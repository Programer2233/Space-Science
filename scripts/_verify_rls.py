import urllib.request, urllib.error, json, re

with open('js/env.js', 'r') as f:
    content = f.read()

url = 'https://xajodmjpwpvhrltdactf.supabase.co'
key_match = re.search(r"SUPABASE_ANON_KEY.*?'(eyJ[^']+)'", content)
key = key_match.group(1)

# Try to update a record with the anon key (should fail if RLS is working)
record_id = 'c699bed7-3c15-498b-8611-7c690669877c'
endpoint = f"{url}/rest/v1/enlistments?id=eq.{record_id}"
payload = json.dumps({"status": "approved"}).encode()

req = urllib.request.Request(endpoint, data=payload, method='PATCH', headers={
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
})

try:
    with urllib.request.urlopen(req) as resp:
        result = resp.read().decode()
        print(f"ANON update result: {result}")
        print(f"Status: {resp.status}")
        # If this returns data, the anon key can update - that's a problem
        data = json.loads(result)
        if len(data) == 0:
            print(">> 0 rows affected - RLS is blocking the update (even for anon)")
        else:
            print(">> UPDATE SUCCEEDED with anon key - RLS is NOT properly configured!")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"ANON update error {e.code}: {body}")

# Check current status
endpoint2 = f"{url}/rest/v1/enlistments?select=id,status,user_id,callsign&limit=10"
req2 = urllib.request.Request(endpoint2, headers={
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
})
try:
    with urllib.request.urlopen(req2) as resp:
        data = json.loads(resp.read().decode())
        print(f"\nCurrent enlistments ({len(data)}):")
        for r in data:
            print(f"  {r['callsign']}: status={r['status']}, user_id={r['user_id']}")
except urllib.error.HTTPError as e:
    print(f"Select error: {e.code}")

