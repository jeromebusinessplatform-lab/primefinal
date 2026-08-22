import crypto from "node:crypto";
import type { Application, Request, Response } from "express";
import { cert, getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { verifyTelegramInitData } from "./telegramAuth.js";

const TG_COOKIE = "prime_telegram_session";
const TG_TTL_MS = 24 * 60 * 60 * 1000;
const ADMIN_COOKIE = "prime_admin_session";
const ADMIN_TTL_MS = 12 * 60 * 60 * 1000;
const INITIAL_CATEGORIES = ["Audio", "Smart Wearables", "Cameras", "Accessories"];

function db() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (raw?.trim()) initializeApp({ credential: cert(JSON.parse(raw)) });
    else initializeApp({ credential: applicationDefault() });
  }
  return getFirestore();
}
function sign(payload: string, secret: string) { return crypto.createHmac("sha256", secret).update(payload).digest("hex"); }
function sessionCookie(userId: string) {
  const expires = Date.now() + TG_TTL_MS; const payload = `telegram:${userId}:${expires}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload, process.env.TELEGRAM_SESSION_SECRET || process.env.TELEGRAM_BOT_TOKEN || "")}`;
}
function cookie(req: Request, name: string) { const value = req.headers.cookie || ""; const found = value.split(";").map(x => x.trim()).find(x => x.startsWith(`${name}=`)); return found ? decodeURIComponent(found.slice(name.length + 1)) : null; }
function telegramUserId(req: Request): string | null {
  const token = cookie(req, TG_COOKIE); const secret = process.env.TELEGRAM_SESSION_SECRET || process.env.TELEGRAM_BOT_TOKEN || "";
  if (!token || !secret) return null; const [encoded, signature] = token.split("."); if (!encoded || !signature) return null;
  try { const payload = Buffer.from(encoded, "base64url").toString("utf8"); const match = payload.match(/^telegram:(\d+):(\d+)$/); if (!match || Number(match[2]) < Date.now()) return null; return sign(payload, secret) === signature ? match[1] : null; } catch { return null; }
}
function adminSession(req: Request): boolean {
  const token = cookie(req, ADMIN_COOKIE); const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_ACCESS_CODE || "";
  if (!token || !secret) return false; const [encoded, signature] = token.split("."); if (!encoded || !signature) return false;
  try { const payload = Buffer.from(encoded, "base64url").toString("utf8"); const match = payload.match(/^admin:(\d+)$/); return !!match && Number(match[1]) >= Date.now() && sign(payload, secret) === signature; } catch { return false; }
}
function setCookie(res: Response, name: string, value: string, maxAge: number) { res.setHeader("Set-Cookie", `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; ${process.env.NODE_ENV === "production" ? "Secure; " : ""}Max-Age=${Math.floor(maxAge / 1000)}`); }
function plain(id: string, data: any) { const out: any = { id, ...data }; for (const [k, v] of Object.entries(out)) if (v instanceof Timestamp || (v && typeof (v as any).toMillis === "function")) out[k] = (v as any).toMillis(); return out; }
function cleanProduct(body: any) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const price = Number(body?.price); const stock = Number(body?.stock);
  if (!name || !Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0) throw new Error("Invalid product data");
  return {
    name,
    subname: typeof body?.subname === "string" && body.subname.trim() ? body.subname.trim() : undefined,
    category: typeof body?.category === "string" && body.category.trim() ? body.category.trim() : "General",
    description: typeof body?.description === "string" && body.description.trim() ? body.description.trim() : undefined,
    price, salePrice: body?.salePrice === undefined || body?.salePrice === "" ? undefined : Number(body.salePrice),
    costing: body?.costing === undefined || body?.costing === "" ? undefined : Number(body.costing),
    stock, available: stock > 0, badge: body?.badge || undefined, badgeExpiry: body?.badgeExpiry || undefined,
    image: typeof body?.image === "string" ? body.image : undefined,
    sortOrder: Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0,
    isCombination: Boolean(body?.isCombination), bundleItems: Array.isArray(body?.bundleItems) ? body.bundleItems : undefined,
    bundleCalculatedPrice: body?.bundleCalculatedPrice === undefined ? undefined : Number(body.bundleCalculatedPrice),
  };
}

export function installReleaseRoutes(app: Application) {
  app.post("/api/auth/telegram", (req, res) => {
    try { const initData = typeof req.body?.initData === "string" ? req.body.initData : ""; const result = verifyTelegramInitData(initData, process.env.TELEGRAM_BOT_TOKEN || ""); setCookie(res, TG_COOKIE, sessionCookie(String(result.user.id)), TG_TTL_MS); return res.json({ authenticated: true, user: result.user }); }
    catch (e: any) { return res.status(401).json({ authenticated: false, error: e?.message || "Telegram authentication failed" }); }
  });
  app.get("/api/auth/telegram/session", (req, res) => { const id = telegramUserId(req); return res.json({ authenticated: !!id, telegramUserId: id }); });

  // Public storefront product read. Product mutations are server-authoritative.
  app.get("/api/products", async (_req, res) => {
    try {
      const firestore = db();
      const [productsSnap, categoriesSnap] = await Promise.all([
        firestore.collection("products").get(),
        firestore.collection("config").doc("categories").get(),
      ]);
      const products = productsSnap.docs.map(d => plain(d.id, d.data())).sort((a: any, b: any) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
      const categories = categoriesSnap.exists && Array.isArray(categoriesSnap.data()?.list) ? categoriesSnap.data()?.list : INITIAL_CATEGORIES;
      return res.json({ products, categories });
    } catch (e) { console.error("Products read error:", e); return res.status(500).json({ error: "Unable to load products" }); }
  });

  app.post("/api/admin/products", async (req, res) => {
    if (!adminSession(req)) return res.status(401).json({ error: "Admin authentication required" });
    try { const data = cleanProduct(req.body); const ref = await db().collection("products").add({ ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }); return res.status(201).json({ product: plain(ref.id, data) }); }
    catch (e: any) { console.error("Product create error:", e); return res.status(e?.message === "Invalid product data" ? 400 : 500).json({ error: e?.message === "Invalid product data" ? e.message : "Unable to create product" }); }
  });

  app.patch("/api/admin/products/:id", async (req, res) => {
    if (!adminSession(req)) return res.status(401).json({ error: "Admin authentication required" });
    const id = req.params.id; if (!/^[A-Za-z0-9_-]{1,150}$/.test(id)) return res.status(400).json({ error: "Invalid product id" });
    try { const data = cleanProduct(req.body); await db().collection("products").doc(id).update({ ...data, updatedAt: FieldValue.serverTimestamp() }); return res.json({ product: plain(id, data) }); }
    catch (e: any) { console.error("Product update error:", e); return res.status(e?.message === "Invalid product data" ? 400 : 500).json({ error: e?.message === "Invalid product data" ? e.message : "Unable to update product" }); }
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    if (!adminSession(req)) return res.status(401).json({ error: "Admin authentication required" });
    const id = req.params.id; if (!/^[A-Za-z0-9_-]{1,150}$/.test(id)) return res.status(400).json({ error: "Invalid product id" });
    try { await db().collection("products").doc(id).delete(); return res.json({ success: true }); }
    catch (e) { console.error("Product delete error:", e); return res.status(500).json({ error: "Unable to delete product" }); }
  });

  app.post("/api/admin/categories", async (req, res) => {
    if (!adminSession(req)) return res.status(401).json({ error: "Admin authentication required" });
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : ""; if (!name) return res.status(400).json({ error: "Category name is required" });
    try { const ref = db().collection("config").doc("categories"); const snap = await ref.get(); const current = snap.exists && Array.isArray(snap.data()?.list) ? snap.data()?.list : INITIAL_CATEGORIES; const categories = Array.from(new Set([...current, name])); await ref.set({ list: categories }, { merge: true }); return res.status(201).json({ categories }); }
    catch (e) { console.error("Category create error:", e); return res.status(500).json({ error: "Unable to create category" }); }
  });

  app.patch("/api/admin/categories/:name", async (req, res) => {
    if (!adminSession(req)) return res.status(401).json({ error: "Admin authentication required" });
    const oldName = decodeURIComponent(req.params.name); const newName = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!oldName || !newName) return res.status(400).json({ error: "Category names are required" });
    try { const firestore = db(); const ref = firestore.collection("config").doc("categories"); const snap = await ref.get(); const current = snap.exists && Array.isArray(snap.data()?.list) ? snap.data()?.list : INITIAL_CATEGORIES; const categories = current.map((c: string) => c === oldName ? newName : c); await ref.set({ list: Array.from(new Set(categories)) }, { merge: true }); const products = await firestore.collection("products").where("category", "==", oldName).get(); await Promise.all(products.docs.map(p => p.ref.update({ category: newName, updatedAt: FieldValue.serverTimestamp() }))); return res.json({ categories: Array.from(new Set(categories)) }); }
    catch (e) { console.error("Category update error:", e); return res.status(500).json({ error: "Unable to update category" }); }
  });

  app.delete("/api/admin/categories/:name", async (req, res) => {
    if (!adminSession(req)) return res.status(401).json({ error: "Admin authentication required" });
    const name = decodeURIComponent(req.params.name);
    try { const firestore = db(); const ref = firestore.collection("config").doc("categories"); const snap = await ref.get(); const current = snap.exists && Array.isArray(snap.data()?.list) ? snap.data()?.list : INITIAL_CATEGORIES; const categories = current.filter((c: string) => c !== name); await ref.set({ list: categories }, { merge: true }); const products = await firestore.collection("products").where("category", "==", name).get(); await Promise.all(products.docs.map(p => p.ref.update({ category: "General", updatedAt: FieldValue.serverTimestamp() }))); return res.json({ categories }); }
    catch (e) { console.error("Category delete error:", e); return res.status(500).json({ error: "Unable to delete category" }); }
  });

  app.get("/api/orders", async (req, res) => {
    const isAdmin = adminSession(req); const tg = telegramUserId(req); if (!isAdmin && !tg) return res.status(401).json({ error: "Authentication required" });
    try { let query = db().collection("orders").orderBy("createdAt", "desc"); const snap = await query.get(); const orders = snap.docs.map(d => plain(d.id, d.data())).filter(o => isAdmin || String(o.telegramUserId) === tg); return res.json({ orders }); }
    catch { return res.status(500).json({ error: "Unable to load orders" }); }
  });

  app.post("/api/orders", async (req, res) => {
    const tg = telegramUserId(req); if (!tg) return res.status(401).json({ error: "Verified Telegram identity required" });
    const input = req.body || {}; const items = Array.isArray(input.items) ? input.items : []; if (!items.length) return res.status(400).json({ error: "Cannot place an order without items" });
    const firestore = db(); const orderRef = firestore.collection("orders").doc(); const customerRef = firestore.collection("customers").doc(tg);
    try {
      const result = await firestore.runTransaction(async tx => {
        const products = await Promise.all(items.map((item: any) => tx.get(firestore.collection("products").doc(String(item.productId)))));
        const normalized: any[] = []; let subtotal = 0;
        products.forEach((snap, i) => { const item = items[i]; if (!snap.exists) throw new Error(`Product ${item.productId} is no longer available.`); const p: any = snap.data(); const qty = Number(item.quantity); const stock = Number(p.stock || 0); if (!Number.isInteger(qty) || qty <= 0 || p.available === false || stock < qty) throw new Error(`${p.name || item.productId} does not have enough stock.`); const unitPrice = Number(p.bundleCalculatedPrice ?? p.salePrice ?? p.price ?? 0); if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error(`Invalid price configuration for ${p.name || item.productId}.`); const line = Math.round(unitPrice * qty * 100) / 100; subtotal += line; normalized.push({ productId: String(item.productId), productName: p.name || item.productName, quantity: qty, unitPrice, subtotal: line }); tx.update(snap.ref, { stock: stock - qty, updatedAt: FieldValue.serverTimestamp() }); });
        subtotal = Math.round(subtotal * 100) / 100; const discount = Math.max(0, Math.min(Number(input.discount || 0) || 0, subtotal)); const deliveryFee = Math.max(0, Number(input.deliveryFee || 0) || 0); const chargesSnap = await firestore.collection("charges").get(); const base = subtotal - discount; const charges = Math.round(chargesSnap.docs.reduce((sum, d) => { const c: any = d.data(); if (c.active !== true) return sum; const amount = Number(c.amount || 0); return sum + (c.type === "percent" ? base * amount / 100 : amount); }, 0) * 100) / 100; const tax = Math.round((base + charges) * 0.05 * 100) / 100; const total = Math.round((base + charges + tax + deliveryFee) * 100) / 100; const now = FieldValue.serverTimestamp();
        const order = { ...input, telegramUserId: tg, items: normalized, subtotal, discount, charges, deliveryFee, total, paymentStatus: "PENDING", orderStatus: "REVIEW", createdAt: now, updatedAt: now };
        tx.set(orderRef, order); tx.set(customerRef, { id: tg, telegramUserId: tg, telegramDisplayName: String(input.telegramDisplayName || "Unknown"), telegramUsername: input.telegramUsername || null, primeMemberId: `PC${tg.slice(0, 8).toUpperCase()}`, vipTier: "Bronze", updatedAt: now }, { merge: true }); return { ...order, id: orderRef.id };
      }); return res.status(201).json({ order: result });
    } catch (e: any) { return res.status(400).json({ error: e?.message || "Unable to create order" }); }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    if (!adminSession(req)) return res.status(401).json({ error: "Admin authentication required" });
    const allowed = ["orderStatus", "paymentStatus", "adminNotes", "receiptOcrData", "receiptUrl"]; const data: any = {}; for (const key of allowed) if (key in req.body) data[key] = req.body[key]; data.updatedAt = FieldValue.serverTimestamp();
    try { await db().collection("orders").doc(req.params.id).update(data); return res.json({ success: true }); } catch { return res.status(500).json({ error: "Unable to update order" }); }
  });
  app.delete("/api/orders/:id", async (req, res) => { if (!adminSession(req)) return res.status(401).json({ error: "Admin authentication required" }); try { await db().collection("orders").doc(req.params.id).delete(); return res.json({ success: true }); } catch { return res.status(500).json({ error: "Unable to delete order" }); } });

  app.get("/api/customers", async (req, res) => { if (!adminSession(req)) return res.status(401).json({ error: "Admin authentication required" }); try { const snap = await db().collection("customers").orderBy("updatedAt", "desc").get(); return res.json({ customers: snap.docs.map(d => plain(d.id, d.data())) }); } catch { return res.status(500).json({ error: "Unable to load customers" }); } });
}
