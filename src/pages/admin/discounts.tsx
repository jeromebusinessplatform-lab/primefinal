import { useEffect, useState } from "react";
import { Plus, Trash2, Settings2 } from "lucide-react";
import { toast } from "sonner";

type Discount = { id: string; code: string; value: number; type: "fixed" | "percent"; minSubtotal: number; active: boolean; maxDiscount?: number; usageLimit?: number; perCustomerLimit?: number; stackable?: boolean };

export default function AdminDiscountsPage() {
  const [items, setItems] = useState<Discount[]>([]);
  const [code, setCode] = useState("");
  const [value, setValue] = useState("");
  const [minSubtotal, setMinSubtotal] = useState("");
  const [type, setType] = useState<Discount["type"]>("percent");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [perCustomerLimit, setPerCustomerLimit] = useState("1");
  const [stackable, setStackable] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const response = await fetch("/api/admin/discounts", { credentials: "same-origin" });
    if (!response.ok) throw new Error("Unable to load discounts");
    const data = await response.json();
    setItems(Array.isArray(data.discounts) ? data.discounts : []);
  };

  useEffect(() => { void load().catch(() => toast.error("Unable to load discounts.")); }, []);

  const add = async () => {
    if (!code.trim() || Number(value) < 0) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/discounts", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, value: Number(value), type, minSubtotal: Number(minSubtotal) || 0, maxDiscount: Number(maxDiscount) || 0, usageLimit: Number(usageLimit) || 0, perCustomerLimit: Number(perCustomerLimit) || 0, stackable, active: true }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to create discount");
      setCode(""); setValue(""); setMinSubtotal(""); setMaxDiscount(""); setUsageLimit(""); setPerCustomerLimit("1"); setStackable(false); await load(); toast.success("Discount added.");
    } catch (error: any) { toast.error(error.message || "Unable to create discount."); }
    finally { setBusy(false); }
  };

  const toggle = async (discount: Discount) => {
    const response = await fetch(`/api/admin/discounts/${discount.id}`, { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...discount, active: !discount.active }) });
    if (!response.ok) { toast.error("Unable to update discount."); return; }
    await load();
  };

  const remove = async (discount: Discount) => {
    if (!window.confirm(`Delete ${discount.code}?`)) return;
    const response = await fetch(`/api/admin/discounts/${discount.id}`, { method: "DELETE", credentials: "same-origin" });
    if (!response.ok) { toast.error("Unable to delete discount."); return; }
    await load();
  };

  return <section className="p-4 sm:p-7 max-w-4xl mx-auto space-y-5 font-condensed">
    <header className="flex items-start justify-between gap-3"><div><p className="text-[10px] tracking-[.2em] text-neutral-400">ADMIN / PRICING</p><h1 className="text-3xl uppercase">Discounts</h1><p className="text-xs text-neutral-400 mt-1">Server-authoritative promo rules and eligibility controls.</p></div><button type="button" onClick={() => setShowAdvanced(v => !v)} className="border border-neutral-300 rounded-lg p-2 cursor-pointer" aria-label="Toggle advanced discount settings"><Settings2 size={16}/></button></header>
    <div className="prime-admin-card p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
      <input className="border border-neutral-300 rounded-lg px-2 py-2 text-sm col-span-2" placeholder="Promo code" value={code} onChange={e=>setCode(e.target.value)} />
      <input className="border border-neutral-300 rounded-lg px-2 py-2 text-sm" type="number" min="0" placeholder="Value" value={value} onChange={e=>setValue(e.target.value)} />
      <select className="border border-neutral-300 rounded-lg px-2 py-2 text-sm" value={type} onChange={e=>setType(e.target.value as Discount["type"])}><option value="percent">Percent</option><option value="fixed">Fixed</option></select>
      <input className="border border-neutral-300 rounded-lg px-2 py-2 text-sm" type="number" min="0" placeholder="Min subtotal" value={minSubtotal} onChange={e=>setMinSubtotal(e.target.value)} />
      {showAdvanced && <>
        <input className="border border-neutral-300 rounded-lg px-2 py-2 text-sm" type="number" min="0" placeholder="Max discount (0 = none)" value={maxDiscount} onChange={e=>setMaxDiscount(e.target.value)} />
        <input className="border border-neutral-300 rounded-lg px-2 py-2 text-sm" type="number" min="0" placeholder="Total usage limit" value={usageLimit} onChange={e=>setUsageLimit(e.target.value)} />
        <input className="border border-neutral-300 rounded-lg px-2 py-2 text-sm" type="number" min="0" placeholder="Uses / customer" value={perCustomerLimit} onChange={e=>setPerCustomerLimit(e.target.value)} />
        <label className="flex items-center gap-1 text-xs px-2"><input type="checkbox" checked={stackable} onChange={e=>setStackable(e.target.checked)} />Stackable with other promos</label>
      </>}
      <button type="button" disabled={busy} onClick={() => void add()} className="bg-black text-white rounded-lg flex items-center justify-center gap-1 py-2 disabled:opacity-50 cursor-pointer col-span-2 sm:col-span-1"><Plus size={16}/>Add</button>
    </div>
    <div className="space-y-2">{items.map(d=><div key={d.id} className="prime-admin-card p-4 flex items-center gap-3"><div className="flex-1 min-w-0"><div className="font-semibold text-sm tracking-wide truncate">{d.code}</div><div className="text-xs text-neutral-400">{d.type === "percent"?`${d.value}%`:`₱${d.value.toLocaleString()}`} · Min ₱{d.minSubtotal.toLocaleString()} · {d.active?"Active":"Inactive"} · Usage {d.usageLimit || "∞"} · {d.perCustomerLimit || "∞"} use/customer · {d.stackable ? "Stackable" : "Exclusive"}</div></div><button type="button" onClick={()=>void toggle(d)} className="text-xs border border-neutral-300 rounded-lg px-2 py-1 cursor-pointer">{d.active?"Disable":"Enable"}</button><button type="button" onClick={()=>void remove(d)} className="text-neutral-400 hover:text-red-600 cursor-pointer" aria-label={`Delete ${d.code}`}><Trash2 size={15}/></button></div>)}</div>
  </section>;
}
