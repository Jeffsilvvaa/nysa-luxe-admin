# NYSÁ Joias

Plataforma full-stack para a marca de joias premium **NYSÁ**, composta por um painel administrativo completo e uma loja pública do cliente.

Construído com **React 19 + TanStack Start + Tailwind CSS v4 + Lovable Cloud (Supabase)** e pronto para deploy em edge (Cloudflare Workers).

---

## ✨ Funcionalidades

### 🛠 Painel Administrativo (`/admin`)
- Dashboard com métricas reais (vendas, pedidos, clientes, ticket médio)
- CRUD profissional de **produtos** com upload de imagens
- Gestão de **pedidos** em tempo real (realtime via Supabase)
- Disparo de mensagem para o cliente via **WhatsApp** com template automático
- Analytics, relatórios e configurações da loja
- Autenticação restrita por papel (`admin`) com tabela `user_roles` e RLS

### 🛍 Loja Pública (`/loja`)
- Catálogo premium, carrinho persistente e checkout
- Opção de **retirada** ou **entrega** com máscara de CEP / WhatsApp
- Login do cliente com **e-mail/senha + Google**
- Área do cliente (`/conta`) com histórico de pedidos em tempo real
- Footer com links diretos para WhatsApp e Instagram
- SEO, lazy loading, skeleton states e microinterações

---

## 🧱 Stack

| Camada | Tecnologia |
|---|---|
| Framework | TanStack Start v1 (SSR + server functions) |
| UI | React 19, Tailwind CSS v4, shadcn/ui |
| Backend | Lovable Cloud (Supabase) — Postgres, Auth, Storage, Realtime |
| Build | Vite 7 |
| Deploy | Cloudflare Workers (edge) |

---

## 🚀 Rodando localmente

```bash
bun install
bun run dev
```

A aplicação ficará disponível em `http://localhost:5173`.

### Variáveis de ambiente

O arquivo `.env` é gerenciado automaticamente pelo Lovable Cloud e contém:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

> Nunca commite chaves de service role.

---

## 📁 Estrutura

```
src/
├── routes/              # Rotas (file-based routing)
│   ├── __root.tsx       # Layout raiz + providers
│   ├── index.tsx        # Home
│   ├── loja.tsx         # Loja pública
│   ├── conta.tsx        # Área do cliente
│   └── admin.*.tsx      # Painel administrativo
├── components/          # Componentes reutilizáveis
│   ├── admin/           # Componentes do painel
│   └── ui/              # shadcn/ui
├── lib/                 # Auth, carrinho, formatadores
├── integrations/
│   └── supabase/        # Cliente Supabase (auto-gerado)
└── styles.css           # Design tokens (oklch) + Tailwind v4
supabase/
└── migrations/          # Migrations SQL versionadas
```

---

## 🌿 Branches

- **`main`** — produção, sincronizada automaticamente com o Lovable
- **`development`** — branch de trabalho para features e experimentos

Fluxo recomendado: trabalhe em `development` → abra Pull Request → merge em `main`.

---

## 🔐 Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Papéis de usuário armazenados em tabela separada (`user_roles`) com função `has_role` `SECURITY DEFINER`
- Autenticação real Supabase Auth (e-mail/senha + Google OAuth)
- Nenhuma credencial sensível exposta no client

---

## 📜 Licença

Projeto proprietário — © NYSÁ Joias. Todos os direitos reservados.
