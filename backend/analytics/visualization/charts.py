import pandas as pd
from sqlalchemy import text
from backend.database.connection import engine

def get_chart_data(chart_type, dataset, x_axis, y_axis, filters=None, limit=20):
    limit = max(1, min(limit or 20, 500))
    x_lower = (x_axis or 'x').lower().strip()
    y_lower = (y_axis or 'y').lower().strip()
    
    # Fast path for popular presets
    if dataset == 'movies' and x_lower in ['genre', 'genres'] and y_lower == 'count':
        df = pd.read_sql("SELECT genres FROM dim_movie WHERE genres IS NOT NULL", engine)
        genres_series = df['genres'].str.split('|').explode().str.strip()
        genres_series = genres_series[genres_series != '']
        counts = genres_series.value_counts().head(limit).reset_index()
        counts.columns = ['x', 'y']
        return {
            'data': counts.to_dict('records'),
            'chart_type': chart_type,
            'x_label': 'Genre',
            'y_label': 'Count',
            'title': "Movies by Genre"
        }
    elif dataset == 'movies' and x_lower in ['rating_count', 'count'] and y_lower in ['avg_rating', 'rating']:
        query = """
        SELECT COUNT(r.rating) as x, ROUND(AVG(r.rating), 2) as y, m.title
        FROM fact_rating r
        JOIN dim_movie m ON r.movie_id = m.movie_id
        GROUP BY r.movie_id
        HAVING COUNT(r.rating) >= 5
        ORDER BY x DESC
        LIMIT :lim
        """
        df = pd.read_sql(query, engine, params={'lim': limit})
        return {
            'data': df[['x', 'y']].to_dict('records'),
            'chart_type': chart_type,
            'x_label': 'Rating Count',
            'y_label': 'Average Rating',
            'title': "Rating vs Popularity"
        }
    elif dataset == 'ratings' and x_lower in ['date', 'time', 'year_month'] and y_lower in ['count', 'rating_count']:
        query = """
        SELECT (d.year || '-' || printf('%02d', d.month)) as x, COUNT(r.rating) as y
        FROM fact_rating r
        JOIN dim_date d ON r.date_id = d.date_id
        WHERE d.year IS NOT NULL AND d.year > 1990
        GROUP BY d.year, d.month
        ORDER BY d.year ASC, d.month ASC
        LIMIT :lim
        """
        df = pd.read_sql(query, engine, params={'lim': limit})
        return {
            'data': df.to_dict('records'),
            'chart_type': chart_type,
            'x_label': 'Date',
            'y_label': 'Count',
            'title': "Ratings Over Time"
        }
    elif dataset == 'ratings' and x_lower == 'rating' and y_lower in ['count', 'frequency']:
        query = """
        SELECT rating as x, COUNT(*) as y
        FROM fact_rating
        GROUP BY rating
        ORDER BY rating ASC
        """
        df = pd.read_sql(query, engine)
        return {
            'data': df.to_dict('records'),
            'chart_type': chart_type,
            'x_label': 'Rating',
            'y_label': 'Count',
            'title': "Rating Distribution"
        }

    # Robust generic generator for any custom selection
    if dataset == 'movies':
        # dim_movie has no 'year' column — extract year from title "(YYYY)" pattern
        # SUBSTR(m.title, INSTR(m.title,'(')+1, 4) gives the 4-char year string when present
        query = """
        SELECT m.movie_id, m.title, m.genres,
               COUNT(r.rating) as rating_count,
               COALESCE(ROUND(AVG(r.rating), 2), 0) as avg_rating,
               COALESCE(ROUND(AVG(r.rating), 2), 0) as rating,
               COUNT(r.rating) as count,
               CAST(
                 CASE
                   WHEN INSTR(m.title, '(') > 0
                        AND CAST(SUBSTR(m.title, INSTR(m.title,'(')+1, 4) AS INTEGER) BETWEEN 1888 AND 2030
                   THEN SUBSTR(m.title, INSTR(m.title,'(')+1, 4)
                   ELSE '2000'
                 END AS INTEGER
               ) as year
        FROM dim_movie m
        LEFT JOIN fact_rating r ON m.movie_id = r.movie_id
        GROUP BY m.movie_id
        LIMIT 10000
        """
        df = pd.read_sql(query, engine)
        if x_lower in ['genre', 'genres'] or y_lower in ['genre', 'genres']:
            df = df.assign(genre=df['genres'].str.split('|')).explode('genre')
            df['genre'] = df['genre'].str.strip()
            df = df[df['genre'] != '']
    elif dataset == 'ratings':
        query = """
        SELECT r.rating, r.user_id, r.movie_id, d.year, d.month, 
               (d.year || '-' || printf('%02d', d.month)) as date, 1 as count
        FROM fact_rating r
        JOIN dim_date d ON r.date_id = d.date_id
        LIMIT 25000
        """
        df = pd.read_sql(query, engine)
    else:
        # tags
        query = """
        SELECT t.tag, t.user_id, t.movie_id, 1 as count
        FROM dim_tag t
        LIMIT 25000
        """
        df = pd.read_sql(query, engine)

    # Determine x_col and y_col
    col_lookup = {c.lower(): c for c in df.columns}
    x_col = col_lookup.get(x_lower, df.columns[0])
    y_col = col_lookup.get(y_lower, None)

    if chart_type == 'scatter':
        # Scatter needs two numeric columns
        if y_col is None:
            y_col = 'rating' if 'rating' in df.columns else 'count'
        df_scatter = df[[x_col, y_col]].dropna()
        df_scatter[x_col] = pd.to_numeric(df_scatter[x_col], errors='coerce')
        df_scatter[y_col] = pd.to_numeric(df_scatter[y_col], errors='coerce')
        df_scatter = df_scatter.dropna()
        if len(df_scatter) > limit:
            df_scatter = df_scatter.sample(limit, random_state=42)
        df_scatter.columns = ['x', 'y']
        data = df_scatter.to_dict('records')
    else:
        # Bar or Line chart aggregation
        if y_lower in ['count', 'frequency'] or y_col is None or not pd.api.types.is_numeric_dtype(df[y_col]):
            # Count frequency of x
            grouped = df.groupby(x_col).size().reset_index(name='y')
            grouped.columns = ['x', 'y']
        else:
            df[y_col] = pd.to_numeric(df[y_col], errors='coerce')
            grouped = df.dropna(subset=[y_col]).groupby(x_col)[y_col].mean().reset_index()
            grouped.columns = ['x', 'y']
            grouped['y'] = grouped['y'].round(2)

        grouped['x'] = grouped['x'].astype(str)
        if chart_type == 'line':
            grouped = grouped.sort_values('x', ascending=True)
        else:
            grouped = grouped.sort_values('y', ascending=False)
        data = grouped.head(limit).to_dict('records')

    return {
        'data': data,
        'chart_type': chart_type,
        'x_label': x_axis or x_col,
        'y_label': y_axis or y_col or 'Count',
        'title': f"{chart_type.capitalize()} of {y_axis or 'Count'} by {x_axis or x_col}"
    }

def get_available_columns(dataset):
    col_map = {
        'movies': [
            {'name': 'genre', 'type': 'categorical'},
            {'name': 'title', 'type': 'categorical'},
            {'name': 'year', 'type': 'numeric'},
            {'name': 'rating', 'type': 'numeric'},
            {'name': 'avg_rating', 'type': 'numeric'},
            {'name': 'rating_count', 'type': 'numeric'},
            {'name': 'count', 'type': 'numeric'},
        ],
        'ratings': [
            {'name': 'rating', 'type': 'numeric'},
            {'name': 'date', 'type': 'categorical'},
            {'name': 'year', 'type': 'numeric'},
            {'name': 'month', 'type': 'numeric'},
            {'name': 'user_id', 'type': 'categorical'},
            {'name': 'count', 'type': 'numeric'},
        ],
        'tags': [
            {'name': 'tag', 'type': 'categorical'},
            {'name': 'user_id', 'type': 'categorical'},
            {'name': 'movie_id', 'type': 'categorical'},
            {'name': 'count', 'type': 'numeric'},
        ]
    }
    cols = col_map.get(dataset, [
        {'name': 'genre', 'type': 'categorical'},
        {'name': 'rating', 'type': 'numeric'},
        {'name': 'count', 'type': 'numeric'}
    ])
    return {'columns': cols}
