# DWM PROJECT CONTEXT — AI HANDOFF & AGENT INSTRUCTION MANUAL
> **BTech IT — Movie Recommendation & Data Warehouse Analytics System**
> **Repository Path:** `C:\Users\Atharva\OneDrive - Vidyalankar Institute of Technology\Documents\DWM Project`
> **Last Verified & Updated:** October 2026

---

## 1. PROJECT OVERVIEW & DOMAIN

This is an academic and enterprise-grade full-stack **Data Warehouse Management (DWM)** project for BTech Information Technology.
It implements a complete end-to-end **Movie Recommendation & Data Warehouse Analytics Platform** leveraging the real **MovieLens ml-latest-small** dataset.

### Core Capabilities:
1. **OLTP (Transactional Layer):** User management, authentication, movie catalog browsing, rating submission, and tagging.
2. **ETL Pipeline:** Extract, clean, transform, and load raw CSV datasets into a dimensional star schema.
3. **OLAP Analytics (Analytical Layer):** Multidimensional data analysis featuring Roll-up, Drill-down, Slice, Dice, and Pivot operations across Time, Movie, User, and Genre dimensions.
4. **Machine Learning & Data Mining:**
   - **Clustering:** K-Means clustering for user segmentation and movie groupings, with dynamic Elbow-method optimal $K$ detection.
   - **Recommendations:** TF-IDF content-based filtering using genres, tags, and similarity matrices, taking into account both historical ratings and real-time app ratings.
5. **Interactive Visualization:** Dynamic multi-chart generation (bar, line, scatter, pie) on operational and analytical datasets.

---

## 2. TECHNOLOGY STACK & ENVIRONMENT

| Layer | Technologies & Libraries |
|---|---|
| **Backend Framework** | Python 3.11, FastAPI, Pydantic, Uvicorn |
| **Database & ORM** | SQLite (`backend/movie_dwm.db`), SQLAlchemy |
| **Data Mining / ML** | Pandas, NumPy, Scikit-learn (TF-IDF, KMeans) |
| **Security & Auth** | JWT (`python-jose`), direct native `bcrypt` (`hashpw`/`checkpw`) |
| **Frontend Framework** | React 18, Vite |
| **Styling & Icons** | Tailwind CSS, Lucide React (`lucide-react`) |
| **Data Visualization** | Recharts |
| **HTTP Client** | Axios (`baseURL: '/api'`) |

### Runtime & Port Configuration:
- **Backend Server:** `http://localhost:8000` (FastAPI + Uvicorn)
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **Frontend Server:** `http://localhost:5173` (Vite Dev Server)
- **Vite Proxy:** Configured in `frontend/vite.config.js` to proxy `/api` requests to `http://localhost:8000`.
- **Python Virtualenv:** `.venv` is in the workspace root (`.venv\Scripts\python.exe`).

---

## 3. DATABASE SCHEMA & DATA WAREHOUSE ARCHITECTURE

Database file: `backend/movie_dwm.db` (SQLite). **CRITICAL: Already populated. DO NOT re-run ETL or delete this database.**

```
                     ┌───────────────┐
                     │   dim_user    │
                     │───────────────│
                     │ PK user_id    │
                     │ total_ratings │
                     │ avg_rating    │
                     └───────┬───────┘
                             │
 ┌───────────────┐           │           ┌───────────────┐
 │   dim_movie   │           │           │   dim_date    │
 │───────────────│           ▼           │───────────────│
 │ PK movie_id   │◄──── fact_rating ────►│ PK date_id    │
 │ title         │      ───────────      │ full_date     │
 │ genres        │      user_id (FK)     │ year, month   │
 └───────────────┘      movie_id (FK)    │ day, quarter  │
                        date_id (FK)     │ day_of_week   │
                        tag_id (FK)      └───────────────┘
                        rating (Float)
                             │
                             ▼
                     ┌───────────────┐
                     │    dim_tag    │
                     │───────────────│
                     │ PK tag_id     │
                     │ tag (unique)  │
                     └───────────────┘
```

### Table Inventory & Verified Row Counts:

| Category | Table Name | Verified Rows | Key Attributes / Notes |
|---|---|---|---|
| **OLTP** | `user` | 3+ | `id`, `username`, `password_hash`, `role`, `created_at` |
| **OLTP** | `movie` | 9,742 | `movie_id`, `title`, `genres`, `imdb_id`, `tmdb_id` |
| **OLTP** | `rating` | 100,836 | `id`, `user_id`, `movie_id`, `rating`, `timestamp` |
| **OLTP** | `tag` | 3,683 | `id`, `user_id`, `movie_id`, `tag`, `timestamp` |
| **OLAP (Dim)** | `dim_movie` | 9,742 | `movie_id`, `title`, `genres` |
| **OLAP (Dim)** | `dim_user` | 610 | `user_id`, `total_ratings`, `avg_rating` |
| **OLAP (Dim)** | `dim_date` | 85,043 | `date_id`, `full_date`, `year`, `month`, `day`, `day_of_week`, `quarter` |
| **OLAP (Dim)** | `dim_tag` | 1,589 | `tag_id`, `tag` (deduplicated tag vocab) |
| **OLAP (Fact)**| `fact_rating` | 102,677 | `id`, `user_id`, `movie_id`, `date_id`, `tag_id`, `rating` |

---

## 4. DIRECTORY & CODEBASE STRUCTURE

```
DWM Project/
├── backend/
│   ├── main.py                     # FastAPI application entry, CORS, router mounts, startup handlers
│   ├── movie_dwm.db                # Primary SQLite database (OLTP + Star Schema)
│   ├── requirements.txt            # Python dependencies
│   ├── database/
│   │   ├── connection.py           # SQLAlchemy Engine, SessionLocal, get_db dependency, init_db
│   │   └── models.py               # ORM declarative models (OLTP & Star Schema tables)
│   ├── routers/
│   │   ├── auth.py                 # JWT login, registration, /me, create_default_admin()
│   │   ├── movies.py               # Movie catalog CRUD, pagination, genre list, filtering
│   │   ├── ratings.py              # Ratings list, personal ratings with titles, aggregate stats
│   │   ├── tags.py                 # Tag search, movie tag listing, popular tags
│   │   ├── dashboard.py            # Admin summary metrics & user personal activity statistics
│   │   ├── etl.py                  # ETL manual execution, warehouse status, dataset profiling
│   │   ├── olap.py                 # Multidimensional OLAP operations & available dimensions
│   │   ├── clustering.py           # K-Means clustering & Elbow curve calculation
│   │   ├── visualizations.py       # Recharts data endpoint & dynamic column schema provider
│   │   └── recommendations.py      # Content-based recommendations & similar movies
│   ├── services/
│   │   └── movie_service.py        # High-performance native SQL queries for movies & stats
│   ├── etl/
│   │   └── pipeline.py             # CSV extract, clean, transform, star schema loader
│   ├── analytics/
│   │   ├── olap/
│   │   │   └── operations.py       # In-memory Fact caching, Roll-up, Drill-down, Slice, Dice, Pivot
│   │   └── visualization/
│   │       └── charts.py           # Recharts-compliant data formatting (x/y coordinate outputs)
│   └── ml/
│       ├── clustering/
│       │   └── kmeans.py           # User & movie feature engineering, KMeans, Elbow method
│       └── recommendation/
│           └── content_based.py    # Cached TF-IDF cosine similarity model
├── data/
│   ├── movies.csv                  # Raw MovieLens movies
│   ├── ratings.csv                 # Raw MovieLens ratings
│   ├── tags.csv                    # Raw MovieLens tags
│   └── links.csv                   # Raw MovieLens IMDB/TMDB link keys
├── frontend/
│   ├── package.json
│   ├── vite.config.js              # Vite server & /api proxy to http://localhost:8000
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── App.jsx                 # Routing configuration & route protection guards
│   │   ├── main.jsx                # React root mount
│   │   ├── api/
│   │   │   └── client.js           # Axios instance (baseURL='/api', Bearer token interceptor)
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx     # User state, login, logout, token persistence
│   │   │   └── ToastContext.jsx    # UI notification banner context
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Layout.jsx      # TopNav + Sidebar wrapper
│   │   │   │   ├── TopNav.jsx      # Header, profile chip, quick logout
│   │   │   │   └── Sidebar.jsx     # Role-based navigation menu (Admin vs User)
│   │   │   └── common/
│   │   │       ├── DataTable.jsx   # Universal flexible table supporting multiple column schemas
│   │   │       ├── LoadingSpinner.jsx
│   │   │       ├── EmptyState.jsx
│   │   │       └── Modal.jsx
│   │   └── pages/
│   │       ├── Login.jsx           # Login view
│   │       ├── Register.jsx        # Registration view
│   │       ├── admin/
│   │       │   ├── Dashboard.jsx        # High-level warehouse KPI cards & distributions
│   │       │   ├── DatasetOverview.jsx  # Summary of raw CSVs & loaded DB tables
│   │       │   ├── ETLPage.jsx          # ETL monitoring, pipeline metrics, stage inspector
│   │       │   ├── OLAPPage.jsx         # Interactive Cube operations (Slice, Dice, Rollup, Pivot)
│   │       │   ├── ClusteringPage.jsx   # KMeans scatter plot, cluster profiles, Elbow chart
│   │       │   ├── VisualizationPage.jsx# Custom chart builder & analytical presets
│   │       │   ├── MoviesPage.jsx       # Admin movie catalog table & editor
│   │       │   ├── RatingsPage.jsx      # Full rating stream with movie title joins
│   │       │   ├── TagsPage.jsx         # Full tag repository viewer
│   │       │   └── SystemPage.jsx       # Health checks, DB size, cache reset, environment info
│   │       └── user/
│   │           ├── UserDashboard.jsx    # User activity stats, recent ratings, recommended preview
│   │           ├── DiscoverPage.jsx     # Filterable movie grid with live search & genres
│   │           ├── RecommendationsPage.jsx # AI personalized recommendations grid
│   │           ├── MyRatingsPage.jsx    # User's submitted ratings with instant edit/delete
│   │           ├── ProfilePage.jsx      # User profile, statistics, rating distribution
│   │           └── MovieDetailPage.jsx  # Single movie details, tags, user rating modal
├── test_all_endpoints.py           # FastAPI TestClient test suite verifying all 27 endpoints
├── test_live_http.py               # Live socket/HTTP test script verifying ports 8000 & 5173
├── test_functions_direct.py        # Direct Python unit test suite for backend services
└── project_context.md              # THIS HANDOFF DOCUMENT
```

---

## 5. COMPLETE API ROUTE SPECIFICATION

Every endpoint below is actively verified working:

### Authentication (`/api/auth`)
| Method | URL | Auth Required | Request Body / Query | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | None | `{"username": str, "password": str}` | Returns `{id, username, role, token}` |
| `POST` | `/api/auth/register` | None | `{"username": str, "password": str, "role": "user"}` | Registers user and returns token |
| `GET` | `/api/auth/me` | Bearer Token | Header: `Authorization: Bearer <token>` | Returns current authenticated user record |

### Movies (`/api/movies`)
| Method | URL | Auth Required | Query Parameters | Description |
|---|---|---|---|---|
| `GET` | `/api/movies/` | None | `page, limit, search, genre, sort_by, min_rating, max_rating` | Paginated movie catalog with `avg_rating`, `rating_count`, `genres_list` |
| `GET` | `/api/movies/genres` | None | None | Returns distinct list of genre strings |
| `GET` | `/api/movies/{movie_id}` | None | Path param: `movie_id` | Returns movie object + ratings array + tags array + avg_rating |
| `POST` | `/api/movies/` | Admin (Bearer) | `{"title": str, "genres": str, "imdb_id"?: str, "tmdb_id"?: str}` | Create new movie |
| `PUT` | `/api/movies/{movie_id}` | Admin (Bearer) | Same as POST | Update movie record |
| `DELETE`| `/api/movies/{movie_id}` | Admin (Bearer) | None | Delete movie record |

*Valid `sort_by` values:* `title_asc`, `title_desc`, `rating_desc`, `rating_asc`, `popular`, `rating_count`.

### Ratings (`/api/ratings`)
| Method | URL | Auth Required | Parameters / Body | Description |
|---|---|---|---|---|
| `GET` | `/api/ratings/` | None | `page, limit, movie_id, user_id` | Paginated ratings list with `movie_title` join |
| `GET` | `/api/ratings/my` | Bearer Token | `page, limit` | Current user's ratings with `movie_title` and `genres` |
| `GET` | `/api/ratings/stats` | None | None | Aggregate `{total_ratings, average_rating}` |
| `POST` | `/api/ratings/` | Bearer Token | `{"movie_id": int, "rating": float}` | Upsert rating (creates or updates existing) |

### Tags (`/api/tags`)
| Method | URL | Auth Required | Parameters | Description |
|---|---|---|---|---|
| `GET` | `/api/tags/` | None | `page, limit, movie_id, tag, search` | Paginated tags with `tag_id`, `movie_title`, and `timestamp` |
| `GET` | `/api/tags/popular`| None | None | Top 20 most frequent tags with occurrence counts |

### Dashboard (`/api/dashboard`)
| Method | URL | Auth Required | Parameters | Description |
|---|---|---|---|---|
| `GET` | `/api/dashboard/stats` | None | None | Admin metrics: counts, rating distribution, genre distribution |
| `GET` | `/api/dashboard/user-stats` | Bearer Token | None | User's rating count, average rating, favorite genre, recent ratings |

### ETL Pipeline (`/api/etl`)
| Method | URL | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/etl/status` | None | Returns pipeline status (`completed`), execution time, and row counts |
| `GET` | `/api/etl/dataset-info` | None | Metadata inspection of raw CSV dataset files |
| `POST` | `/api/etl/run` | Admin (Bearer) | Triggers ETL pipeline. *(NOTE: DB already loaded; do not call unnecessarily)* |

### OLAP Analytical Cube (`/api/olap`)
| Method | URL | Request Payload | Description |
|---|---|---|---|
| `GET` | `/api/olap/dimensions` | None | Returns available dimensions and measures |
| `POST` | `/api/olap/rollup` | `{"dimension": "Time"|"Genre"|"User"|"Movie", "measure": "Average Rating"|"Total Ratings", "hierarchy_level": "Year"|"Month"|"Day"}` | Aggregates data up the dimension hierarchy |
| `POST` | `/api/olap/drilldown`| `{"dimension": str, "measure": str, "hierarchy_level": str, "filter_value"?: str}` | Drills down into lower hierarchy level (e.g. Month for Year 2015) |
| `POST` | `/api/olap/slice` | `{"dimension": "Genre", "value": "Action", "measure": "Average Rating"}` | Filters cube to a single dimension slice |
| `POST` | `/api/olap/dice` | `{"conditions": {"genres": ["Action", "Comedy"]}, "measure": "Average Rating"}` | Filters cube across multi-dimensional criteria |
| `POST` | `/api/olap/pivot` | `{"rows": "Genre", "columns": "Year", "measure": "Average Rating"}` | Cross-tabulates matrix across two dimensions |

### Clustering (`/api/clustering`)
| Method | URL | Request Payload | Description |
|---|---|---|---|
| `POST` | `/api/clustering/kmeans` | `{"type": "user"|"movie", "k": int, "features"?: list[str]}` | Returns cluster assignments, centroids, statistical summaries, scatter sample |
| `POST` | `/api/clustering/elbow` | `{"type": "user"|"movie", "max_k": int}` | Calculates inertia across $k=1 \dots max\_k$ for elbow detection |

### Visualizations (`/api/visualizations`)
| Method | URL | Parameters / Body | Description |
|---|---|---|---|
| `GET` | `/api/visualizations/columns/{dataset}` | Path: `movies` \| `ratings` \| `warehouse` | Returns plottable numerical and categorical column names |
| `POST` | `/api/visualizations/data` | `{"chart_type": "bar"|"line"|"scatter"|"pie", "dataset": str, "x_axis": str, "y_axis": str, "limit"?: int, "filters"?: dict}` | Generates Recharts-ready formatted coordinates |

### Recommendations (`/api/recommendations`)
| Method | URL | Request Payload | Description |
|---|---|---|---|
| `POST` | `/api/recommendations/` | `{"movie_ids"?: list[int], "user_id"?: int, "n"?: int}` | Top-$N$ content-based recommendations based on seed movies or user history |
| `GET` | `/api/recommendations/similar/{movie_id}` | Path param: `movie_id` | Top similar movies based on TF-IDF cosine distance |

### Health & System
| Method | URL | Description |
|---|---|---|
| `GET` | `/` | API status metadata, documentation link, and version |
| `GET` | `/api/health` | Returns `{"status": "ok"}` |

---

## 6. AUTHENTICATION & SECURITY RULES

1. **Default Administrator Account:**
   - **Username:** `admin`
   - **Password:** `admin123`
   - Initialized automatically on startup via `create_default_admin()` in `backend/routers/auth.py`.
2. **Password Hashing:**
   - Directly implemented with `bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())` and `bcrypt.checkpw(...)`.
   - **DO NOT** re-introduce the `passlib.context.CryptContext` wrapper (which caused 72-byte string errors and library incompatibilities with bcrypt 4.x).
3. **Frontend Token Storage:**
   - JWT token stored in `localStorage.getItem('token')`.
   - User profile stored in `localStorage.getItem('user')`.
   - `frontend/src/api/client.js` uses an Axios request interceptor that injects `Authorization: Bearer <token>`.
   - If backend returns `401 Unauthorized`, `client.js` automatically clears localStorage and redirects to `/`.

---

## 7. ALGORITHMS & IMPLEMENTATION DETAILS

### A. Movie Service Fast Path vs. Rating Path (`backend/services/movie_service.py`)
- **Fast Path:** Used when sorting by title or ID with no rating filter. Queries the `movie` table with `LIMIT`/`OFFSET`, then fetches batch statistics (`avg_rating`, `rating_count`) for just those 20 movies using `SELECT movie_id, AVG(rating), COUNT(id) FROM rating WHERE movie_id IN (...) GROUP BY movie_id`.
- **Rating Path:** Used when filtering by `min_rating`, `max_rating`, or sorting by `rating_desc`/`popular`. Executes a single SQL query joining `movie` with an aggregated rating subquery, preventing N+1 queries.
- Returns clean split genres: `genres` string (`"Action|Sci-Fi"`) and `genres_list` array (`["Action", "Sci-Fi"]`).

### B. Content-Based Recommender (`backend/ml/recommendation/content_based.py`)
- **In-Memory Cache:** `_cache` dictionary caches the Scikit-learn `TfidfVectorizer` and TF-IDF feature matrix computed from `dim_movie.genres` and `dim_tag.tag`.
- **Vector Cosine Similarity:** Calculates similarity between query vectors and the matrix, filtering out already-watched/rated movie IDs.
- **Dual Table Lookup:** Inspects ratings from both the registered `rating` table and historical `fact_rating` to ensure new users receive instant dynamic recommendations upon submitting their first rating.

### C. OLAP Analytical Operations (`backend/analytics/olap/operations.py`)
- **Fact Table Cache:** Uses a globally cached Pandas DataFrame `_FACT_DF` created from `fact_rating` joined with `dim_movie` and `dim_date`.
- **Operations:**
  - `rollup`: Groups by dimension hierarchy (e.g. Year) and applies aggregate functions (`mean` for rating, `count` for volume).
  - `drilldown`: Filters by parent hierarchy level (e.g., `Year == '2015'`) and aggregates by child level (e.g., `Month`).
  - `slice_op`: Filters by single dimension criteria.
  - `dice`: Multi-attribute conditional masking across dimensions.
  - `pivot`: Cross-tabulates matrix using `pd.pivot_table`.

### D. K-Means Clustering (`backend/ml/clustering/kmeans.py`)
- **User Segmentation:** Features engineered per user: `[avg_rating, total_ratings, rating_std, rating_range]`.
- **Movie Segmentation:** Features engineered per movie: `[avg_rating, rating_count, rating_std]` combined with one-hot encoded top 10 genre frequency indicators.
- **Performance:** O(N) vectorized feature extraction; centroids and detailed statistical distributions calculated per cluster for visualization.

---

## 8. FRONTEND ROUTING & UI CONVENTIONS

### React Router (`frontend/src/App.jsx`):
- `/` -> Login page (or redirects to `/admin` or `/user` if authenticated).
- `/register` -> Registration page.
- `/admin/*` (Protected by `AuthRoute`):
  - `/admin` -> `AdminDashboard`
  - `/admin/dataset` -> `DatasetOverview`
  - `/admin/etl` -> `ETLPage`
  - `/admin/olap` -> `OLAPPage`
  - `/admin/clustering` -> `ClusteringPage`
  - `/admin/visualization` -> `VisualizationPage`
  - `/admin/movies` -> `MoviesPage`
  - `/admin/ratings` -> `RatingsPage`
  - `/admin/tags` -> `TagsPage`
  - `/admin/system` -> `SystemPage`
- `/user/*` (Protected by `AuthRoute`):
  - `/user` -> `UserDashboard`
  - `/user/discover` -> `DiscoverPage`
  - `/user/recommendations` -> `RecommendationsPage`
  - `/user/my-ratings` -> `MyRatingsPage`
  - `/user/ratings` -> Alias redirecting to `/user/my-ratings`
  - `/user/profile` -> `ProfilePage`
  - `/user/movie/:id` -> `MovieDetailPage`

### Key Frontend Components:
- **`frontend/src/components/common/DataTable.jsx`**:
  - Resilient table component supporting column configurations: `{header, accessor}`, `{label, key, render}`, or `{cell}`.
  - Automatically joins array values with commas.
- **Axios Client (`frontend/src/api/client.js`)**:
  - `baseURL` is set to `/api`.
  - In frontend components, make requests to relative paths like `client.get('/movies/')` or `client.get('/dashboard/stats')`. **DO NOT prefix with `/api` again** (e.g., avoid `/api/movies/` in frontend code to prevent `/api/api/movies/` proxy failures).

---

## 9. HOW TO RUN, DEVELOP, AND TEST

### 1. Start the Backend:
Open PowerShell in the workspace root:
```powershell
.venv\Scripts\uvicorn.exe backend.main:app --reload --host 0.0.0.0 --port 8000
```
Swagger UI: `http://localhost:8000/docs`

### 2. Start the Frontend:
In a separate terminal:
```powershell
cd "frontend"
npm run dev
```
Application UI: `http://localhost:5173`

### 3. Verify Full Frontend Production Build:
```powershell
cd "frontend"
npm run build
```

### 4. Run Backend Test Suites:
```powershell
# 1. Direct Python service & router unit tests (Recommended, covers all 27 functions without needing HTTP server):
.venv\Scripts\python.exe test_functions_direct.py

# 2. Live HTTP network test (verifies running uvicorn & Vite proxy over real sockets):
.venv\Scripts\python.exe test_live_http.py

# Note: test_all_endpoints.py uses FastAPI's TestClient which requires `httpx`.
```

---

## 10. CRITICAL INVARIANTS & AGENT RULES

When working on this codebase in future sessions, all AI agents **MUST** follow these rules:

1. **NEVER DELETE OR OVERWRITE `backend/movie_dwm.db`:**
   The SQLite database contains real pre-computed star schema tables and 100k+ MovieLens records. Do not drop tables or run destructive migrations.
2. **NEVER RUN `POST /api/etl/run` IN AUTOMATED SCRIPTS:**
   The ETL pipeline is resource-intensive and will rebuild warehouse tables from CSVs. The database is already in a fully operational state.
3. **NEVER USE MOCK OR FAKE DATA:**
   All components, charts, and API endpoints must query real database tables and return actual calculated statistics.
4. **DO NOT RECREATE THE VIRTUAL ENVIRONMENT:**
   Use the existing virtualenv at `.venv\Scripts\python.exe`.
5. **FRONTEND API PATH RULE:**
   Because Axios `baseURL` is `/api` and Vite proxies `/api` to port 8000, call `client.get('/movies/')` in React components, **never** `client.get('/api/movies/')`.
6. **PRESERVE NATIVE BCRYPT IMPLEMENTATION:**
   Do not introduce `passlib` for password verification. Use Python's built-in `bcrypt` module.
7. **TIMESTAMP RENDERING:**
   MovieLens timestamps are Unix epoch seconds. When rendering in React, always multiply by 1000: `new Date(timestamp * 1000).toLocaleDateString()`.
