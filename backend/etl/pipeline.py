import os, time
import pandas as pd
import numpy as np
from sqlalchemy import text
from backend.database.connection import engine, SessionLocal

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data')

def get_dataset_info():
    files = ['movies.csv', 'ratings.csv', 'tags.csv', 'links.csv']
    info = []
    for f in files:
        path = os.path.join(DATA_DIR, f)
        if os.path.exists(path):
            df = pd.read_csv(path)
            dtypes_dict = {k: str(v) for k, v in df.dtypes.items()}
            int_count = sum(1 for v in dtypes_dict.values() if 'int' in v)
            float_count = sum(1 for v in dtypes_dict.values() if 'float' in v)
            obj_count = sum(1 for v in dtypes_dict.values() if 'object' in v or 'str' in v)
            other_count = len(dtypes_dict) - (int_count + float_count + obj_count)

            info.append({
                'name': f,
                'exists': True,
                'rows': len(df),
                'columns': len(df.columns),
                'column_names': list(df.columns),
                'dtypes': dtypes_dict,
                'column_type_counts': {
                    'int': int_count,
                    'float': float_count,
                    'object': obj_count,
                    'other': other_count
                },
                'missing_values': df.isnull().sum().to_dict(),
                'duplicates': int(df.duplicated().sum()),
                'sample': df.head(25).fillna('').to_dict('records'),
                'statistics': df.describe().fillna(0).to_dict()
            })
        else:
            info.append({'name': f, 'exists': False})
    return info

def extract():
    files = ['movies.csv', 'ratings.csv', 'tags.csv', 'links.csv']
    data = {}
    stats = {}
    for f in files:
        path = os.path.join(DATA_DIR, f)
        name = f.split('.')[0]
        if os.path.exists(path):
            df = pd.read_csv(path)
            data[name] = df
            stat_obj = {
                'rows': len(df),
                'cols': len(df.columns),
                'row_count': len(df),
                'column_count': len(df.columns),
                'dtypes': {k: str(v) for k, v in df.dtypes.items()}
            }
            stats[f] = stat_obj
            stats[name] = stat_obj
        else:
            stats[f] = {'error': 'File not found'}
    return {'data': data, 'stats': stats}


def clean(data: dict):
    stats = {}
    dfs = data['data']
    cleaned_dfs = {}
    
    for name, df in dfs.items():
        rows_before = len(df)
        missing_before = df.isnull().sum().sum()
        df = df.copy()
        
        if name == 'movies':
            df['genres'] = df['genres'].fillna('Unknown')
        elif name == 'ratings':
            df = df.dropna(subset=['rating'])
            df = df.drop_duplicates(subset=['userId', 'movieId'], keep='last')
            df['movieId'] = df['movieId'].astype(int)
            df['userId'] = df['userId'].astype(int)
            df['rating'] = df['rating'].astype(float)
            df['timestamp'] = df['timestamp'].astype(int)
        elif name == 'tags':
            df['tag'] = df['tag'].fillna('')
        elif name == 'links':
            df['imdbId'] = df['imdbId'].fillna('')
            df['tmdbId'] = df['tmdbId'].fillna('')
            
        duplicates_removed = rows_before - len(df)
        missing_after = df.isnull().sum().sum()
        cleaned_dfs[name] = df
        
        stats[name] = {
            'missing_before': int(missing_before),
            'missing_after': int(missing_after),
            'duplicates_found': int(duplicates_removed),
            'duplicates_removed': int(duplicates_removed),
            'rows_before': rows_before,
            'rows_after': len(df)
        }
    return {'data': cleaned_dfs, 'stats': stats}

def transform(data: dict):
    dfs = data['data']
    stats = {}
    
    if 'ratings' in dfs:
        ratings = dfs['ratings']
        ratings['date'] = pd.to_datetime(ratings['timestamp'], unit='s')
        ratings['year'] = ratings['date'].dt.year
        ratings['month'] = ratings['date'].dt.month
        ratings['day'] = ratings['date'].dt.day
        ratings['day_of_week'] = ratings['date'].dt.dayofweek
        ratings['quarter'] = ratings['date'].dt.quarter
        
        movie_stats = ratings.groupby('movieId').agg(
            avg_rating=('rating', 'mean'),
            rating_count=('rating', 'count'),
            rating_std=('rating', 'std')
        ).reset_index()
        
        user_stats = ratings.groupby('userId').agg(
            avg_rating=('rating', 'mean'),
            rating_count=('rating', 'count'),
            rating_std=('rating', 'std')
        ).reset_index()
        dfs['movie_stats'] = movie_stats
        dfs['user_stats'] = user_stats
        
    if 'movies' in dfs and 'movie_stats' in dfs:
        dfs['movies'] = pd.merge(dfs['movies'], dfs['movie_stats'], on='movieId', how='left')
        
    if 'movies' in dfs:
        genres_series = dfs['movies']['genres'].str.split('|').explode().unique()
        dfs['unique_genres'] = list(genres_series)
        
    if 'ratings' in dfs:
        unique_dates = ratings[['date', 'year', 'month', 'day', 'day_of_week', 'quarter']].drop_duplicates()
        unique_dates = unique_dates.reset_index(drop=True)
        unique_dates['date_id'] = unique_dates.index + 1
        unique_dates['full_date'] = unique_dates['date'].astype(str)
        dfs['unique_dates'] = unique_dates
        
        dfs['ratings'] = pd.merge(ratings, unique_dates[['date', 'date_id']], on='date', how='left')
        
    if 'tags' in dfs:
        unique_tags = dfs['tags'][['tag']].drop_duplicates().reset_index(drop=True)
        unique_tags['tag_id'] = unique_tags.index + 1
        dfs['unique_tags'] = unique_tags
        dfs['tags'] = pd.merge(dfs['tags'], unique_tags, on='tag', how='left')

    transform_steps = [
        "Date dimension parsed (year, month, day, quarter, day of week)",
        "Aggregated movie statistics calculated (mean, count, std)",
        "Aggregated user statistics calculated (mean, count, std)",
        "Unique genres extracted and normalized",
        "Unique dates and tags dimension tables created",
        "Star schema surrogate keys generated"
    ]
    return {'data': dfs, 'stats': transform_steps}


def load(data: dict):
    dfs = data['data']
    stats = {}
    
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM fact_rating"))
        conn.execute(text("DELETE FROM dim_movie"))
        conn.execute(text("DELETE FROM dim_user"))
        conn.execute(text("DELETE FROM dim_date"))
        conn.execute(text("DELETE FROM dim_tag"))
        conn.execute(text("DELETE FROM movie"))
        conn.execute(text("DELETE FROM rating"))
        conn.execute(text("DELETE FROM tag"))
        
    if 'movies' in dfs:
        movies_df = dfs['movies'][['movieId', 'title', 'genres']].rename(columns={'movieId': 'movie_id'})
        movies_df.to_sql('dim_movie', engine, if_exists='append', index=False)
        movies_df.to_sql('movie', engine, if_exists='append', index=False)
        stats['movies'] = len(movies_df)
        
    if 'user_stats' in dfs:
        user_df = dfs['user_stats'][['userId', 'rating_count', 'avg_rating']].rename(
            columns={'userId': 'user_id', 'rating_count': 'total_ratings'})
        user_df.to_sql('dim_user', engine, if_exists='append', index=False)
        stats['users'] = len(user_df)
        
    if 'unique_dates' in dfs:
        dates_df = dfs['unique_dates'][['date_id', 'full_date', 'year', 'month', 'day', 'day_of_week', 'quarter']]
        dates_df.to_sql('dim_date', engine, if_exists='append', index=False)
        stats['dates'] = len(dates_df)
        
    if 'unique_tags' in dfs:
        tags_df = dfs['unique_tags']
        tags_df.to_sql('dim_tag', engine, if_exists='append', index=False)
        stats['tags'] = len(tags_df)
        
    if 'ratings' in dfs:
        ratings_df = dfs['ratings'][['userId', 'movieId', 'rating', 'timestamp']].rename(
            columns={'userId': 'user_id', 'movieId': 'movie_id'})
        ratings_df.to_sql('rating', engine, if_exists='append', index=False)
        
        fact_df = dfs['ratings'][['userId', 'movieId', 'date_id', 'rating']].rename(
            columns={'userId': 'user_id', 'movieId': 'movie_id'})
        if 'tags' in dfs:
            tag_merge = dfs['tags'][['userId', 'movieId', 'tag_id']].rename(columns={'userId': 'user_id', 'movieId': 'movie_id'})
            fact_df = pd.merge(fact_df, tag_merge, on=['user_id', 'movie_id'], how='left')
        else:
            fact_df['tag_id'] = None
        fact_df.to_sql('fact_rating', engine, if_exists='append', index=False)
        stats['ratings'] = len(ratings_df)
        stats['fact_rating'] = len(fact_df)
        
    if 'tags' in dfs:
        tags_op = dfs['tags'][['userId', 'movieId', 'tag', 'timestamp']].rename(
            columns={'userId': 'user_id', 'movieId': 'movie_id'})
        tags_op.to_sql('tag', engine, if_exists='append', index=False)
        stats['tags_op'] = len(tags_op)

    return stats

def run_etl_pipeline():
    try:
        start_time = time.time()
        extracted = extract()
        cleaned = clean(extracted)
        transformed = transform(cleaned)
        load_stats = load(transformed)
        end_time = time.time()
        
        return {
            'status': 'success',
            'execution_time': end_time - start_time,
            'extract_stats': extracted['stats'],
            'clean_stats': cleaned['stats'],
            'transform_stats': transformed['stats'],
            'load_stats': load_stats
        }
    except Exception as e:
        return {'status': 'error', 'error': str(e)}
