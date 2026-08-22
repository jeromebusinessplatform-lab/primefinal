import { useMemo } from "react";
import { useOrders } from "./useOrders";

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
}

export function useCustomers() {
  const { allOrders, loading } = useOrders();

  const customers = useMemo(() => {
    const customerMap = new Map<string, Customer>();

    for (const order of allOrders) {
      if (!order.telegramUserId) continue;

      const customerId = order.telegramUserId;
      const existing = customerMap.get(customerId);

      if (existing) {
        existing.orderCount += 1;
        existing.totalSpending += order.total;
        existing.points += Math.floor(order.total * 0.1);
        existing.memberSince = Math.min(existing.memberSince, order._creationTime);
        if (!existing.telegramUsername && order.telegramUsername) {
          existing.telegramUsername = order.telegramUsername;
        }
        if (existing.telegramDisplayName === "Unknown" && order.telegramDisplayName) {
          existing.telegramDisplayName = order.telegramDisplayName;
        }
        continue;
      }

      customerMap.set(customerId, {
        id: customerId,
        telegramUserId: customerId,
        telegramDisplayName: order.telegramDisplayName || "Unknown",
        telegramUsername: order.telegramUsername,
        primeMemberId: `PC${customerId.slice(0, 8).toUpperCase()}`,
        vipTier: "Bronze",
        points: Math.floor(order.total * 0.1),
        memberSince: order._creationTime,
        referrals: 0,
        totalSpending: order.total,
        orderCount: 1,
      });
    }

    return Array.from(customerMap.values());
  }, [allOrders]);

  return { customers, loading };
}
