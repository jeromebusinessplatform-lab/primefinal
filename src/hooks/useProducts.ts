import { useState, useEffect } from "react";
import { INITIAL_PRODUCTS, type Product } from "@/data/products.ts";

const PRODUCTS_STORAGE_KEY = "prime_products_list";

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

  useEffect(() => {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

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

  return {
    products,
    loading: false,
    addProduct,
    updateProduct,
    removeProduct,
  };
}
