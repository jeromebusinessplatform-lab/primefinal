import { useState, type FormEvent, type ChangeEvent } from "react";
import { useCart } from "@/context/CartContext.tsx";
import { useTelegram } from "@/context/TelegramContext.tsx";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, MapPin, Upload, CheckCircle2, Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import { useOrders } from "@/hooks/useOrders.ts";
import { useCouriers } from "@/hooks/useCouriers.ts";
import { formatCurrency } from "@/lib/utils.ts";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { customer } = useTelegram();
  const { createOrder } = useOrders(customer?.telegramUserId);
  const { couriers } = useCouriers();
  const navigate = useNavigate();

  const [recipientName, setRecipientName] = useState(
    customer?.telegramDisplayName || "Marcus Vance"
  );
  const [phone, setPhone] = useState("0919 123 1234");
  const [address, setAddress] = useState("450 Silicon Way, Tech District, Ste 800");
  const [selectedCourierId, setSelectedCourierId] = useState(
    couriers[0]?._id || "cour-1"
  );
  const [notes, setNotes] = useState("");
  const MAX_NOTES = 160;

  const [paymentMethod, setPaymentMethod] = useState<"TELEGRAM_PAY" | "DIRECT_TRANSFER">("TELEGRAM_PAY");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCourier = couriers.find((c) => c._id === selectedCourierId) || couriers[0];
  const estTax = subtotal * 0.05;
  const shipping = subtotal > 0 ? (subtotal > 150 ? 0 : (selectedCourier?.baseFare ? selectedCourier.baseFare / 5 : 9.99)) : 0;
  const grandTotal = subtotal + estTax + shipping;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
      toast.success("Receipt image attached for verification");
    }
  };

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const generatedOrderNumber = `PRIME-${randomNum}`;

      const orderItems = items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.unitPrice * it.quantity,
      }));

      await createOrder({
        orderNumber: generatedOrderNumber,
        telegramUserId: customer?.telegramUserId || "1085949511",
        telegramDisplayName: customer?.telegramDisplayName || recipientName,
        telegramUsername: customer?.telegramUsername || "marcus_v",
        items: orderItems,
        subtotal,
        discount: 0,
        deliveryFee: shipping,
        total: grandTotal,
        receiverName: recipientName,
        contactNumber: phone,
        deliveryAddress: address,
        courierName: selectedCourier?.name || "Priority Dispatch Express",
        paymentMethodName: paymentMethod === "TELEGRAM_PAY" ? "Telegram Pay" : "Direct Transfer OCR",
        paymentStatus: "CONFIRMED",
        orderStatus: "REVIEW",
        queuePosition: 6,
        estimatedWaitingMinutes: 44,
        estimatedDispatchTime: "21 MINUTES",
        adminNotes: notes || undefined,
        receiptUrl: receiptPreview || undefined,
      });

      clearCart();
      toast.success("Order placed successfully!");
      navigate(`/shop/order-confirmation/${generatedOrderNumber}`, {
        state: {
          orderNumber: generatedOrderNumber,
          queuePosition: 6,
          estimatedWaitingMinutes: 44,
          estimatedDispatchTime: "21 MINUTES",
        },
      });
    } catch {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-[#f3f4f6] min-h-full p-6 text-center py-20">
        <h2 className="text-xl font-normal text-neutral-800" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
          Your cart is empty
        </h2>
        <Link
          to="/shop"
          className="mt-4 inline-block bg-black text-white px-5 py-2 rounded-xl text-sm font-normal"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f3f4f6] min-h-full pb-10">
      {/* Top Header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/shop/cart")}
          className="p-1 text-neutral-700 hover:text-black cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1
            className="text-black font-normal uppercase text-xl leading-tight"
            style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
          >
            SECURE CHECKOUT
          </h1>
          <p className="text-xs text-neutral-500 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Verified customer delivery dispatch
          </p>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="p-3 space-y-3">
        {/* Delivery Information */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-black font-normal text-sm uppercase">
            <MapPin size={16} className="text-blue-600" />
            <span style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>Delivery Details</span>
          </div>

          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-normal text-neutral-600 uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Recipient Name
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full mt-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:border-black font-normal"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                />
              </div>

              <div>
                <label className="text-[11px] font-normal text-neutral-600 uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Contact Phone
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0919 123 1238"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full mt-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:border-black font-normal"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-normal text-neutral-600 uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                Delivery Street Address
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, city, district..."
                className="w-full mt-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:border-black font-normal"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              />
            </div>

            {/* Courier Selection */}
            <div>
              <label className="text-[11px] font-normal text-neutral-600 uppercase mb-1 block" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                Select Courier Partner
              </label>
              <div className="space-y-1.5">
                {couriers.map((c) => (
                  <label
                    key={c._id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                      selectedCourierId === c._id
                        ? "border-black bg-neutral-50"
                        : "border-neutral-200 bg-white hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="courier"
                        checked={selectedCourierId === c._id}
                        onChange={() => setSelectedCourierId(c._id)}
                        className="w-4 h-4 text-black accent-black"
                      />
                      <div>
                        <div className="text-xs font-normal text-black" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                          {c.name}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-normal">
                          {c.serviceTypes.join(" • ")}
                        </div>
                      </div>
                    </div>
                    <Truck size={14} className="text-neutral-400" />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-normal text-neutral-600 uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                Unit / Floor / Delivery Notes (Optional)
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  maxLength={MAX_NOTES}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter up to 160 characters..."
                  className="w-full mt-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:border-black resize-none font-normal"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                />
                <div className="absolute bottom-2 right-2 text-[10px] text-neutral-400">
                  {notes.length}/{MAX_NOTES}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Verification & Method */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-black font-normal text-sm uppercase">
            <ShieldCheck size={16} className="text-green-600" />
            <span style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>Payment Verification</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("TELEGRAM_PAY")}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                paymentMethod === "TELEGRAM_PAY"
                  ? "border-black bg-neutral-50 font-normal"
                  : "border-neutral-200 text-neutral-600 font-normal"
              }`}
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              <div className="text-xs font-normal text-black" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                Telegram Pay
              </div>
              <div className="text-[10px] text-neutral-500">Instant bot settlement</div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("DIRECT_TRANSFER")}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                paymentMethod === "DIRECT_TRANSFER"
                  ? "border-black bg-neutral-50 font-normal"
                  : "border-neutral-200 text-neutral-600 font-normal"
              }`}
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              <div className="text-xs font-normal text-black" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                Bank / OCR Receipt
              </div>
              <div className="text-[10px] text-neutral-500">Automated OCR scan</div>
            </button>
          </div>

          {/* Receipt Attachment Area */}
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-3 text-center bg-neutral-50/50 hover:bg-neutral-50 transition-colors relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            {receiptPreview ? (
              <div className="flex items-center justify-center gap-2 text-green-600 text-xs font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                <CheckCircle2 size={16} /> Receipt Attached ({receiptFile?.name || "Uploaded"})
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-neutral-500 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                <Upload size={20} className="mb-1 text-neutral-400" />
                <span className="text-xs font-normal text-neutral-700">Attach Payment Confirmation / Receipt</span>
                <span className="text-[10px] text-neutral-400">Click or drag image file here</span>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary & Confirmation Button */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 shadow-xs space-y-2">
          <div className="flex justify-between text-xs text-neutral-600 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            <span>Items Subtotal ({items.length} items)</span>
            <span className="font-normal text-neutral-900">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-neutral-600 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            <span>Est. Taxes & Processing (5%)</span>
            <span className="font-normal text-neutral-900">{formatCurrency(estTax)}</span>
          </div>
          <div className="flex justify-between text-xs text-neutral-600 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            <span>Priority Dispatch</span>
            <span className="font-normal text-neutral-900">
              {shipping === 0 ? "FREE" : formatCurrency(shipping)}
            </span>
          </div>
          <div className="pt-2 border-t border-neutral-100 flex justify-between items-baseline">
            <span
              className="text-sm font-normal text-black"
              style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
            >
              FINAL PAYABLE
            </span>
            <span
              className="text-xl font-normal text-black"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {formatCurrency(grandTotal)}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-3 bg-black hover:bg-neutral-800 text-white font-normal py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition-all"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "17px",
              letterSpacing: "0.5px",
            }}
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
            {isSubmitting ? "PROCESSING TRANSACTION..." : "CONFIRM & SUBMIT ORDER"}
          </button>
        </div>
      </form>
    </div>
  );
}
