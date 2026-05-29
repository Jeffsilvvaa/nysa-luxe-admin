import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";



function SettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Conta</p>
        <h2 className="font-display text-3xl md:text-4xl mt-1">Configurações</h2>
        <div className="gold-divider w-24 mt-3" />
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-gold grid place-items-center text-primary-foreground shadow-gold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="font-display text-xl">NYSÁ Joias</p>
            <p className="text-sm text-muted-foreground">admin@nysa.com</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-soft space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <p>Acesso protegido por PIN de 4 dígitos</p>
        </div>
        <p className="text-xs text-muted-foreground">
          A loja pública ainda não está disponível — esta é a primeira etapa do sistema, focada no painel administrativo.
        </p>
      </div>

      <Button
        variant="outline"
        onClick={() => { logout(); navigate("/"); }}
        className="border-destructive/30 text-destructive hover:bg-destructive/10"
      >
        <LogOut className="w-4 h-4 mr-2" /> Encerrar sessão
      </Button>
    </div>
  );
}

export default SettingsPage;
