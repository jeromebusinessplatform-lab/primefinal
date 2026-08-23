import { useState } from "react";
import { useTelegram } from "@/context/TelegramContext.tsx";
import { useOrders, type CustomerOrder } from "@/hooks/useOrders.ts";
import { useReviews } from "@/hooks/useReviews.ts";
import { Package, Download, X, Printer, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/utils.ts";
import { ProductReviewModal } from "@/components/ProductReviewModal.tsx";

const STATUS_LABELS: Record<string, string> = {
  REVIEW: "Under Review", PAYMENT_CONFIRMED: "Payment Confirmed", START_PACKING: "Packing", READY: "Ready for Pickup",
  AWAITING_RIDER: "Awaiting Rider", DISPATCHED: "Dispatched", DELIVERED: "Delivered", PAYMENT_FAILED: "Payment Failed",
  HOLD_ORDER: "On Hold", REQUEST_RESUBMIT: "Resubmit Required", PAYMENT_CLEARED: "Payment Cleared", FINAL_FOLLOW_UP: "Final Follow-up",
  REJECTED: "Rejected", CANCELLED: "Cancelled",
};

function orderDate(order: CustomerOrder) {
  return new Date(order._creationTime).toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" });
}

function receiptHtml(order: CustomerOrder) {
  const items = order.items.map(item => `<tr><td>${item.quantity} × ${escapeHtml(item.productName)}</td><td style="text-align:right">${formatCurrency(item.subtotal)}</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>PRIME Receipt ${order.orderNumber}</title><style>body{font-family:Arial,sans-serif;max-width:680px;margin:32px auto;padding:0 20px;color:#111}h1{margin:0 0 4px}small{color:#666}table{width:100%;border-collapse:collapse;margin:20px 0}td{padding:8px 0;border-bottom:1px solid #ddd}.total{font-weight:700;font-size:20px}</style></head><body><h1>PRIME™ TRANSACTION RECEIPT</h1><small>Order #${escapeHtml(order.orderNumber)} • ${escapeHtml(orderDate(order))}</small><p><b>${escapeHtml(order.receiverName || "Customer")}</b><br>${escapeHtml(order.contactNumber || "")}<br>${escapeHtml(order.deliveryAddress || "")}</p><table>${items}<tr><td>Subtotal</td><td style="text-align:right">${formatCurrency(order.subtotal)}</td></tr><tr><td>Discount</td><td style="text-align:right">-${formatCurrency(order.discount)}</td></tr><tr><td>Delivery Fee</td><td style="text-align:right">${formatCurrency(order.deliveryFee)}</td></tr><tr class="total"><td>Total</td><td style="text-align:right">${formatCurrency(order.total)}</td></tr></table><p>Payment: ${escapeHtml(order.paymentMethodName || "—")}<br>Status: ${escapeHtml(STATUS_LABELS[order.orderStatus] || order.orderStatus)}</p></body></html>`;
}
function escapeHtml(value: string) { return value.replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\\": "&#92;", '"': "&quot;" }[c] || c)); }

function downloadReceipt(order: CustomerOrder) {
  const blob = new Blob([receiptHtml(order)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `PRIME-Receipt-${order.orderNumber}.html`; anchor.click(); URL.revokeObjectURL(url);
}

export default function OrdersPage() {
  const { customer } = useTelegram();
  const { orders, loading, error } = useOrders(customer?.telegramUserId);
  const { getReviewForOrderItem } = useReviews();
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<CustomerOrder | null>(null);
  const [reviewState, setReviewState] = useState<{ order: CustomerOrder; productId: string; productName: string } | null>(null);

  return (
    <div className="bg-[#f3f4f6] min-h-full pb-10">
      <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <div><h1 className="text-black font-normal uppercase text-xl leading-tight">ORDERS</h1><p className="text-xs text-neutral-500">Compact order history • tap an order for full details</p></div>
        <Link to="/shop" className="text-xs border border-neutral-200 px-3 py-1.5 rounded-lg">Shop</Link>
      </div>

      {loading ? <div className="p-3 space-y-2"><div className="h-14 bg-white rounded-xl border border-neutral-200 animate-pulse" /><div className="h-14 bg-white rounded-xl border border-neutral-200 animate-pulse" /></div> : error ? <div className="m-3 bg-white rounded-xl border p-5 text-sm text-red-600">{error}</div> : !orders.length ? (
        <div className="m-3 bg-white rounded-2xl border border-neutral-200 p-8 text-center"><Package size={42} className="mx-auto mb-3 opacity-30" /><p className="font-semibold">No order history found</p><Link to="/shop" className="inline-block mt-3 text-xs bg-black text-white px-4 py-2 rounded-lg">BROWSE PRODUCTS</Link></div>
      ) : (
        <div className="p-3 space-y-1.5">
          {orders.map((order) => (
            <button type="button" key={order._id} onClick={() => setSelectedOrder(order)} className="w-full text-left bg-white rounded-xl border border-neutral-200 px-3 py-2.5 flex items-center justify-between gap-3 hover:bg-neutral-50 active:bg-neutral-100">
              <div className="min-w-0"><div className="font-flex tabular-nums text-sm truncate">#{order.orderNumber}</div><div className="text-[11px] text-neutral-400">{orderDate(order)}</div></div>
              <div className="text-right shrink-0"><div className="text-[11px] uppercase">{STATUS_LABELS[order.orderStatus] || order.orderStatus}</div><div className="font-flex tabular-nums text-sm">{formatCurrency(order.total)}</div></div>
            </button>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 p-3 flex items-end sm:items-center justify-center" onClick={() => setSelectedOrder(null)}>
          <div className="w-full max-w-lg max-h-[88dvh] overflow-y-auto bg-white rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between"><div><div className="font-flex tabular-nums font-semibold">#{selectedOrder.orderNumber}</div><div className="text-[11px] text-neutral-400">{orderDate(selectedOrder)}</div></div><button type="button" onClick={() => setSelectedOrder(null)}><X size={18} /></button></div>
            <div className="p-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs"><div><div className="text-neutral-400">STATUS</div><div>{STATUS_LABELS[selectedOrder.orderStatus] || selectedOrder.orderStatus}</div></div><div><div className="text-neutral-400">PAYMENT</div><div>{selectedOrder.paymentStatus}</div></div><div><div className="text-neutral-400">METHOD</div><div>{selectedOrder.paymentMethodName || "—"}</div></div><div><div className="text-neutral-400">DELIVERY</div><div>{selectedOrder.courierName || "—"}</div></div></div>
              <div className="border-t pt-3"><div className="font-semibold mb-2">ITEMS</div>{selectedOrder.items.map((item) => { const review = getReviewForOrderItem(selectedOrder._id, item.productId); return <div key={`${item.productId}-${item.quantity}`} className="py-2 border-b last:border-0 flex items-start justify-between gap-3"><div><div>{item.quantity} × {item.productName}</div><div className="text-[11px] text-neutral-400">{formatCurrency(item.unitPrice)} each</div>{review ? <div className="text-[10px] text-neutral-500 mt-1">Reviewed • {review.rating}/5</div> : <button type="button" onClick={() => setReviewState({ order: selectedOrder, productId: item.productId, productName: item.productName })} className="text-[10px] underline mt-1 inline-flex items-center gap-1"><MessageSquare size={10} /> Write review</button>}</div><div className="font-flex tabular-nums">{formatCurrency(item.subtotal)}</div></div>; })}</div>
              <div className="space-y-1 text-xs border-t pt-3"><div className="flex justify-between"><span>Subtotal</span><span className="font-flex">{formatCurrency(selectedOrder.subtotal)}</span></div><div className="flex justify-between"><span>Discount</span><span className="font-flex">-{formatCurrency(selectedOrder.discount)}</span></div><div className="flex justify-between"><span>Delivery</span><span className="font-flex">{formatCurrency(selectedOrder.deliveryFee)}</span></div><div className="flex justify-between text-base font-bold pt-1"><span>Total</span><span className="font-flex">{formatCurrency(selectedOrder.total)}</span></div></div>
              <div className="border-t pt-3 text-xs"><div className="font-semibold">DELIVER TO</div><div className="mt-1">{selectedOrder.receiverName}</div><div>{selectedOrder.contactNumber}</div><div className="text-neutral-500">{selectedOrder.deliveryAddress}</div></div>
              <div className="flex gap-2 pt-2"><button type="button" onClick={() => setReceiptOrder(selectedOrder)} className="flex-1 border border-black rounded-lg py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5"><Download size={13} /> DOWNLOAD RECEIPT</button><button type="button" onClick={() => setSelectedOrder(null)} className="px-4 border rounded-lg py-2 text-xs">CLOSE</button></div>
            </div>
          </div>
        </div>
      )}

      {receiptOrder && (
        <div className="fixed inset-0 z-[60] bg-black/60 p-3 flex items-end sm:items-center justify-center" onClick={() => setReceiptOrder(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b flex items-center justify-between"><div><div className="font-semibold">DOWNLOAD RECEIPT</div><div className="font-flex text-[11px] text-neutral-400">#{receiptOrder.orderNumber}</div></div><button type="button" onClick={() => setReceiptOrder(null)}><X size={18} /></button></div>
            <div className="p-4"><div className="border rounded-xl p-4 text-xs space-y-2"><div className="font-bold text-base">PRIME™ TRANSACTION RECEIPT</div><div className="text-neutral-500">Order #{receiptOrder.orderNumber}</div><div className="border-t pt-2">{receiptOrder.items.map(i => <div key={`${i.productId}-${i.quantity}`} className="flex justify-between py-1"><span>{i.quantity} × {i.productName}</span><span className="font-flex">{formatCurrency(i.subtotal)}</span></div>)}</div><div className="border-t pt-2 flex justify-between font-bold"><span>Total</span><span className="font-flex">{formatCurrency(receiptOrder.total)}</span></div></div><div className="flex gap-2 mt-3"><button type="button" onClick={() => downloadReceipt(receiptOrder)} className="flex-1 bg-black text-white rounded-lg py-2 text-xs inline-flex items-center justify-center gap-1.5"><Download size={13} /> DOWNLOAD HTML COPY</button><button type="button" onClick={() => window.print()} className="border rounded-lg px-4 py-2 text-xs inline-flex items-center gap-1.5"><Printer size={13} /> PRINT</button></div></div>
          </div>
        </div>
      )}

      {reviewState && <ProductReviewModal isOpen={true} onClose={() => setReviewState(null)} productId={reviewState.productId} productName={reviewState.productName} orderId={reviewState.order._id} orderNumber={reviewState.order.orderNumber} userId={customer?.telegramUserId || ""} userName={customer?.telegramDisplayName || ""} existingReview={getReviewForOrderItem(reviewState.order._id, reviewState.productId)} />}
    </div>
  );
}
