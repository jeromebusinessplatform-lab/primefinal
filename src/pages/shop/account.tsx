import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTelegram } from "@/context/TelegramContext.tsx";
import { useCustomers } from "@/hooks/useCustomers";
import { useOrders, type CustomerOrder } from "@/hooks/useOrders";
import { User, ChevronRight } from "lucide-react";

export default function AccountPage() {
  const { customer, isAuthenticated, isTelegramEnv, error: telegramError } = useTelegram();
  const { customers, loading: customersLoading, refresh: refreshCustomers } = useCustomers();
  const { orders, loading: ordersLoading } = useOrders(customer?.telegramUserId);
  const [migrationNotice, setMigrationNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) return;
    let active = true;
    void fetch("/api/customer/migration", { method: "POST", credentials: "same-origin" })
      .then(async (r) => r.ok ? r.json() : null)
      .then(async (data) => {
        if (!active || !data?.migrated) return;
        setMigrationNotice(data.notification || "Your PRIME™ Member ID has been migrated.");
        await refreshCustomers();
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [customer, refreshCustomers]);

  const customerData = customers.find(c => c.telegramUserId === customer?.telegramUserId);

  if (customersLoading) return <div className="min-h-[60vh] flex items-center justify-center p-6 text-center text-neutral-500">Loading account...</div>;
  if (!isTelegramEnv || !isAuthenticated || !customer) return <div className="min-h-[60vh] flex items-center justify-center p-6 text-center"><div><div className="font-bold text-lg">ACCOUNT UNAVAILABLE</div><p className="text-sm text-neutral-500 mt-2">Open PRIME from Telegram to access your customer account.</p>{telegramError && <p className="text-xs text-neutral-400 mt-2">{telegramError}</p>}</div></div>;
  if (!customerData) return <div className="min-h-[60vh] flex items-center justify-center p-6 text-center"><div><div className="font-bold text-lg">ACCOUNT NOT FOUND</div><p className="text-sm text-neutral-500 mt-2">Your PRIME customer profile has not been created yet.</p></div></div>;

  return (
    <div className="bg-[#f3f4f6] min-h-full pb-10">
      <div className="bg-white border-b border-neutral-200 px-4 py-3"><h1 className="text-black font-normal uppercase text-xl leading-tight">MY ACCOUNT</h1><p className="text-xs text-neutral-500 font-normal">SECURED CUSTOMER ACCESS</p></div>
      <div className="p-3 space-y-3">
        {migrationNotice && <div className="bg-black text-white rounded-2xl p-3 text-xs leading-relaxed"><div className="font-semibold uppercase mb-1">PRIME™ Member ID Migration</div><div>{migrationNotice}</div></div>}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm text-center"><div className="w-20 h-20 rounded-full bg-neutral-200 mx-auto mb-3 flex items-center justify-center"><User size={40} className="text-neutral-500" /></div><div className="text-lg font-bold">{customerData.telegramDisplayName}</div><div className="text-neutral-500 text-sm">@{customerData.telegramUsername}</div><div className="grid grid-cols-2 gap-3 mt-6 text-xs text-left"><div className="border p-2 rounded"><div className="text-neutral-500">TELEGRAM UID</div><div className="font-flex tabular-nums break-all">{customerData.telegramUserId}</div></div><div className="border p-2 rounded"><div className="text-neutral-500">PRIME MEMBER ID</div><div className="font-flex tabular-nums break-all">{customerData.primeMemberId}</div></div></div></div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm space-y-2 text-sm"><div className="flex justify-between"><span>VIP Tier Status:</span><span className="font-bold">{customerData.vipTier}</span></div><div className="flex justify-between"><span>Points:</span><span className="font-bold font-flex tabular-nums">{customerData.points}</span></div><div className="flex justify-between"><span>Member since:</span><span className="font-bold font-flex tabular-nums">{new Date(customerData.memberSince).toLocaleDateString()}</span></div><div className="flex justify-between"><span>Order Count:</span><span className="font-bold font-flex tabular-nums">{customerData.orderCount}</span></div><div className="flex justify-between"><span>Total Spending:</span><span className="font-bold font-flex tabular-nums">₱{customerData.totalSpending.toFixed(2)}</span></div></div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm"><div className="flex items-center justify-between mb-3"><h2 className="font-bold">RECENT ORDERS</h2><Link to="/shop/orders" className="text-[11px] underline inline-flex items-center gap-1">View All <ChevronRight size={12} /></Link></div><div className="space-y-2">{ordersLoading ? <div className="text-xs text-neutral-500">Loading orders...</div> : orders.slice(0, 3).map((order: CustomerOrder) => <Link key={order._id} to="/shop/orders" className="flex items-center justify-between gap-2 text-xs border-b pb-2 last:border-0 last:pb-0 hover:bg-neutral-50 rounded px-1"><div className="min-w-0"><div className="font-flex tabular-nums truncate">#{order.orderNumber}</div><div className="text-neutral-400">{new Date(order._creationTime).toLocaleDateString()}</div></div><div className="text-right shrink-0"><div>{order.orderStatus}</div><div className="font-flex tabular-nums">₱{order.total.toFixed(2)}</div></div></Link>)}{!ordersLoading && !orders.length && <div className="text-xs text-neutral-500">No orders yet.</div>}</div></div>
      </div>
    </div>
  );
}
