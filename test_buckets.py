import urllib.request, json, ssl
ctx = ssl._create_unverified_context()
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9kbWpwd3B2aHJsdGRhY3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NDkzNzksImV4cCI6MjA5MTUyNTM3OX0.-RaIb18Ujj2nr7MV07kRg6ZVa42Db7h3vQuN3AlpwXE"
base = "https://xajodmjpwpvhrltdactf.supabase.co/storage/v1/bucket"
headers = {'apikey': key, 'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'}

req = urllib.request.Request(base, headers=headers)
try:
    with urllib.request.urlopen(req, context=ctx) as r:
        print(r.read().decode())
except Exception as e:
    print(e.read().decode())
