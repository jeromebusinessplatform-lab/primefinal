import { useState, useEffect, useCallback } from "react";
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, type Product, type BundleItemConfig } from "@/data/products.ts";

const PRODUCTS_STORAGE_KEY = "prime_products_list";
const CATEGORIES_STORAGE_KEY = "prime_categories_list";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return INITIAL_PRODUCTS;
        }
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [categories, setCategories] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {
          // ignore
        }
      }
    }
    return INITIAL_CATEGORIES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch {
      // ignore
    }
  }, [categories]);

  const addProduct = (newProd: Omit<Product, "_id">) => {
    const id = `prod-${Date.now()}`;
    const product: Product = { ...newProd, _id: id };
    setProducts((prev) => [product, ...prev]);
    return product;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p._id === id ? { ...p, ...updates } : p))
    );
  };

  const removeProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  // Category Management Handlers
  const addCategory = useCallback((newCategory: string) => {
    const trimmed = newCategory.trim();
    if (!trimmed) return false;
    setCategories((prev) => {
      if (prev.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, trimmed];
    });
    return true;
  }, []);

  const editCategory = useCallback((oldCategory: string, newCategory: string) => {
    const trimmedNew = newCategory.trim();
    if (!trimmedNew || oldCategory === trimmedNew) return false;

    setCategories((prev) =>
      prev.map((c) => (c === oldCategory ? trimmedNew : c))
    );

    // Cascade update all products in this category
    setProducts((prev) =>
      prev.map((p) => (p.category === oldCategory ? { ...p, category: trimmedNew } : p))
    );
    return true;
  }, []);

  const removeCategory = useCallback((categoryToRemove: string, fallback = "General") => {
    setCategories((prev) => {
      const filtered = prev.filter((c) => c !== categoryToRemove);
      if (filtered.length === 0) return [fallback];
      return filtered;
    });

    // Reassign products to fallback
    setProducts((prev) =>
      prev.map((p) =>
        p.category === categoryToRemove ? { ...p, category: fallback } : p
      )
    );
    return true;
  }, []);

  // Helper to compute bundle prices based on included items
  const computeBundlePrice = useCallback(
    (bundleItems: BundleItemConfig[] = []): number => {
      let total = 0;
      for (const item of bundleItems) {
        const prod = products.find((p) => p._id === item.productId);
        if (!prod) continue;
        const originalPrice = prod.salePrice ?? prod.price;
        if (item.pricingType === "fixed") {
          total += typeof item.customPrice === "number" ? item.customPrice : originalPrice;
        } else if (item.pricingType === "percentage_off") {
          const pct = item.discountPercent ?? 0;
          const discounted = originalPrice * (1 - pct / 100);
          total += Math.max(0, discounted);
        }
      }
      return Math.round(total * 100) / 100;
    },
    [products]
  );

  return {
    products,
    categories,
    loading: false,
    addProduct,
    updateProduct,
    removeProduct,
    addCategory,
    editCategory,
    removeCategory,
    computeBundlePrice,
  };
}
