import { ShoppingBag, Package, Users, Truck, ReceiptText, BadgePercent, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const modules = [
  { number: "01", title: "ORDERS", description: "Fulfillment queue", icon: ShoppingBag, to: "/admin/orders" },
  { number: "02", title: "INVENTORY", description: "Products & stock", icon: Package, to: "/admin/products" },
  { number: "03", title: "CUSTOMERS", description: "Accounts & history", icon: Users, to: "/admin/customers" },
  { number: "04", title: "LOGISTICS", description: "Couriers & delivery", icon: Truck, to: "/admin/courier" },
  { number: "05", title: "CHARGES", description: "Fees & surcharges", icon: ReceiptText, to: "/admin/charges" },
  { number: "06", title: "DISCOUNTS", description: "Promotions & rules", icon: BadgePercent, to: "/admin/discounts" },
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  return (
    <section className="w-full px-4 py-5 sm:px-6 lg:px-8" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
      <header className="mb-7 max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4 border-b border-neutral-300 pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-neutral-400 mb-1.5">PRIME ADMIN</p>
            <h1 className="text-[28px] sm:text-[34px] font-normal leading-none tracking-[-0.02em] text-black">COMMAND CENTER</h1>
            <p className="text-sm text-neutral-500 mt-2" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
              Select a system to manage operations.
            </p>
          </div>
          <span className="hidden sm:block text-[10px] uppercase tracking-[0.18em] text-neutral-400 pb-1">SYSTEMS / 06</span>
        </div>
      </header>

      <nav className="w-full max-w-6xl mx-auto border-b border-neutral-200" aria-label="Admin systems">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {modules.map(({ number, title, description, icon: Icon, to }, index) => (
            <button
              key={title}
              type="button"
              onClick={() => navigate(to)}
              className={`group relative min-w-0 px-3 py-5 sm:px-4 sm:py-6 text-left transition-all duration-200 cursor-pointer hover:bg-white active:bg-neutral-50 ${
                index < modules.length - 1 ? "border-b xl:border-b-0 xl:border-r border-neutral-200" : "border-b sm:border-b-0 border-neutral-200"
              } ${index >= 3 ? "sm:border-b-0" : ""}`}
            >
              <div className="flex items-start justify-between mb-7">
                <span className="text-[10px] tracking-[0.18em] text-neutral-300 group-hover:text-neutral-500 transition-colors">{number}</span>
                <span className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 group-hover:border-black group-hover:text-black group-hover:-translate-y-0.5 transition-all">
                  <Icon size={15} strokeWidth={1.6} />
                </span>
              </div>

              <div className="pr-2">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[14px] sm:text-[15px] font-semibold tracking-[0.04em] text-black">{title}</h2>
                  <ArrowUpRight size={12} className="text-neutral-300 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <p className="text-xs text-neutral-400 mt-1 leading-snug" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
                  {description}
                </p>
              </div>

              <span className="absolute bottom-0 left-0 h-px w-0 bg-black group-hover:w-full transition-all duration-300" />
            </button>
          ))}
        </div>
      </nav>
    </section>
  );
}
