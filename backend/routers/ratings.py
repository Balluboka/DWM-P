from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from pydantic import BaseModel
import time
from backend.database.connection import get_db
from backend.database.models import Rating, User
from backend.routers.auth import get_current_user

router = APIRouter()

class RatingCreate(BaseModel):
    movie_id: int
    rating: float

@router.get('')
@router.get('/')
def get_ratings(
    page: int = 1,
    limit: int = 20,
    movie_id: Optional[str] = None,
    user_id: Optional[str] = None,
    search: Optional[str] = None,
    min_rating: Optional[float] = None,
    max_rating: Optional[float] = None,
    db: Session = Depends(get_db)

):
    try:
        from backend.database.models import Movie
        query = db.query(Rating, Movie.title.label("movie_title"), Movie.genres.label("genres")).outerjoin(Movie, Rating.movie_id == Movie.movie_id)
        
        # Safe integer filtering
        if movie_id is not None and str(movie_id).strip():
            try:
                m_id = int(str(movie_id).strip())
                query = query.filter(Rating.movie_id == m_id)
            except ValueError:
                pass
                
        if user_id is not None and str(user_id).strip():
            try:
                u_id = int(str(user_id).strip())
                query = query.filter(Rating.user_id == u_id)
            except ValueError:
                pass

        if search is not None and str(search).strip():
            s = f"%{str(search).strip()}%"
            query = query.filter(Movie.title.ilike(s))

        if min_rating is not None:
            query = query.filter(Rating.rating >= min_rating)
        if max_rating is not None:
            query = query.filter(Rating.rating <= max_rating)
        
        total = query.count()
        ratings_results = query.order_by(Rating.timestamp.desc()).offset((page - 1) * limit).limit(limit).all()
        
        return {
            "ratings": [{
                "id": r.id,
                "rating_id": r.id,
                "user_id": r.user_id,
                "movie_id": r.movie_id,
                "movie_title": title or f"Movie #{r.movie_id}",
                "genres": genres or "",
                "rating": r.rating,
                "timestamp": r.timestamp
            } for r, title, genres in ratings_results],
            "total": total,
            "page": page,
            "pages": (total + limit - 1) // limit if total > 0 else 1
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('')
@router.post('/')
def create_or_update_rating(rating: RatingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        now_ts = int(time.time())
        existing = db.query(Rating).filter(Rating.user_id == current_user.id, Rating.movie_id == rating.movie_id).first()
        if existing:
            existing.rating = rating.rating
            existing.timestamp = now_ts
            db.commit()
            db.refresh(existing)
            return {"status": "updated", "message": "Rating updated successfully", "rating": {"id": existing.id, "user_id": existing.user_id, "movie_id": existing.movie_id, "rating": existing.rating, "timestamp": existing.timestamp}}
        else:
            new_rating = Rating(user_id=current_user.id, movie_id=rating.movie_id, rating=rating.rating, timestamp=now_ts)
            db.add(new_rating)
            db.commit()
            db.refresh(new_rating)
            return {"status": "created", "message": "Rating recorded successfully", "rating": {"id": new_rating.id, "user_id": new_rating.user_id, "movie_id": new_rating.movie_id, "rating": new_rating.rating, "timestamp": new_rating.timestamp}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/my')
def get_my_ratings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        from sqlalchemy import text
        # Threshold between historical MovieLens sample data (< 1700000000) and newly user-created ratings (>= 1700000000)
        # Fetch all new user-generated ratings
        new_rows = db.execute(text(
            "SELECT r.id, r.movie_id, r.rating, r.timestamp, m.title, m.genres "
            "FROM rating r LEFT JOIN movie m ON r.movie_id = m.movie_id "
            "WHERE r.user_id = :uid AND r.timestamp >= 1700000000 ORDER BY r.timestamp DESC"
        ), {"uid": current_user.id}).fetchall()

        # Fetch sample/pre-generated ratings (reduced to 10 latest as requested)
        sample_rows = db.execute(text(
            "SELECT r.id, r.movie_id, r.rating, r.timestamp, m.title, m.genres "
            "FROM rating r LEFT JOIN movie m ON r.movie_id = m.movie_id "
            "WHERE r.user_id = :uid AND r.timestamp < 1700000000 ORDER BY r.timestamp DESC LIMIT 10"
        ), {"uid": current_user.id}).fetchall()

        results = []
        for row in new_rows:
            results.append({
                "id": row[0],
                "rating_id": row[0],
                "movie_id": row[1],
                "rating": row[2],
                "timestamp": row[3],
                "movie_title": row[4] or f"Movie #{row[1]}",
                "genres": row[5] or "",
                "is_new": True
            })
        for row in sample_rows:
            results.append({
                "id": row[0],
                "rating_id": row[0],
                "movie_id": row[1],
                "rating": row[2],
                "timestamp": row[3],
                "movie_title": row[4] or f"Movie #{row[1]}",
                "genres": row[5] or "",
                "is_new": False
            })

        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/stats')
def get_rating_stats(db: Session = Depends(get_db)):
    try:
        total = db.query(Rating).count()
        avg = db.query(func.avg(Rating.rating)).scalar() or 0.0
        return {
            "total_ratings": total,
            "average_rating": float(avg)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
