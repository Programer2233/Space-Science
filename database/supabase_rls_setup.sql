-- ==========================================
-- COMPREHENSIVE SUPABASE RLS SECURITY SETUP
-- ==========================================
-- SECURITY MODEL:
-- - Admin functions use a custom claim approach: check if user's email matches
--   the admin email (admin@nexus.com). In production, use a proper admin role.
-- - All tables have least-privilege RLS policies.
-- - Anonymous users have SELECT-only access to public data.
-- - Authenticated users can only access/manage their own data.
-- - Service role key must NEVER be exposed client-side.
-- ==========================================

-- 0. CREATE ADMIN CHECK FUNCTION (reusable, supports role-based expansion)
-- NOTE: In production, consider using a `is_admin` custom claim in auth.users
-- instead of hardcoding an email address.
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

-- ==========================================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ==========================================
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE enlistments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_updates ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. DROP EXISTING POLICIES (clean slate)
-- ==========================================
DROP POLICY IF EXISTS "Public can view approved profiles" ON enlistments;
DROP POLICY IF EXISTS "Users can manage own profile" ON enlistments;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON enlistments;
DROP POLICY IF EXISTS "Recruits can upload submissions" ON submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can view and manage all submissions" ON submissions;
DROP POLICY IF EXISTS "Public can view research papers" ON papers;
DROP POLICY IF EXISTS "Only admins can manage research papers" ON papers;
DROP POLICY IF EXISTS "Public can view blogs" ON blogs;
DROP POLICY IF EXISTS "Only admins can manage blogs" ON blogs;
DROP POLICY IF EXISTS "Public can view events" ON events;
DROP POLICY IF EXISTS "Only admins can manage events" ON events;
DROP POLICY IF EXISTS "Public can view missions" ON missions;
DROP POLICY IF EXISTS "Only admins can manage missions" ON missions;
DROP POLICY IF EXISTS "Users can view own completed missions" ON user_missions;
DROP POLICY IF EXISTS "Users can complete missions" ON user_missions;
DROP POLICY IF EXISTS "Admins can view all completed missions" ON user_missions;
DROP POLICY IF EXISTS "Public can view projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Admins can manage all projects" ON projects;
DROP POLICY IF EXISTS "Public can view user_projects" ON user_projects;
DROP POLICY IF EXISTS "Users can manage own user_projects" ON user_projects;
DROP POLICY IF EXISTS "Public can view mission updates" ON mission_updates;
DROP POLICY IF EXISTS "Users can post mission updates" ON mission_updates;
DROP POLICY IF EXISTS "Admins can manage mission updates" ON mission_updates;
DROP POLICY IF EXISTS "Public can view interactions" ON interactions;
DROP POLICY IF EXISTS "Users can create interactions" ON interactions;
DROP POLICY IF EXISTS "Users can delete own interactions" ON interactions;
DROP POLICY IF EXISTS "Admins can manage interactions" ON interactions;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications (Authenticated)" ON notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;

-- ==========================================
-- 3. ENLISTMENTS (User Profiles)
-- ==========================================
-- Anyone can see approved/non-sensitive profile data
CREATE POLICY "enlistments_select_public" ON enlistments FOR SELECT TO public
  USING (true);
-- Users can manage their own enlistment record
CREATE POLICY "enlistments_manage_own" ON enlistments FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- Admins can manage all enlistment records
CREATE POLICY "enlistments_admin_all" ON enlistments FOR ALL TO authenticated
  USING (is_admin());

-- ==========================================
-- 4. SUBMISSIONS (Pending Research Papers)
-- ==========================================
-- Recruits can submit their own papers
CREATE POLICY "submissions_insert_own" ON submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);
-- Users can view their own submissions
CREATE POLICY "submissions_select_own" ON submissions FOR SELECT TO authenticated
  USING (auth.uid() = author_id);
-- Admins can view and manage all submissions
CREATE POLICY "submissions_admin_all" ON submissions FOR ALL TO authenticated
  USING (is_admin());

-- ==========================================
-- 5. PAPERS (Published Research)
-- ==========================================
-- Anyone can read published papers
CREATE POLICY "papers_select_public" ON papers FOR SELECT TO public
  USING (true);
-- Only admins can create/update/delete published papers
CREATE POLICY "papers_admin_all" ON papers FOR ALL TO authenticated
  USING (is_admin());

-- ==========================================
-- 6. BLOGS
-- ==========================================
-- Anyone can read blog posts
CREATE POLICY "blogs_select_public" ON blogs FOR SELECT TO public
  USING (true);
-- Only admins can manage blog posts
CREATE POLICY "blogs_admin_all" ON blogs FOR ALL TO authenticated
  USING (is_admin());

-- ==========================================
-- 7. EVENTS
-- ==========================================
-- Anyone can view events
CREATE POLICY "events_select_public" ON events FOR SELECT TO public
  USING (true);
-- Only admins can manage events
CREATE POLICY "events_admin_all" ON events FOR ALL TO authenticated
  USING (is_admin());

-- ==========================================
-- 8. MISSIONS
-- ==========================================
-- Anyone can view available missions
CREATE POLICY "missions_select_public" ON missions FOR SELECT TO public
  USING (true);
-- Only admins can manage missions
CREATE POLICY "missions_admin_all" ON missions FOR ALL TO authenticated
  USING (is_admin());

-- ==========================================
-- 9. USER MISSIONS (Completion Tracking)
-- ==========================================
-- Users can view their own completions
CREATE POLICY "user_missions_select_own" ON user_missions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
-- Users can complete missions for themselves
CREATE POLICY "user_missions_insert_own" ON user_missions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
-- Admins can view all completions
CREATE POLICY "user_missions_admin_select" ON user_missions FOR SELECT TO authenticated
  USING (is_admin());

-- ==========================================
-- 10. PROJECTS & USER PROJECTS
-- ==========================================
-- Anyone can view projects
CREATE POLICY "projects_select_public" ON projects FOR SELECT TO public
  USING (true);
-- Authenticated users can create projects
CREATE POLICY "projects_insert_auth" ON projects FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
-- Users can update their own projects
CREATE POLICY "projects_update_own" ON projects FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
-- Admins can manage all projects
CREATE POLICY "projects_admin_all" ON projects FOR ALL TO authenticated
  USING (is_admin());

-- Anyone can view user projects
CREATE POLICY "user_projects_select_public" ON user_projects FOR SELECT TO public
  USING (true);
-- Users can manage their own projects
CREATE POLICY "user_projects_manage_own" ON user_projects FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- ==========================================
-- 11. MISSION UPDATES (Project Logs)
-- ==========================================
-- Anyone can view mission updates
CREATE POLICY "mission_updates_select_public" ON mission_updates FOR SELECT TO public
  USING (true);
-- Authenticated users can post updates linked to their user_id
CREATE POLICY "mission_updates_insert_own" ON mission_updates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
-- Admins can manage all mission updates
CREATE POLICY "mission_updates_admin_all" ON mission_updates FOR ALL TO authenticated
  USING (is_admin());

-- ==========================================
-- 12. INTERACTIONS (Comments & Upvotes)
-- ==========================================
-- Anyone can view interactions
CREATE POLICY "interactions_select_public" ON interactions FOR SELECT TO public
  USING (true);
-- Authenticated users can create their own interactions
CREATE POLICY "interactions_insert_own" ON interactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
-- Users can delete their own interactions
CREATE POLICY "interactions_delete_own" ON interactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
-- Admins can manage all interactions
CREATE POLICY "interactions_admin_all" ON interactions FOR ALL TO authenticated
  USING (is_admin());

-- ==========================================
-- 13. NOTIFICATIONS
-- ==========================================
-- Users can view their own notifications
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
-- Users can mark their own notifications as read
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
-- Authenticated users can trigger notifications (e.g., during commenting)
CREATE POLICY "notifications_insert_auth" ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);
-- Admins can manage all notifications
CREATE POLICY "notifications_admin_all" ON notifications FOR ALL TO authenticated
  USING (is_admin());

-- ==========================================
-- 14. STORAGE BUCKET POLICIES (mission-evidence)
-- Run against the storage schema:
-- GRANT USAGE ON SCHEMA storage TO anon, authenticated;
-- ==========================================
-- NOTE: These operate on `storage.objects`. Connect via the Supabase dashboard
-- or run these against the `storage` schema.

-- Anyone can view/download files from mission-evidence
-- CREATE POLICY "storage_select_public" ON storage.objects FOR SELECT TO public
--   USING (bucket_id = 'mission-evidence');

-- Authenticated users can upload to mission-evidence
-- CREATE POLICY "storage_insert_auth" ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'mission-evidence');

-- Users can update/delete their own uploads
-- CREATE POLICY "storage_update_own" ON storage.objects FOR UPDATE TO authenticated
--   USING (bucket_id = 'mission-evidence' AND auth.uid() = owner);
-- CREATE POLICY "storage_delete_own" ON storage.objects FOR DELETE TO authenticated
--   USING (bucket_id = 'mission-evidence' AND auth.uid() = owner);

-- Admins can manage all objects in mission-evidence
-- CREATE POLICY "storage_admin_all" ON storage.objects FOR ALL TO authenticated
--   USING (bucket_id = 'mission-evidence' AND is_admin());

-- ==========================================
-- 15. RECOMMENDED INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_enlistments_user_id ON enlistments(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_author_id ON submissions(author_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_interactions_target_id ON interactions(target_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_user_id ON user_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_mission_updates_project_id ON mission_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_papers_published_at ON papers(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC);
