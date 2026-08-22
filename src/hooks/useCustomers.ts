import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Customer {
  id: string;
  telegramUserId: string;
  telegramDisplayName: string;
  telegramUsername?: string;
  primeMemberId: string;
  vipTier: "Bronze" | "Silver" | "Gold";
  points: number;
  memberSince: number;
  referrals: number;
  totalSpending: number;
  orderCount: number;
  lastOrderAt?: number;
}

type TimestampLike = { toMillis?: () => number } | number | null | undefined;

function timestampMillis(value: TimestampLike): number {
  if (typeof value === "number") return value;
  if (value && typeof value.toMillis === "function") return value.toMillis();
  return Date.now();
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const customersQuery = query(collection(db, "customers"), orderBy("updatedAt", "desc"));
    return onSnapshot(
      customersQuery,
      (snapshot) => {
        setCustomers(snapshot.docs.map((customerDoc) => {
          const data = customerDoc.data();
          return {
            id: customerDoc.id,
            telegramUserId: String(data.telegramUserId || customerDoc.id),
            telegramDisplayName: String(data.telegramDisplayName || "Unknown"),
            telegramUsername: data.telegramUsername || undefined,
            primeMemberId: String(data.primeMemberId || `PC${customerDoc.id.slice(0, 8).toUpperCase()}`),
            vipTier: data.vipTier || "Bronze",
            points: Number(data.points || 0),
            memberSince: timestampMillis(data.memberSince),
            referrals: Number(data.referrals || 0),
            totalSpending: Number(data.totalSpending || 0),
            orderCount: Number(data.orderCount || 0),
            lastOrderAt: data.lastOrderAt ? timestampMillis(data.lastOrderAt) : undefined,
          } as Customer;
        }));
        setLoading(false);
      },
      (error) => {
        console.error("Failed to subscribe to customers:", error);
        setCustomers([]);
        setLoading(false);
      }
    );
  }, []);

  return { customers, loading };
}
