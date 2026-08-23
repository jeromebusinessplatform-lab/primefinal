import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Clock, Truck, ShieldAlert, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotificationsPage() {
  const [migration, setMigration] = useState<{ message: string; newId: string } | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/customer/migration", { method: "POST", credentials: "same-origin" })
      .then(async (r) => r.ok ? r.json() : null)
      .then((data) => { if (active && data?.migrated) setMigration({ message: data.notification, newId: data.primeMemberId }); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const notifications = [
    ...(migration ? [{ id: "member-id-migration", title: "PRIME™ Member ID Migrated", message: `${migration.message} New ID: ${migration.newId}`, time: "Just now", icon: ShieldAlert, color: "#111", unread: true }] : []),
    { id: "notif-1", title: "Order Dispatched", message: "Your order has left our fulfillment hub with priority courier.", time: "10 mins ago", icon: Truck, color: "#2563eb", unread: true },
    { id: "notif-2", title: "Payment Receipt Confirmed", message: "Automated receipt verification completed successfully.", time: "24 mins ago", icon: CheckCircle2, color: "#16a34a", unread: true },
    { id: "notif-3", title: "Queue Position Update", message: "Your order queue position has changed. Packing operations are in progress.", time: "42 mins ago", icon: Clock, color: "#ea580c", unread: true },
    { id: "notif-4", title: "Account & Security", message: "Your PRIME customer session remains secured through Telegram authentication.", time: "Today", icon: Bell, color: "#111", unread: false },
  ];

  return (
    <div className="bg-[#f3f4f6] min-h-full pb-10">
      <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <div><h1 className="text-black font-normal uppercase text-xl leading-tight">NOTIFICATIONS</h1><p className="text-xs text-neutral-500">Customer alerts and account events</p></div>
        <span className="bg-black text-white text-[11px] px-2.5 py-1 rounded-full uppercase">Live</span>
      </div>
      <div className="p-3 space-y-2.5">
        {notifications.map((n) => { const Icon = n.icon; return <div key={n.id} className="bg-white rounded-2xl border border-neutral-200/90 p-3.5 shadow-xs flex items-start gap-3"><div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${n.color}15`, color: n.color }}><Icon size={18} /></div><div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2"><h3 className="font-normal text-neutral-900 text-sm">{n.title}</h3><span className="text-[10px] text-neutral-400 shrink-0">{n.time}</span></div><p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">{n.message}</p>{n.id === "member-id-migration" && <Link to="/shop/account" className="text-[11px] mt-2 inline-flex items-center gap-1 underline">View account <ArrowRight size={11} /></Link>}</div></div>; })}
      </div>
    </div>
  );
}
