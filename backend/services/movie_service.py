from sqlalchemy.orm import Session
from sqlalchemy import text, func
from backend.database.models import Movie, Rating, Tag, User, DimMovie

def get_movies(db: Session, page: int = 1, limit: int = 20, search: str = None, genre: str = None, sort_by: str = None, min_rating: float = None, max_rating: float = None):
    has_rating_filter = min_rating is not None or max_rating is not None
    is_rating_sort = sort_by in ('rating_desc', 'rating_asc', 'popular', 'rating_count', 'avg_rating')
    
    params = {}
    where_clauses = ["1=1"]
    if search and search.strip():
        where_clauses.append("m.title LIKE :search")
        params["search"] = f"%{search.strip()}%"
    if genre and genre.strip():
        where_clauses.append("m.genres LIKE :genre")
        params["genre"] = f"%{genre.strip()}%"
        
    if has_rating_filter or is_rating_sort:
        if min_rating is not None:
            where_clauses.append("COALESCE(r.avg_r, 0) >= :min_rating")
            params["min_rating"] = float(min_rating)
        if max_rating is not None:
            where_clauses.append("COALESCE(r.avg_r, 0) <= :max_rating")
            params["max_rating"] = float(max_rating)
            
        if sort_by in ('rating_desc', 'avg_rating'):
            order_clause = "avg_rating DESC, rating_count DESC"
        elif sort_by == 'rating_asc':
            order_clause = "avg_rating ASC, rating_count ASC"
        elif sort_by in ('popular', 'rating_count'):
            order_clause = "rating_count DESC, avg_rating DESC"
        elif sort_by in ('title_asc', 'title'):
            order_clause = "m.title ASC"
        elif sort_by == 'title_desc':
            order_clause = "m.title DESC"
        else:
            order_clause = "m.movie_id ASC"
            
        where_str = " AND ".join(where_clauses)
        count_sql = f"""
        SELECT COUNT(*) FROM movie m
        LEFT JOIN (
            SELECT movie_id, AVG(rating) as avg_r, COUNT(id) as cnt
            FROM rating GROUP BY movie_id
        ) r ON m.movie_id = r.movie_id
        WHERE {where_str}
        """
        total = db.execute(text(count_sql), params).scalar() or 0
        
        offset = (page - 1) * limit
        data_sql = f"""
        SELECT m.movie_id, m.title, m.genres, m.imdb_id, m.tmdb_id,
               COALESCE(r.avg_r, 0) as avg_rating,
               COALESCE(r.cnt, 0) as rating_count
        FROM movie m
        LEFT JOIN (
            SELECT movie_id, AVG(rating) as avg_r, COUNT(id) as cnt
            FROM rating GROUP BY movie_id
        ) r ON m.movie_id = r.movie_id
        WHERE {where_str}
        ORDER BY {order_clause}
        LIMIT :limit OFFSET :offset
        """
        params["limit"] = limit
        params["offset"] = offset
        rows = db.execute(text(data_sql), params).fetchall()
    else:
        # Fast path without full rating subquery
        if sort_by in ('title_asc', 'title'):
            order_clause = "m.title ASC"
        elif sort_by == 'title_desc':
            order_clause = "m.title DESC"
        else:
            order_clause = "m.movie_id ASC"
            
        where_str = " AND ".join(where_clauses)
        count_sql = f"SELECT COUNT(*) FROM movie m WHERE {where_str}"
        total = db.execute(text(count_sql), params).scalar() or 0
        
        offset = (page - 1) * limit
        data_sql = f"""
        SELECT m.movie_id, m.title, m.genres, m.imdb_id, m.tmdb_id
        FROM movie m
        WHERE {where_str}
        ORDER BY {order_clause}
        LIMIT :limit OFFSET :offset
        """
        params["limit"] = limit
        params["offset"] = offset
        base_rows = db.execute(text(data_sql), params).fetchall()
        
        # Batch fetch stats for the retrieved page of movies
        m_ids = [r[0] for r in base_rows]
        stats_map = {}
        if m_ids:
            ph = ','.join(map(str, m_ids))
            s_rows = db.execute(text(f"SELECT movie_id, AVG(rating), COUNT(id) FROM rating WHERE movie_id IN ({ph}) GROUP BY movie_id")).fetchall()
            stats_map = {sr[0]: (round(float(sr[1]), 2), int(sr[2])) for sr in s_rows}
            
        rows = [
            (r[0], r[1], r[2], r[3], r[4], stats_map.get(r[0], (0.0, 0))[0], stats_map.get(r[0], (0.0, 0))[1])
            for r in base_rows
        ]
        
    movies_list = []
    for row in rows:
        genres_val = row[2] or ""
        g_list = [g.strip() for g in genres_val.split('|') if g.strip()] if genres_val else []
        movies_list.append({
            "movie_id": row[0],
            "title": row[1],
            "genres": genres_val,
            "genres_list": g_list,
            "imdb_id": row[3],
            "tmdb_id": row[4],
            "avg_rating": round(float(row[5]), 2),
            "rating_count": int(row[6])
        })
    pages = (total + limit - 1) // limit if total > 0 else 1
    return {"movies": movies_list, "total": total, "page": page, "pages": pages}

def get_movie_detail(db: Session, movie_id: int):
    movie = db.query(Movie).filter(Movie.movie_id == movie_id).first()
    if not movie:
        return None
    ratings = db.query(Rating).filter(Rating.movie_id == movie_id).all()
    tags = db.query(Tag).filter(Tag.movie_id == movie_id).all()
    avg_rating = sum([r.rating for r in ratings]) / len(ratings) if ratings else 0.0
    return {
        "movie_id": movie.movie_id,
        "title": movie.title,
        "genres": movie.genres.split('|') if movie.genres else [],
        "avg_rating": avg_rating,
        "rating_count": len(ratings),
        "tags": [t.tag for t in tags],
        "ratings": [{"user_id": r.user_id, "rating": r.rating, "timestamp": r.timestamp} for r in ratings]
    }

def create_movie(db: Session, title: str, genres: str, imdb_id: str = None, tmdb_id: str = None):
    new_movie = Movie(title=title, genres=genres, imdb_id=imdb_id, tmdb_id=tmdb_id)
    db.add(new_movie)
    db.commit()
    db.refresh(new_movie)
    return {"movie_id": new_movie.movie_id, "title": new_movie.title, "genres": new_movie.genres}

def update_movie(db: Session, movie_id: int, data_dict: dict):
    movie = db.query(Movie).filter(Movie.movie_id == movie_id).first()
    if not movie:
        return None
    for key, value in data_dict.items():
        setattr(movie, key, value)
    db.commit()
    db.refresh(movie)
    return {"movie_id": movie.movie_id, "title": movie.title, "genres": movie.genres}

def delete_movie(db: Session, movie_id: int):
    movie = db.query(Movie).filter(Movie.movie_id == movie_id).first()
    if not movie:
        return False
    db.delete(movie)
    db.commit()
    return True

def get_all_genres(db: Session):
    movies = db.query(Movie.genres).all()
    genres_set = set()
    for m in movies:
        if m.genres:
            genres_set.update(m.genres.split('|'))
    return sorted(list(genres_set))

def get_dashboard_stats(db: Session):
    total_movies = db.query(Movie).count()
    total_users = db.execute(text("SELECT COUNT(DISTINCT user_id) FROM rating")).scalar() or db.query(User).count()
    total_ratings = db.query(Rating).count()
    total_tags = db.query(Tag).count()
    avg_rating_res = db.execute(text("SELECT AVG(rating) FROM rating")).scalar()
    
    genres = get_all_genres(db)
    
    # Rating distribution
    rating_dist_rows = db.execute(text(
        "SELECT ROUND(rating * 2) / 2 as rating, COUNT(*) as count FROM rating GROUP BY ROUND(rating * 2) / 2 ORDER BY rating"
    )).fetchall()
    rating_distribution = [{"rating": float(r[0]), "count": int(r[1])} for r in rating_dist_rows]
    
    # Movies by genre (count movies per genre)
    all_movies = db.query(Movie.genres).all()
    genre_counts = {}
    for m in all_movies:
        if m.genres:
            for g in m.genres.split('|'):
                g = g.strip()
                if g and g != '(no genres listed)':
                    genre_counts[g] = genre_counts.get(g, 0) + 1
    movies_by_genre = sorted(
        [{"genre": k, "count": v} for k, v in genre_counts.items()],
        key=lambda x: x["count"], reverse=True
    )[:15]
    
    # Average rating by genre
    genre_ratings = {}
    genre_rating_counts = {}
    rated_movies = db.execute(text(
        "SELECT m.genres, AVG(r.rating) as avg_r, COUNT(r.id) as cnt "
        "FROM movie m JOIN rating r ON m.movie_id = r.movie_id "
        "GROUP BY m.movie_id, m.genres"
    )).fetchall()
    for row in rated_movies:
        if row[0]:
            for g in row[0].split('|'):
                g = g.strip()
                if g and g != '(no genres listed)':
                    genre_ratings[g] = genre_ratings.get(g, 0) + float(row[1]) * int(row[2])
                    genre_rating_counts[g] = genre_rating_counts.get(g, 0) + int(row[2])
    avg_rating_by_genre = sorted(
        [{"genre": k, "avg_rating": round(genre_ratings[k] / genre_rating_counts[k], 2)} 
         for k in genre_ratings if genre_rating_counts[k] > 0],
        key=lambda x: x["avg_rating"], reverse=True
    )[:15]
    
    # Ratings over time (by year)
    ratings_over_time_rows = db.execute(text(
        "SELECT strftime('%Y', datetime(timestamp, 'unixepoch')) as date, COUNT(*) as count "
        "FROM rating WHERE timestamp > 0 "
        "GROUP BY strftime('%Y', datetime(timestamp, 'unixepoch')) ORDER BY date"
    )).fetchall()
    ratings_over_time = [{"date": str(r[0]), "count": int(r[1])} for r in ratings_over_time_rows]
    
    # Most rated movies (top 10)
    most_rated_rows = db.execute(text(
        "SELECT m.title, COUNT(r.id) as rating_count "
        "FROM movie m JOIN rating r ON m.movie_id = r.movie_id "
        "GROUP BY m.movie_id ORDER BY rating_count DESC LIMIT 10"
    )).fetchall()
    most_rated_movies = [{"title": r[0], "rating_count": int(r[1])} for r in most_rated_rows]
    
    # Highest rated movies (min 50 ratings, top 10)
    highest_rated_rows = db.execute(text(
        "SELECT m.title, AVG(r.rating) as avg_rating, COUNT(r.id) as cnt "
        "FROM movie m JOIN rating r ON m.movie_id = r.movie_id "
        "GROUP BY m.movie_id HAVING cnt >= 50 ORDER BY avg_rating DESC LIMIT 10"
    )).fetchall()
    highest_rated_movies = [{"title": r[0], "avg_rating": round(float(r[1]), 2)} for r in highest_rated_rows]
    
    return {
        "total_movies": total_movies,
        "total_users": total_users,
        "total_ratings": total_ratings,
        "total_tags": total_tags,
        "avg_rating": float(avg_rating_res) if avg_rating_res else 0.0,
        "num_genres": len(genres),
        "rating_distribution": rating_distribution,
        "movies_by_genre": movies_by_genre,
        "avg_rating_by_genre": avg_rating_by_genre,
        "ratings_over_time": ratings_over_time,
        "most_rated_movies": most_rated_movies,
        "highest_rated_movies": highest_rated_movies
    }
