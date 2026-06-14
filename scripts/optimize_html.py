import os
import glob
import re

html_files = glob.glob("*.html")

for file in html_files:
    with open(file, "r") as f:
        content = f.read()

    # 1. Add defer to the 4 main scripts if not already there
    scripts_to_defer = [
        '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>',
        '<script src="js/env.js"></script>',
        '<script src="js/supabaseClient.js"></script>',
        '<script src="js/auth.js"></script>'
    ]
    deferred_scripts = [
        '<script defer src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>',
        '<script defer src="js/env.js"></script>',
        '<script defer src="js/supabaseClient.js"></script>',
        '<script defer src="js/auth.js"></script>'
    ]
    
    for old, new in zip(scripts_to_defer, deferred_scripts):
        content = content.replace(old, new)

    # 2. Add preconnect tags if they don't exist
    preconnects = """  <!-- Preconnect to external domains for faster DNS resolution -->
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link rel="preconnect" href="https://i.pravatar.cc">
  <link rel="preconnect" href="https://api.web3forms.com">
"""
    if "https://cdn.jsdelivr.net" not in content and "</title>" in content:
        content = content.replace("</title>", "</title>\n" + preconnects)

    # 3. Add loading="lazy" to specific images
    # Instead of complex HTML parsing, let's just do it for pravatar specifically since we know those are avatars
    content = re.sub(r'(<img[^>]+src="https://i\.pravatar\.cc[^>]+?)(?<!loading="lazy")>', r'\1 loading="lazy">', content)
    
    with open(file, "w") as f:
        f.write(content)

print(f"Optimized {len(html_files)} HTML files.")
