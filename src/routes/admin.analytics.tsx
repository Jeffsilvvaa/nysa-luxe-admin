
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line,
} from "recharts";
import { motion } from "framer-motion";
import { brl } from "@/lib/format";

({ component: AnalyticsPage });

type Order = { total: number; created_at: string };

function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("orders").select("total,created_at");
      setOrders((data as Order[]) ?? []);
    })();
    const ch = supabase.channel("an-rt").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, async () => {
      const { data } = await supabase.from("orders").select("total,created_at");
      setOrders((data as Order[]) ?? []);
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const monthly = useMemo(() => {
    const arr = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i)); d.setHours(0,0,0,0);
      return { date: d, label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), total: 0 };
    });
    orders.forEach((o) => {
      const od = new Date(o.created_at); od.setHours(0,0,0,0);
      const slot = arr.find((a) => a.date.getTime() === od.getTime());
      if (slot) slot.total += Number(o.total || 0);
    });
    return arr;
  }, [orders]);

  const cumulative = useMemo(() => {
    let acc = 0;
    return monthly.map((m) => ({ label: m.label, acumulado: (acc += m.total) }));
  }, [monthly]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Inteligência</p>
        <h2 className="font-display text-3xl md:text-4xl mt-1">Analytics</h2>
        <div className="gold-divider w-24 mt-3" />
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-5 shadow-soft">
        <h3 className="font-display text-xl">Faturamento — últimos 30 dias</h3>
        <div className="h-80 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.78 0.13 78)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="oklch(0.78 0.13 78)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 80)" />
              <XAxis dataKey="label" fontSize={10} stroke="oklch(0.52 0.02 70)" />
              <YAxis fontSize={11} stroke="oklch(0.52 0.02 70)" tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(v: number) => brl(v)} />
              <Area type="monotone" dataKey="total" stroke="oklch(0.6 0.14 65)" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-5 shadow-soft">
        <h3 className="font-display text-xl">Faturamento acumulado</h3>
        <div className="h-80 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cumulative}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 80)" />
              <XAxis dataKey="label" fontSize={10} stroke="oklch(0.52 0.02 70)" />
              <YAxis fontSize={11} stroke="oklch(0.52 0.02 70)" tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(v: number) => brl(v)} />
              <Line type="monotone" dataKey="acumulado" stroke="oklch(0.55 0.13 70)" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}

export default AnalyticsPage;
