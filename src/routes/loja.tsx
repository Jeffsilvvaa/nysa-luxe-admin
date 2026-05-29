import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingBag, Plus, Minus, Trash2, X, Heart, Check, User, ArrowRight, Sparkles,
  MessageCircle, Instagram, Truck, Store, LogOut, Mail, KeyRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useCart } from "@/lib/cart";
import { useCustomerAuth } from "@/lib/customer-auth";
import { brl } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

({
  head: () => ({
    meta: [
      { title: "NYSÁ Joias — Semijoias e Acessórios Premium" },
      { name: "description", content: "Boutique online de semijoias e acessórios premium. Peças selecionadas com entrega para todo o Brasil." },
      { property: "og:title", content: "NYSÁ Joias — Boutique Premium" },
      { property: "og:description", content: "Semijoias e acessórios desenhados para celebrar cada detalhe da sua história." },
    ],
  }),
  component: LojaPage,
});

const WPP_LOJA = "5527999611722";
const INSTAGRAM_URL = "https://www.instagram.com/nysa__joias_";

type Product = {
  id: string; name: string; description: string | null; price: number;
  image_url: string | null; category: string | null; stock: number;
  active: boolean; featured: boolean;
};

function maskWhats(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function maskCEP(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

function LojaPage() {
  const qc = useQueryClient();
  const { data: products, isLoading } = useQuery({
    queryKey: ["loja-products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products").select("*").eq("active", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  useEffect(() => {
    const ch = supabase.channel("loja-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        qc.invalidateQueries({ queryKey: ["loja-products"] });
      }).subscribe();
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
              {products.map((p, idx) => <ProductCard key={p.id} product={p} index={idx} />)}
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
  const { user, signOut } = useCustomerAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium transition hover:border-[var(--gold)]"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-gold text-[10px] text-primary-foreground">
                  {(user.email?.[0] ?? "U").toUpperCase()}
                </span>
                <span className="hidden max-w-[120px] truncate sm:inline">{user.email}</span>
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border bg-card shadow-soft"
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    <Link to="/conta" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted">
                      <User className="h-4 w-4" /> Minha conta
                    </Link>
                    <button
                      onClick={async () => { await signOut(); setMenuOpen(false); toast.success("Você saiu"); }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-muted"
                    >
                      <LogOut className="h-4 w-4" /> Sair
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden text-xs uppercase tracking-widest sm:inline-flex" onClick={() => setAuthOpen(true)}>
                <User className="mr-2 h-4 w-4" /> Criar Conta / Entrar
              </Button>
              <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Conta" onClick={() => setAuthOpen(true)}>
                <User className="h-5 w-5" />
              </Button>
            </>
          )}
          <button
            onClick={() => setOpen(true)}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition hover:border-[var(--gold)] hover:shadow-gold"
            aria-label="Abrir sacola"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <motion.span
                key={count} initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-gold px-1 text-[10px] font-semibold text-primary-foreground shadow-gold"
              >
                {count}
              </motion.span>
            )}
          </button>
        </div>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="absolute inset-0 -z-10" style={{
        background: "radial-gradient(800px 400px at 20% 20%, oklch(0.95 0.05 80 / 0.7), transparent 60%), radial-gradient(600px 400px at 80% 80%, oklch(0.92 0.06 70 / 0.5), transparent 60%)",
      }} />
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
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <p className="font-display text-2xl tracking-[0.3em] text-foreground">NYSÁ</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Semijoias e acessórios premium, criados para celebrar a sua história.
          </p>
          <div className="gold-divider mt-4 w-16" />
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Suporte</h4>
          <p className="mt-3 text-sm text-foreground">
            Tire dúvidas, acompanhe pedidos ou fale diretamente conosco.
          </p>
          <motion.a
            href={`https://api.whatsapp.com/send?phone=${WPP_LOJA}`}
            target="_blank" rel="noreferrer"
            whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-soft transition hover:bg-emerald-700"
          >
            <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
          </motion.a>
          <p className="mt-2 text-xs text-muted-foreground">+55 (27) 99961-1722</p>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Social</h4>
          <p className="mt-3 text-sm text-foreground">Nos acompanhe no Instagram ✨</p>
          <motion.a
            href={INSTAGRAM_URL} target="_blank" rel="noreferrer"
            whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium transition hover:border-[var(--gold)] hover:shadow-gold"
          >
            <Instagram className="h-4 w-4 text-[var(--gold-deep)]" /> @nysa__joias_
          </motion.a>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} NYSÁ Joias — Todos os direitos reservados
      </div>
    </footer>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const { add } = useCart();
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
        layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4) }}
        className="group"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted shadow-soft">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
            <button onClick={onAdd} className="text-xs uppercase tracking-widest text-muted-foreground transition hover:text-[var(--gold-deep)] sm:hidden">
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
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.aside key="drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
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
                        <motion.li key={it.id} layout
                          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                          className="flex gap-3 rounded-xl border bg-card p-3">
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
                                <button onClick={() => setQty(it.id, it.quantity - 1)} className="px-2 py-1 hover:bg-muted" aria-label="-"><Minus className="h-3 w-3" /></button>
                                <span className="w-8 text-center text-sm">{it.quantity}</span>
                                <button onClick={() => setQty(it.id, it.quantity + 1)} className="px-2 py-1 hover:bg-muted" aria-label="+"><Plus className="h-3 w-3" /></button>
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
                  <Button className="mt-4 w-full bg-gradient-gold text-primary-foreground shadow-gold hover:opacity-90" size="lg"
                    onClick={() => { setOpen(false); setCheckout(true); }}>
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

type DeliveryType = "retirada" | "entrega";
type PayMethod = "PIX" | "Cartão" | "Dinheiro";

function CheckoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { items, total, clear } = useCart();
  const { user } = useCustomerAuth();
  const [delivery, setDelivery] = useState<DeliveryType>("entrega");
  const [pay, setPay] = useState<PayMethod>("PIX");
  const [name, setName] = useState("");
  const [whats, setWhats] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setDone(false); setName(""); setWhats(""); setCep(""); setRua(""); setNumero("");
        setComplemento(""); setBairro(""); setCidade(""); setEstado("");
        setDelivery("entrega"); setPay("PIX");
      }, 300);
    } else if (user?.email) {
      // pré-preenche nome se for o email
    }
  }, [open, user]);

  const fullAddress = useMemo(() => {
    if (delivery === "retirada") return null;
    return [`${rua}, ${numero}${complemento ? ` - ${complemento}` : ""}`, bairro, `${cidade} - ${estado}`, `CEP ${cep}`]
      .filter(Boolean).join(" · ");
  }, [delivery, rua, numero, complemento, bairro, cidade, estado, cep]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whats.trim()) { toast.error("Preencha nome e WhatsApp."); return; }
    if (delivery === "entrega" && (!cep || !rua || !numero || !bairro || !cidade || !estado)) {
      toast.error("Preencha o endereço completo."); return;
    }
    if (items.length === 0) return;
    setLoading(true);
    try {
      const { data: cust } = await supabase.from("customers")
        .insert({ name: name.trim(), whatsapp: whats, address: fullAddress, user_id: user?.id ?? null })
        .select("id").single();

      const { data: order, error: orderErr } = await supabase.from("orders").insert({
        customer_id: cust?.id ?? null,
        user_id: user?.id ?? null,
        customer_name: name.trim(),
        customer_whatsapp: whats,
        customer_address: fullAddress,
        subtotal: total, total,
        status: "pendente",
        delivery_type: delivery,
        payment_method: pay,
      }).select("id").single();
      if (orderErr || !order) throw orderErr ?? new Error("Falha ao criar pedido");

      const itemsPayload = items.map((i) => ({
        order_id: order.id, product_id: i.id, product_name: i.name,
        quantity: i.quantity, unit_price: i.price, subtotal: i.price * i.quantity,
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={() => !loading && onOpenChange(false)} />
          <motion.div initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", damping: 24, stiffness: 220 }}
            className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
            <div className="m-0 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-background shadow-2xl sm:m-4 sm:rounded-3xl">
              {done ? <SuccessView onClose={() => onOpenChange(false)} /> : (
                <div className="p-6 sm:p-8">
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Checkout</p>
                      <h2 className="font-display text-3xl">Finalizar Pedido</h2>
                    </div>
                    <button onClick={() => onOpenChange(false)} className="rounded-full p-2 hover:bg-muted"><X className="h-5 w-5" /></button>
                  </div>

                  <form onSubmit={submit} className="space-y-5">
                    {/* Entrega */}
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">Como deseja receber</p>
                      <div className="grid grid-cols-2 gap-3">
                        <OptionCard active={delivery === "retirada"} onClick={() => setDelivery("retirada")} icon={Store} title="Retirada" subtitle="Combinar local" />
                        <OptionCard active={delivery === "entrega"} onClick={() => setDelivery("entrega")} icon={Truck} title="Entrega" subtitle="Todo o Brasil" />
                      </div>
                    </div>

                    {/* Dados básicos */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="ck-name">Nome completo</Label>
                        <Input id="ck-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" maxLength={120} required />
                      </div>
                      <div>
                        <Label htmlFor="ck-whats">WhatsApp</Label>
                        <Input id="ck-whats" value={whats} onChange={(e) => setWhats(maskWhats(e.target.value))} placeholder="(11) 99999-9999" inputMode="tel" required />
                      </div>
                    </div>

                    {/* Endereço (somente se entrega) */}
                    <AnimatePresence initial={false}>
                      {delivery === "entrega" && (
                        <motion.div
                          key="addr"
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid gap-3 pt-1 sm:grid-cols-2">
                            <div>
                              <Label htmlFor="ck-cep">CEP</Label>
                              <Input id="ck-cep" value={cep} onChange={(e) => setCep(maskCEP(e.target.value))} placeholder="00000-000" inputMode="numeric" />
                            </div>
                            <div className="sm:col-span-1">
                              <Label htmlFor="ck-est">Estado</Label>
                              <Input id="ck-est" value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))} placeholder="UF" maxLength={2} />
                            </div>
                            <div className="sm:col-span-2">
                              <Label htmlFor="ck-rua">Rua</Label>
                              <Input id="ck-rua" value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Avenida / Rua" />
                            </div>
                            <div>
                              <Label htmlFor="ck-num">Número</Label>
                              <Input id="ck-num" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="123" />
                            </div>
                            <div>
                              <Label htmlFor="ck-comp">Complemento</Label>
                              <Input id="ck-comp" value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Apto, bloco..." />
                            </div>
                            <div>
                              <Label htmlFor="ck-bai">Bairro</Label>
                              <Input id="ck-bai" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" />
                            </div>
                            <div>
                              <Label htmlFor="ck-cid">Cidade</Label>
                              <Input id="ck-cid" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Pagamento */}
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">Forma de pagamento</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(["PIX", "Cartão", "Dinheiro"] as PayMethod[]).map((m) => (
                          <button
                            key={m} type="button" onClick={() => setPay(m)}
                            className={`rounded-xl border px-3 py-2.5 text-sm transition ${
                              pay === m ? "border-[var(--gold)] bg-accent text-foreground shadow-soft" : "border-border bg-card hover:border-[var(--gold)]"
                            }`}
                          >{m}</button>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Os detalhes do pagamento serão combinados pelo WhatsApp após a confirmação.
                      </p>
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

                    <Button type="submit" size="lg" disabled={loading || items.length === 0}
                      className="w-full bg-gradient-gold text-primary-foreground shadow-gold hover:opacity-90">
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

function OptionCard({ active, onClick, icon: Icon, title, subtitle }: {
  active: boolean; onClick: () => void; icon: any; title: string; subtitle: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
        active ? "border-[var(--gold)] bg-accent shadow-soft" : "border-border bg-card hover:border-[var(--gold)]"
      }`}>
      <span className={`grid h-10 w-10 place-items-center rounded-lg ${active ? "bg-gradient-gold text-primary-foreground" : "bg-muted text-foreground"}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-[11px] text-muted-foreground">{subtitle}</span>
      </span>
    </button>
  );
}

function SuccessView({ onClose }: { onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center px-6 py-14 text-center sm:py-20">
      <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 12, stiffness: 180 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
        <Check className="h-10 w-10 text-primary-foreground" strokeWidth={3} />
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="mt-6 font-display text-3xl">
        Pedido recebido <Heart className="ml-1 inline h-6 w-6 text-[var(--gold-deep)]" />
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mt-4 max-w-sm text-sm text-muted-foreground">
        Logo, logo a responsável irá enviar uma mensagem com mais detalhes do produto.
      </motion.p>
      <Button onClick={onClose} variant="outline" className="mt-8">Continuar navegando</Button>
    </motion.div>
  );
}

// ============== AUTH DIALOG ==============

function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) setTimeout(() => { setEmail(""); setPassword(""); setMode("login"); }, 300);
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || password.length < 6) { toast.error("Email e senha (mín. 6) são obrigatórios."); return; }
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vinda de volta ✨");
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/loja" },
        });
        if (error) throw error;
        toast.success("Conta criada! Você já está logada.");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/loja" });
      if (result.error) throw result.error;
    } catch (err: any) {
      toast.error(err?.message ?? "Erro com Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
            onClick={() => !loading && onOpenChange(false)} />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: "spring", damping: 22, stiffness: 220 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-background shadow-2xl">
              <div className="bg-gradient-gold px-6 py-6 text-center text-primary-foreground">
                <p className="text-[10px] uppercase tracking-[0.3em] opacity-80">NYSÁ</p>
                <h2 className="font-display text-3xl">{mode === "login" ? "Entrar" : "Criar conta"}</h2>
              </div>
              <div className="p-6 sm:p-8">
                <button
                  onClick={google} disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:border-[var(--gold)] hover:shadow-soft disabled:opacity-50"
                >
                  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C41.1 35.3 44 30 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
                  Continuar com Google
                </button>

                <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" /> ou e-mail <span className="h-px flex-1 bg-border" />
                </div>

                <form onSubmit={submit} className="space-y-3">
                  <div>
                    <Label htmlFor="auth-email">E-mail</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="auth-email" type="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="auth-pass">Senha</Label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="auth-pass" type="password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground shadow-gold hover:opacity-90">
                    {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
                  </Button>
                </form>

                <p className="mt-5 text-center text-xs text-muted-foreground">
                  {mode === "login" ? "Ainda não tem conta? " : "Já tem conta? "}
                  <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
                    className="font-semibold text-[var(--gold-deep)] hover:underline">
                    {mode === "login" ? "Criar conta" : "Entrar"}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default LojaPage;
