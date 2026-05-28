import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Package, ArrowLeft, LogOut, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerAuth } from "@/lib/customer-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { brl, dateBR } from "@/lib/format";

export const Route = createFileRoute("/conta")({
  head: () => ({
    meta: [
      { title: "Minha Conta — NYSÁ Joias" },
      { name: "description", content: "Acompanhe seus pedidos e dados da NYSÁ Joias." },
    ],
  }),
  component: ContaPage,
});

const STATUS_LABEL: Record<string, string> = {
  pendente: "Aguardando pagamento",
  pago: "Pago",
  separando: "Em separação",
  enviado: "Enviado",
  finalizado: "Finalizado",
};
const STATUS_COLOR: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800 border-amber-200",
  pago: "bg-emerald-100 text-emerald-800 border-emerald-200",
  separando: "bg-orange-100 text-orange-800 border-orange-200",
  enviado: "bg-sky-100 text-sky-800 border-sky-200",
  finalizado: "bg-stone-200 text-stone-800 border-stone-300",
};

function ContaPage() {
  const { user, loading, signOut } = useCustomerAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/loja" });
  }, [loading, user, navigate]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(id, product_name, quantity, subtotal)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--gold)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/loja" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar à loja
          </Link>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate({ to: "/loja" }); }}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Minha conta</p>
          <h1 className="font-display text-4xl">Olá, <span className="text-gradient-gold">{user.email}</span></h1>
          <div className="gold-divider mt-3 w-24" />
        </div>

        <section>
          <h2 className="mb-4 flex items-center gap-2 font-display text-2xl">
            <Package className="h-5 w-5 text-[var(--gold-deep)]" /> Meus pedidos
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
          ) : !orders?.length ? (
            <div className="rounded-2xl border border-dashed bg-card/50 py-16 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-[var(--gold)]" />
              <p className="mt-3 font-display text-xl">Nenhum pedido ainda</p>
              <p className="mt-1 text-sm text-muted-foreground">Explore a coleção e faça seu primeiro pedido.</p>
              <Link to="/loja" className="mt-5 inline-flex items-center justify-center rounded-md bg-gradient-gold px-5 py-2 text-sm text-primary-foreground shadow-gold">
                Ir para a loja
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((o: any, i: number) => (
                <motion.li key={o.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  className="rounded-2xl border bg-card p-5 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">#{o.id.slice(0, 8).toUpperCase()} · {dateBR(o.created_at)}</p>
                      <span className={`mt-2 inline-block rounded-full border px-2.5 py-0.5 text-xs ${STATUS_COLOR[o.status] ?? ""}`}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</p>
                      <p className="font-display text-2xl text-[var(--gold-deep)]">{brl(Number(o.total))}</p>
                    </div>
                  </div>
                  <ul className="mt-4 divide-y divide-border/60 text-sm">
                    {o.order_items?.map((it: any) => (
                      <li key={it.id} className="flex justify-between py-1.5">
                        <span>{it.product_name} <span className="text-muted-foreground">× {it.quantity}</span></span>
                        <span>{brl(Number(it.subtotal))}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Entrega: <span className="text-foreground capitalize">{o.delivery_type}</span></span>
                    <span>Pagamento: <span className="text-foreground">{o.payment_method}</span></span>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
