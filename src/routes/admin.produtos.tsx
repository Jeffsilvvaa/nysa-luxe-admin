import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, ImageIcon, Star } from "lucide-react";
import { motion } from "framer-motion";
import { ProductFormDialog, type Product } from "@/components/admin/ProductFormDialog";
import { brl } from "@/lib/format";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";



type Row = Product & { id: string; created_at: string };

function ProductsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [q, setQ] = useState("");
  const [delId, setDelId] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("products").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("products-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((p) =>
      p.name.toLowerCase().includes(s) || (p.category ?? "").toLowerCase().includes(s)
    );
  }, [items, q]);

  const remove = async () => {
    if (!delId) return;
    const { error } = await supabase.from("products").delete().eq("id", delId);
    if (error) toast.error(error.message); else toast.success("Joia removida");
    setDelId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Catálogo</p>
          <h2 className="font-display text-3xl md:text-4xl mt-1">Produtos</h2>
          <div className="gold-divider w-24 mt-3" />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar joias..." className="pl-9 h-11" />
          </div>
          <Button onClick={() => { setEditing(null); setOpen(true); }} className="h-11 bg-gradient-gold text-primary-foreground shadow-gold">
            <Plus className="w-4 h-4 mr-1" /> Cadastrar Nova Joia
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-xl">
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/40" />
          <p className="font-display text-xl mt-3">Nenhuma joia cadastrada</p>
          <p className="text-sm text-muted-foreground mt-1">Clique em "Cadastrar Nova Joia" para começar.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              whileHover={{ y: -4 }}
              className="group bg-card border border-border rounded-xl overflow-hidden shadow-soft hover:shadow-gold transition-shadow"
            >
              <div className="relative aspect-square bg-muted overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                )}
                {p.featured && (
                  <Badge className="absolute top-2 left-2 bg-gradient-gold text-primary-foreground border-0 shadow-gold">
                    <Star className="w-3 h-3 mr-1" /> Destaque
                  </Badge>
                )}
                {!p.active && (
                  <Badge variant="secondary" className="absolute top-2 right-2">Inativo</Badge>
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    {p.category && <p className="text-xs text-muted-foreground">{p.category}</p>}
                  </div>
                  <p className="text-gradient-gold font-display text-lg whitespace-nowrap">{brl(Number(p.price))}</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className={`text-xs ${p.stock > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {p.stock > 0 ? `${p.stock} em estoque` : "Sem estoque"}
                  </span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(p); setOpen(true); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDelId(p.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ProductFormDialog open={open} onOpenChange={setOpen} product={editing} onSaved={load} />

      <AlertDialog open={!!delId} onOpenChange={(v) => !v && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover esta joia?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ProductsPage;
