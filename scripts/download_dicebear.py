import urllib.request
import os

os.makedirs("assets/images/avatars", exist_ok=True)
for i in range(1, 11):
    url = f"https://api.dicebear.com/9.x/bottts/svg?seed=SpaceExplorer{i}&backgroundColor=050a18"
    print(f"Downloading {url}...")
    try:
        urllib.request.urlretrieve(url, f"assets/images/avatars/avatar_{i}.svg")
    except Exception as e:
        print(f"Failed to download {i}: {e}")
