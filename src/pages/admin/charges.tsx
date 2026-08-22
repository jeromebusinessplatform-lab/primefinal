import { useEffect, useState } from "react";
import { Plus, Trash2, Settings2, Save } from "lucide-react";
import { toast } from "sonner";

type Charge = { id: string; name: string; amount: number; type: "fixed" | "percent"; active: boolean; priority?: number; stackable?: boolean; taxable?: boolean; minSubtotal?: number; maxSubtotal?: number };

export default function AdminChargesPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<Charge["type"]>("fixed");
  const [priority, setPriority] = useState("100");
  const [minSubtotal, setMinSubtotal] = useState("");
  const [maxSubtotal, setMaxSubtotal] = useState("");
  const [stackable, setStackable] = useState(false);
  const [taxable, setTaxable] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const response = await fetch("/api/admin/charges", { credentials: "same-origin" });
    if (!response.ok) throw new Error("Unable to load charges");
    const data = await response.json();
    setCharges(Array.isArray(data.charges) ? data.charges : []);
  };

  useEffect(() => { void load().catch(() => toast.error("Unable to load charges.")); }, []);

  const add = async () => {
    if (!name.trim() || Number(amount) < 0) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/charges", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, amount: Number(amount), type, active: true, priority: Number(priority) || 100, minSubtotal: Number(minSubtotal) || 0, maxSubtotal: Number(maxSubtotal) || 0, stackable, taxable }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to create charge");
      setName(""); setAmount(""); setPriority("100"); setMinSubtotal(""); setMaxSubtotal(""); setStackable(false); setTaxable(true); await load(); toast.success("Charge added.");
    } catch (error: any) { toast.error(error.message || "Unable to create charge."); }
    finally { setBusy(false); }
  };

  const toggle = async (charge: Charge) => {
    const response = await fetch(`/api/admin/charges/${charge.id}`, { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...charge, active: !charge.active }) });
    if (!response.ok) { toast.error("Unable to update charge."); return; }
    await load();
  };

  const remove = async (charge: Charge) => {
    if (!window.confirm(`Delete ${charge.name}?`)) return;
    const response = await fetch(`/api/admin/charges/${charge.id}`, { method: "DELETE", credentials: "same-origin" });
    if (!response.ok) { toast.error("Unable to delete charge."); return; }
    await load();
  };

  return <section className="p-4 sm:p-7 max-w-4xl mx-auto space-y-5 font-condensed">
    <header className="flex items-start justify-between gap-3"><div><p className="text-[10px] tracking-[.2em] text-neutral-400">ADMIN / PRICING</p><h1 className="text-3xl uppercase">Charges</h1><p className="text-xs text-neutral-400 mt-1">Server-authoritative fees and surcharges with configurable application rules.</p></div><button type="button" onClick={() => setShowAdvanced(v => !v)} className="border border-neutral-300 rounded-lg p-2 cursor-pointer" aria-label="Toggle advanced charge settings"><Settings2 size={16}/></button></header>
    <div className="prime-admin-card p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
      <input className="border border-neutral-300 rounded-lg px-2 py-2 text-sm col-span-2" placeholder="Charge name" value={name} onChange={e=>setName(e.target.value)} />
      <input className="border border-neutral-300 rounded-lg px-2 py-2 text-sm" type="number" min="0" placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)} />
      <select className="border border-neutral-300 rounded-lg px-2 py-2 text-sm" value={type} onChange={e=>setType(e.target.value as Charge["type"])}><option value="fixed">Fixed</option><option value="percent">Percent</option></select>
      {showAdvanced && <>
        <input className="border border-neutral-300 rounded-lg px-2 py-2 text-sm" type="number" min="0" placeholder="Priority" value={priority} onChange={e=>setPriority(e.target.value)} />
        <input className="border border-neutral-300 rounded-lg px-2 py-2 text-sm" type="number" min="0" placeholder="Min subtotal" value={minSubtotal} onChange={e=>setMinSubtotal(e.target.value)} />
        <input className="border border-neutral-300 rounded-lg px-2 py-2 text-sm" type="number" min="0" placeholder="Max subtotal (0 = none)" value={maxSubtotal} onChange={e=>setMaxSubtotal(e.target.value)} />
        <div className="flex items-center gap-4 text-xs"><label className="flex items-center gap-1"><input type="checkbox" checked={stackable} onChange={e=>setStackable(e.target.checked)} />Stackable</label><label className="flex items-center gap-1"><input type="checkbox" checked={taxable} onChange={e=>setTaxable(e.target.checked)} />Taxable</label></div>
      </>}
      <button type="button" disabled={busy} onClick={() => void add()} className="bg-black text-white rounded-lg flex items-center justify-center gap-1 py-2 disabled:opacity-50 cursor-pointer col-span-2 sm:col-span-1"><Plus size={16}/>Add</button>
    </div>
    <div className="space-y-2">{charges.map(c=><div key={c.id} className="prime-admin-card p-4 flex items-center gap-3"><div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{c.name}</div><div className="text-xs text-neutral-400">{c.type === "percent" ? `${c.amount}%` : `₱${c.amount.toLocaleString()}`} · {c.active ? "Active" : "Inactive"} · Priority {c.priority ?? 100} · {c.stackable ? "Stackable" : "Exclusive"} · {c.taxable === false ? "Non-taxable" : "Taxable"}</div></div><button type="button" onClick={()=>void toggle(c)} className="text-xs border border-neutral-300 rounded-lg px-2 py-1 cursor-pointer">{c.active?"Disable":"Enable"}</button><button type="button" onClick={()=>void remove(c)} className="text-neutral-400 hover:text-red-600 cursor-pointer" aria-label={`Delete ${c.name}`}><Trash2 size={15}/></button></div>)}</div>
  </section>;
}
