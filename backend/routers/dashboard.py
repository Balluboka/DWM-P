from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database.connection import get_db
from backend.services.movie_service import get_dashboard_stats
from backend.routers.auth import get_current_user
from backend.database.models import User

router = APIRouter()

@router.get('/stats')
def dashboard_stats(db: Session = Depends(get_db)):
    try:
        return get_dashboard_stats(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/user-stats')
def user_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        uid = current_user.id
        # Total ratings by user
        total_ratings = db.execute(text("SELECT COUNT(*) FROM rating WHERE user_id = :uid"), {"uid": uid}).scalar() or 0
        # Average rating
        avg_rating = db.execute(text("SELECT AVG(rating) FROM rating WHERE user_id = :uid"), {"uid": uid}).scalar()
        avg_rating = round(float(avg_rating), 2) if avg_rating else 0.0
        # Recent ratings (top 5)
        recent_rows = db.execute(text(
            "SELECT r.movie_id, m.title, r.rating, r.timestamp "
            "FROM rating r LEFT JOIN movie m ON r.movie_id = m.movie_id "
            "WHERE r.user_id = :uid ORDER BY r.timestamp DESC LIMIT 5"
        ), {"uid": uid}).fetchall()
        recent_ratings = [{"movie_id": row[0], "title": row[1], "movie_title": row[1] or "Unknown Movie", "rating": row[2], "timestamp": row[3]} for row in recent_rows]
        # Genre preferences (count movies per genre from user's ratings)
        genre_rows = db.execute(text(
            "SELECT m.genres FROM rating r JOIN movie m ON r.movie_id = m.movie_id WHERE r.user_id = :uid"
        ), {"uid": uid}).fetchall()
        genre_counts = {}
        for row in genre_rows:
            if row[0]:
                for g in row[0].split('|'):
                    g = g.strip()
                    if g and g != '(no genres listed)':
                        genre_counts[g] = genre_counts.get(g, 0) + 1
        genre_preferences = sorted(
            [{"genre": k, "count": v} for k, v in genre_counts.items()],
            key=lambda x: x["count"], reverse=True
        )[:10]
        
        return {
            "total_ratings": int(total_ratings),
            "avg_rating": avg_rating,
            "recent_ratings": recent_ratings,
            "genre_preferences": genre_preferences
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
