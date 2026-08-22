import crypto from "node:crypto";
import type { Application, Request, Response } from "express";
import { cert, getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const ADMIN_COOKIE = "prime_admin_session";
const ADMIN_TTL_MS = 12 * 60 * 60 * 1000;
const INITIAL_CATEGORIES = ["Audio", "Smart Wearables", "Cameras", "Accessories"];

function getCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie || "";
  const found = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.slice(name.length + 1)) : null;
}

function adminSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_ACCESS_CODE || "";
}

function isAdmin(req: Request): boolean {
  const token = getCookie(req, ADMIN_COOKIE);
  const secret = adminSecret();
  if (!token || !secret) return false;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;
  try {
    const payload = Buffer.from(encoded, "base64url").toString("utf8");
    const match = payload.match(/^admin:(\d+)$/);
    if (!match || Number(match[1]) < Date.now()) return false;
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function requireAdmin(req: Request, res: Response): boolean {
  if (isAdmin(req)) return true;
  res.status(401).json({ error: "Admin authentication required" });
  return false;
}

let adminDb: ReturnType<typeof getFirestore> | null = null;
function db() {
  if (adminDb) return adminDb;
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (raw?.trim()) {
      let serviceAccount: Record<string, unknown>;
      try { serviceAccount = JSON.parse(raw); } catch { throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON"); }
      initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
    } else {
      initializeApp({ credential: applicationDefault() });
    }
  }
  adminDb = getFirestore();
  return adminDb;
}

function plain(id: string, data: Record<string, any>) {
  return { _id: id, ...data };
}

function cleanProduct(body: any) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const price = Number(body?.price);
  const stock = Number(body?.stock);
  if (!name || !Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0) throw new Error("Invalid product data");
  return {
    name,
    subname: typeof body?.subname === "string" && body.subname.trim() ? body.subname.trim() : undefined,
    category: typeof body?.category === "string" && body.category.trim() ? body.category.trim() : "General",
    description: typeof body?.description === "string" && body.description.trim() ? body.description.trim() : undefined,
    price,
    salePrice: body?.salePrice === undefined || body?.salePrice === "" ? undefined : Number(body.salePrice),
    costing: body?.costing === undefined || body?.costing === "" ? undefined : Number(body.costing),
    stock,
    available: stock > 0,
    badge: body?.badge || undefined,
    badgeExpiry: body?.badgeExpiry || undefined,
    image: typeof body?.image === "string" ? body.image : undefined,
    sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0,
    isCombination: Boolean(body?.isCombination),
    bundleItems: Array.isArray(body?.bundleItems) ? body.bundleItems : undefined,
    bundleCalculatedPrice: body?.bundleCalculatedPrice === undefined ? undefined : Number(body.bundleCalculatedPrice),
  };
}

export function installProductRoutes(app: Application) {
  // Public storefront read. Product mutations never go through the browser Firebase SDK.
  app.get("/api/products", async (_req, res) => {
    try {
      const firestore = db();
      const [productsSnap, categoriesSnap] = await Promise.all([
        firestore.collection("products").get(),
        firestore.collection("config").doc("categories").get(),
      ]);
      const products = productsSnap.docs
        .map((doc) => plain(doc.id, doc.data()))
        .sort((a: any, b: any) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
      const categories = categoriesSnap.exists && Array.isArray(categoriesSnap.data()?.list)
        ? categoriesSnap.data()?.list
        : INITIAL_CATEGORIES;
      return res.json({ products, categories });
    } catch (error) {
      console.error("Products read error:", error);
      return res.status(500).json({ error: "Unable to load products" });
    }
  });

  app.post("/api/admin/products", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const data = cleanProduct(req.body);
      const ref = await db().collection("products").add({ ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      return res.status(201).json({ product: plain(ref.id, data) });
    } catch (error: any) {
      console.error("Product create error:", error);
      return res.status(error?.message === "Invalid product data" ? 400 : 500).json({ error: error?.message === "Invalid product data" ? error.message : "Unable to create product" });
    }
  });

  app.patch("/api/admin/products/:id", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const id = req.params.id;
    if (!/^[A-Za-z0-9_-]{1,150}$/.test(id)) return res.status(400).json({ error: "Invalid product id" });
    try {
      const data = cleanProduct(req.body);
      await db().collection("products").doc(id).update({ ...data, updatedAt: FieldValue.serverTimestamp() });
      return res.json({ product: plain(id, data) });
    } catch (error: any) {
      console.error("Product update error:", error);
      return res.status(error?.message === "Invalid product data" ? 400 : 500).json({ error: error?.message === "Invalid product data" ? error.message : "Unable to update product" });
    }
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const id = req.params.id;
    if (!/^[A-Za-z0-9_-]{1,150}$/.test(id)) return res.status(400).json({ error: "Invalid product id" });
    try {
      await db().collection("products").doc(id).delete();
      return res.json({ success: true });
    } catch (error) {
      console.error("Product delete error:", error);
      return res.status(500).json({ error: "Unable to delete product" });
    }
  });

  app.post("/api/admin/categories", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name) return res.status(400).json({ error: "Category name is required" });
    try {
      const ref = db().collection("config").doc("categories");
      const snap = await ref.get();
      const current = snap.exists && Array.isArray(snap.data()?.list) ? snap.data()?.list : INITIAL_CATEGORIES;
      const categories = Array.from(new Set([...current, name]));
      await ref.set({ list: categories }, { merge: true });
      return res.status(201).json({ categories });
    } catch (error) {
      console.error("Category create error:", error);
      return res.status(500).json({ error: "Unable to create category" });
    }
  });

  app.patch("/api/admin/categories/:name", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const oldName = decodeURIComponent(req.params.name);
    const newName = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!oldName || !newName) return res.status(400).json({ error: "Category names are required" });
    try {
      const firestore = db();
      const ref = firestore.collection("config").doc("categories");
      const snap = await ref.get();
      const current = snap.exists && Array.isArray(snap.data()?.list) ? snap.data()?.list : INITIAL_CATEGORIES;
      const categories = current.map((c: string) => c === oldName ? newName : c);
      await ref.set({ list: Array.from(new Set(categories)) }, { merge: true });
      const products = await firestore.collection("products").where("category", "==", oldName).get();
      await Promise.all(products.docs.map((p) => p.ref.update({ category: newName, updatedAt: FieldValue.serverTimestamp() })));
      return res.json({ categories: Array.from(new Set(categories)) });
    } catch (error) {
      console.error("Category update error:", error);
      return res.status(500).json({ error: "Unable to update category" });
    }
  });

  app.delete("/api/admin/categories/:name", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const name = decodeURIComponent(req.params.name);
    try {
      const firestore = db();
      const ref = firestore.collection("config").doc("categories");
      const snap = await ref.get();
      const current = snap.exists && Array.isArray(snap.data()?.list) ? snap.data()?.list : INITIAL_CATEGORIES;
      const categories = current.filter((c: string) => c !== name);
      await ref.set({ list: categories }, { merge: true });
      const products = await firestore.collection("products").where("category", "==", name).get();
      await Promise.all(products.docs.map((p) => p.ref.update({ category: "General", updatedAt: FieldValue.serverTimestamp() })));
      return res.json({ categories });
    } catch (error) {
      console.error("Category delete error:", error);
      return res.status(500).json({ error: "Unable to delete category" });
    }
  });
}
