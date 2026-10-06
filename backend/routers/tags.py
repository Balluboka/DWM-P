from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from backend.database.connection import get_db
from backend.database.models import Tag

router = APIRouter()

from fastapi import Query
from backend.database.models import Movie

@router.get('')
@router.get('/')
def get_tags(
    page: int = 1,
    limit: int = 20,
    movie_id: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)

):
    try:
        query = db.query(Tag, Movie.title.label("movie_title")).outerjoin(Movie, Tag.movie_id == Movie.movie_id)
        
        if movie_id is not None and str(movie_id).strip():
            try:
                m_id = int(str(movie_id).strip())
                query = query.filter(Tag.movie_id == m_id)
            except ValueError:
                pass
                
        search_kw = tag or search
        if search_kw is not None and str(search_kw).strip():
            query = query.filter(Tag.tag.ilike(f"%{str(search_kw).strip()}%"))
            
        total = query.count()
        tags_results = query.order_by(Tag.timestamp.desc()).offset((page - 1) * limit).limit(limit).all()
        
        return {
            "tags": [{
                "id": t.id,
                "tag_id": t.id,
                "user_id": t.user_id,
                "movie_id": t.movie_id,
                "movie_title": title or f"Movie #{t.movie_id}",
                "tag": t.tag,
                "timestamp": t.timestamp
            } for t, title in tags_results],
            "total": total,
            "page": page,
            "pages": (total + limit - 1) // limit if total > 0 else 1
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/popular')
def get_popular_tags(db: Session = Depends(get_db)):
    try:
        tags = db.query(Tag.tag, func.count(Tag.id).label('count')).group_by(Tag.tag).order_by(func.count(Tag.id).desc()).limit(20).all()
        return [{"tag": t.tag, "count": t.count} for t in tags]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
