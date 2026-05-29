import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { CustomerAuthProvider } from "@/lib/customer-auth";

import Lockscreen from "./routes/index";
import LojaPage from "./routes/loja";
import ContaPage from "./routes/conta";
import AdminLayout from "./routes/admin";
import Dashboard from "./routes/admin.index";
import ProductsPage from "./routes/admin.produtos";
import OrdersPage from "./routes/admin.pedidos";
import AnalyticsPage from "./routes/admin.analytics";
import ReportsPage from "./routes/admin.relatorios";
import SettingsPage from "./routes/admin.configuracoes";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display text-gradient-gold">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Página não encontrada.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CustomerAuthProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Lockscreen />} />
                <Route path="/loja" element={<LojaPage />} />
                <Route path="/conta" element={<ContaPage />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="produtos" element={<ProductsPage />} />
                  <Route path="pedidos" element={<OrdersPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="relatorios" element={<ReportsPage />} />
                  <Route path="configuracoes" element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <Toaster richColors position="top-right" />
          </CartProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
