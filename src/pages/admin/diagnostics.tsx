import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, RefreshCw, Stethoscope } from "lucide-react";
import { toast } from "sonner";

type Check = { name: string; status: "IDLE" | "PASS" | "FAIL"; detail: string };
const initialChecks: Check[] = [
  { name: "Admin session", status: "IDLE", detail: "Authentication endpoint" },
  { name: "Orders service", status: "IDLE", detail: "Authoritative order API" },
  { name: "Queue state", status: "IDLE", detail: "Local queue configuration" },
  { name: "Browser storage", status: "IDLE", detail: "Persistence availability" },
];

export default function AdminDiagnosticsPage() {
  const [checks, setChecks] = useState(initialChecks);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    const next = [...initialChecks];
    try {
      const session = await fetch("/api/admin/session", { credentials: "same-origin" });
      next[0] = { ...next[0], status: session.ok ? "PASS" : "FAIL", detail: session.ok ? "Session endpoint reachable" : `HTTP ${session.status}` };
    } catch { next[0] = { ...next[0], status: "FAIL", detail: "Session endpoint unreachable" }; }
    try {
      const orders = await fetch("/api/orders", { credentials: "same-origin" });
      next[1] = { ...next[1], status: orders.ok ? "PASS" : "FAIL", detail: orders.ok ? "Orders endpoint reachable" : `HTTP ${orders.status}` };
    } catch { next[1] = { ...next[1], status: "FAIL", detail: "Orders endpoint unreachable" }; }
    try {
      const raw = localStorage.getItem("prime_queue_stats");
      localStorage.setItem("prime_diagnostic_probe", "ok");
      localStorage.removeItem("prime_diagnostic_probe");
      next[2] = { ...next[2], status: "PASS", detail: raw ? "Queue configuration loaded" : "Queue defaults available" };
      next[3] = { ...next[3], status: "PASS", detail: "Local storage read/write passed" };
    } catch { next[2] = { ...next[2], status: "FAIL", detail: "Queue storage unavailable" }; next[3] = { ...next[3], status: "FAIL", detail: "Local storage unavailable" }; }
    setChecks(next); setRunning(false);
    toast.success(next.every((check) => check.status === "PASS") ? "All diagnostics passed" : "Diagnostics completed with failures");
  };

  return (
    <section className="p-4 sm:p-7 max-w-4xl mx-auto space-y-6 font-condensed">
      <header className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Stethoscope size={22}/><h1 className="text-3xl uppercase">Full Diagnostics</h1></div><p className="text-xs text-neutral-500 mt-1">Run live connectivity and persistence checks before release or maintenance.</p></div><button type="button" onClick={run} disabled={running} className="bg-black text-white rounded-lg px-4 py-2 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50">{running ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>} {running ? "RUNNING" : "RUN DIAGNOSTICS"}</button></header>
      <div className="space-y-3">{checks.map((check) => <div key={check.name} className="bg-white border border-neutral-300 rounded-xl p-4 flex items-center gap-3"><div className="shrink-0">{check.status === "PASS" ? <CheckCircle2 className="text-emerald-600"/> : check.status === "FAIL" ? <XCircle className="text-red-600"/> : <div className="w-6 h-6 rounded-full border border-neutral-300"/>}</div><div><div className="text-sm font-semibold uppercase">{check.name}</div><div className="text-xs text-neutral-500">{check.detail}</div></div><div className="ml-auto text-[10px] tracking-wider text-neutral-400">{check.status}</div></div>)}</div>
    </section>
  );
}
