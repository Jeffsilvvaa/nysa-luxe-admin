
-- 1) Roles enum + table
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own roles" ON public.user_roles;
CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 2) Security definer role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3) Replace permissive policies
-- products
DROP POLICY IF EXISTS "products public all" ON public.products;
CREATE POLICY "products select public" ON public.products
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "products admin write" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "products admin update" ON public.products
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "products admin delete" ON public.products
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- orders (guest checkout allowed: INSERT public; reads/admin only)
DROP POLICY IF EXISTS "orders public all" ON public.orders;
CREATE POLICY "orders insert public" ON public.orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "orders admin select" ON public.orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
CREATE POLICY "orders admin update" ON public.orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "orders admin delete" ON public.orders
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- order_items
DROP POLICY IF EXISTS "order_items public all" ON public.order_items;
CREATE POLICY "order_items insert public" ON public.order_items
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "order_items admin select" ON public.order_items
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "order_items admin update" ON public.order_items
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "order_items admin delete" ON public.order_items
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- customers
DROP POLICY IF EXISTS "customers public all" ON public.customers;
CREATE POLICY "customers insert public" ON public.customers
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "customers self or admin select" ON public.customers
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
CREATE POLICY "customers admin update" ON public.customers
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "customers admin delete" ON public.customers
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4) Storage: product-images — public read, admin write
DROP POLICY IF EXISTS "product-images public read" ON storage.objects;
CREATE POLICY "product-images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product-images admin insert" ON storage.objects;
CREATE POLICY "product-images admin insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "product-images admin update" ON storage.objects;
CREATE POLICY "product-images admin update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "product-images admin delete" ON storage.objects;
CREATE POLICY "product-images admin delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
