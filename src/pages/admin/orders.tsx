import { useState, useMemo } from "react";
import {
  Search,
  Package,
  Truck,
  Eye,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useOrders, type CustomerOrder, type OrderStatus } from "@/hooks/useOrders.ts";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils.ts";

const STATUS_LABELS: Record<OrderStatus, string> = {
  REVIEW: "Under Review",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  START_PACKING: "Packing",
  READY: "Ready for Pickup",
  AWAITING_RIDER: "Awaiting Rider",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
  PAYMENT_FAILED: "Payment Failed",
  HOLD_ORDER: "On Hold",
  REQUEST_RESUBMIT: "Resubmit Required",
  PAYMENT_CLEARED: "Payment Cleared",
  FINAL_FOLLOW_UP: "Final Follow-up",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  REVIEW: "bg-amber-500/20 text-amber-700 border-amber-500/30",
  PAYMENT_CONFIRMED: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
  START_PACKING: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  READY: "bg-teal-500/20 text-teal-700 border-teal-500/30",
  AWAITING_RIDER: "bg-indigo-500/20 text-indigo-700 border-indigo-500/30",
  DISPATCHED: "bg-purple-500/20 text-purple-700 border-purple-500/30",
  DELIVERED: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
  PAYMENT_FAILED: "bg-rose-500/20 text-rose-700 border-rose-500/30",
  HOLD_ORDER: "bg-orange-500/20 text-orange-700 border-orange-500/30",
  REQUEST_RESUBMIT: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  PAYMENT_CLEARED: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
  FINAL_FOLLOW_UP: "bg-amber-500/20 text-amber-700 border-amber-500/30",
  REJECTED: "bg-rose-500/20 text-rose-700 border-rose-500/30",
  CANCELLED: "bg-neutral-500/20 text-neutral-700 border-neutral-500/30",
};

export default function AdminOrdersPage() {
  const { allOrders: orders, updateOrderStatus, deleteOrder } = useOrders();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.receiverName.toLowerCase().includes(search.toLowerCase()) ||
        o.contactNumber.includes(search) ||
        (o.telegramUsername && o.telegramUsername.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === "ALL" || o.orderStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    toast.success(`Updated order #${selectedOrder?.orderNumber} status to ${STATUS_LABELS[newStatus]}`);
    if (selectedOrder?._id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, orderStatus: newStatus } : null));
    }
  };

  const handleUpdateNotes = (orderId: string, notes: string) => {
    updateOrderStatus(orderId, selectedOrder?.orderStatus || "REVIEW", notes);
    if (selectedOrder?._id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, adminNotes: notes } : null));
    }
  };

  const handleDelete = (orderId: string) => {
    deleteOrder(orderId);
    if (selectedOrder?._id === orderId) {
      setSelectedOrder(null);
    }
    toast.success("Order removed from queue");
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className="text-black text-2xl font-normal tracking-wide uppercase"
            style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
          >
            Orders Management
          </h1>
          <p className="text-neutral-500 text-xs mt-0.5 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Real-time customer orders, payment approvals, and courier dispatches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-neutral-200 rounded-xl px-3.5 py-1.5 flex items-center gap-2">
            <span className="text-neutral-500 text-xs font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Active Orders:</span>
            <span className="text-black font-semibold text-sm" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{orders.length}</span>
          </div>

          <button
            onClick={() => toast.success("Synced latest orders")}
            className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs px-3 py-2 rounded-xl transition cursor-pointer font-normal"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            <RefreshCw size={13} /> Refresh Sync
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-neutral-500 text-[10px] font-normal uppercase tracking-wider" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Pending Review</div>
          <div className="text-amber-600 text-2xl font-normal mt-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
            {orders.filter((o) => o.orderStatus === "REVIEW").length}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-neutral-500 text-[10px] font-normal uppercase tracking-wider" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>In Preparation</div>
          <div className="text-blue-600 text-2xl font-normal mt-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
            {orders.filter((o) => ["PAYMENT_CONFIRMED", "START_PACKING", "READY"].includes(o.orderStatus)).length}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-neutral-500 text-[10px] font-normal uppercase tracking-wider" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Out for Delivery</div>
          <div className="text-purple-600 text-2xl font-normal mt-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
            {orders.filter((o) => ["AWAITING_RIDER", "DISPATCHED"].includes(o.orderStatus)).length}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-neutral-500 text-[10px] font-normal uppercase tracking-wider" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Delivered</div>
          <div className="text-emerald-600 text-2xl font-normal mt-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
            {orders.filter((o) => o.orderStatus === "DELIVERED").length}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-3 py-2 shadow-2xs">
          <Search size={15} className="text-neutral-400" />
          <input
            type="text"
            placeholder="Search by order #, customer, phone, or handle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-black placeholder-neutral-400 outline-none font-normal"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {["ALL", "REVIEW", "START_PACKING", "DISPATCHED", "DELIVERED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-normal whitespace-nowrap cursor-pointer transition ${
                statusFilter === st ? "bg-black text-white" : "bg-white text-neutral-600 hover:text-black border border-neutral-200"
              }`}
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center text-neutral-400">
              <Package size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-normal" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                No orders match the selected filters
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order._id}
                onClick={() => setSelectedOrder(order)}
                className={`bg-white border rounded-2xl p-4 transition cursor-pointer hover:border-neutral-400 shadow-2xs ${
                  selectedOrder?._id === order._id ? "border-black ring-1 ring-black" : "border-neutral-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-black font-normal text-lg tracking-wider"
                        style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                      >
                        #{order.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-normal px-2 py-0.5 rounded-full border ${
                          STATUS_COLORS[order.orderStatus]
                        }`}
                        style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                      >
                        {STATUS_LABELS[order.orderStatus]}
                      </span>
                    </div>
                    <div className="text-neutral-500 text-xs mt-1 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {order.receiverName} {order.telegramUsername ? `(@${order.telegramUsername})` : ""}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className="text-black font-normal text-lg"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                      {formatCurrency(order.total)}
                    </div>
                    <div className="text-neutral-400 text-[11px] font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {new Date(order._creationTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  <div className="flex items-center gap-1.5">
                    <Package size={13} className="text-neutral-400" />
                    <span>
                      {order.items.reduce((s, i) => s + i.quantity, 0)} items ({order.items.map((i) => i.productName).join(", ")})
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-neutral-700 font-normal">
                    <Truck size={13} /> {order.courierName}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-1">
          {selectedOrder ? (
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 sticky top-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <div
                    className="text-black font-normal text-xl"
                    style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                  >
                    #{selectedOrder.orderNumber}
                  </div>
                  <div className="text-xs text-neutral-500 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {new Date(selectedOrder._creationTime).toLocaleString()}
                  </div>
                </div>
                <span
                  className={`text-xs font-normal px-2.5 py-1 rounded-full border ${
                    STATUS_COLORS[selectedOrder.orderStatus]
                  }`}
                  style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                >
                  {STATUS_LABELS[selectedOrder.orderStatus]}
                </span>
              </div>

              <div>
                <label className="block text-neutral-500 text-[11px] font-normal uppercase tracking-wider mb-1.5" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Update Order Status
                </label>
                <select
                  value={selectedOrder.orderStatus}
                  onChange={(e) => handleUpdateStatus(selectedOrder._id, e.target.value as OrderStatus)}
                  className="w-full bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs rounded-xl px-3 py-2.5 outline-none cursor-pointer font-normal"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px" }}
                >
                  {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((st) => (
                    <option key={st} value={st}>
                      {STATUS_LABELS[st]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <div className="text-xs font-normal text-neutral-400 uppercase tracking-wider" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                  Customer & Delivery
                </div>
                <div className="bg-neutral-50 rounded-xl p-3 text-xs space-y-1.5 font-normal border border-neutral-100" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px" }}>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Receiver:</span>
                    <span className="text-black font-medium">{selectedOrder.receiverName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Contact:</span>
                    <span className="text-black font-medium">{selectedOrder.contactNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Courier:</span>
                    <span className="text-black font-medium">{selectedOrder.courierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Payment:</span>
                    <span className="text-black font-medium">{selectedOrder.paymentMethodName}</span>
                  </div>
                  <div className="pt-1 border-t border-neutral-200">
                    <span className="text-neutral-500 block mb-0.5">Address:</span>
                    <span className="text-neutral-800 leading-snug block">{selectedOrder.deliveryAddress}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <div className="text-xs font-normal text-neutral-400 uppercase tracking-wider" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                  Ordered Items
                </div>
                <div className="space-y-1.5 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-1 border-b border-neutral-100">
                      <span className="text-neutral-700">
                        {it.quantity}x {it.productName}
                      </span>
                      <span className="text-black font-medium">{formatCurrency(it.subtotal)}</span>
                    </div>
                  ))}
                  <div className="pt-2 text-xs space-y-1">
                    <div className="flex justify-between text-neutral-500">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-500">
                      <span>Delivery Fee:</span>
                      <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between text-black font-semibold text-sm pt-1 border-t border-neutral-200">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100">
                <label className="block text-neutral-500 text-[11px] font-normal uppercase tracking-wider mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={selectedOrder.adminNotes ?? ""}
                  onChange={(e) => handleUpdateNotes(selectedOrder._id, e.target.value)}
                  placeholder="Add notes for dispatch team..."
                  className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs rounded-xl p-2.5 outline-none resize-none placeholder-neutral-400 font-normal"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                />
              </div>

              <button
                type="button"
                onClick={() => handleDelete(selectedOrder._id)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl border border-red-200 cursor-pointer transition-colors"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                <Trash2 size={13} /> Remove Order
              </button>
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center text-neutral-400 shadow-2xs">
              <Eye size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                Select an order from the list to review details and update its processing status.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
