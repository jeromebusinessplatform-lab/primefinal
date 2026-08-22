import { useMemo, useState } from "react";
import { Download, RefreshCw, WalletCards, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { useOrders } from "@/hooks/useOrders.ts";
import { formatCurrency } from "@/lib/utils.ts";

export default function AdminCashflowPage() {
  const { allOrders } = useOrders();
  const [reserveRate, setReserveRate] = useState(10);
  const [showConfig, setShowConfig] = useState(false);

  const metrics = useMemo(() => {
    const completed = allOrders.filter((order) => order.orderStatus === "DELIVERED");
    const gross = completed.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const reserve = gross * (reserveRate / 100);
    return { gross, reserve, net: gross - reserve, count: completed.length };
  }, [allOrders, reserveRate]);

  const exportCsv = () => {
    const header = "Order,Status,Amount\n";
    const rows = allOrders.map((order) => `${order.orderNumber},${order.orderStatus},${Number(order.total || 0).toFixed(2)}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `prime-cashflow-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Cashflow CSV exported");
  };

  return (
    <section className="p-4 sm:p-7 max-w-5xl mx-auto space-y-6 font-condensed">
      <header className="flex items-start justify-between gap-4">
        <div><h1 className="text-3xl uppercase">Cashflow</h1><p className="text-xs text-neutral-500 mt-1">Authoritative order revenue, reserve planning, and export controls.</p></div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowConfig((v) => !v)} className="p-2 border border-neutral-300 rounded-lg cursor-pointer" aria-label="Cashflow configuration"><Settings2 size={16}/></button>
          <button type="button" onClick={() => toast.success("Cashflow recalculated from current order data")} className="p-2 border border-neutral-300 rounded-lg cursor-pointer" aria-label="Refresh cashflow"><RefreshCw size={16}/></button>
          <button type="button" onClick={exportCsv} className="p-2 bg-black text-white rounded-lg cursor-pointer" aria-label="Export cashflow"><Download size={16}/></button>
        </div>
      </header>

      {showConfig && (
        <div className="bg-white border border-neutral-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div><div className="text-sm font-semibold uppercase">Reserve configuration</div><div className="text-xs text-neutral-500">Applied to delivered-order gross for planning only.</div></div>
          <label className="text-sm flex items-center gap-2">Reserve %<input type="number" min="0" max="100" value={reserveRate} onChange={(e) => setReserveRate(Number(e.target.value))} className="w-20 border border-neutral-300 rounded-md px-2 py-1" /></label>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Metric label="DELIVERED ORDERS" value={String(metrics.count)} />
        <Metric label="GROSS CASHFLOW" value={formatCurrency(metrics.gross)} />
        <Metric label="NET AFTER RESERVE" value={formatCurrency(metrics.net)} />
      </div>

      <div className="bg-white border border-neutral-300 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4"><WalletCards size={19}/><h2 className="text-lg uppercase">Cashflow Ledger</h2></div>
        <div className="space-y-2 text-sm">
          <Row label="Delivered order revenue" value={formatCurrency(metrics.gross)} />
          <Row label={`Planning reserve (${reserveRate}%)`} value={`-${formatCurrency(metrics.reserve)}`} />
          <Row label="Net available" value={formatCurrency(metrics.net)} strong />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="bg-white border border-neutral-300 rounded-xl p-4"><div className="text-[10px] tracking-wider text-neutral-500">{label}</div><div className="text-2xl mt-1">{value}</div></div>;
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className={`flex justify-between border-b border-neutral-100 py-2 ${strong ? "font-semibold text-black" : "text-neutral-700"}`}><span>{label}</span><span>{value}</span></div>;
}
