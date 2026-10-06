import json
from backend.database.connection import SessionLocal
from backend.routers.auth import create_default_admin, login, UserLogin
from backend.routers.dashboard import dashboard_stats, user_stats
from backend.routers.movies import read_movies, read_movie_detail, read_genres
from backend.routers.ratings import get_ratings, get_my_ratings, get_rating_stats
from backend.routers.tags import get_tags, get_popular_tags
from backend.routers.etl import get_etl_status, dataset_info
from backend.routers.olap import perform_rollup, perform_drilldown, perform_slice, perform_dice, perform_pivot, get_dimensions
from backend.routers.olap import RollupRequest, DrilldownRequest, SliceRequest, DiceRequest, PivotRequest
from backend.routers.clustering import perform_kmeans, perform_elbow, KMeansRequest, ElbowRequest
from backend.routers.visualizations import fetch_chart_data, fetch_columns, ChartDataRequest
from backend.routers.recommendations import fetch_recommendations, fetch_similar_movies, RecommendationRequest
from backend.database.models import User

create_default_admin()
db = SessionLocal()

passed = 0
failed = 0

def test(name, fn, *args, **kwargs):
    global passed, failed
    try:
        res = fn(*args, **kwargs)
        print(f"[PASS] {name} -> result type: {type(res).__name__}")
        passed += 1
        return res
    except Exception as e:
        print(f"[FAIL] {name} -> Error: {e}")
        failed += 1
        return None

admin_user = db.query(User).filter(User.username == "admin").first()

print("\n--- AUTH & USER TESTS ---")
login_resp = test("login", login, UserLogin(username="admin", password="admin123"), db=db)
test("dashboard_stats", dashboard_stats, db=db)
test("user_stats", user_stats, current_user=admin_user, db=db)

print("\n--- MOVIES & RATINGS & TAGS TESTS ---")
test("read_movies (popular)", read_movies, page=1, limit=5, sort_by="popular", db=db)
test("read_genres", read_genres, db=db)
test("read_movie_detail (id=1)", read_movie_detail, movie_id=1, db=db)
test("get_ratings", get_ratings, page=1, limit=5, db=db)
test("get_my_ratings", get_my_ratings, db=db, current_user=admin_user)
test("get_rating_stats", get_rating_stats, db=db)
test("get_tags", get_tags, page=1, limit=5, db=db)
test("get_popular_tags", get_popular_tags, db=db)

print("\n--- ETL TESTS ---")
status_res = test("get_etl_status", get_etl_status)
if status_res:
    print(f"       ETL Status: {status_res.get('status')}")
test("dataset_info", dataset_info)

print("\n--- OLAP TESTS ---")
test("get_dimensions", get_dimensions)
test("perform_rollup", perform_rollup, RollupRequest(dimension="Time", measure="Average Rating", hierarchy_level="Year"))
test("perform_drilldown", perform_drilldown, DrilldownRequest(dimension="Time", measure="Average Rating", hierarchy_level="Month", filter_value="2015"))
test("perform_slice", perform_slice, SliceRequest(dimension="Genre", value="Action", measure="Average Rating"))
test("perform_dice", perform_dice, DiceRequest(conditions={"genres": ["Action"]}, measure="Average Rating"))
test("perform_pivot", perform_pivot, PivotRequest(rows="Genre", columns="Year", measure="Average Rating"))

print("\n--- CLUSTERING TESTS ---")
test("perform_kmeans (user, k=3)", perform_kmeans, KMeansRequest(type="user", k=3))
test("perform_kmeans (movie, k=3)", perform_kmeans, KMeansRequest(type="movie", k=3))
test("perform_elbow", perform_elbow, ElbowRequest(type="user", max_k=4))

print("\n--- VISUALIZATION TESTS ---")
test("fetch_columns (movies)", fetch_columns, dataset="movies")
test("fetch_chart_data (movies genre count)", fetch_chart_data, ChartDataRequest(chart_type="bar", dataset="movies", x_axis="genre", y_axis="count", limit=10))

print("\n--- RECOMMENDATIONS TESTS ---")
test("fetch_recommendations (movie_ids=[1])", fetch_recommendations, RecommendationRequest(movie_ids=[1], n=4))
test("fetch_recommendations (user_id=admin)", fetch_recommendations, RecommendationRequest(user_id=admin_user.id, n=4))
test("fetch_similar_movies (id=1)", fetch_similar_movies, movie_id=1)

db.close()

print(f"\n==========================================")
print(f"TEST SUMMARY: {passed} PASSED, {failed} FAILED")
print(f"==========================================")
