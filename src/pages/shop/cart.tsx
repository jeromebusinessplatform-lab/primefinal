import { useCart } from "@/context/CartContext.tsx";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/utils.ts";

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalItems, toggleSelect, subtotal } = useCart();
  const navigate = useNavigate();

  const estTax = subtotal * 0.05;
  const shipping = subtotal > 0 ? (subtotal > 150 ? 0 : 9.99) : 0;
  const grandTotal = subtotal + estTax + shipping;

  return (
    <div className="bg-[#f3f4f6] min-h-full pb-10">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1
            className="text-black font-normal uppercase text-xl leading-tight"
            style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
          >
            SHOPPING CART
          </h1>
          <p className="text-xs text-neutral-500 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            {totalItems} items selected
          </p>
        </div>
        <Link
          to="/shop"
          className="text-xs font-normal text-black border border-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-50"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Add Items
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="p-6 text-center py-20 bg-white m-3 rounded-2xl border border-neutral-200 shadow-xs">
          <ShoppingBag size={48} className="mx-auto mb-3 text-neutral-300" />
          <h2
            className="text-lg font-normal text-neutral-800"
            style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
          >
            Your cart is empty
          </h2>
          <p className="text-xs text-neutral-500 mt-1 mb-5 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Explore our catalog to add items to your cart.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-normal text-xs uppercase tracking-wide hover:bg-neutral-800 transition-colors"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Browse Products <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="p-3 space-y-3">
          {/* Cart items list */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-3 shadow-xs space-y-3">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-3 border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
              >
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => toggleSelect(item.productId)}
                  className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black cursor-pointer accent-black"
                />

                {/* Image */}
                <div className="w-14 h-14 rounded-lg bg-neutral-50 border border-neutral-100 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <ShoppingBag size={20} className="text-neutral-300" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-normal text-neutral-900 text-sm truncate"
                    style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                  >
                    {item.productName}
                  </h3>
                  <div
                    className="text-xs text-black font-normal mt-0.5"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {formatCurrency(item.unitPrice)} each
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="h-6 border border-neutral-200 rounded-md flex items-center bg-neutral-50 overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="px-2 h-full text-neutral-600 hover:bg-neutral-200 active:bg-neutral-300 cursor-pointer"
                      >
                        <Minus size={10} className="stroke-[2.5]" />
                      </button>
                      <span
                        className="px-2 text-xs font-normal text-black"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="px-2 h-full text-neutral-600 hover:bg-neutral-200 active:bg-neutral-300 cursor-pointer"
                      >
                        <Plus size={10} className="stroke-[2.5]" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-neutral-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                      title="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing summary */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 shadow-xs space-y-2">
            <div className="flex justify-between text-xs text-neutral-600 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              <span>Subtotal ({totalItems} items)</span>
              <span className="font-normal text-neutral-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-600 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              <span>Estimated Tax (5%)</span>
              <span className="font-normal text-neutral-900">{formatCurrency(estTax)}</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-600 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              <span>Delivery Fee</span>
              <span className="font-normal text-neutral-900">
                {shipping === 0 ? "FREE" : formatCurrency(shipping)}
              </span>
            </div>
            <div className="pt-2 border-t border-neutral-100 flex justify-between items-baseline">
              <span
                className="text-sm font-normal text-black"
                style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
              >
                ESTIMATED TOTAL
              </span>
              <span
                className="text-xl font-normal text-black"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate("/shop/checkout")}
            className="w-full bg-black hover:bg-neutral-800 text-white font-normal py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "15px",
              letterSpacing: "0.5px",
            }}
          >
            PROCEED TO SECURE CHECKOUT <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
