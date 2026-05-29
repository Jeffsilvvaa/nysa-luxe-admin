import { useEffect, useState, useMemo } from "react";

import {
  DollarSign, ShoppingBag, Package, Users, TrendingUp, Receipt, Copy, ExternalLink, Check,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/admin/MetricCard";
import { brl } from "@/lib/format";



type Order = { id: string; total: number; status: string; created_at: string };
type Product = { id: string; name: string; stock: number; active: boolean };
type OrderItem = { product_name: string; quantity: number; subtotal: number };

const STATUS_COLORS: Record<string, string> = {
  pendente: "oklch(0.78 0.12 80)",
  pago: "oklch(0.65 0.15 150)",
  separando: "oklch(0.7 0.13 50)",
  enviado: "oklch(0.6 0.14 240)",
  finalizado: "oklch(0.55 0.13 70)",
};

function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [customersCount, setCustomersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: o }, { data: p }, { data: it }, { count }] = await Promise.all([
      supabase.from("orders").select("id,total,status,created_at"),
      supabase.from("products").select("id,name,stock,active"),
      supabase.from("order_items").select("product_name,quantity,subtotal"),
      supabase.from("customers").select("*", { count: "exact", head: true }),
    ]);
    setOrders((o as Order[]) ?? []);
    setProducts((p as Product[]) ?? []);
    setItems((it as OrderItem[]) ?? []);
    setCustomersCount(count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("dash-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const metrics = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter((o) => new Date(o.created_at) >= todayStart);
    const revenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
    const avg = orders.length ? revenue / orders.length : 0;
    return {
      totalSales: orders.length,
      todayOrders: todayOrders.length,
      revenue,
      avgTicket: avg,
      activeProducts: products.filter((p) => p.active).length,
      customers: customersCount,
    };
  }, [orders, products, customersCount]);

  const revenueSeries = useMemo(() => {
    const days = 7;
    const arr = Array.from({ length: days }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      d.setHours(0, 0, 0, 0);
      return { date: d, label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), total: 0, count: 0 };
    });
    orders.forEach((o) => {
      const od = new Date(o.created_at); od.setHours(0, 0, 0, 0);
      const slot = arr.find((a) => a.date.getTime() === od.getTime());
      if (slot) { slot.total += Number(o.total || 0); slot.count += 1; }
    });
    return arr;
  }, [orders]);

  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => { map[o.status] = (map[o.status] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const topProducts = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => { map[i.product_name] = (map[i.product_name] ?? 0) + Number(i.quantity || 0); });
    return Object.entries(map)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [items]);

  const weekGrowth = useMemo(() => {
    const now = Date.now();
    const week = 7 * 86400000;
    const cur = orders.filter((o) => now - new Date(o.created_at).getTime() <= week)
      .reduce((s, o) => s + Number(o.total || 0), 0);
    const prev = orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return now - t > week && now - t <= 2 * week;
    }).reduce((s, o) => s + Number(o.total || 0), 0);
    if (!prev) return cur > 0 ? 100 : 0;
    return ((cur - prev) / prev) * 100;
  }, [orders]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Visão geral</p>
        <h2 className="font-display text-3xl md:text-4xl mt-1">Sua boutique em tempo real</h2>
        <div className="gold-divider w-24 mt-3" />
      </div>

      <StoreLinkCard />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard label="Receita total" value={brl(metrics.revenue)} icon={DollarSign} loading={loading} delay={0} />
        <MetricCard label="Total de vendas" value={String(metrics.totalSales)} icon={Receipt} loading={loading} delay={0.05} />
        <MetricCard label="Pedidos hoje" value={String(metrics.todayOrders)} icon={ShoppingBag} loading={loading} delay={0.1} />
        <MetricCard label="Ticket médio" value={brl(metrics.avgTicket)} icon={TrendingUp} loading={loading} delay={0.15} />
        <MetricCard label="Produtos ativos" value={String(metrics.activeProducts)} icon={Package} loading={loading} delay={0.2} />
        <MetricCard label="Clientes" value={String(metrics.customers)} icon={Users} loading={loading} delay={0.25} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-soft"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-display text-xl">Faturamento</h3>
              <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
            </div>
            <div className={`text-xs px-2.5 py-1 rounded-full border ${weekGrowth >= 0 ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-rose-600 border-rose-200 bg-rose-50"}`}>
              {weekGrowth >= 0 ? "+" : ""}{weekGrowth.toFixed(1)}% semana
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.13 78)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="oklch(0.78 0.13 78)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 80)" />
                <XAxis dataKey="label" stroke="oklch(0.52 0.02 70)" fontSize={11} />
                <YAxis stroke="oklch(0.52 0.02 70)" fontSize={11} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{ background: "white", border: "1px solid oklch(0.92 0.01 80)", borderRadius: 8 }}
                  formatter={(v: number) => brl(v)}
                />
                <Area type="monotone" dataKey="total" stroke="oklch(0.6 0.14 65)" strokeWidth={2} fill="url(#gGold)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-xl p-5 shadow-soft"
        >
          <h3 className="font-display text-xl">Status dos pedidos</h3>
          <p className="text-xs text-muted-foreground mb-2">Distribuição atual</p>
          <div className="h-72">
            {statusData.length === 0 ? (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">Sem pedidos ainda</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {statusData.map((s) => (
                      <Cell key={s.name} fill={STATUS_COLORS[s.name] ?? "oklch(0.6 0.05 70)"} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" formatter={(v) => <span className="text-xs capitalize">{v}</span>} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-5 shadow-soft"
        >
          <h3 className="font-display text-xl">Pedidos por dia</h3>
          <p className="text-xs text-muted-foreground mb-4">Últimos 7 dias</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 80)" />
                <XAxis dataKey="label" stroke="oklch(0.52 0.02 70)" fontSize={11} />
                <YAxis stroke="oklch(0.52 0.02 70)" fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="oklch(0.74 0.13 78)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-card border border-border rounded-xl p-5 shadow-soft"
        >
          <h3 className="font-display text-xl">Mais vendidas</h3>
          <p className="text-xs text-muted-foreground mb-4">Top 5 joias</p>
          {topProducts.length === 0 ? (
            <div className="h-64 grid place-items-center text-sm text-muted-foreground">Ainda não há vendas registradas</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 80)" />
                  <XAxis type="number" stroke="oklch(0.52 0.02 70)" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="oklch(0.52 0.02 70)" fontSize={11} width={100} />
                  <Tooltip />
                  <Bar dataKey="qty" radius={[0, 6, 6, 0]} fill="oklch(0.6 0.14 65)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function StoreLinkCard() {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/loja` : "/loja";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 1800);
    } catch { toast.error("Não foi possível copiar"); }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-accent/40 p-5 shadow-soft sm:p-6"
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-gold opacity-20 blur-3xl" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Sua boutique online</p>
          <h3 className="font-display text-2xl">Link da sua Loja</h3>
          <p className="mt-1 truncate text-sm text-muted-foreground">{url}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={copy}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition hover:border-[var(--gold)] hover:shadow-soft">
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar Link"}
          </button>
          <a href={url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-4 py-2 text-sm font-medium text-primary-foreground shadow-gold transition hover:opacity-90">
            <ExternalLink className="h-4 w-4" /> Abrir Loja
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export default Dashboard;
