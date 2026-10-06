from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.connection import init_db
from backend.routers import auth, movies, ratings, tags, dashboard, etl, olap, clustering, visualizations, recommendations

app = FastAPI(
    title='MovieDWM API',
    description='Movie Recommendation & Data Warehouse Analytics System',
    version='1.0.0'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://localhost:3000'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth.router, prefix='/api/auth', tags=['Authentication'])
app.include_router(movies.router, prefix='/api/movies', tags=['Movies'])
app.include_router(ratings.router, prefix='/api/ratings', tags=['Ratings'])
app.include_router(tags.router, prefix='/api/tags', tags=['Tags'])
app.include_router(dashboard.router, prefix='/api/dashboard', tags=['Dashboard'])
app.include_router(etl.router, prefix='/api/etl', tags=['ETL'])
app.include_router(olap.router, prefix='/api/olap', tags=['OLAP'])
app.include_router(clustering.router, prefix='/api/clustering', tags=['Clustering'])
app.include_router(visualizations.router, prefix='/api/visualizations', tags=['Visualizations'])
app.include_router(recommendations.router, prefix='/api/recommendations', tags=['Recommendations'])

@app.on_event('startup')
def startup():
    init_db()
    # Create default admin user (router-level @on_event doesn't fire)
    from backend.routers.auth import create_default_admin
    create_default_admin()

@app.get('/')
def root():
    return {
        'status': 'online',
        'message': 'MovieDWM API is running',
        'version': '1.0.0',
        'docs_url': '/docs',
        'health_url': '/api/health'
    }

@app.get('/api/health')
def health():
    return {'status': 'ok'}

