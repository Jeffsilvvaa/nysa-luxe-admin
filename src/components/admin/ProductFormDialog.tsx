import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export type Product = {
  id?: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  featured: boolean;
  image_url: string | null;
  active: boolean;
};

const empty: Product = {
  name: "", description: "", price: 0, stock: 0,
  category: "", featured: false, image_url: null, active: true,
};

export function ProductFormDialog({
  open, onOpenChange, product, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product?: Product | null;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<Product>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(product ? { ...product } : { ...empty });
  }, [product, open]);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const name = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("product-images").upload(name, file, {
        cacheControl: "3600", upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(name);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast.success("Imagem enviada");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha no upload";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Informe o nome da joia"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description,
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        category: form.category,
        featured: form.featured,
        image_url: form.image_url,
        active: form.active,
        updated_at: new Date().toISOString(),
      };
      if (product?.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", product.id);
        if (error) throw error;
        toast.success("Joia atualizada");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        toast.success("Joia cadastrada");
      }
      onSaved?.();
      onOpenChange(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar";
      toast.error(msg);
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {product?.id ? "Editar joia" : "Cadastrar nova joia"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-full aspect-square rounded-xl border-2 border-dashed border-border hover:border-gold transition overflow-hidden bg-muted/50 group"
            >
              {form.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image_url} alt={form.name} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                  <div className="text-center">
                    <ImagePlus className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs">Adicionar foto</p>
                  </div>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-background/70 grid place-items-center">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </button>
            <input
              ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
            <p className="text-[11px] text-muted-foreground text-center">JPG, PNG · até 5MB</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Colar Dourado Solitário" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Preço (R$)</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Estoque</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Colar, Brinco, Anel..." />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <Label htmlFor="featured" className="cursor-pointer">Em destaque</Label>
              <Switch id="featured" checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <Label htmlFor="active" className="cursor-pointer">Ativo na loja</Label>
              <Switch id="active" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving} className="bg-gradient-gold text-primary-foreground shadow-gold">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : product?.id ? "Salvar alterações" : "Cadastrar joia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
