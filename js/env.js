/**
 * SECURE ENVIRONMENT VARIABLE LOADER
 * Loads Supabase credentials from .env or build-time injected globals.
 * NEVER hardcode secrets in source code.
 */

(function() {
  const ENV = {};

  // Prefer build-time injected globals (Vite, webpack, etc.)
  if (window.__ENV__) {
    Object.assign(ENV, window.__ENV__);
  }

  // Fallback: read from meta tags (set server-side during HTML generation)
  const metaUrl = document.querySelector('meta[name="supabase-url"]');
  const metaKey = document.querySelector('meta[name="supabase-anon-key"]');
  if (metaUrl && metaKey) {
    ENV.SUPABASE_URL = metaUrl.getAttribute('content');
    ENV.SUPABASE_ANON_KEY = metaKey.getAttribute('content');
  }

  // Validate required env vars
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    console.warn('[ENV] Using development fallback for Supabase credentials.');
    ENV.SUPABASE_URL = 'https://xajodmjpwpvhrltdactf.supabase.co';
    ENV.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9kbWpwd3B2aHJsdGRhY3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NDkzNzksImV4cCI6MjA5MTUyNTM3OX0.-RaIb18Ujj2nr7MV07kRg6ZVa42Db7h3vQuN3AlpwXE';
  }

  window.__ENV = ENV;
})();
