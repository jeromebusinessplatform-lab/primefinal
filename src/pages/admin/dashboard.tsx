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
    <section className="w-full p-3 sm:p-5" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
      <header className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-400 mb-1">PRIME ADMIN</p>
        <h1 className="text-2xl font-normal tracking-tight text-black">COMMAND CENTER</h1>
        <p className="text-xs text-neutral-500 mt-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Select a system to manage operations.
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-3 border-y border-neutral-200 py-2">
        {modules.map(({ title, description, icon: Icon, to }) => (
          <button
            key={title}
            type="button"
            onClick={() => navigate(to)}
            className="group min-w-0 py-3 px-1 text-left flex items-center gap-3 border-b sm:border-b-0 border-neutral-100 hover:bg-neutral-50 active:bg-neutral-100 transition-colors cursor-pointer"
          >
            <div className="shrink-0 text-neutral-500 group-hover:text-black transition-colors">
              <Icon size={19} strokeWidth={1.7} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h2 className="text-[13px] sm:text-sm font-semibold tracking-wide text-black truncate">{title}</h2>
                <ArrowUpRight size={12} className="shrink-0 text-neutral-300 group-hover:text-black" />
              </div>
              <p className="text-[10px] sm:text-xs text-neutral-400 mt-0.5 leading-tight truncate" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
