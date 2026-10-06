from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from backend.ml.clustering.kmeans import run_kmeans, run_elbow

router = APIRouter()

class KMeansRequest(BaseModel):
    type: str
    k: int
    features: Optional[List[str]] = None

class ElbowRequest(BaseModel):
    type: str
    max_k: Optional[int] = 10

@router.post('/kmeans')
def perform_kmeans(req: KMeansRequest):
    try:
        return run_kmeans(req.type, req.k, req.features)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/elbow')
def perform_elbow(req: ElbowRequest):
    try:
        return run_elbow(req.type, req.max_k)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
