import sys
from fastapi.testclient import TestClient

try:
    from backend.main import app
    from backend.database.connection import SessionLocal
    from backend.database.models import User
    from backend.routers.auth import get_password_hash, create_default_admin

    create_default_admin()
    client = TestClient(app)
    print("TestClient initialized successfully")
except ImportError as e:
    print(f"Direct import/TestClient error: {e}")
    sys.exit(1)

def run_tests():
    passed = 0
    failed = 0

    def check(name, resp, expected_status=200):
        nonlocal passed, failed
        if resp.status_code == expected_status:
            print(f"[PASS] {name} (Status: {resp.status_code})")
            passed += 1
            return resp.json()
        else:
            print(f"[FAIL] {name} (Expected {expected_status}, got {resp.status_code}): {resp.text[:200]}")
            failed += 1
            return None

    # 1. Auth Login
    login_res = check("POST /api/auth/login", client.post("/api/auth/login", json={"username": "admin", "password": "admin123"}))
    token = login_res.get("token") if login_res else None
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    # 2. Auth Me
    check("GET /api/auth/me", client.get("/api/auth/me", headers=headers))

    # 3. Movies
    check("GET /api/movies/", client.get("/api/movies/?page=1&limit=5&sort_by=popular"))
    check("GET /api/movies/genres", client.get("/api/movies/genres"))
    check("GET /api/movies/1", client.get("/api/movies/1"))

    # 4. Ratings
    check("GET /api/ratings/", client.get("/api/ratings/?page=1&limit=5"))
    check("GET /api/ratings/my", client.get("/api/ratings/my", headers=headers))
    check("GET /api/ratings/stats", client.get("/api/ratings/stats"))

    # 5. Tags
    check("GET /api/tags/", client.get("/api/tags/?page=1&limit=5"))
    check("GET /api/tags/popular", client.get("/api/tags/popular"))

    # 6. Dashboard
    check("GET /api/dashboard/stats", client.get("/api/dashboard/stats"))
    check("GET /api/dashboard/user-stats", client.get("/api/dashboard/user-stats", headers=headers))

    # 7. ETL
    check("GET /api/etl/status", client.get("/api/etl/status"))
    check("GET /api/etl/dataset-info", client.get("/api/etl/dataset-info"))

    # 8. OLAP
    check("GET /api/olap/dimensions", client.get("/api/olap/dimensions"))
    check("POST /api/olap/rollup", client.post("/api/olap/rollup", json={"dimension": "Time", "measure": "Average Rating", "hierarchy_level": "Year"}))
    check("POST /api/olap/drilldown", client.post("/api/olap/drilldown", json={"dimension": "Time", "measure": "Average Rating", "hierarchy_level": "Month", "filter_value": "2015"}))
    check("POST /api/olap/slice", client.post("/api/olap/slice", json={"dimension": "Genre", "value": "Action", "measure": "Average Rating"}))
    check("POST /api/olap/dice", client.post("/api/olap/dice", json={"conditions": {"genres": ["Action"]}, "measure": "Average Rating"}))
    check("POST /api/olap/pivot", client.post("/api/olap/pivot", json={"rows": "Genre", "columns": "Year", "measure": "Average Rating"}))

    # 9. Clustering
    check("POST /api/clustering/kmeans", client.post("/api/clustering/kmeans", json={"type": "user", "k": 3}))
    check("POST /api/clustering/elbow", client.post("/api/clustering/elbow", json={"type": "user", "max_k": 5}))

    # 10. Visualizations
    check("GET /api/visualizations/columns/movies", client.get("/api/visualizations/columns/movies"))
    check("POST /api/visualizations/data", client.post("/api/visualizations/data", json={"chart_type": "bar", "dataset": "movies", "x_axis": "genre", "y_axis": "count", "limit": 10}))

    # 11. Recommendations
    check("POST /api/recommendations/", client.post("/api/recommendations/", json={"movie_ids": [1, 2], "n": 4}))
    check("GET /api/recommendations/similar/1", client.get("/api/recommendations/similar/1"))

    print(f"\n==========================================")
    print(f"TEST SUMMARY: {passed} PASSED, {failed} FAILED")
    print(f"==========================================")

if __name__ == "__main__":
    run_tests()
