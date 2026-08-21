import { useTelegram } from "@/context/TelegramContext.tsx";
import { User, ShieldCheck, ShoppingBag, Bell, HelpCircle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export default function AccountPage() {
  const { customer, isLoading } = useTelegram();

  if (isLoading) {
    return (
      <div className="bg-[#f3f4f6] min-h-full pb-10 p-3 space-y-3 animate-pulse">
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-neutral-200" />
            <div className="space-y-2">
              <div className="w-32 h-5 bg-neutral-200 rounded" />
              <div className="w-24 h-4 bg-neutral-100 rounded" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-100 space-y-2">
            <div className="w-full h-4 bg-neutral-100 rounded" />
            <div className="w-full h-4 bg-neutral-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f3f4f6] min-h-full pb-10">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3">
        <h1
          className="text-black font-normal uppercase text-xl leading-tight"
          style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
        >
          SECURED ACCOUNT
        </h1>
        <p className="text-xs text-neutral-500 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Verified Telegram Customer Identity
        </p>
      </div>

      <div className="p-3 space-y-3">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-white shadow-xs">
              <User size={26} />
            </div>
            <div>
              <div
                className="text-black font-normal text-lg leading-tight"
                style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
              >
                {customer?.telegramDisplayName ?? "Marcus Vance"}
              </div>
              <div className="text-neutral-500 text-xs font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {customer?.telegramUsername ? `@${customer.telegramUsername}` : "Telegram Connected"}
              </div>
              <div className="inline-flex items-center gap-1 mt-1 text-[10px] bg-green-50 text-green-700 font-normal px-2 py-0.5 rounded-full" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                <ShieldCheck size={12} /> SECURED TELEGRAM ACCESS
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 text-xs space-y-2 text-neutral-600 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            <div className="flex justify-between">
              <span>Customer ID</span>
              <span className="font-mono font-normal text-neutral-900">
                {customer?.telegramUserId ?? "1085949511"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Security Clearance</span>
              <span className="font-normal text-black">LEVEL 1 DIRECT ACCESS</span>
            </div>
            <div className="flex justify-between">
              <span>Encryption Handshake</span>
              <span className="font-normal text-blue-600">SHA-256 HMAC ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-3 shadow-xs divide-y divide-neutral-100 font-normal" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          <Link
            to="/shop/orders"
            className="flex items-center justify-between py-2.5 px-1 text-xs font-normal text-neutral-800 hover:text-black cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag size={16} className="text-neutral-500" />
              <span>My Orders & Queue Position</span>
            </div>
            <span className="text-neutral-400 text-sm">›</span>
          </Link>

          <Link
            to="/shop/notifications"
            className="flex items-center justify-between py-2.5 px-1 text-xs font-normal text-neutral-800 hover:text-black cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Bell size={16} className="text-neutral-500" />
              <span>Alerts & Notifications</span>
            </div>
            <span className="text-neutral-400 text-sm">›</span>
          </Link>

          <Link
            to="/shop/support"
            className="flex items-center justify-between py-2.5 px-1 text-xs font-normal text-neutral-800 hover:text-black cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle size={16} className="text-neutral-500" />
              <span>Customer Care & Bot Support</span>
            </div>
            <span className="text-neutral-400 text-sm">›</span>
          </Link>

          <Link
            to="/admin"
            className="flex items-center justify-between py-2.5 px-1 text-xs font-normal text-neutral-800 hover:text-black cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <ExternalLink size={16} className="text-neutral-500" />
              <span>Admin Operations Portal</span>
            </div>
            <span className="text-neutral-400 text-sm">›</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
