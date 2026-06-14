-- ==========================================
-- UPDATE ADMIN CHECK FUNCTION
-- Run this script in your Supabase SQL Editor
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT lower(auth.jwt() ->> 'email') = ANY (
    ARRAY[
      'myared918@gmail.com',
      'abelkebebew99@gmail.com',
      'elyannanebiyu@gmail.com'
    ]
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Re-apply policies on enlistments just to be safe
ALTER TABLE enlistments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enlistments_select_public" ON enlistments;
DROP POLICY IF EXISTS "enlistments_manage_own" ON enlistments;
DROP POLICY IF EXISTS "enlistments_admin_all" ON enlistments;

CREATE POLICY "enlistments_select_public" ON enlistments FOR SELECT TO public USING (true);
CREATE POLICY "enlistments_manage_own" ON enlistments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "enlistments_admin_all" ON enlistments FOR ALL TO authenticated USING (is_admin());
