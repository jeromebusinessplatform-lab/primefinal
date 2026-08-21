import { useState, useEffect, useCallback } from "react";
import { collection, onSnapshot, query, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { INITIAL_CATEGORIES, type Product, type BundleItemConfig } from "@/data/products.ts";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [loading, setLoading] = useState(true);

  // Load products from Firestore
  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        _id: doc.id,
        ...doc.data(),
      })) as Product[];
      setProducts(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addProduct = async (newProd: Omit<Product, "_id">) => {
    await addDoc(collection(db, "products"), newProd);
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    await updateDoc(doc(db, "products", id), updates);
  };

  const removeProduct = async (id: string) => {
    await deleteDoc(doc(db, "products", id));
  };

  // Category Management Handlers (Simplified for now - could also move to Firestore)
  const addCategory = useCallback((newCategory: string) => {
    // Implement or leave as is if categories are static/local
    return true;
  }, []);

  const editCategory = useCallback((oldCategory: string, newCategory: string) => {
    return true;
  }, []);

  const removeCategory = useCallback((categoryToRemove: string, fallback = "General") => {
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
    loading,
    addProduct,
    updateProduct,
    removeProduct,
    addCategory,
    editCategory,
    removeCategory,
    computeBundlePrice,
  };
}
