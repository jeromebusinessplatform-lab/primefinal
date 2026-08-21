import { useState, useEffect } from "react";
import { collection, onSnapshot, query, doc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Courier } from "../types/courier";

export function useCouriers() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "couriers"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Courier[];
      setCouriers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const calculateDeliveryCharge = (courier: Courier, distanceKm: number) => {
    if (!courier.isAvailable) return 0;
    
    let charge = courier.baseFare;
    if (distanceKm > 4) {
      charge += (distanceKm - 4) * courier.perKmCharge;
    }
    charge += courier.platformFee + courier.surchargeFee;
    
    // Simple night differential check
    const hour = new Date().getHours();
    if (courier.nightDifferentialEnabled && (hour >= 22 || hour < 5)) {
      charge += 50; // Arbitrary night differential fee
    }

    return charge;
  };

  const addCourier = async (courier: Omit<Courier, "id">) => {
    await addDoc(collection(db, "couriers"), courier);
  };

  const updateCourier = async (id: string, updates: Partial<Courier>) => {
    await updateDoc(doc(db, "couriers", id), updates);
  };

  const removeCourier = async (id: string) => {
    await deleteDoc(doc(db, "couriers", id));
  };

  return {
    couriers,
    loading,
    calculateDeliveryCharge,
    addCourier,
    updateCourier,
    removeCourier,
  };
}
