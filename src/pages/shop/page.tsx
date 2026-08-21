import { useCart } from "@/context/CartContext.tsx";
import { ShoppingCart, Minus, Plus, Search, ChevronDown, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce.ts";
import { useProducts } from "@/hooks/useProducts.ts";
import { type Product } from "@/data/products.ts";
import { toast } from "sonner";

function BadgePill({ badge }: { badge: "NEW" | "SALE" | "LOW_STOCK" }) {
  const config = {
    NEW: { label: "NEW", bg: "#2563eb" },
    SALE: { label: "SALE", bg: "#ef4444" },
    LOW_STOCK: { label: "LOW STOCK", bg: "#f59e0b" },
  }[badge];

  return (
    <span
      className="text-white font-normal px-2 py-0.5 rounded-full text-[9px] uppercase leading-none shadow-xs"
      style={{
        backgroundColor: config.bg,
        fontFamily: "'Roboto Condensed', sans-serif",
        letterSpacing: "0.4px",
      }}
    >
      {config.label}
    </span>
  );
}

function ProductCard({ product }: { product: Product; key?: string }) {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find((i) => i.productId === product._id);
  const [showQuantity, setShowQuantity] = useState(!!cartItem);
  const [localQty, setLocalQty] = useState<number>(() => {
    if (cartItem) return cartItem.quantity;
    return 1;
  });

  const unitPrice = product.salePrice ?? product.price;
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const qtyToAdd = localQty > 0 ? localQty : 1;
    addItem({
      productId: product._id,
      productName: product.name,
      unitPrice,
      image: product.image,
      quantity: qtyToAdd,
    });
    toast.success(`Added ${qtyToAdd}x ${product.name} to cart`);
  };

  const handleIncrement = () => {
    if (isOutOfStock || localQty >= product.stock) return;
    const newQty = localQty + 1;
    setLocalQty(newQty);
    if (cartItem) {
      updateQuantity(product._id, newQty);
    }
  };

  const handleDecrement = () => {
    if (localQty <= 1) {
      updateQuantity(product._id, 0);
      setShowQuantity(false);
      setLocalQty(1);
      return;
    }
    const newQty = localQty - 1;
    setLocalQty(newQty);
    if (cartItem) {
      updateQuantity(product._id, newQty);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
        isOutOfStock ? "opacity-60 border-neutral-200" : "border-neutral-200/90"
      }`}
    >
      {/* Product Image & Badge Area */}
      <div className="relative aspect-square w-full bg-white flex items-center justify-center p-2.5 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-300 hover:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <ShoppingCart size={32} />
          </div>
        )}

        {/* Badge */}
        {product.badge && !isOutOfStock && (
          <div className="absolute top-2 left-2 z-10">
            <BadgePill badge={product.badge} />
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-xs">
            <span
              className="bg-neutral-900 text-white text-[9px] font-normal px-2.5 py-1 rounded-full uppercase"
              style={{ fontFamily: "'Roboto Condensed', sans-serif", letterSpacing: "1px" }}
            >
              OUT OF STOCK
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-1.5 flex flex-col flex-1 justify-between pt-0">
        <div>
          <h3
            className="text-neutral-900 font-normal leading-tight line-clamp-1"
            style={{
              fontFamily: "'Roboto Condensed', sans-serif",
              fontSize: "13.5px",
            }}
          >
            {product.name}
          </h3>
          {product.subname && (
            <p
              className="text-neutral-500 leading-tight mt-0.5 line-clamp-1 font-normal"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "12px",
              }}
            >
              {product.subname}
            </p>
          )}

          {/* Pricing */}
          <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
            <span
              className="text-black font-normal"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "17px",
              }}
            >
              ${unitPrice.toFixed(2)}
            </span>
            {product.salePrice && (
              <span
                className="text-[#ef4444] font-normal line-through"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "11px",
                }}
              >
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-1.5 flex items-center justify-center gap-1.5">
          {!showQuantity ? (
            <button
              onClick={() => {
                handleAddToCart();
                setShowQuantity(true);
              }}
              disabled={isOutOfStock}
              className="w-full h-7 rounded-full bg-neutral-800 hover:bg-black text-white text-[12px] uppercase tracking-wider font-normal active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Add to Cart
            </button>
          ) : (
            <div className="flex-1 h-7 rounded-lg border border-neutral-200 bg-white flex items-center justify-between overflow-hidden shadow-2xs">
              <button
                onClick={handleDecrement}
                disabled={isOutOfStock}
                className="h-full px-2 text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus size={12} className="stroke-[2.2]" />
              </button>
              <span
                className="font-normal text-black px-2 text-center"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "14px",
                }}
              >
                {localQty}
              </span>
              <button
                onClick={handleIncrement}
                disabled={isOutOfStock || localQty >= product.stock}
                className="h-full px-2 text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Increase quantity"
              >
                <Plus size={12} className="stroke-[2.2]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type FilterOption = "all" | "in_stock" | "sale" | "new" | "low_stock" | "price_asc" | "price_desc";

const FILTER_LABELS: Record<FilterOption, string> = {
  all: "All Filters",
  in_stock: "In Stock Only",
  sale: "On Sale",
  new: "New Arrivals",
  low_stock: "Low Stock",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
};

export default function ShopCatalog() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 250);
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const { products, loading } = useProducts();

  const categories = useMemo(() => {
    if (!products) return ["All Categories"];
    const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];
    return ["All Categories", ...cats.sort()];
  }, [products]);

  const filtered = useMemo(() => {
    let list = products ?? [];

    // Category filter
    if (activeCategory !== "All Categories") {
      list = list.filter((p) => p.category === activeCategory);
    }

    // Search query
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.subname ?? "").toLowerCase().includes(q) ||
          (p.category ?? "").toLowerCase().includes(q)
      );
    }

    // Custom Filters
    if (activeFilter === "in_stock") {
      list = list.filter((p) => p.stock > 0);
    } else if (activeFilter === "sale") {
      list = list.filter((p) => p.badge === "SALE" || Boolean(p.salePrice));
    } else if (activeFilter === "new") {
      list = list.filter((p) => p.badge === "NEW");
    } else if (activeFilter === "low_stock") {
      list = list.filter((p) => p.badge === "LOW_STOCK" || (p.stock > 0 && p.stock <= 10));
    }

    // Sorting
    const sortFn = (a: Product, b: Product) => {
      const priceA = a.salePrice ?? a.price;
      const priceB = b.salePrice ?? b.price;
      if (activeFilter === "price_asc") return priceA - priceB;
      if (activeFilter === "price_desc") return priceB - priceA;
      return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
    };

    return [...list].sort(sortFn);
  }, [products, activeCategory, debouncedSearch, activeFilter]);

  return (
    <div className="bg-[#f3f4f6] min-h-full pb-6">
      {/* Top Search & Filter Bar */}
      <div className="px-2.5 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Search Box */}
          <div className="flex-1 flex items-center gap-1.5 bg-white border border-neutral-200/90 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Search size={14} className="text-neutral-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-neutral-800 placeholder-neutral-400 outline-none font-normal"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            />
          </div>

          {/* Categories Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowCategoryMenu((v) => !v);
                setShowFilterMenu(false);
              }}
              className="flex items-center justify-between gap-1.5 bg-white border border-neutral-200/90 rounded-xl px-2.5 py-1.5 text-xs font-normal text-neutral-800 cursor-pointer shadow-2xs hover:bg-neutral-50 min-w-[105px]"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              <span className="truncate max-w-[85px]">{activeCategory}</span>
              <ChevronDown size={14} className="text-neutral-500 flex-shrink-0" />
            </button>

            {showCategoryMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-30 min-w-[160px] overflow-hidden py-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setShowCategoryMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between cursor-pointer hover:bg-neutral-50 font-normal ${
                      activeCategory === cat ? "text-black bg-neutral-50 font-semibold" : "text-neutral-700"
                    }`}
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    <span>{cat}</span>
                    {activeCategory === cat && <Check size={12} className="text-black" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filters Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowFilterMenu((v) => !v);
                setShowCategoryMenu(false);
              }}
              className="flex items-center justify-between gap-1.5 bg-white border border-neutral-200/90 rounded-xl px-2.5 py-1.5 text-xs font-normal text-neutral-800 cursor-pointer shadow-2xs hover:bg-neutral-50 min-w-[95px]"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              <span className="truncate max-w-[75px]">
                {activeFilter === "all" ? "All Filters" : FILTER_LABELS[activeFilter]}
              </span>
              <ChevronDown size={14} className="text-neutral-500 flex-shrink-0" />
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-30 min-w-[160px] overflow-hidden py-1">
                {(Object.keys(FILTER_LABELS) as FilterOption[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveFilter(key);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between cursor-pointer hover:bg-neutral-50 font-normal ${
                      activeFilter === key ? "text-black bg-neutral-50 font-semibold" : "text-neutral-700"
                    }`}
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    <span>{FILTER_LABELS[key]}</span>
                    {activeFilter === key && <Check size={12} className="text-black" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop for closing popups */}
      {(showCategoryMenu || showFilterMenu) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setShowCategoryMenu(false);
            setShowFilterMenu(false);
          }}
        />
      )}

      {/* Product Grid */}
      <div className="p-2.5">
        {loading ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-neutral-200 aspect-[3/5] animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-neutral-400 bg-white rounded-2xl border border-neutral-200 p-8 my-4">
            <ShoppingCart size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-normal text-neutral-700" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              No products match your criteria
            </p>
            {(search || activeCategory !== "All Categories" || activeFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setActiveCategory("All Categories");
                  setActiveFilter("all");
                }}
                className="mt-3 text-xs bg-black text-white font-normal px-4 py-2 rounded-xl cursor-pointer hover:bg-neutral-800"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {filtered.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
