import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase.ts";
import { Plus, Trash2, Save } from "lucide-react";

type Charge = { id: string; name: string; amount: number; type: "fixed" | "percent"; active: boolean };

export default function AdminChargesPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<Charge["type"]>("fixed");
  useEffect(() => onSnapshot(query(collection(db, "charges"), orderBy("createdAt", "desc")), s => setCharges(s.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Charge, "id">) })))), []);
  const add = async () => { if (!name.trim() || Number(amount) < 0) return; await addDoc(collection(db, "charges"), { name: name.trim(), amount: Number(amount), type, active: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); setName(""); setAmount(""); };
  return <section className="p-3 sm:p-5 max-w-3xl mx-auto" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}><header className="mb-4"><p className="text-[10px] tracking-[.2em] text-neutral-400">ADMIN / PRICING</p><h1 className="text-2xl">CHARGES</h1></header><div className="bg-white border border-neutral-200 rounded-xl p-3 mb-3 grid grid-cols-[1fr_90px_80px_38px] gap-2"><input className="border border-neutral-200 rounded-lg px-2 text-sm" placeholder="Charge name" value={name} onChange={e=>setName(e.target.value)}/><input className="border border-neutral-200 rounded-lg px-2 text-sm" type="number" min="0" placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)}/><select className="border border-neutral-200 rounded-lg px-2 text-sm" value={type} onChange={e=>setType(e.target.value as Charge["type"])}><option value="fixed">Fixed</option><option value="percent">%</option></select><button onClick={add} className="bg-black text-white rounded-lg flex items-center justify-center"><Plus size={16}/></button></div><div className="space-y-2">{charges.map(c=><div key={c.id} className="bg-white border border-neutral-200 rounded-xl p-3 flex items-center gap-3"><div className="flex-1"><div className="font-semibold text-sm">{c.name}</div><div className="text-xs text-neutral-400">{c.type === "percent" ? `${c.amount}%` : `₱${c.amount.toLocaleString()}`} · {c.active ? "Active" : "Inactive"}</div></div><button onClick={()=>updateDoc(doc(db,"charges",c.id),{active:!c.active,updatedAt:serverTimestamp()})} className="text-xs border rounded-lg px-2 py-1">{c.active?"Disable":"Enable"}</button><button onClick={()=>deleteDoc(doc(db,"charges",c.id))} className="text-neutral-400 hover:text-red-600"><Trash2 size={15}/></button></div>)}</div></section>;
}
