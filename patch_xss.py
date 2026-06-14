"""
DEPRECATED - Superceded by manual escaping audit.

This script was used to automatically patch template literal XSS vulnerabilities.
As of the security audit, all user-rendered content now uses escapeHTML() explicitly.

The following files have been manually audited and fixed:
  - js/supabaseClient.js       (escapeHTML function + all DB calls)
  - js/research.js             (all paper template literals escaped)
  - js/blog.js                 (all blog template literals + modal content as text)
  - js/interactions.js         (all comment/upvote HTML escaped)
  - admin.html                 (all admin panels, forms, submissions)
  - recruit-dashboard.html     (all user-facing data escaped)
  - profile.html               (all profile data escaped)
  - index.html                 (leaderboard + contact form escaped)

Key change: innerHTML with user data is now built via string concatenation
with escapeHTML() wrapping every user-controlled value, rather than template
literals with ${...} interpolation.
"""

