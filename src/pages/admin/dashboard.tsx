import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Package, 
  Truck, 
  Settings, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const tiles = [
    {
      title: "Orders",
      description: "Manage sales, fulfillments, and OCR verification",
      icon: ShoppingBag,
      to: "/admin/orders",
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      stats: "24 New"
    },
    {
      title: "Analytics",
      description: "Sales performance, revenue, and growth tracking",
      icon: TrendingUp,
      to: "/admin/analytics",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      stats: "+12.5%"
    },
    {
      title: "Customers",
      description: "Customer database and engagement history",
      icon: Users,
      to: "/admin/customers",
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
      stats: "1,240 Total"
    },
    {
      title: "Inventory",
      description: "Product management and stock level alerts",
      icon: Package,
      to: "/admin/products",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
      stats: "3 Low Stock"
    },
    {
      title: "Logistics",
      description: "Shipping routes, couriers, and delivery tracking",
      icon: Truck,
      to: "/admin/courier",
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
      stats: "8 In Transit"
    },
    {
      title: "Settings",
      description: "System configuration and API key management",
      icon: Settings,
      to: "/admin/settings",
      color: "text-neutral-600",
      bg: "bg-neutral-100",
      border: "border-neutral-200",
      stats: "System OK"
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 
            className="text-black text-3xl font-normal tracking-tight uppercase"
            style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
          >
            Admin Command Center
          </h1>
          <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
            v1.2.0
          </span>
        </div>
        <p 
          className="text-neutral-500 text-sm mt-1 font-normal"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Select a module to manage your commerce ecosystem.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.title}
              onClick={() => navigate(tile.to)}
              className="group relative bg-white border border-neutral-200 rounded-3xl p-6 text-left transition-all duration-300 hover:shadow-xl hover:border-black cursor-pointer overflow-hidden flex flex-col justify-between min-h-[200px]"
            >
              {/* Decorative Background Icon */}
              <Icon 
                size={120} 
                className={`absolute -right-8 -bottom-8 opacity-[0.03] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${tile.color}`}
              />

              <div className="space-y-4 relative z-10">
                <div className={`w-12 h-12 ${tile.bg} ${tile.color} rounded-2xl flex items-center justify-center border ${tile.border} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <Icon size={24} />
                </div>

                <div>
                  <h3 
                    className="text-xl font-normal text-black uppercase tracking-wide"
                    style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
                  >
                    {tile.title}
                  </h3>
                  <p 
                    className="text-neutral-500 text-sm mt-1 font-normal leading-tight"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {tile.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between relative z-10">
                <span 
                  className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${tile.bg} ${tile.color} border ${tile.border}`}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {tile.stats}
                </span>
                <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center transition-all duration-300 group-hover:bg-black group-hover:translate-x-1">
                  <ArrowRight size={14} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* OCR Quick Launch Strip */}
      <div 
        className="bg-neutral-900 rounded-3xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl -mr-32 -mt-32 rounded-full" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-500/30">
            <Sparkles size={28} className="text-amber-400" />
          </div>
          <div>
            <h4 className="text-xl font-normal uppercase tracking-wide">Receipt OCR Intelligence</h4>
            <p className="text-neutral-400 text-sm">Autonomous extraction of bank slips and e-wallet transfers via Gemini 3.7 Flash.</p>
          </div>
        </div>

        <button 
          onClick={() => navigate("/admin/ocr")}
          className="bg-white text-black hover:bg-neutral-100 px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer relative z-10"
        >
          Launch Scanner
        </button>
      </div>
    </div>
  );
}
