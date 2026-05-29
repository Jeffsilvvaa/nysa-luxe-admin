import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, KeyRound, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

({ component: Lockscreen });

function Lockscreen() {
  const navigate = useNavigate();
  const { isAuthed, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthed) navigate("/admin");
  }, [isAuthed, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) {
      toast.success("Bem-vinda, NYSÁ ✨");
      navigate("/admin");
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error(res.error ?? "Credenciais inválidas.");
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-gold opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gold-soft/40 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`w-full max-w-md ${shake ? "animate-shake" : ""}`}
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full border border-gold/40 bg-card shadow-soft mb-4"
          >
            <Sparkles className="w-8 h-8 text-gradient-gold" style={{ color: "var(--gold-deep)" }} />
          </motion.div>
          <h1 className="font-display text-5xl tracking-[0.25em] text-gradient-gold">NYSÁ</h1>
          <div className="gold-divider w-32 mx-auto my-3" />
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Painel Administrativo</p>
        </div>

        <form
          onSubmit={submit}
          className="bg-card border border-border rounded-2xl p-8 shadow-soft backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Lock className="w-4 h-4" />
            Acesso restrito · NYSÁ Joias
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider">E-mail</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="pl-9 h-11"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider">Senha</Label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="pl-9 h-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full h-12 mt-7 bg-gradient-gold text-primary-foreground hover:opacity-90 transition shadow-gold tracking-widest uppercase text-xs font-semibold"
          >
            {loading ? "Validando..." : "Entrar no Painel"}
          </Button>

          <p className="text-[11px] text-center text-muted-foreground mt-5">
            Acesso restrito a administradores autorizados.
          </p>
        </form>
      </motion.div>
    </main>
  );
}

export default Lockscreen;
