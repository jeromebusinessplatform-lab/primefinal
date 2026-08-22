import { useState, useEffect, useCallback } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  runTransaction,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase.ts";
import type { ReceiptOcrResult } from "@/types/ocr.ts";

export type OrderStatus =
  | "REVIEW" | "PAYMENT_CONFIRMED" | "START_PACKING" | "READY" | "AWAITING_RIDER"
  | "DISPATCHED" | "DELIVERED" | "PAYMENT_FAILED" | "HOLD_ORDER"
  | "REQUEST_RESUBMIT" | "PAYMENT_CLEARED" | "FINAL_FOLLOW_UP" | "REJECTED" | "CANCELLED";
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
  _id: string; orderNumber: string; _creationTime: number;
  telegramUserId?: string; telegramDisplayName?: string; telegramUsername?: string;
  items: OrderItem[]; total: number; subtotal: number; discount: number; deliveryFee: number; charges?: number;
  receiverName: string; contactNumber: string; deliveryAddress: string; courierName: string;
  deliveryProviderId?: string; deliveryCharge?: number; deliveryPaymentMethod?: DeliveryPaymentOption;
  paymentMethodName: string; paymentStatus: PaymentStatus; orderStatus: OrderStatus;
  queuePosition: number; estimatedWaitingMinutes: number; estimatedDispatchTime: string;
  adminNotes?: string; receiptUrl?: string; receiptOcrData?: ReceiptOcrResult;
  deliveryPaymentOption?: DeliveryPaymentOption;
}

type FirestoreOrder = Omit<CustomerOrder, "_id" | "_creationTime"> & { createdAt?: Timestamp | null; updatedAt?: Timestamp | null };
const ORDERS_COLLECTION = "orders";
const CUSTOMERS_COLLECTION = "customers";
const PRODUCTS_COLLECTION = "products";
const CHARGES_COLLECTION = "charges";

function makeOrderNumber(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(now.getDate())}${pad(now.getMonth() + 1)}${String(now.getFullYear()).slice(-2)}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function fromFirestore(id: string, data: FirestoreOrder): CustomerOrder {
  const createdAt = data.createdAt;
  return { ...data, _id: id, _creationTime: createdAt instanceof Timestamp ? createdAt.toMillis() : Date.now() };
}

export function useOrders(telegramUserId?: string) {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true); setError(null);
    const ordersQuery = query(collection(db, ORDERS_COLLECTION), orderBy("createdAt", "desc"));
    return onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map((d) => fromFirestore(d.id, d.data() as FirestoreOrder)));
      setLoading(false);
    }, (snapshotError) => {
      console.error("Failed to subscribe to orders:", snapshotError);
      setError("Unable to load orders. Please refresh and try again."); setLoading(false);
    });
  }, []);

  const createOrder = useCallback(async (orderData: Omit<CustomerOrder, "_id" | "_creationTime">) => {
    const verifiedTelegramUserId = orderData.telegramUserId?.trim();
    if (!verifiedTelegramUserId || verifiedTelegramUserId === "1085949511") {
      throw new Error("A verified Telegram customer identity is required before placing an order.");
    }
    if (!orderData.items.length) throw new Error("Cannot place an order without items.");

    const normalizedOrderNumber = /^\d{12}$/.test(orderData.orderNumber) ? orderData.orderNumber : makeOrderNumber();
    const orderRef = doc(collection(db, ORDERS_COLLECTION));
    const customerRef = doc(db, CUSTOMERS_COLLECTION, verifiedTelegramUserId);
    const productRefs = orderData.items.map((item) => ({ item, ref: doc(db, PRODUCTS_COLLECTION, item.productId) }));

    // Load the currently active admin-configured charges once before the transaction.
    // The transaction still remains authoritative for product prices, stock and the final order write.
    const chargesSnapshot = await getDocs(collection(db, CHARGES_COLLECTION));
    const activeCharges = chargesSnapshot.docs
      .map((entry) => entry.data() as { amount?: number; type?: "fixed" | "percent"; active?: boolean })
      .filter((charge) => charge.active === true);

    await runTransaction(db, async (transaction) => {
      const productSnapshots = [];
      for (const entry of productRefs) {
        productSnapshots.push({ entry, snapshot: await transaction.get(entry.ref) });
      }

      const normalizedItems: OrderItem[] = [];
      let authoritativeSubtotal = 0;

      for (const { entry, snapshot } of productSnapshots) {
        if (!snapshot.exists()) throw new Error(`Product ${entry.item.productId} is no longer available.`);
        const product = snapshot.data() as { name?: string; price?: number; salePrice?: number; bundleCalculatedPrice?: number; stock?: number; available?: boolean };
        const quantity = Number(entry.item.quantity);
        const stock = Number(product.stock ?? 0);
        if (!Number.isInteger(quantity) || quantity <= 0) throw new Error(`Invalid quantity for ${product.name || entry.item.productId}.`);
        if (product.available === false || stock < quantity) throw new Error(`${product.name || entry.item.productId} does not have enough stock.`);

        const authoritativeUnitPrice = Number(product.bundleCalculatedPrice ?? product.salePrice ?? product.price ?? 0);
        if (!Number.isFinite(authoritativeUnitPrice) || authoritativeUnitPrice < 0) throw new Error(`Invalid price configuration for ${product.name || entry.item.productId}.`);
        const subtotal = Math.round(authoritativeUnitPrice * quantity * 100) / 100;
        authoritativeSubtotal += subtotal;
        normalizedItems.push({ productId: entry.item.productId, productName: product.name || entry.item.productName, quantity, unitPrice: authoritativeUnitPrice, subtotal });
        transaction.update(entry.ref, { stock: stock - quantity, updatedAt: Timestamp.now() });
      }

      authoritativeSubtotal = Math.round(authoritativeSubtotal * 100) / 100;
      const clientDiscount = Number(orderData.discount || 0);
      const safeDiscount = Number.isFinite(clientDiscount) ? Math.max(0, Math.min(clientDiscount, authoritativeSubtotal)) : 0;
      const deliveryFee = Math.max(0, Number(orderData.deliveryFee || 0));
      const merchandiseAfterDiscount = Math.max(0, authoritativeSubtotal - safeDiscount);
      const charges = Math.round(activeCharges.reduce((sum, charge) => {
        const amount = Number(charge.amount ?? 0);
        if (!Number.isFinite(amount) || amount < 0) return sum;
        return sum + (charge.type === "percent" ? merchandiseAfterDiscount * amount / 100 : amount);
      }, 0) * 100) / 100;
      const tax = Math.round((merchandiseAfterDiscount + charges) * 0.05 * 100) / 100;
      const authoritativeTotal = Math.round((merchandiseAfterDiscount + charges + tax + deliveryFee) * 100) / 100;
      const now = Timestamp.now();

      transaction.set(orderRef, {
        ...orderData,
        telegramUserId: verifiedTelegramUserId,
        orderNumber: normalizedOrderNumber,
        items: normalizedItems,
        subtotal: authoritativeSubtotal,
        discount: safeDiscount,
        charges,
        deliveryFee,
        total: authoritativeTotal,
        paymentStatus: "PENDING" as PaymentStatus,
        orderStatus: "REVIEW" as OrderStatus,
        createdAt: now,
        updatedAt: now,
      });

      transaction.set(customerRef, {
        id: verifiedTelegramUserId,
        telegramUserId: verifiedTelegramUserId,
        telegramDisplayName: orderData.telegramDisplayName || "Unknown",
        telegramUsername: orderData.telegramUsername || null,
        primeMemberId: `PC${verifiedTelegramUserId.slice(0, 8).toUpperCase()}`,
        vipTier: "Bronze",
        lastOrderAt: now,
        updatedAt: now,
      }, { merge: true });
    });

    return { ...orderData, telegramUserId: verifiedTelegramUserId, orderNumber: normalizedOrderNumber, paymentStatus: "PENDING" as PaymentStatus, orderStatus: "REVIEW" as OrderStatus, _id: orderRef.id, _creationTime: Date.now() } as CustomerOrder;
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus, notes?: string) => {
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), { orderStatus: newStatus, ...(notes !== undefined ? { adminNotes: notes } : {}), updatedAt: Timestamp.now() });
  }, []);

  const updateOrderOcr = useCallback(async (orderId: string, ocrData: ReceiptOcrResult, receiptUrl?: string) => {
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), { receiptOcrData: ocrData, ...(receiptUrl ? { receiptUrl } : {}), updatedAt: Timestamp.now() });
  }, []);

  const updateOrderPaymentStatus = useCallback(async (orderId: string, paymentStatus: PaymentStatus, orderStatus?: OrderStatus) => {
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), { paymentStatus, ...(orderStatus ? { orderStatus } : {}), updatedAt: Timestamp.now() });
  }, []);

  const deleteOrder = useCallback(async (orderId: string) => { await deleteDoc(doc(db, ORDERS_COLLECTION, orderId)); }, []);

  const customerFilteredOrders = telegramUserId ? orders.filter((order) => order.telegramUserId === telegramUserId) : orders;
  return { orders: customerFilteredOrders, allOrders: orders, loading, error, createOrder, updateOrderStatus, updateOrderOcr, updateOrderPaymentStatus, deleteOrder };
}
