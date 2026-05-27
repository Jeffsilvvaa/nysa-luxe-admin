import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingBag, Plus, Minus, Trash2, X, Heart, Check, User, ArrowRight, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/loja")({
  head: () => ({
    meta: [
      { title: "NYSÁ Joias — Semijoias e Acessórios" },
      { name: "description", content: "Boutique online de semijoias e acessórios premium." },
    ],
  }),
  component: LojaPage,
});

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  stock: number;
  active: boolean;
  featured: boolean;
};

function maskWhats(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function LojaPage() {
  const qc = useQueryClient();
  const { data: products, isLoading } = useQuery({
    queryKey: ["loja-products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("loja-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        qc.invalidateQueries({ queryKey: ["loja-products"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />

      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col items-center text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Coleção</span>
          <h2 className="mt-2 font-display text-4xl sm:text-5xl">Peças Selecionadas</h2>
          <div className="gold-divider mt-4 w-24" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : !products?.length ? (
          <div className="rounded-2xl border border-dashed bg-card/50 py-24 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-[var(--gold)]" />
            <p className="mt-4 font-display text-2xl">Em breve, novidades</p>
            <p className="mt-1 text-sm text-muted-foreground">Nossa coleção será revelada em breve.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <AnimatePresence>
              {products.map((p, idx) => (
                <ProductCard key={p.id} product={p} index={idx} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}

function Header() {
  const { count, setOpen } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/loja" className="flex flex-col leading-none">
          <span className="font-display text-2xl tracking-[0.25em] text-foreground sm:text-3xl">NYSÁ</span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
            Semijoias & Acessórios
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" className="hidden text-xs uppercase tracking-widest sm:inline-flex">
            <User className="mr-2 h-4 w-4" /> Criar Conta / Entrar
          </Button>
          <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Conta">
            <User className="h-5 w-5" />
          </Button>
          <button
            onClick={() => setOpen(true)}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition hover:border-[var(--gold)] hover:shadow-gold"
            aria-label="Abrir sacola"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <motion.span
                key={count}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-gold px-1 text-[10px] font-semibold text-primary-foreground shadow-gold"
              >
                {count}
              </motion.span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(800px 400px at 20% 20%, oklch(0.95 0.05 80 / 0.7), transparent 60%), radial-gradient(600px 400px at 80% 80%, oklch(0.92 0.06 70 / 0.5), transparent 60%)",
        }}
      />
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="text-xs uppercase tracking-[0.4em] text-[var(--gold-deep)]">Nova Coleção</span>
          <h1 className="mt-4 font-display text-5xl leading-tight sm:text-6xl md:text-7xl">
            Beleza que <em className="text-gradient-gold not-italic">atravessa o tempo</em>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Semijoias e acessórios desenhados para celebrar cada detalhe da sua história.
          </p>
          <div className="gold-divider mx-auto mt-8 w-32" />
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/40 py-10 text-center text-xs text-muted-foreground">
      <p className="font-display text-lg tracking-[0.3em] text-foreground">NYSÁ</p>
      <p className="mt-2">© {new Date().getFullYear()} NYSÁ Joias — Semijoias & Acessórios</p>
    </footer>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const { add, setOpen } = useCart();
  const [checkout, setCheckout] = useState(false);

  const onAdd = () => {
    add({ id: product.id, name: product.name, price: Number(product.price), image_url: product.image_url });
    toast.success("Adicionado à sacola");
  };
  const onBuyNow = () => {
    add({ id: product.id, name: product.name, price: Number(product.price), image_url: product.image_url });
    setCheckout(true);
  };

  return (
    <>
      <motion.article
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4) }}
        className="group"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted shadow-soft">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Sparkles className="h-8 w-8" />
            </div>
          )}
          {product.featured && (
            <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-[10px] uppercase tracking-widest backdrop-blur">
              Destaque
            </span>
          )}
          <div className="absolute inset-x-3 bottom-3 flex translate-y-3 gap-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <Button size="sm" variant="secondary" className="flex-1 backdrop-blur" onClick={onAdd}>
              <ShoppingBag className="mr-2 h-4 w-4" /> Sacola
            </Button>
            <Button size="sm" className="flex-1 bg-gradient-gold text-primary-foreground shadow-gold hover:opacity-90" onClick={onBuyNow}>
              Comprar
            </Button>
          </div>
        </div>
        <div className="mt-4 px-1">
          <h3 className="line-clamp-1 font-display text-lg">{product.name}</h3>
          {product.description && (
            <p className="line-clamp-1 text-xs text-muted-foreground">{product.description}</p>
          )}
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-base font-semibold text-[var(--gold-deep)]">{brl(Number(product.price))}</span>
            <button
              onClick={onAdd}
              className="text-xs uppercase tracking-widest text-muted-foreground transition hover:text-[var(--gold-deep)] sm:hidden"
            >
              + Sacola
            </button>
          </div>
        </div>
      </motion.article>

      <CheckoutDialog open={checkout} onOpenChange={setCheckout} />
    </>
  );
}

function CartDrawer() {
  const { items, open, setOpen, setQty, remove, total } = useCart();
  const [checkout, setCheckout] = useState(false);

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl"
            >
              <div className="flex items-center justify-between border-b px-6 py-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Sua Sacola</p>
                  <h2 className="font-display text-2xl">NYSÁ</h2>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-muted" aria-label="Fechar">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {items.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                    <p className="mt-4 font-display text-xl">Sacola vazia</p>
                    <p className="mt-1 text-sm text-muted-foreground">Explore nossa coleção.</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    <AnimatePresence>
                      {items.map((it) => (
                        <motion.li
                          key={it.id} layout
                          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                          className="flex gap-3 rounded-xl border bg-card p-3"
                        >
                          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                            {it.image_url
                              ? <img src={it.image_url} alt={it.name} className="h-full w-full object-cover" />
                              : <div className="flex h-full items-center justify-center"><Sparkles className="h-5 w-5 text-muted-foreground" /></div>}
                          </div>
                          <div className="flex flex-1 flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <p className="line-clamp-2 text-sm font-medium">{it.name}</p>
                              <button onClick={() => remove(it.id)} className="text-muted-foreground hover:text-destructive" aria-label="Remover">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="mt-1 text-xs text-[var(--gold-deep)]">{brl(it.price)}</p>
                            <div className="mt-auto flex items-center justify-between">
                              <div className="inline-flex items-center rounded-full border">
                                <button onClick={() => setQty(it.id, it.quantity - 1)} className="px-2 py-1 hover:bg-muted" aria-label="-">
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-8 text-center text-sm">{it.quantity}</span>
                                <button onClick={() => setQty(it.id, it.quantity + 1)} className="px-2 py-1 hover:bg-muted" aria-label="+">
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                              <span className="text-sm font-semibold">{brl(it.price * it.quantity)}</span>
                            </div>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t bg-card/50 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">Total</span>
                    <span className="font-display text-2xl text-[var(--gold-deep)]">{brl(total)}</span>
                  </div>
                  <Button
                    className="mt-4 w-full bg-gradient-gold text-primary-foreground shadow-gold hover:opacity-90"
                    size="lg"
                    onClick={() => { setOpen(false); setCheckout(true); }}
                  >
                    Finalizar Pedido <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <CheckoutDialog open={checkout} onOpenChange={setCheckout} />
    </>
  );
}

function CheckoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { items, total, clear } = useCart();
  const [name, setName] = useState("");
  const [whats, setWhats] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setTimeout(() => { setDone(false); setName(""); setWhats(""); setAddress(""); }, 300);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whats.trim() || !address.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    if (items.length === 0) return;
    setLoading(true);
    try {
      // Upsert customer
      const { data: cust } = await supabase
        .from("customers")
        .insert({ name: name.trim(), whatsapp: whats, address })
        .select("id")
        .single();

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_id: cust?.id ?? null,
          customer_name: name.trim(),
          customer_whatsapp: whats,
          customer_address: address,
          subtotal: total,
          total,
          status: "pendente",
        })
        .select("id")
        .single();
      if (orderErr || !order) throw orderErr ?? new Error("Falha ao criar pedido");

      const itemsPayload = items.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        product_name: i.name,
        quantity: i.quantity,
        unit_price: i.price,
        subtotal: i.price * i.quantity,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(itemsPayload);
      if (itemsErr) throw itemsErr;

      clear();
      setDone(true);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao concluir pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={() => !loading && onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", damping: 24, stiffness: 220 }}
            className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
          >
            <div className="m-0 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-background shadow-2xl sm:m-4 sm:rounded-3xl">
              {done ? (
                <SuccessView onClose={() => onOpenChange(false)} />
              ) : (
                <div className="p-6 sm:p-8">
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Checkout</p>
                      <h2 className="font-display text-3xl">Finalizar Pedido</h2>
                    </div>
                    <button onClick={() => onOpenChange(false)} className="rounded-full p-2 hover:bg-muted">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={submit} className="space-y-4">
                    <div>
                      <Label htmlFor="ck-name">Nome Completo</Label>
                      <Input id="ck-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" maxLength={120} />
                    </div>
                    <div>
                      <Label htmlFor="ck-whats">WhatsApp</Label>
                      <Input id="ck-whats" value={whats} onChange={(e) => setWhats(maskWhats(e.target.value))} placeholder="(11) 99999-9999" inputMode="tel" />
                    </div>
                    <div>
                      <Label htmlFor="ck-addr">Endereço Completo</Label>
                      <Textarea id="ck-addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, complemento, bairro, cidade — UF" rows={3} maxLength={500} />
                    </div>

                    <div className="rounded-2xl border bg-card/50 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Itens</span>
                        <span>{items.reduce((s, i) => s + i.quantity, 0)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs uppercase tracking-widest text-muted-foreground">Total</span>
                        <span className="font-display text-2xl text-[var(--gold-deep)]">{brl(total)}</span>
                      </div>
                    </div>

                    <Button
                      type="submit" size="lg" disabled={loading || items.length === 0}
                      className="w-full bg-gradient-gold text-primary-foreground shadow-gold hover:opacity-90"
                    >
                      {loading ? "Enviando..." : "Concluir Pedido"}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SuccessView({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center px-6 py-14 text-center sm:py-20"
    >
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 12, stiffness: 180 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-gold shadow-gold"
      >
        <Check className="h-10 w-10 text-primary-foreground" strokeWidth={3} />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="mt-6 font-display text-3xl"
      >
        Pedido recebido <Heart className="ml-1 inline h-6 w-6 text-[var(--gold-deep)]" />
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mt-4 max-w-sm text-sm text-muted-foreground"
      >
        Logo, logo a responsável irá enviar uma mensagem com mais detalhes do produto.
      </motion.p>
      <Button onClick={onClose} variant="outline" className="mt-8">Continuar navegando</Button>
    </motion.div>
  );
}
