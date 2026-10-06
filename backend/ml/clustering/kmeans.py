import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sqlalchemy import text
from backend.database.connection import engine

def _prepare_user_features():
    query = """
    SELECT user_id, rating
    FROM fact_rating
    """
    df = pd.read_sql(query, engine)
    
    if df.empty:
        return pd.DataFrame(), []
        
    agg = df.groupby('user_id').agg(
        avg_rating=('rating', 'mean'),
        rating_count=('rating', 'count'),
        rating_std=('rating', 'std'),
        rating_max=('rating', 'max'),
        rating_min=('rating', 'min')
    ).reset_index()
    
    agg['rating_std'] = agg['rating_std'].fillna(0)
    agg['rating_range'] = agg['rating_max'] - agg['rating_min']
    
    features = ['avg_rating', 'rating_count', 'rating_std', 'rating_range']
    return agg[['user_id'] + features], features

def _prepare_movie_features():
    query = """
    SELECT f.movie_id, f.rating, m.genres 
    FROM fact_rating f
    JOIN dim_movie m ON f.movie_id = m.movie_id
    """
    df = pd.read_sql(query, engine)
    
    if df.empty:
        return pd.DataFrame(), []
        
    agg = df.groupby('movie_id').agg(
        avg_rating=('rating', 'mean'),
        rating_count=('rating', 'count'),
        rating_std=('rating', 'std')
    ).reset_index()
    agg['rating_std'] = agg['rating_std'].fillna(0)
    
    # Genre features
    genres = df[['movie_id', 'genres']].drop_duplicates()
    genres_exploded = genres.assign(genre=genres['genres'].str.split('|')).explode('genre')
    top_genres = [g for g in genres_exploded['genre'].value_counts().head(10).index.tolist() if g]
    
    genre_map = genres.set_index('movie_id')['genres'].fillna('').to_dict()
    for g in top_genres:
        agg[f'genre_{g}'] = agg['movie_id'].map(lambda mid: 1 if g in genre_map.get(mid, '') else 0)
        
    features = ['avg_rating', 'rating_count', 'rating_std'] + [f'genre_{g}' for g in top_genres]
    return agg, features

def run_kmeans(cluster_type, k, features=None):
    if cluster_type == 'user':
        df, feat_names = _prepare_user_features()
    else:
        df, feat_names = _prepare_movie_features()
        
    if df.empty:
        return {'error': 'No data available'}
        
    X = df[feat_names]
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)
    df['cluster'] = labels
    
    clusters = []
    for c in range(k):
        c_data = df[df['cluster'] == c]
        centroid = {f: round(float(c_data[f].mean()), 2) for f in feat_names}
        stats = {f: round(float(c_data[f].mean()), 2) for f in feat_names}
        detailed_stats = {f: {'mean': round(float(c_data[f].mean()), 2), 'min': round(float(c_data[f].min()), 2), 'max': round(float(c_data[f].max()), 2)} for f in feat_names}
        clusters.append({
            'cluster_id': c,
            'size': int(len(c_data)),
            'centroid': centroid,
            'stats': stats,
            'detailed_stats': detailed_stats,
            'characteristics': f"Cluster {c} ({len(c_data)} items)"
        })
        
    scatter = df.head(500).rename(columns={feat_names[0]: 'x', feat_names[1]: 'y'}).to_dict('records')
    scatter_data = [{'id': r.get('user_id', r.get('movie_id')), 'x': r['x'], 'y': r['y'], 'cluster': r['cluster']} for r in scatter]
    
    return {
        'clusters': clusters,
        'scatter_data': scatter_data,
        'inertia': float(kmeans.inertia_),
        'k': k,
        'type': cluster_type,
        'feature_names': feat_names,
        'total_items': len(df)
    }

def run_elbow(cluster_type, max_k=10):
    if cluster_type == 'user':
        df, feat_names = _prepare_user_features()
    else:
        df, feat_names = _prepare_movie_features()
        
    if df.empty:
        return {'error': 'No data'}
        
    X = df[feat_names]
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    k_values = list(range(2, max_k + 1))
    inertias = []
    for k in k_values:
        model = KMeans(n_clusters=k, random_state=42, n_init=10)
        model.fit(X_scaled)
        inertias.append(float(model.inertia_))
        
    # simple suggested k
    suggested_k = 3 if len(k_values) >= 2 else k_values[0]
        
    return {
        'k_values': k_values,
        'inertias': inertias,
        'suggested_k': suggested_k,
        'type': cluster_type
    }
