import { useState, type FormEvent, type ChangeEvent, type MouseEvent } from "react";
import { useCart } from "@/context/CartContext.tsx";
import { useTelegram } from "@/context/TelegramContext.tsx";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Upload,
  CheckCircle2,
  Loader2,
  Truck,
  CreditCard,
  Check,
  Edit2,
  Phone,
  User,
  ShoppingBag,
  Trash2,
  QrCode,
  FileCheck,
  Building2,
  Route
} from "lucide-react";
import { toast } from "sonner";
import { useOrders } from "@/hooks/useOrders.ts";
import { useCouriers } from "@/hooks/useCouriers.ts";
import { useAddressAutocomplete } from "@/hooks/useAddressAutocomplete.ts";
import { GeoAddressAutocomplete } from "@/components/GeoAddressAutocomplete.tsx";
import { ReceiptOcrScanner } from "@/components/ReceiptOcrScanner.tsx";
import type { ReceiptOcrResult } from "@/types/ocr.ts";
import { formatCurrency } from "@/lib/utils.ts";

type CheckoutStep = 1 | 2 | 3;

export default function CheckoutPage() {
  const { items, subtotal, selectedItems, selectedSubtotal, removeSelectedItems, clearCart } = useCart();
  const { customer } = useTelegram();
  const { createOrder } = useOrders(customer?.telegramUserId);
  const { couriers } = useCouriers();
  const navigate = useNavigate();

  // Active items being checked out
  const itemsToCheckout = selectedItems.length > 0 ? selectedItems : items;
  const activeSubtotal = selectedItems.length > 0 ? selectedSubtotal : subtotal;

  // Multi-step State
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);

  // Step 1: Delivery Details & Geoapify Address Hook (300ms Debounce)
  const [recipientName, setRecipientName] = useState(
    customer?.telegramDisplayName || "Marcus Vance"
  );
  const [phone, setPhone] = useState("0919 123 1234");
  const {
    addressInput,
    setAddressInput,
    suggestions,
    isLoading: isGeoLoading,
    isLocating,
    isOpen: isGeoOpen,
    setIsOpen: setIsGeoOpen,
    selectedLocation,
    selectSuggestion,
    detectCurrentLocation,
    detectIpLocation,
    routeInfo,
    isCalculatingRoute,
    geoConfig,
  } = useAddressAutocomplete("Bonifacio Global City, 5th Avenue, Taguig, Metro Manila");

  const [selectedCourierId, setSelectedCourierId] = useState(
    couriers[0]?._id || "cour-1"
  );
  const [notes, setNotes] = useState("");
  const MAX_NOTES = 160;

  // Step 2: Payment Details
  const [paymentMethod, setPaymentMethod] = useState<"TELEGRAM_PAY" | "DIRECT_TRANSFER">("TELEGRAM_PAY");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<ReceiptOcrResult | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCourier = couriers.find((c) => c._id === selectedCourierId) || couriers[0];
  const estTax = activeSubtotal * 0.05;

  // Calculate dynamic courier shipping fee with Geoapify route distance
  const baseCourierFare = selectedCourier?.baseFare ?? 50;
  const minCourierCoverage = selectedCourier?.minDistance ?? 5;
  const excessKmRate = selectedCourier?.excessDistanceFare ?? 10;
  const actualDistanceKm = routeInfo?.distanceKm ?? 6.2;
  const excessDistanceKm = Math.max(0, actualDistanceKm - minCourierCoverage);
  const calculatedCourierFee = Math.round(baseCourierFare + excessDistanceKm * excessKmRate);

  const shipping = activeSubtotal > 0 ? (activeSubtotal > 2500 ? 0 : calculatedCourierFee) : 0;
  const grandTotal = activeSubtotal + estTax + shipping;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
      toast.success("Receipt attachment uploaded for verification");
    }
  };

  const handleRemoveReceipt = (e: MouseEvent) => {
    e.stopPropagation();
    setReceiptFile(null);
    setReceiptPreview(null);
    toast.info("Receipt removed");
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!recipientName.trim()) {
      toast.error("Please enter the recipient name");
      return false;
    }
    if (!phone.trim()) {
      toast.error("Please enter a contact phone number");
      return false;
    }
    if (!addressInput.trim()) {
      toast.error("Please enter the delivery address");
      return false;
    }
    return true;
  };

  const handleNextFromStep1 = (e: FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextFromStep2 = (e: FormEvent) => {
    e.preventDefault();
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const generatedOrderNumber = `PRIME-${randomNum}`;

      const orderItems = itemsToCheckout.map((it) => ({
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
        subtotal: activeSubtotal,
        discount: 0,
        deliveryFee: shipping,
        total: grandTotal,
        receiverName: recipientName,
        contactNumber: phone,
        deliveryAddress: addressInput,
        courierName: selectedCourier?.name || "Priority Dispatch Express",
        paymentMethodName: paymentMethod === "TELEGRAM_PAY" ? "Telegram Pay" : "Direct Transfer OCR",
        paymentStatus: "CONFIRMED",
        orderStatus: "REVIEW",
        queuePosition: 6,
        estimatedWaitingMinutes: routeInfo ? Math.max(15, routeInfo.durationMinutes + 12) : 44,
        estimatedDispatchTime: routeInfo ? `${routeInfo.durationMinutes} MIN TRANSIT` : "21 MINUTES",
        adminNotes: notes || undefined,
        receiptUrl: receiptPreview || undefined,
        receiptOcrData: ocrResult || undefined,
      });

      // Remove only the purchased items, preserving unselected items for future use
      if (selectedItems.length > 0) {
        removeSelectedItems();
      } else {
        clearCart();
      }
      toast.success("Order confirmed successfully!");
      navigate(`/shop/order-confirmation/${generatedOrderNumber}`, {
        state: {
          orderNumber: generatedOrderNumber,
          queuePosition: 6,
          estimatedWaitingMinutes: routeInfo ? Math.max(15, routeInfo.durationMinutes + 12) : 44,
          estimatedDispatchTime: routeInfo ? `${routeInfo.durationMinutes} MIN TRANSIT` : "21 MINUTES",
          distanceKm: routeInfo?.distanceKm,
        },
      });
    } catch {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (itemsToCheckout.length === 0) {
    return (
      <div className="bg-[#f3f4f6] min-h-full p-6 text-center py-20">
        <div className="w-16 h-16 bg-neutral-200/60 rounded-full flex items-center justify-center mx-auto mb-3">
          <ShoppingBag size={28} className="text-neutral-500" />
        </div>
        <h2 className="text-xl font-normal text-neutral-800 uppercase" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
          No items selected for checkout
        </h2>
        <p className="text-xs text-neutral-500 font-normal mt-1 mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Select products in your cart or browse the catalog before proceeding to checkout.
        </p>
        <Link
          to="/shop/cart"
          className="inline-block bg-black text-white px-5 py-2.5 rounded-xl text-sm font-normal shadow-xs hover:bg-neutral-800 transition-colors"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Return to Cart
        </Link>
      </div>
    );
  }

  const stepsList = [
    { id: 1, label: "Shipping", shortLabel: "Delivery" },
    { id: 2, label: "Payment", shortLabel: "Payment" },
    { id: 3, label: "Review", shortLabel: "Confirm" },
  ];

  return (
    <div className="bg-[#f3f4f6] min-h-full pb-14">
      {/* Top Header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3 sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (currentStep === 1) navigate("/shop/cart");
                else setCurrentStep((prev) => (prev - 1) as CheckoutStep);
              }}
              className="p-1.5 -ml-1 text-neutral-700 hover:text-black rounded-lg hover:bg-neutral-100 cursor-pointer transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={19} />
            </button>
            <div>
              <h1
                className="text-black font-normal uppercase text-lg leading-none"
                style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
              >
                CHECKOUT
              </h1>
              <p className="text-[11px] text-neutral-500 font-normal mt-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                Step {currentStep} of 3 • {stepsList[currentStep - 1].label}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-neutral-400 font-normal uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Total Payable
            </div>
            <div className="text-sm font-semibold text-black leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {formatCurrency(grandTotal)}
            </div>
          </div>
        </div>

        {/* Step Progress Indicator */}
        <div className="mt-3 pt-2 border-t border-neutral-100">
          <div className="grid grid-cols-3 gap-2 relative">
            {stepsList.map((st) => {
              const isPassed = currentStep > st.id;
              const isCurrent = currentStep === st.id;

              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    // Only allow clicking to go back or to next if validated
                    if (st.id < currentStep) {
                      setCurrentStep(st.id as CheckoutStep);
                    } else if (st.id === 2 && currentStep === 1 && validateStep1()) {
                      setCurrentStep(2);
                    } else if (st.id === 3 && currentStep === 2) {
                      setCurrentStep(3);
                    }
                  }}
                  className={`flex items-center gap-1.5 text-left py-1 px-1.5 rounded-lg transition-all ${
                    isCurrent
                      ? "bg-neutral-900 text-white shadow-2xs"
                      : isPassed
                      ? "bg-neutral-100 text-neutral-800 hover:bg-neutral-200 cursor-pointer"
                      : "bg-transparent text-neutral-400 cursor-default"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isCurrent
                        ? "bg-white text-black"
                        : isPassed
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    {isPassed ? <Check size={10} strokeWidth={3} /> : st.id}
                  </div>
                  <span
                    className="text-[11px] font-medium tracking-tight truncate uppercase"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {st.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* ================= STEP 1: DELIVERY DETAILS ================= */}
        {currentStep === 1 && (
          <form onSubmit={handleNextFromStep1} className="space-y-3">
            <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 text-black font-normal text-sm uppercase pb-2 border-b border-neutral-100">
                <MapPin size={16} className="text-neutral-800" />
                <span style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>Delivery & Contact Information</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-normal text-neutral-600 uppercase flex items-center gap-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <User size={12} className="text-neutral-400" /> Recipient Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marcus Vance"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full mt-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:border-black font-normal transition-colors"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-normal text-neutral-600 uppercase flex items-center gap-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <Phone size={12} className="text-neutral-400" /> Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0919 123 1234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full mt-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:border-black font-normal transition-colors"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px" }}
                  />
                </div>

                {/* Geoapify Address Autocomplete (debounced at 300ms) with Geocoding, Reverse Geocoding, Route & Map Tile */}
                <GeoAddressAutocomplete
                  addressInput={addressInput}
                  onAddressChange={setAddressInput}
                  suggestions={suggestions}
                  isLoading={isGeoLoading}
                  isLocating={isLocating}
                  isOpen={isGeoOpen}
                  setIsOpen={setIsGeoOpen}
                  selectedLocation={selectedLocation}
                  onSelectSuggestion={selectSuggestion}
                  onDetectGps={detectCurrentLocation}
                  onDetectIp={detectIpLocation}
                  routeInfo={routeInfo}
                  isCalculatingRoute={isCalculatingRoute}
                  warehouseName={geoConfig?.warehouse.name}
                  hasGeoapifyKey={geoConfig?.hasApiKey}
                />
              </div>
            </div>

            {/* Courier Selection */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-2 text-black font-normal text-sm uppercase">
                  <Truck size={16} className="text-neutral-800" />
                  <span style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>Select Courier Fleet</span>
                </div>
                <span className="text-[11px] text-neutral-500 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {couriers.length} Available Partners
                </span>
              </div>

              <div className="space-y-2">
                {couriers.map((c) => {
                  const isSelected = selectedCourierId === c._id;
                  return (
                    <label
                      key={c._id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-black bg-neutral-900 text-white shadow-xs"
                          : "border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="courier"
                          checked={isSelected}
                          onChange={() => setSelectedCourierId(c._id)}
                          className="w-4 h-4 text-black accent-black shrink-0"
                        />
                        <div>
                          <div
                            className={`text-xs font-normal ${isSelected ? "text-white" : "text-black"}`}
                            style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                          >
                            {c.name}
                          </div>
                          <div className={`text-[11px] font-normal ${isSelected ? "text-neutral-300" : "text-neutral-500"}`} style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                            {c.serviceTypes.join(" • ")}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`text-xs font-semibold ${isSelected ? "text-white" : "text-black"}`}
                          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                        >
                          {c.baseFare > 0 ? formatCurrency(c.baseFare) : "Free"}
                        </div>
                        <div className={`text-[10px] ${isSelected ? "text-neutral-400" : "text-neutral-400"}`}>
                          Min {c.minDistance}km
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Delivery Instructions */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 shadow-xs space-y-2">
              <label className="text-[11px] font-normal text-neutral-600 uppercase block" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                Delivery Landmark & Gate Notes (Optional)
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  maxLength={MAX_NOTES}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Leave with lobby concierge or call upon arrival..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:border-black resize-none font-normal"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px" }}
                />
                <div className="absolute bottom-2 right-2 text-[10px] text-neutral-400 font-mono">
                  {notes.length}/{MAX_NOTES}
                </div>
              </div>
            </div>

            {/* Step 1 Submit Button */}
            <button
              type="submit"
              className="w-full bg-black hover:bg-neutral-800 text-white font-normal py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.99]"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px" }}
            >
              <span>Continue to Payment</span>
              <ArrowRight size={17} />
            </button>
          </form>
        )}

        {/* ================= STEP 2: PAYMENT & VERIFICATION ================= */}
        {currentStep === 2 && (
          <form onSubmit={handleNextFromStep2} className="space-y-3">
            <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-2 text-black font-normal text-sm uppercase">
                  <CreditCard size={16} className="text-neutral-800" />
                  <span style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>Payment Method</span>
                </div>
                <span className="text-[11px] text-neutral-500 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Secured Transaction
                </span>
              </div>

              {/* Payment Method Toggle Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("TELEGRAM_PAY")}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all relative ${
                    paymentMethod === "TELEGRAM_PAY"
                      ? "border-black bg-neutral-900 text-white shadow-xs"
                      : "border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800"
                  }`}
                >
                  {paymentMethod === "TELEGRAM_PAY" && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <Check size={11} className="text-black" strokeWidth={3} />
                    </div>
                  )}
                  <div className="text-xs font-normal uppercase" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                    Telegram Pay
                  </div>
                  <div className={`text-[10px] mt-1 font-normal ${paymentMethod === "TELEGRAM_PAY" ? "text-neutral-300" : "text-neutral-500"}`} style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    Instant bot settlement & one-tap clearance
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("DIRECT_TRANSFER")}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all relative ${
                    paymentMethod === "DIRECT_TRANSFER"
                      ? "border-black bg-neutral-900 text-white shadow-xs"
                      : "border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800"
                  }`}
                >
                  {paymentMethod === "DIRECT_TRANSFER" && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <Check size={11} className="text-black" strokeWidth={3} />
                    </div>
                  )}
                  <div className="text-xs font-normal uppercase" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                    Bank / GCash / Maya
                  </div>
                  <div className={`text-[10px] mt-1 font-normal ${paymentMethod === "DIRECT_TRANSFER" ? "text-neutral-300" : "text-neutral-500"}`} style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    Direct transfer with OCR receipt scan
                  </div>
                </button>
              </div>

              {/* Direct Transfer Bank Details Info Box */}
              {paymentMethod === "DIRECT_TRANSFER" && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 space-y-2 text-xs text-neutral-700">
                  <div className="flex items-center gap-1.5 font-medium text-black uppercase" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                    <Building2 size={14} className="text-neutral-600" />
                    <span>Beneficiary Account Information</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[12px]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase">GCash / Maya:</span>
                      <span className="font-semibold text-black">0919 123 1234</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase">Account Name:</span>
                      <span className="font-semibold text-black">PRIME ENTERPRISE PH</span>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Receipt OCR Scanner & Verification */}
              <div className="pt-1">
                <ReceiptOcrScanner
                  expectedAmount={grandTotal}
                  expectedReceiver="PRIME ENTERPRISE PH"
                  initialReceiptUrl={receiptPreview || undefined}
                  initialOcrResult={ocrResult}
                  title={`Proof of Payment ${paymentMethod === "TELEGRAM_PAY" ? "(Optional)" : "(Recommended)"}`}
                  onOcrComplete={(result, previewUri) => {
                    setOcrResult(result);
                    setReceiptPreview(previewUri);
                  }}
                  onRemoveReceipt={() => {
                    setOcrResult(null);
                    setReceiptPreview(null);
                    setReceiptFile(null);
                  }}
                />
              </div>
            </div>

            {/* Step 2 Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-normal py-3.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px" }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <button
                type="submit"
                className="flex-[2] bg-black hover:bg-neutral-800 text-white font-normal py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.99]"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "16px" }}
              >
                <span>Continue to Review</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 3: ORDER REVIEW & CONFIRMATION ================= */}
        {currentStep === 3 && (
          <div className="space-y-3">
            {/* Items Summary Accordion/Card */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-2 text-black font-normal text-sm uppercase">
                  <ShoppingBag size={16} className="text-neutral-800" />
                  <span style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>Selected Order Items ({itemsToCheckout.length})</span>
                </div>
                <Link
                  to="/shop/cart"
                  className="text-xs text-neutral-500 hover:text-black flex items-center gap-1 font-normal underline"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  Edit Cart Selection
                </Link>
              </div>

              <div className="divide-y divide-neutral-100 max-h-48 overflow-y-auto pr-1">
                {itemsToCheckout.map((item) => (
                  <div key={item.productId} className="py-2 flex items-center justify-between gap-2 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2.5 truncate">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="w-9 h-9 rounded-lg object-contain bg-neutral-50 border border-neutral-100 p-0.5 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                          <ShoppingBag size={14} className="text-neutral-400" />
                        </div>
                      )}
                      <div className="truncate">
                        <div className="text-xs font-normal text-black truncate" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                          {item.productName}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                          Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-black shrink-0" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery & Courier Summary Card */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100">
                <div className="flex items-center gap-1.5 text-xs text-neutral-600 uppercase font-medium" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                  <MapPin size={14} className="text-neutral-700" /> Delivery Address & Courier
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-[11px] text-neutral-500 hover:text-black flex items-center gap-0.5 cursor-pointer font-normal"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  <Edit2 size={11} /> Change
                </button>
              </div>

              <div className="text-xs space-y-1 pt-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px" }}>
                <div className="font-semibold text-black">{recipientName} • {phone}</div>
                <div className="text-neutral-600">{addressInput}</div>
                <div className="text-neutral-500 flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    <Truck size={12} className="text-neutral-400" />
                    <span>Courier: <strong className="text-neutral-800">{selectedCourier?.name}</strong></span>
                  </div>
                  {routeInfo && (
                    <span className="text-[11px] bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                      <Route size={10} /> {routeInfo.distanceKm} km (~{routeInfo.durationMinutes} min)
                    </span>
                  )}
                </div>
                {notes && (
                  <div className="text-neutral-500 italic text-[11px] pt-0.5">
                    "{notes}"
                  </div>
                )}
              </div>
            </div>

            {/* Payment Verification Summary Card */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100">
                <div className="flex items-center gap-1.5 text-xs text-neutral-600 uppercase font-medium" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                  <CreditCard size={14} className="text-neutral-700" /> Payment & Verification
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-[11px] text-neutral-500 hover:text-black flex items-center gap-0.5 cursor-pointer font-normal"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  <Edit2 size={11} /> Change
                </button>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "13px" }}>
                <div>
                  <span className="font-semibold text-black">
                    {ocrResult ? `${ocrResult.channel} (${ocrResult.currency} ${ocrResult.amount.toFixed(2)})` : paymentMethod === "TELEGRAM_PAY" ? "Telegram Pay" : "Direct Transfer / GCash / Maya"}
                  </span>
                  <div className="text-neutral-500 text-[11px]">
                    {ocrResult ? `Ref: ${ocrResult.referenceNumber}` : paymentMethod === "TELEGRAM_PAY" ? "Instant Telegram Bot Clearing" : "Receipt Verification on Dispatch"}
                  </div>
                </div>

                {ocrResult ? (
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-emerald-700" /> OCR Verified ({ocrResult.confidenceScore}%)
                  </span>
                ) : receiptPreview ? (
                  <span className="text-[11px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <FileCheck size={11} /> Attached
                  </span>
                ) : (
                  <span className="text-[11px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
                    No Receipt
                  </span>
                )}
              </div>
            </div>

            {/* Final Payable Breakdown Card */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 shadow-xs space-y-2">
              <div className="flex justify-between text-xs text-neutral-600 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                <span>Items Subtotal ({items.length} items)</span>
                <span className="font-normal text-neutral-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-600 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                <span>Estimated Tax (5%)</span>
                <span className="font-normal text-neutral-900">{formatCurrency(estTax)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-600 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                <span>Priority Dispatch ({selectedCourier?.name})</span>
                <span className="font-normal text-neutral-900">
                  {shipping === 0 ? "FREE" : formatCurrency(shipping)}
                </span>
              </div>
              <div className="pt-2 border-t border-neutral-100 flex justify-between items-baseline">
                <span
                  className="text-sm font-normal text-black uppercase"
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

              {/* Step 3 Action Controls */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={isSubmitting}
                  className="flex-1 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-normal py-3.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "15px" }}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="flex-[2] bg-black hover:bg-neutral-800 text-white font-normal py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition-all active:scale-[0.99]"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "16px",
                    letterSpacing: "0.5px",
                  }}
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                  <span>{isSubmitting ? "AUTHORIZING ORDER..." : "CONFIRM & SUBMIT ORDER"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

