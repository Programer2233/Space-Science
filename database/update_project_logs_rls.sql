-- ==========================================
-- FEATURE UPDATE: USER PROJECTS & PROJECT LOGS
-- Run this script in your Supabase SQL Editor
-- ==========================================

-- 1. ENFORCE UNIQUE USERS
ALTER TABLE enlistments DROP CONSTRAINT IF EXISTS unique_commlink;
ALTER TABLE enlistments ADD CONSTRAINT unique_commlink UNIQUE (commlink);

-- 2. CREATE USER PROJECTS TABLE
CREATE TABLE IF NOT EXISTS user_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_projects_insert_own" ON user_projects;
DROP POLICY IF EXISTS "user_projects_select_own" ON user_projects;
DROP POLICY IF EXISTS "user_projects_admin_all" ON user_projects;

CREATE POLICY "user_projects_insert_own" ON user_projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_projects_select_own" ON user_projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_projects_admin_all" ON user_projects FOR ALL TO authenticated USING (public.is_admin());

-- 3. CREATE/UPDATE PROJECT LOGS TABLE
-- If it exists from the previous run, let's drop it and recreate it properly with project_id
DROP TABLE IF EXISTS project_logs CASCADE;

CREATE TABLE project_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  update_text TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_logs_insert_own" ON project_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "project_logs_select_own" ON project_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "project_logs_admin_all" ON project_logs FOR ALL TO authenticated USING (public.is_admin());

-- 4. ADD REJECTION REASON COLUMNS
ALTER TABLE enlistments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
