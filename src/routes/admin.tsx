import { createFileRoute, Outlet, useNavigate, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Package, ShoppingBag, FileBarChart, LineChart,
  Settings, LogOut, Menu, X, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/relatorios", label: "Relatórios", icon: FileBarChart },
  { to: "/admin/analytics", label: "Analytics", icon: LineChart },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

function AdminLayout() {
  const { isAuthed, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthed) navigate({ to: "/" });
  }, [loading, isAuthed, navigate]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (loading || !isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  const Sidebar = (
    <aside className="h-full w-64 bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="px-6 pt-7 pb-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: "var(--gold)" }} />
          <div>
            <div className="font-display text-2xl tracking-[0.25em] text-gradient-gold leading-none">NYSÁ</div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-sidebar-foreground/60 mt-1">Admin Suite</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV.map((item) => {
          const active = item.exact
            ? location.pathname === item.to
            : location.pathname === item.to || location.pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="navActive"
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
                  style={{ background: "var(--gold)" }}
                />
              )}
              <item.icon className="w-4 h-4" />
              <span className="tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-5">
        <button
          onClick={async () => { await logout(); navigate({ to: "/" }); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
        <div className="gold-divider mt-4 opacity-40" />
        <p className="text-[10px] text-center text-sidebar-foreground/40 mt-3 tracking-widest uppercase">
          v1 · Premium
        </p>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block sticky top-0 h-screen">{Sidebar}</div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 md:hidden"
            >
              {Sidebar}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 md:px-8 h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost" size="icon" className="md:hidden"
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Painel</p>
                <h1 className="font-display text-xl">Bem-vinda de volta</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-accent text-accent-foreground border border-border">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Online · Tempo real
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-gold grid place-items-center text-primary-foreground text-xs font-semibold shadow-gold">
                N
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
