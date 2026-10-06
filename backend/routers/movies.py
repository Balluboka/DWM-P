from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from backend.database.connection import get_db
from backend.services.movie_service import get_movies, get_movie_detail, create_movie, update_movie, delete_movie, get_all_genres
from backend.routers.auth import get_current_user
from backend.database.models import User

router = APIRouter()

class MovieCreate(BaseModel):
    title: str
    genres: str
    imdb_id: Optional[str] = None
    tmdb_id: Optional[str] = None

class MovieUpdate(BaseModel):
    title: Optional[str] = None
    genres: Optional[str] = None
    imdb_id: Optional[str] = None
    tmdb_id: Optional[str] = None

@router.get('/')
def read_movies(
    page: int = 1,
    limit: int = 20,
    search: str = '',
    genre: str = '',
    sort_by: str = 'title',
    min_rating: Optional[float] = None,
    max_rating: Optional[float] = None,
    db: Session = Depends(get_db)
):
    try:
        return get_movies(db, page, limit, search, genre, sort_by, min_rating, max_rating)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/genres')
def read_genres(db: Session = Depends(get_db)):
    try:
        return get_all_genres(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/{movie_id}')
def read_movie_detail(movie_id: int, db: Session = Depends(get_db)):
    try:
        movie = get_movie_detail(db, movie_id)
        if not movie:
            raise HTTPException(status_code=404, detail="Movie not found")
        return movie
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/')
def add_movie(movie: MovieCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        return create_movie(db, movie.title, movie.genres, movie.imdb_id, movie.tmdb_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put('/{movie_id}')
def edit_movie(movie_id: int, movie: MovieUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        updated = update_movie(db, movie_id, movie.dict(exclude_unset=True))
        if not updated:
            raise HTTPException(status_code=404, detail="Movie not found")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/{movie_id}')
def remove_movie(movie_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        success = delete_movie(db, movie_id)
        if not success:
            raise HTTPException(status_code=404, detail="Movie not found")
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
