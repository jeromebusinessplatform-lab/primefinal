import { ShoppingBag, Package, Users, Truck, ReceiptText, BadgePercent, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const modules = [
  { title: "ORDERS", description: "Fulfillment queue", icon: ShoppingBag, to: "/admin/orders" },
  { title: "INVENTORY", description: "Products & stock", icon: Package, to: "/admin/products" },
  { title: "CUSTOMERS", description: "Accounts & history", icon: Users, to: "/admin/customers" },
  { title: "LOGISTICS", description: "Couriers & delivery", icon: Truck, to: "/admin/courier" },
  { title: "CHARGES", description: "Fees & surcharges", icon: ReceiptText, to: "/admin/charges" },
  { title: "DISCOUNTS", description: "Promotions & rules", icon: BadgePercent, to: "/admin/discounts" },
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  return (
    <section className="p-3 sm:p-5 max-w-5xl mx-auto" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
      <header className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-400 mb-1">PRIME ADMIN</p>
        <h1 className="text-2xl font-normal tracking-tight text-black">COMMAND CENTER</h1>
        <p className="text-xs text-neutral-500 mt-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Select a system to manage operations.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {modules.map(({ title, description, icon: Icon, to }) => (
          <button
            key={title}
            type="button"
            onClick={() => navigate(to)}
            className="group aspect-square min-h-[112px] bg-white border border-neutral-200 rounded-xl p-3 text-left flex flex-col justify-between hover:border-black hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                <Icon size={16} strokeWidth={1.8} />
              </div>
              <ArrowUpRight size={14} className="text-neutral-300 group-hover:text-black" />
            </div>
            <div>
              <h2 className="text-[13px] sm:text-sm font-semibold tracking-wide text-black">{title}</h2>
              <p className="text-[10px] sm:text-xs text-neutral-400 mt-0.5 leading-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
