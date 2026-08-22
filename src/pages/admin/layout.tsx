import { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext.tsx";
import { ShoppingBag, Package, LogOut, Truck, ArrowLeft, Users, ReceiptText, BadgePercent, BarChart3, WalletCards, Headphones, Settings, Stethoscope } from "lucide-react";
import PrimeLogo from "@/components/PrimeLogo.tsx";
import { useQueueStats } from "@/hooks/useQueueStats.ts";

const navItems = [
  { to: "/admin", icon: ShoppingBag, label: "Orders", end: true },
  { to: "/admin/products", icon: Package, label: "Inventory" },
  { to: "/admin/customers", icon: Users, label: "Customers" },
  { to: "/admin/courier", icon: Truck, label: "Couriers" },
  { to: "/admin/charges", icon: ReceiptText, label: "Charges" },
  { to: "/admin/discounts", icon: BadgePercent, label: "Discounts" },
  { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/admin/cashflow", icon: WalletCards, label: "Cashflow" },
  { to: "/admin/support", icon: Headphones, label: "Support" },
];

function QueueStrip() {
  const { stats } = useQueueStats();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const trafficClass = stats.traffic === "HIGH" ? "text-red-600" : stats.traffic === "LOW" ? "text-emerald-600" : "text-orange-600";
  const date = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase().replaceAll(" ", "-");
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <>
      <div className="px-4 pt-3 pb-1 flex items-start justify-between gap-3">
        <button type="button" onClick={() => window.location.assign("/admin")} aria-label="Open administrator home" className="h-12 w-44 sm:w-52 flex items-center cursor-pointer">
          <PrimeLogo className="h-full w-full" />
        </button>
        <div className="text-right font-condensed leading-tight pt-1 shrink-0">
          <div className="text-[14px] sm:text-[16px] tracking-[0.04em] text-black">{date} | {time}</div>
          <div className="text-[14px] sm:text-[16px] font-semibold tracking-[0.02em] text-black">FULL SYSTEM ACCESS</div>
        </div>
      </div>
      <div className="mx-1 rounded-lg border border-neutral-300 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.14)] grid grid-cols-5 divide-x divide-neutral-200 overflow-hidden">
        <Metric label="ON QUEUE" value={stats.onQueue} className="text-blue-700" />
        <Metric label="PROCESSING" value={stats.processing} className="text-emerald-600" />
        <Metric label="EST. WAIT TIME" value={`${stats.estimatedWaitMinutes} MINUTES`} className="text-red-600" />
        <Metric label="EST. DISPATCH TIME" value={`${stats.estimatedDispatchMinutes} MINUTES`} className="text-red-600" />
        <Metric label="ORDER TRAFFIC" value={stats.traffic} className={trafficClass} />
      </div>
    </>
  );
}

function Metric({ label, value, className }: { label: string; value: string | number; className: string }) {
  return (
    <div className="min-w-0 px-1 py-2 text-center font-condensed">
      <div className="text-[9px] sm:text-[11px] font-semibold tracking-[0.04em] text-neutral-700 whitespace-nowrap truncate">{label}</div>
      <div className={`text-[14px] sm:text-[18px] font-semibold leading-none mt-1 whitespace-nowrap truncate ${className}`}>{value}</div>
    </div>
  );
}

export default function AdminLayout() {
  const { logout } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === "/admin";
  const handleLogout = () => { logout(); navigate("/admin/login", { replace: true }); };

  return (
    <div className="min-h-screen bg-white text-black font-condensed">
      <QueueStrip />
      <div className="flex min-h-[calc(100vh-115px)]">
        <aside className="hidden xl:flex w-48 bg-white border-r border-neutral-200 p-3 flex-col gap-4">
          <nav className="space-y-1">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-md text-xs ${isActive ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-black"}`}>
                <Icon size={15} />{label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto space-y-1 border-t border-neutral-200 pt-3">
            <NavLink to="/admin/settings" className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-neutral-600 hover:bg-neutral-100 hover:text-black"><Settings size={15} />System Settings</NavLink>
            <NavLink to="/admin/diagnostics" className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-neutral-600 hover:bg-neutral-100 hover:text-black"><Stethoscope size={15} />Diagnostics</NavLink>
          </div>
        </aside>

        <main className={`flex-1 overflow-auto ${isDashboard ? "pb-20" : "pb-28"}`}>
          <Outlet />
        </main>
      </div>

      {!isDashboard && (
        <nav className="fixed bottom-[42px] left-0 right-0 z-40 bg-white border-t border-neutral-300 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] px-2 py-2">
          <div className="max-w-5xl mx-auto flex items-center gap-2">
            <button type="button" onClick={() => navigate("/shop")} className="hidden sm:flex items-center justify-center gap-1 px-3 py-2 text-[11px] text-neutral-600 border border-neutral-200 rounded-md hover:text-black cursor-pointer"><ArrowLeft size={13} />SHOP</button>
            <div className="flex-1 grid grid-cols-4 sm:grid-cols-6 gap-1">
              {navItems.slice(0, 6).map(({ to, icon: Icon, label, end }) => (
                <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-col items-center justify-center py-1.5 rounded-md text-[9px] ${isActive ? "bg-black text-white" : "text-neutral-500 hover:text-black"}`}>
                  <Icon size={16} /><span className="mt-0.5">{label}</span>
                </NavLink>
              ))}
            </div>
            <button type="button" onClick={() => navigate("/admin/settings")} className="p-2 text-neutral-500 hover:text-black cursor-pointer" aria-label="System settings"><Settings size={18} /></button>
            <button type="button" onClick={handleLogout} className="p-2 text-neutral-500 hover:text-red-600 cursor-pointer" aria-label="Logout"><LogOut size={18} /></button>
          </div>
        </nav>
      )}
    </div>
  );
}
