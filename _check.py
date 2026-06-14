import urllib.request, json, ssl
ctx = ssl._create_unverified_context()
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhham9kbWpwd3B2aHJsdGRhY3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NDkzNzksImV4cCI6MjA5MTUyNTM3OX0.-RaIb18Ujj2nr7MV07kRg6ZVa42Db7h3vQuN3AlpwXE"
base = "https://xajodmjpwpvhrltdactf.supabase.co/rest/v1"
headers = {'apikey': key, 'Authorization': f'Bearer {key}'}

# Check notifications (reward markers)
req = urllib.request.Request(f"{base}/notifications?select=id,user_id,type,message,link&order=created_at.desc", headers=headers)
with urllib.request.urlopen(req, context=ctx) as r:
    print("=== NOTIFICATIONS ===")
    print(json.dumps(json.loads(r.read()), indent=2))

# Check mission_updates
req2 = urllib.request.Request(f"{base}/mission_updates?select=id,user_id,update_text", headers=headers)
with urllib.request.urlopen(req2, context=ctx) as r:
    print("\n=== MISSION UPDATES ===")
    print(json.dumps(json.loads(r.read()), indent=2))

# Check enlistments
req3 = urllib.request.Request(f"{base}/enlistments?select=id,callsign,user_id,xp,level", headers=headers)
with urllib.request.urlopen(req3, context=ctx) as r:
    print("\n=== ENLISTMENTS ===")
    print(json.dumps(json.loads(r.read()), indent=2))
