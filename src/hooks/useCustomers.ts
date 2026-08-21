import { useState, useMemo } from 'react';
import { useOrders } from './useOrders';
import { TelegramCustomer } from '../context/TelegramContext';

export interface Customer {
  id: string; // telegramUserId
  telegramUserId: string;
  telegramDisplayName: string;
  telegramUsername?: string;
  primeMemberId: string;
  vipTier: 'Bronze' | 'Silver' | 'Gold';
  points: number;
  memberSince: number; // timestamp
  referrals: number;
  totalSpending: number;
  orderCount: number;
}

export function useCustomers() {
  const { allOrders } = useOrders();

  // Aggregate customer data from orders
  const customers = useMemo(() => {
    const customerMap = new Map<string, Customer>();

    allOrders.forEach(order => {
      if (!order.telegramUserId) return;

      const customerId = order.telegramUserId;
      let customer = customerMap.get(customerId);

      if (!customer) {
        customer = {
          id: customerId,
          telegramUserId: customerId,
          telegramDisplayName: order.telegramDisplayName || 'Unknown',
          telegramUsername: order.telegramUsername,
          primeMemberId: `PC${customerId.slice(0, 8).toUpperCase()}`, // Stable ID
          vipTier: 'Bronze',
          points: Math.floor(order.total * 0.1), // Mock point logic
          memberSince: order._creationTime,
          referrals: 0, // Need to implement referral system or aggregate from orders
          totalSpending: 0,
          orderCount: 0,
        };
        customerMap.set(customerId, customer);
      }

      customer.orderCount += 1;
      customer.totalSpending += order.total;
      customer.points += Math.floor(order.total * 0.1); // Mock point logic
      customer.memberSince = Math.min(customer.memberSince, order._creationTime);
    });

    return Array.from(customerMap.values());
  }, [allOrders]);

  return { customers };
}
