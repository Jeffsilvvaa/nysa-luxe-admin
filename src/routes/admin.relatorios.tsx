
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, Package, ShoppingBag, Users } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";



type DataRow = Record<string, unknown>;

function toCSV(rows: DataRow[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(";"), ...rows.map((r) => headers.map((h) => escape(r[h])).join(";"))].join("\n");
}

function download(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob(["\uFEFF" + content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ReportsPage() {
  const [counts, setCounts] = useState({ orders: 0, products: 0, customers: 0 });

  useEffect(() => {
    (async () => {
      const [o, p, c] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("customers").select("*", { count: "exact", head: true }),
      ]);
      setCounts({ orders: o.count ?? 0, products: p.count ?? 0, customers: c.count ?? 0 });
    })();
  }, []);

  const exportTable = async (table: "products" | "orders" | "customers", filename: string) => {
    const { data, error } = await supabase.from(table).select("*");
    if (error) { toast.error(error.message); return; }
    if (!data?.length) { toast.error("Sem dados para exportar"); return; }
    download(filename, toCSV(data as DataRow[]));
    toast.success(`${filename} gerado`);
  };

  const exportRevenuePDF = async () => {
    const { data } = await supabase.from("orders").select("id,customer_name,total,status,created_at").order("created_at", { ascending: false });
    const rows = (data ?? []) as { id: string; customer_name: string; total: number; status: string; created_at: string }[];
    const total = rows.reduce((s, r) => s + Number(r.total || 0), 0);
    const html = `
<!doctype html><html><head><meta charset="utf-8"><title>NYSÁ — Relatório de Faturamento</title>
<style>
  body{font-family:Georgia,serif;padding:40px;color:#2a2520;}
  h1{font-weight:400;letter-spacing:.3em;text-align:center;background:linear-gradient(135deg,#c9a84c,#8a6a2a);-webkit-background-clip:text;color:transparent;}
  .sub{text-align:center;color:#8a7d6e;letter-spacing:.2em;text-transform:uppercase;font-size:11px;margin-top:-10px;}
  table{width:100%;border-collapse:collapse;margin-top:24px;font-family:Helvetica,Arial,sans-serif;font-size:12px;}
  th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #e8e2d6;}
  th{background:#faf6ee;text-transform:uppercase;letter-spacing:.1em;font-size:10px;color:#8a6a2a;}
  tfoot td{font-weight:bold;background:#faf6ee;}
  .hr{height:1px;background:linear-gradient(90deg,transparent,#c9a84c,transparent);margin:18px 0;}
</style></head><body>
<h1>NYSÁ</h1><p class="sub">Relatório de Faturamento</p>
<div class="hr"></div>
<p style="font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#666">Gerado em ${new Date().toLocaleString("pt-BR")}</p>
<table>
  <thead><tr><th>Pedido</th><th>Cliente</th><th>Status</th><th>Data</th><th style="text-align:right">Total</th></tr></thead>
  <tbody>
    ${rows.map((r) => `<tr><td>#${r.id.slice(0,8).toUpperCase()}</td><td>${r.customer_name}</td><td style="text-transform:capitalize">${r.status}</td><td>${new Date(r.created_at).toLocaleDateString("pt-BR")}</td><td style="text-align:right">R$ ${Number(r.total).toFixed(2)}</td></tr>`).join("")}
  </tbody>
  <tfoot><tr><td colspan="4">Total Geral</td><td style="text-align:right">R$ ${total.toFixed(2)}</td></tr></tfoot>
</table>
<script>window.onload=()=>window.print();</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) { toast.error("Permita pop-ups para gerar o PDF"); return; }
    w.document.write(html); w.document.close();
  };

  const reports = [
    { key: "products", label: "Produtos", icon: Package, count: counts.products, action: () => exportTable("products", "nysa-produtos.csv") },
    { key: "orders", label: "Pedidos", icon: ShoppingBag, count: counts.orders, action: () => exportTable("orders", "nysa-pedidos.csv") },
    { key: "customers", label: "Clientes", icon: Users, count: counts.customers, action: () => exportTable("customers", "nysa-clientes.csv") },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Exportações</p>
        <h2 className="font-display text-3xl md:text-4xl mt-1">Relatórios</h2>
        <div className="gold-divider w-24 mt-3" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {reports.map((r, i) => (
          <motion.div
            key={r.key}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-5 shadow-soft"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{r.label}</p>
                <p className="font-display text-3xl mt-1">{r.count}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-gold grid place-items-center text-primary-foreground"><r.icon className="w-5 h-5" /></div>
            </div>
            <Button onClick={r.action} variant="outline" className="w-full mt-4">
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar CSV / Excel
            </Button>
          </motion.div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-soft">
        <h3 className="font-display text-2xl">Relatório de Faturamento</h3>
        <p className="text-sm text-muted-foreground mt-1">PDF elegante pronto para impressão, com sua marca.</p>
        <Button onClick={exportRevenuePDF} className="mt-4 bg-gradient-gold text-primary-foreground shadow-gold">
          <FileText className="w-4 h-4 mr-2" /> Gerar PDF
        </Button>
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Download className="w-3.5 h-3.5" /> Os arquivos CSV abrem direto no Excel ou Google Sheets.
      </p>
    </div>
  );
}

export default ReportsPage;
