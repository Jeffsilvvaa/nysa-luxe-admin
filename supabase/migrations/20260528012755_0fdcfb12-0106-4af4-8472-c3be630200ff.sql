
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_type text NOT NULL DEFAULT 'entrega',
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'A combinar',
  ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS customers_user_id_idx ON public.customers(user_id);
