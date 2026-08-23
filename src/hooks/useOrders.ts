import { useCallback, useEffect, useState } from "react";
import type { ReceiptOcrResult } from "@/types/ocr.ts";

export type OrderStatus = "REVIEW" | "PAYMENT_CONFIRMED" | "START_PACKING" | "READY" | "AWAITING_RIDER" | "DISPATCHED" | "DELIVERED" | "PAYMENT_FAILED" | "HOLD_ORDER" | "REQUEST_RESUBMIT" | "PAYMENT_CLEARED" | "FINAL_FOLLOW_UP" | "REJECTED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "CONFIRMED" | "FAILED" | "CLEARED";
export type DeliveryPaymentOption = "PAY_AT_CHECKOUT" | "PAY_UPON_FULFILLMENT";
export interface OrderItem { productId: string; productName: string; quantity: number; unitPrice: number; subtotal: number; }
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
  charges?: number;
  receiverName: string;
  contactNumber: string;
  deliveryAddress: string;
  courierName: string;
  deliveryProviderId?: string;
  deliveryCharge?: number;
  deliveryPaymentMethod?: DeliveryPaymentOption;
  paymentMethodName: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  queuePosition: number;
  estimatedWaitingMinutes: number;
  estimatedDispatchTime: string;
  adminNotes?: string;
  receiptUrl?: string;
  receiptOcrData?: ReceiptOcrResult;
  deliveryPaymentOption?: DeliveryPaymentOption;
}

function normalizeOrder(raw: any): CustomerOrder {
  const createdAt = Number(raw.createdAt || raw._creationTime || Date.now());
  return {
    ...raw,
    _id: String(raw.id || raw._id || ""),
    _creationTime: Number.isFinite(createdAt) ? createdAt : Date.now(),
    orderNumber: String(raw.orderNumber || ""),
    items: Array.isArray(raw.items) ? raw.items : [],
    total: Number(raw.total || 0),
    subtotal: Number(raw.subtotal || 0),
    discount: Number(raw.discount || 0),
    deliveryFee: Number(raw.deliveryFee || 0),
    charges: Number(raw.charges || 0),
  } as CustomerOrder;
}

export function useOrders(_telegramUserId?: string) {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/orders", { credentials: "same-origin", cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to load orders");
      setOrders(Array.isArray(data.orders) ? data.orders.map(normalizeOrder) : []);
      setError(null);
    } catch (e) {
      console.error(e);
      setOrders([]);
      setError(e instanceof Error ? e.message : "Unable to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 15000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const createOrder = useCallback(async (orderData: Omit<CustomerOrder, "_id" | "_creationTime">) => {
    const response = await fetch("/api/orders", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Unable to create order");
    await load();
    return normalizeOrder(data.order);
  }, [load]);

  const mutate = useCallback(async (id: string, patch: Record<string, any>) => {
    const response = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Unable to update order");
    await load();
  }, [load]);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus, notes?: string) => mutate(id, { orderStatus: status, ...(notes !== undefined ? { adminNotes: notes } : {}) }), [mutate]);
  const updateOrderOcr = useCallback((id: string, ocrData: ReceiptOcrResult, receiptUrl?: string) => mutate(id, { receiptOcrData: ocrData, ...(receiptUrl ? { receiptUrl } : {}) }), [mutate]);
  const updateOrderPaymentStatus = useCallback((id: string, paymentStatus: PaymentStatus, orderStatus?: OrderStatus) => mutate(id, { paymentStatus, ...(orderStatus ? { orderStatus } : {}) }), [mutate]);

  const deleteOrder = useCallback(async (id: string) => {
    const response = await fetch(`/api/orders/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "same-origin" });
    if (!response.ok) throw new Error("Unable to delete order");
    await load();
  }, [load]);

  return { orders, allOrders: orders, loading, error, refresh: load, createOrder, updateOrderStatus, updateOrderOcr, updateOrderPaymentStatus, deleteOrder };
}
