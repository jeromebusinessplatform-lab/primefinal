import { useEffect, useState } from "react";
import { Headphones, Plus, Settings2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Ticket = { id: string; subject: string; priority: "LOW" | "NORMAL" | "HIGH"; status: "OPEN" | "RESOLVED"; createdAt: string };
const STORAGE_KEY = "prime_admin_support_tickets";
const seed: Ticket[] = [{ id: "SUP-001", subject: "Payment verification assistance", priority: "HIGH", status: "OPEN", createdAt: new Date().toISOString() }];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<Ticket["priority"]>("NORMAL");
  const [autoAssign, setAutoAssign] = useState(true);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); setTickets(saved ? JSON.parse(saved) : seed); } catch { setTickets(seed); }
  }, []);

  const persist = (next: Ticket[]) => { setTickets(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); };
  const createTicket = (event: React.FormEvent) => {
    event.preventDefault();
    if (!subject.trim()) { toast.error("Enter a support subject"); return; }
    const ticket: Ticket = { id: `SUP-${String(Date.now()).slice(-6)}`, subject: subject.trim(), priority, status: "OPEN", createdAt: new Date().toISOString() };
    persist([ticket, ...tickets]); setSubject(""); toast.success(autoAssign ? "Ticket created and assigned" : "Ticket created");
  };
  const resolve = (id: string) => { persist(tickets.map((ticket) => ticket.id === id ? { ...ticket, status: "RESOLVED" } : ticket)); toast.success("Ticket resolved"); };

  return (
    <section className="p-4 sm:p-7 max-w-5xl mx-auto space-y-6 font-condensed">
      <header className="flex items-start justify-between gap-4"><div><h1 className="text-3xl uppercase">Support</h1><p className="text-xs text-neutral-500 mt-1">Administrator service desk, escalation and ticket controls.</p></div><button type="button" onClick={() => setShowConfig((v) => !v)} className="p-2 border border-neutral-300 rounded-lg cursor-pointer" aria-label="Support configuration"><Settings2 size={16}/></button></header>
      {showConfig && <div className="bg-white border border-neutral-300 rounded-xl p-4 flex items-center justify-between"><div><div className="text-sm font-semibold uppercase">Auto-assignment</div><div className="text-xs text-neutral-500">Automatically route new tickets to the active support queue.</div></div><input type="checkbox" checked={autoAssign} onChange={(e) => setAutoAssign(e.target.checked)} className="w-5 h-5 accent-black cursor-pointer" /></div>}

      <form onSubmit={createTicket} className="bg-white border border-neutral-300 rounded-xl p-4 flex flex-col sm:flex-row gap-2">
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="New support issue..." className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-black" />
        <select value={priority} onChange={(e) => setPriority(e.target.value as Ticket["priority"])} className="border border-neutral-300 rounded-lg px-3 py-2 text-sm"><option>LOW</option><option>NORMAL</option><option>HIGH</option></select>
        <button type="submit" className="bg-black text-white rounded-lg px-4 py-2 text-sm flex items-center justify-center gap-2 cursor-pointer"><Plus size={15}/>Create Ticket</button>
      </form>

      <div className="space-y-3">
        {tickets.map((ticket) => <article key={ticket.id} className="bg-white border border-neutral-300 rounded-xl p-4 flex items-center justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2 text-[10px] text-neutral-500"><span>{ticket.id}</span><span>{ticket.priority}</span><span>{ticket.status}</span></div><h2 className="text-base mt-1 truncate">{ticket.subject}</h2><p className="text-[10px] text-neutral-400">{new Date(ticket.createdAt).toLocaleString()}</p></div>{ticket.status === "OPEN" ? <button type="button" onClick={() => resolve(ticket.id)} className="shrink-0 border border-neutral-300 rounded-lg px-3 py-2 text-xs flex items-center gap-1 cursor-pointer"><CheckCircle2 size={14}/>Resolve</button> : <span className="text-xs text-emerald-700 flex items-center gap-1"><CheckCircle2 size={14}/>Resolved</span>}</article>)}
        {!tickets.length && <div className="text-center text-neutral-400 py-12"><Headphones className="mx-auto mb-2"/>No support tickets.</div>}
      </div>
    </section>
  );
}
