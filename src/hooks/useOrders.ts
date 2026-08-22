import { useState, useEffect, useCallback } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase.ts";
import type { ReceiptOcrResult } from "@/types/ocr.ts";

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
export type DeliveryPaymentOption = "PAY_AT_CHECKOUT" | "PAY_UPON_FULFILLMENT";

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
  deliveryPaymentOption: DeliveryPaymentOption;
}

type FirestoreOrder = Omit<CustomerOrder, "_id" | "_creationTime"> & {
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

const ORDERS_COLLECTION = "orders";

function fromFirestore(id: string, data: FirestoreOrder): CustomerOrder {
  const createdAt = data.createdAt;
  const creationTime = createdAt instanceof Timestamp ? createdAt.toMillis() : Date.now();

  return {
    ...data,
    _id: id,
    _creationTime: creationTime,
  };
}

export function useOrders(telegramUserId?: string) {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const ordersQuery = query(
      collection(db, ORDERS_COLLECTION),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const nextOrders = snapshot.docs.map((snapshotDoc) =>
          fromFirestore(snapshotDoc.id, snapshotDoc.data() as FirestoreOrder)
        );
        setOrders(nextOrders);
        setLoading(false);
      },
      (snapshotError) => {
        console.error("Failed to subscribe to orders:", snapshotError);
        setError("Unable to load orders. Please refresh and try again.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const createOrder = useCallback(
    async (orderData: Omit<CustomerOrder, "_id" | "_creationTime">) => {
      const now = serverTimestamp();
      const orderDocument: FirestoreOrder = {
        ...orderData,
        createdAt: now as unknown as Timestamp,
        updatedAt: now as unknown as Timestamp,
      };

      const created = await addDoc(collection(db, ORDERS_COLLECTION), orderDocument);

      return {
        ...orderData,
        _id: created.id,
        _creationTime: Date.now(),
      } as CustomerOrder;
    },
    []
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, newStatus: OrderStatus, notes?: string) => {
      await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
        orderStatus: newStatus,
        ...(notes !== undefined ? { adminNotes: notes } : {}),
        updatedAt: serverTimestamp(),
      });
    },
    []
  );

  const updateOrderOcr = useCallback(
    async (orderId: string, ocrData: ReceiptOcrResult, receiptUrl?: string) => {
      await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
        receiptOcrData: ocrData,
        ...(receiptUrl ? { receiptUrl } : {}),
        updatedAt: serverTimestamp(),
      });
    },
    []
  );

  const updateOrderPaymentStatus = useCallback(
    async (
      orderId: string,
      paymentStatus: PaymentStatus,
      orderStatus?: OrderStatus
    ) => {
      await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
        paymentStatus,
        ...(orderStatus ? { orderStatus } : {}),
        updatedAt: serverTimestamp(),
      });
    },
    []
  );

  const deleteOrder = useCallback(async (orderId: string) => {
    await deleteDoc(doc(db, ORDERS_COLLECTION, orderId));
  }, []);

  const customerFilteredOrders = telegramUserId
    ? orders.filter((order) => order.telegramUserId === telegramUserId)
    : orders;

  return {
    orders: customerFilteredOrders,
    allOrders: orders,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    updateOrderOcr,
    updateOrderPaymentStatus,
    deleteOrder,
  };
}
