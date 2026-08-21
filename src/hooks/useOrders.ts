import { useState, useEffect } from "react";

export type OrderStatus =
  | "REVIEW"
  | "PAYMENT_CONFIRMED"
  | "START_PACKING"
  | "READY"
  | "AWAITING_RIDER"
  | "DISPATCHED"
  | "DELIVERED"
  | "PAYMENT_FAILED"
  | "HOLD_ORDER"
  | "REQUEST_RESUBMIT"
  | "PAYMENT_CLEARED"
  | "FINAL_FOLLOW_UP"
  | "REJECTED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "CONFIRMED" | "FAILED" | "CLEARED";

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CustomerOrder {
  _id: string;
  orderNumber: string;
  _creationTime: number;
  telegramUserId?: string;
  telegramDisplayName?: string;
  telegramUsername?: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  receiverName: string;
  contactNumber: string;
  deliveryAddress: string;
  courierName: string;
  paymentMethodName: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  queuePosition: number;
  estimatedWaitingMinutes: number;
  estimatedDispatchTime: string;
  adminNotes?: string;
  receiptUrl?: string;
}

export const INITIAL_ORDERS: CustomerOrder[] = [
  {
    _id: "ord-1001",
    orderNumber: "PRIME-9021",
    _creationTime: Date.now() - 1000 * 60 * 15,
    telegramUserId: "1085949511",
    telegramDisplayName: "Marcus Vance",
    telegramUsername: "marcus_v",
    items: [
      {
        productId: "prod-2",
        productName: "Wireless Headphones",
        quantity: 2,
        unitPrice: 119.99,
        subtotal: 239.98,
      },
      {
        productId: "prod-6",
        productName: "Power Bank 10000mAh",
        quantity: 1,
        unitPrice: 39.99,
        subtotal: 39.99,
      },
    ],
    subtotal: 279.97,
    discount: 0,
    deliveryFee: 0,
    total: 293.97,
    receiverName: "Marcus Vance",
    contactNumber: "+1 (555) 019-2834",
    deliveryAddress: "450 Silicon Way, Tech District, Ste 800",
    courierName: "Priority Dispatch Express",
    paymentMethodName: "Telegram Pay",
    paymentStatus: "CONFIRMED",
    orderStatus: "REVIEW",
    queuePosition: 1,
    estimatedWaitingMinutes: 12,
    estimatedDispatchTime: "2:45 PM",
    adminNotes: "Customer requested contactless lobby drop-off.",
  },
  {
    _id: "ord-1002",
    orderNumber: "PRIME-9022",
    _creationTime: Date.now() - 1000 * 60 * 45,
    telegramUserId: "tg_881245",
    telegramDisplayName: "Sarah Jenkins",
    telegramUsername: "sarahj_fit",
    items: [
      {
        productId: "prod-1",
        productName: "BLAU Digital Smartwatch",
        quantity: 1,
        unitPrice: 129.99,
        subtotal: 129.99,
      },
    ],
    subtotal: 129.99,
    discount: 10,
    deliveryFee: 9.99,
    total: 136.48,
    receiverName: "Sarah Jenkins",
    contactNumber: "+1 (555) 392-1920",
    deliveryAddress: "14 Palm Avenue, Metro Bay",
    courierName: "Priority Dispatch Express",
    paymentMethodName: "Direct Transfer OCR",
    paymentStatus: "CONFIRMED",
    orderStatus: "START_PACKING",
    queuePosition: 2,
    estimatedWaitingMinutes: 20,
    estimatedDispatchTime: "3:10 PM",
  },
];

const ORDERS_STORAGE_KEY = "prime_app_orders";

export function useOrders(telegramUserId?: string) {
  const [orders, setOrders] = useState<CustomerOrder[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed;
        } catch {
          return INITIAL_ORDERS;
        }
      }
    }
    return INITIAL_ORDERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch {
      // ignore
    }
  }, [orders]);

  const customerFilteredOrders = telegramUserId
    ? orders.filter((o) => o.telegramUserId === telegramUserId)
    : orders;

  const createOrder = async (
    orderData: Omit<CustomerOrder, "_id" | "_creationTime">
  ) => {
    const newOrder: CustomerOrder = {
      ...orderData,
      _id: `ord-${Date.now()}`,
      _creationTime: Date.now(),
    };
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrderStatus = (
    orderId: string,
    newStatus: OrderStatus,
    notes?: string
  ) => {
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId
          ? {
              ...o,
              orderStatus: newStatus,
              ...(notes !== undefined ? { adminNotes: notes } : {}),
            }
          : o
      )
    );
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o._id !== orderId));
  };

  return {
    orders: customerFilteredOrders,
    allOrders: orders,
    loading: false,
    createOrder,
    updateOrderStatus,
    deleteOrder,
  };
}
