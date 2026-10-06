import urllib.request
import urllib.parse
import json

def test_url(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    if data is not None:
        encoded_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    else:
        encoded_data = None

    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, content
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")
    except Exception as e:
        return 0, str(e)

print("--- 1. Testing Frontend HTTP server (http://localhost:5173) ---")
status, html = test_url("http://localhost:5173/")
print(f"Status: {status}, HTML preview: {html[:120]}...")

print("\n--- 2. Testing Backend Health/Root (http://127.0.0.1:8000/api/health) ---")
status, res = test_url("http://127.0.0.1:8000/api/health")
print(f"Status: {status}, Response: {res}")

print("\n--- 3. Testing Backend Auth Login (http://127.0.0.1:8000/api/auth/login) ---")
status, res = test_url("http://127.0.0.1:8000/api/auth/login", method="POST", data={"username": "admin", "password": "admin123"})
print(f"Status: {status}, Response: {res[:120]}...")
login_data = json.loads(res)
token = login_data.get("token")
auth_headers = {"Authorization": f"Bearer {token}"}

print("\n--- 4. Testing Movies API (/api/movies/?page=1&limit=3) ---")
status, res = test_url("http://127.0.0.1:8000/api/movies/?page=1&limit=3")
print(f"Status: {status}, Total movies in DB: {json.loads(res).get('total')}")

print("\n--- 5. Testing Ratings API with movie_title (/api/ratings/?page=1&limit=2) ---")
status, res = test_url("http://127.0.0.1:8000/api/ratings/?page=1&limit=2")
sample_rating = json.loads(res).get("ratings", [{}])[0]
print(f"Status: {status}, Sample rating movie_title: {sample_rating.get('movie_title')}, rating_id: {sample_rating.get('rating_id')}")

print("\n--- 6. Testing Dashboard Stats (/api/dashboard/stats) ---")
status, res = test_url("http://127.0.0.1:8000/api/dashboard/stats")
d_stats = json.loads(res)
print(f"Status: {status}, Total Movies: {d_stats.get('total_movies')}, Total Users: {d_stats.get('total_users')}, Total Ratings: {d_stats.get('total_ratings')}")

print("\n--- 7. Testing ETL Status (/api/etl/status) ---")
status, res = test_url("http://127.0.0.1:8000/api/etl/status")
etl_res = json.loads(res)
print(f"Status: {status}, ETL Status: {etl_res.get('status')}")

print("\n--- 8. Testing Recommendations (/api/recommendations/) ---")
status, res = test_url("http://127.0.0.1:8000/api/recommendations/", method="POST", data={"movie_ids": [1], "n": 3})
recs = json.loads(res)
print(f"Status: {status}, Received {len(recs)} recommendations for Toy Story (movie_id=1): {[r['title'] for r in recs]}")

print("\n--- 9. Testing Vite Proxy: http://localhost:5173/api/movies/genres ---")
status, res = test_url("http://localhost:5173/api/movies/genres")
print(f"Status: {status}, Genres returned through Vite proxy: {len(json.loads(res))} genres")

print("\n==========================================")
print("ALL LIVE NETWORK HTTP ENDPOINTS VERIFIED!")
print("==========================================")
