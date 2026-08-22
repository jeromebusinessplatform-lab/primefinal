import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Package, Users, Truck, ReceiptText, BadgePercent, BarChart3, WalletCards, Headphones, Settings, Stethoscope } from "lucide-react";
import { useQueueStats } from "@/hooks/useQueueStats.ts";

const modules = [
  { title: "ORDERS", icon: ClipboardList, to: "/admin/orders" },
  { title: "INVENTORY", icon: Package, to: "/admin/products" },
  { title: "CUSTOMERS", icon: Users, to: "/admin/customers" },
  { title: "COURIERS", icon: Truck, to: "/admin/courier" },
  { title: "CHARGES", icon: ReceiptText, to: "/admin/charges" },
  { title: "DISCOUNTS", icon: BadgePercent, to: "/admin/discounts" },
  { title: "ANALYTICS", icon: BarChart3, to: "/admin/analytics" },
  { title: "CASHFLOW", icon: WalletCards, to: "/admin/cashflow" },
  { title: "SUPPORT", icon: Headphones, to: "/admin/support" },
];

function ModuleButton({ title, Icon, onClick }: { title: string; Icon: typeof ClipboardList; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-h-[108px] sm:min-h-[132px] rounded-xl border border-neutral-400 bg-gradient-to-b from-white to-neutral-50 shadow-[0_2px_5px_rgba(0,0,0,0.14)] flex items-center justify-center gap-3 sm:gap-4 px-3 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgba(0,0,0,0.18)] active:translate-y-0 active:shadow-[0_1px_3px_rgba(0,0,0,0.15)] focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
      aria-label={`Open ${title}`}
    >
      <Icon className="shrink-0 text-neutral-900" size={42} strokeWidth={2.2} />
      <span className="text-[17px] sm:text-[20px] font-semibold tracking-[0.01em] leading-none text-black font-condensed">{title}</span>
    </button>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { stats } = useQueueStats();
  const capacity = useMemo(() => Math.min(100, Math.round(((stats.onQueue + stats.processing) / Math.max(1, stats.maxConcurrent)) * 100)), [stats]);

  return (
    <section className="w-full max-w-[900px] mx-auto px-4 sm:px-8 pt-12 sm:pt-14 pb-10 font-condensed">
      <header className="text-center mb-10 sm:mb-12">
        <h1 className="text-[34px] sm:text-[48px] leading-none tracking-[0.02em] text-black">ADMINISTRATOR MENU</h1>
        <p className="mt-2 text-[11px] sm:text-[13px] tracking-[0.12em] text-neutral-500 uppercase">
          {stats.isPaused ? "INCOMING QUEUE PAUSED" : `${stats.onQueue + stats.processing} ACTIVE OPERATIONS • ${capacity}% CAPACITY`}
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        {modules.map(({ title, icon: Icon, to }) => (
          <ModuleButton key={title} title={title} Icon={Icon} onClick={() => navigate(to)} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-10">
        <ModuleButton title="SYSTEM SETTINGS" Icon={Settings} onClick={() => navigate("/admin/settings")} />
        <ModuleButton title="RUN FULL DIAGNOSTICS" Icon={Stethoscope} onClick={() => navigate("/admin/diagnostics")} />
      </div>
    </section>
  );
}
