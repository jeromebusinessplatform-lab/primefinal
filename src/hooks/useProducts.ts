import { useState, useEffect, useCallback } from "react";
import { INITIAL_CATEGORIES, type Product, type BundleItemConfig } from "@/data/products.ts";

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin", ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
  return data as T;
}

function normalizeProduct(product: any): Product {
  return { ...product, _id: String(product?._id ?? product?.id ?? "") } as Product;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ products?: any[]; categories?: string[] }>("/api/products");
      setProducts(Array.isArray(data.products) ? data.products.map(normalizeProduct).filter((p) => p._id) : []);
      setCategories(Array.isArray(data.categories) && data.categories.length ? data.categories : INITIAL_CATEGORIES);
    } catch (e: any) {
      console.error("Product catalog load error:", e);
      setError(e?.message || "Unable to load product catalog");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const addProduct = async (newProd: Omit<Product, "_id">) => {
    const data = await api<{ product: any }>("/api/admin/products", { method: "POST", body: JSON.stringify(newProd) });
    const product = normalizeProduct(data.product);
    setProducts((current) => [...current, product].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)));
    return product;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const current = products.find((p) => p._id === id);
    const data = await api<{ product: any }>(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ ...current, ...updates, _id: undefined }),
    });
    const product = normalizeProduct(data.product);
    setProducts((items) => items.map((p) => p._id === id ? product : p));
    return product;
  };

  const removeProduct = async (id: string) => {
    await api<{ success: boolean }>(`/api/admin/products/${encodeURIComponent(id)}`, { method: "DELETE" });
    setProducts((items) => items.filter((p) => p._id !== id));
  };

  const addCategory = useCallback(async (newCategory: string) => {
    const trimmed = newCategory.trim();
    if (!trimmed) return false;
    const data = await api<{ categories: string[] }>("/api/admin/categories", { method: "POST", body: JSON.stringify({ name: trimmed }) });
    setCategories(data.categories);
    return true;
  }, []);

  const editCategory = useCallback(async (oldCategory: string, newCategory: string) => {
    const trimmedNew = newCategory.trim();
    if (!trimmedNew || oldCategory === trimmedNew) return false;
    const data = await api<{ categories: string[] }>(`/api/admin/categories/${encodeURIComponent(oldCategory)}`, { method: "PATCH", body: JSON.stringify({ name: trimmedNew }) });
    setCategories(data.categories);
    setProducts((items) => items.map((p) => p.category === oldCategory ? { ...p, category: trimmedNew } : p));
    return true;
  }, []);

  const removeCategory = useCallback(async (categoryToRemove: string, fallback = "General") => {
    const data = await api<{ categories: string[] }>(`/api/admin/categories/${encodeURIComponent(categoryToRemove)}`, { method: "DELETE" });
    setCategories(data.categories);
    setProducts((items) => items.map((p) => p.category === categoryToRemove ? { ...p, category: fallback } : p));
    return true;
  }, []);

  const computeBundlePrice = useCallback(
    (bundleItems: BundleItemConfig[] = []): number => {
      let total = 0;
      for (const item of bundleItems) {
        const prod = products.find((p) => p._id === item.productId);
        if (!prod) continue;
        const originalPrice = prod.salePrice ?? prod.price;
        if (item.pricingType === "fixed") total += typeof item.customPrice === "number" ? item.customPrice : originalPrice;
        else if (item.pricingType === "percentage_off") total += Math.max(0, originalPrice * (1 - (item.discountPercent ?? 0) / 100));
      }
      return Math.round(total * 100) / 100;
    },
    [products]
  );

  return { products, categories, loading, error, reload, addProduct, updateProduct, removeProduct, addCategory, editCategory, removeCategory, computeBundlePrice };
}
