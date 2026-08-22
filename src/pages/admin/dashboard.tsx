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
    <section className="w-full bg-white text-black" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
      <header className="w-full border-b border-neutral-200 px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-neutral-400">PRIME ADMIN</p>
            <h1 className="text-[32px] font-normal leading-[0.95] tracking-[-0.035em] sm:text-[42px]">COMMAND CENTER</h1>
            <p className="mt-3 text-sm text-neutral-500">Select a system to manage operations.</p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400">SYSTEMS</p>
            <p className="mt-1 text-lg leading-none">06</p>
          </div>
        </div>
      </header>

      <nav className="w-full" aria-label="Admin systems">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(({ number, title, description, icon: Icon, to }, index) => (
            <button
              key={title}
              type="button"
              onClick={() => navigate(to)}
              className={`group relative flex min-h-[142px] flex-col justify-between border-b border-neutral-200 px-5 py-5 text-left transition-colors duration-200 hover:bg-neutral-50 sm:min-h-[164px] sm:px-6 sm:py-6 lg:min-h-[190px] lg:px-8 ${
                index % 3 !== 2 ? "lg:border-r" : ""
              } ${index % 2 !== 1 ? "sm:border-r lg:border-r" : "sm:border-r-0"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium tracking-[0.2em] text-neutral-300 transition-colors group-hover:text-neutral-500">{number}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-all group-hover:border-black group-hover:text-black">
                  <Icon size={16} strokeWidth={1.55} />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] font-semibold tracking-[0.045em]">{title}</h2>
                  <ArrowUpRight size={13} className="text-neutral-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-black" />
                </div>
                <p className="mt-1 text-[13px] text-neutral-400">{description}</p>
              </div>

              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-black transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
        </div>
      </nav>
    </section>
  );
}
