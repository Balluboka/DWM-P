import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import text
from backend.database.connection import engine

_cache = {}

def _build_feature_matrix():
    if "data" not in _cache:
        movies = pd.read_sql("SELECT movie_id, title, genres FROM dim_movie", engine)
        tags_df = pd.read_sql("SELECT movie_id, tag FROM dim_tag JOIN fact_rating ON dim_tag.tag_id = fact_rating.tag_id", engine)
        
        if movies.empty:
            return pd.DataFrame(), None, {}
            
        if not tags_df.empty:
            tags_grouped = tags_df.groupby('movie_id')['tag'].apply(lambda x: ' '.join(x.astype(str))).reset_index()
            movies = pd.merge(movies, tags_grouped, on='movie_id', how='left')
            movies['tag'] = movies['tag'].fillna('')
        else:
            movies['tag'] = ''
            
        movies['features'] = movies['genres'].str.replace('|', ' ', regex=False) + ' ' + movies['tag']
        
        tfidf = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf.fit_transform(movies['features'])
        id_to_idx = {int(mid): idx for idx, mid in enumerate(movies['movie_id'])}
        _cache["data"] = (movies, tfidf_matrix, id_to_idx)
        
    return _cache["data"]

def get_recommendations(movie_ids=None, user_id=None, n=10):
    movies, tfidf_matrix, id_to_idx = _build_feature_matrix()
    if movies.empty or tfidf_matrix is None:
        return []
        
    if user_id:
        # Get user's top rated movies from both rating and fact_rating
        user_ratings = pd.read_sql(
            text(
                "SELECT movie_id, rating FROM rating WHERE user_id = :uid "
                "UNION "
                "SELECT movie_id, rating FROM fact_rating WHERE user_id = :uid "
                "ORDER BY rating DESC LIMIT 5"
            ),
            engine,
            params={"uid": user_id}
        )
        if user_ratings.empty:
            top_movies = pd.read_sql(
                text(
                    "SELECT movie_id FROM fact_rating "
                    "GROUP BY movie_id HAVING COUNT(rating) >= 15 "
                    "ORDER BY AVG(rating) DESC LIMIT 5"
                ),
                engine
            )
            if not top_movies.empty:
                target_ids = top_movies['movie_id'].tolist()
                reason = 'Trending & top-rated movies (rate more movies for personalized picks!)'
            else:
                return []
        else:
            target_ids = user_ratings['movie_id'].tolist()
            reason = 'Recommended based on your highly rated movies'
    else:
        if not movie_ids:
            top_movies = pd.read_sql(
                text(
                    "SELECT movie_id FROM fact_rating "
                    "GROUP BY movie_id HAVING COUNT(rating) >= 15 "
                    "ORDER BY AVG(rating) DESC LIMIT 5"
                ),
                engine
            )
            if not top_movies.empty:
                target_ids = top_movies['movie_id'].tolist()
                reason = 'Popular movies across all viewers'
            else:
                return []
        else:
            target_ids = movie_ids
            reason = 'Similar to selected movies based on genres and tags'
        
    valid_indices = [id_to_idx[int(mid)] for mid in target_ids if int(mid) in id_to_idx]
    if not valid_indices:
        return []
        
    target_vecs = tfidf_matrix[valid_indices]
    sims = cosine_similarity(target_vecs, tfidf_matrix)
    sim_scores = sims.mean(axis=0)
    
    top_indices = sim_scores.argsort()[::-1]
    input_set = set(int(mid) for mid in target_ids)
    top_indices = [idx for idx in top_indices if int(movies.iloc[idx]['movie_id']) not in input_set][:n]
    
    # Query genuine average ratings for top recommended movies
    rec_movie_ids = [int(movies.iloc[idx]['movie_id']) for idx in top_indices]
    rating_map = {}
    if rec_movie_ids:
        ph = ','.join(map(str, rec_movie_ids))
        with engine.connect() as conn:
            rows = conn.execute(text(f"SELECT movie_id, AVG(rating) FROM rating WHERE movie_id IN ({ph}) GROUP BY movie_id")).fetchall()
            rating_map = {r[0]: round(float(r[1]), 2) for r in rows}
            
    results = []
    for idx in top_indices:
        row = movies.iloc[idx]
        mid = int(row['movie_id'])
        genres_val = row['genres']
        g_list = [g.strip() for g in str(genres_val).split('|') if g.strip()] if genres_val else []
        results.append({
            'movie_id': mid,
            'title': str(row['title']),
            'genres': g_list,
            'avg_rating': rating_map.get(mid, 0.0),
            'score': round(float(sim_scores[idx]), 3),
            'reason': reason
        })
        
    return results

def get_similar_movies(movie_id, n=10):
    return get_recommendations(movie_ids=[movie_id], n=n)
