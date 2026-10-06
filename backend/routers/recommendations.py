from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from backend.ml.recommendation.content_based import get_recommendations, get_similar_movies

router = APIRouter()

class RecommendationRequest(BaseModel):
    movie_ids: Optional[List[int]] = None
    user_id: Optional[int] = None
    n: Optional[int] = 10

@router.post('/')
def fetch_recommendations(req: RecommendationRequest):
    try:
        return get_recommendations(req.movie_ids, req.user_id, req.n)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/similar/{movie_id}')
def fetch_similar_movies(movie_id: int):
    try:
        return get_similar_movies(movie_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
