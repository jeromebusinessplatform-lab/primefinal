import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext.tsx";
import { ShoppingBag, Package, Settings, LogOut, Truck, ArrowLeft, ScanLine, TrendingUp } from "lucide-react";
import PrimeLogo from "@/components/PrimeLogo.tsx";

export default function AdminLayout() {
  const { logout } = useAdmin();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin");
  };

  const navItems = [
    { to: "/admin/orders", icon: ShoppingBag, label: "Orders" },
    { to: "/admin/analytics", icon: TrendingUp, label: "Analytics" },
    { to: "/admin/ocr", icon: ScanLine, label: "Receipt OCR" },
    { to: "/admin/logistics", icon: Truck, label: "Logistics" },
    { to: "/admin/products", icon: Package, label: "Products" },
    { to: "/admin/courier", icon: Truck, label: "Courier" },
    { to: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-black">
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/shop")}
            className="flex items-center gap-1 text-xs text-neutral-600 hover:text-black border border-neutral-200 px-2 py-1 rounded-lg"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            <ArrowLeft size={13} /> Shop View
          </button>
          <div className="bg-white rounded-md px-2 py-1 flex items-center">
            <PrimeLogo className="h-5" />
          </div>
          <span className="text-neutral-500 text-xs font-normal">Admin Panel</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-neutral-500 hover:text-black text-xs cursor-pointer font-normal"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          <LogOut size={14} /> Logout
        </button>
      </header>

      <div className="flex h-[calc(100vh-53px)]">
        <aside className="hidden md:flex flex-col w-48 bg-white border-r border-neutral-200 p-3">
          <nav className="space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-normal cursor-pointer transition-colors ${
                    isActive
                      ? "bg-black text-white"
                      : "text-neutral-600 hover:text-black hover:bg-neutral-100"
                  }`
                }
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "14px" }}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex md:hidden z-40">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs cursor-pointer ${
                isActive ? "text-black font-semibold" : "text-neutral-400"
              }`
            }
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            <Icon size={18} />
            <span className="mt-0.5">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
