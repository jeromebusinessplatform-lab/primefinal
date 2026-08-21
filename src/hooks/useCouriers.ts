import { useState, useEffect } from "react";

export interface Courier {
  _id: string;
  name: string;
  serviceTypes: string[];
  baseFare: number;
  minDistance: number;
  minFare: number;
  excessDistanceFare: number;
  platformFee: number;
  surgeFee: number;
  enabled: boolean;
}

export const INITIAL_COURIERS: Courier[] = [
  {
    _id: "cour-1",
    name: "Priority Dispatch Express",
    serviceTypes: ["Same Day Express", "Standard Delivery"],
    baseFare: 50,
    minDistance: 5,
    minFare: 50,
    excessDistanceFare: 10,
    platformFee: 15,
    surgeFee: 0,
    enabled: true,
  },
  {
    _id: "cour-2",
    name: "Apex City Logistics",
    serviceTypes: ["2-Hour Instant", "Scheduled Dropoff"],
    baseFare: 75,
    minDistance: 3,
    minFare: 75,
    excessDistanceFare: 12,
    platformFee: 20,
    surgeFee: 10,
    enabled: true,
  },
  {
    _id: "cour-3",
    name: "Metro Parcel Direct",
    serviceTypes: ["Standard Economy", "Bulk Freight"],
    baseFare: 40,
    minDistance: 6,
    minFare: 40,
    excessDistanceFare: 8,
    platformFee: 10,
    surgeFee: 0,
    enabled: true,
  },
];

const COURIERS_STORAGE_KEY = "prime_couriers_list";

export function useCouriers() {
  const [couriers, setCouriers] = useState<Courier[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(COURIERS_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return INITIAL_COURIERS;
        }
      }
    }
    return INITIAL_COURIERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(COURIERS_STORAGE_KEY, JSON.stringify(couriers));
    } catch {
      // ignore
    }
  }, [couriers]);

  const addCourier = (data: Omit<Courier, "_id">) => {
    const newCourier: Courier = {
      ...data,
      _id: `cour-${Date.now()}`,
    };
    setCouriers((prev) => [...prev, newCourier]);
    return newCourier;
  };

  const updateCourier = (id: string, updates: Partial<Courier>) => {
    setCouriers((prev) =>
      prev.map((c) => (c._id === id ? { ...c, ...updates } : c))
    );
  };

  const removeCourier = (id: string) => {
    setCouriers((prev) => prev.filter((c) => c._id !== id));
  };

  return {
    couriers,
    addCourier,
    updateCourier,
    removeCourier,
  };
}
