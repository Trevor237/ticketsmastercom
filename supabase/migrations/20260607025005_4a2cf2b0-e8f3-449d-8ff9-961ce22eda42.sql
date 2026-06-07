
-- 1) Prevent privilege escalation on user_roles
-- Add restrictive policy: only admins may write to user_roles
DROP POLICY IF EXISTS user_roles_no_self_write ON public.user_roles;
CREATE POLICY user_roles_no_self_write
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) Remove orders from realtime publication (contains financial/PII data)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.orders';
  END IF;
END $$;
