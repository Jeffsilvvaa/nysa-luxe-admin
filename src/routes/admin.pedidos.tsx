import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { MessageCircle, MapPin, Package as PackageIcon, ShoppingBag, Send } from "lucide-react";
import { brl, dateBR } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pedidos")({ component: OrdersPage });

const STATUSES = ["pendente", "pago", "separando", "enviado", "finalizado"] as const;
type Status = typeof STATUSES[number];

const statusColor: Record<Status, string> = {
  pendente: "bg-amber-100 text-amber-800 border-amber-200",
  pago: "bg-emerald-100 text-emerald-800 border-emerald-200",
  separando: "bg-orange-100 text-orange-800 border-orange-200",
  enviado: "bg-sky-100 text-sky-800 border-sky-200",
  finalizado: "bg-stone-200 text-stone-800 border-stone-300",
};

type Order = {
  id: string; customer_name: string; customer_whatsapp: string | null;
  customer_address: string | null; subtotal: number; total: number;
  status: Status; created_at: string;
  delivery_type?: string | null; payment_method?: string | null;
  order_items: { id: string; product_name: string; quantity: number; unit_price: number; subtotal: number }[];
};

function buildWhatsMessage(o: Order) {
  const items = (o.order_items ?? []).map((i) => `• ${i.product_name} x${i.quantity}`).join("\n");
  const lines = [
    `Olá ${o.customer_name} ✨`,
    "",
    "Recebemos seu pedido com sucesso!",
    "",
    `🧾 Pedido: #${o.id.slice(0, 8).toUpperCase()}`,
    "",
    `💎 Itens:\n${items || "—"}`,
    "",
    `💰 Total: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(o.total))}`,
    "",
    `💳 Pagamento: ${o.payment_method ?? "A combinar"}`,
    "",
    `🚚 Entrega: ${o.delivery_type === "retirada" ? "Retirada" : "Entrega para todo Brasil"}`,
  ];
  if (o.delivery_type !== "retirada" && o.customer_address) {
    lines.push("", `📍 Endereço:\n${o.customer_address}`);
  }
  lines.push("", "Logo iremos separar seu pedido 💖");
  return lines.join("\n");
}

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todos");

  const load = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(id, product_name, quantity, unit_price, subtotal)")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("orders-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Status atualizado");
  };

  const filtered = useMemo(
    () => (filter === "todos" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Atendimento</p>
          <h2 className="font-display text-3xl md:text-4xl mt-1">Pedidos</h2>
          <div className="gold-divider w-24 mt-3" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-48 h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-xl">
          <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/40" />
          <p className="font-display text-xl mt-3">Nenhum pedido por aqui</p>
          <p className="text-sm text-muted-foreground mt-1">Os novos pedidos aparecerão em tempo real.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((o, i) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="bg-card border border-border rounded-xl shadow-soft overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-5 border-b border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display text-lg">{o.customer_name}</p>
                    <Badge variant="outline" className={`capitalize ${statusColor[o.status]} border`}>{o.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">#{o.id.slice(0, 8).toUpperCase()} · {dateBR(o.created_at)}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                    {o.customer_whatsapp && (
                      <a
                        href={`https://wa.me/${o.customer_whatsapp.replace(/\D/g, "")}`}
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
                      >
                        <MessageCircle className="w-4 h-4" /> {o.customer_whatsapp}
                      </a>
                    )}
                    {o.customer_address && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-4 h-4" /> {o.customer_address}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</p>
                    <p className="font-display text-2xl text-gradient-gold">{brl(Number(o.total))}</p>
                  </div>
                  <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as Status)}>
                    <SelectTrigger className="w-40 h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="p-5 bg-muted/30">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                  <PackageIcon className="w-3.5 h-3.5" /> Itens
                </p>
                <div className="divide-y divide-border/60">
                  {o.order_items?.length ? o.order_items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between py-2 text-sm">
                      <span>{it.product_name} <span className="text-muted-foreground">× {it.quantity}</span></span>
                      <span className="font-medium">{brl(Number(it.subtotal))}</span>
                    </div>
                  )) : <p className="text-sm text-muted-foreground py-2">Sem itens registrados</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
