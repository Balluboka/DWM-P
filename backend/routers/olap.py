from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.analytics.olap.operations import rollup, drilldown, slice_op, dice, pivot

router = APIRouter()

class RollupRequest(BaseModel):
    dimension: str
    measure: str
    hierarchy_level: str

class DrilldownRequest(BaseModel):
    dimension: str
    measure: str
    hierarchy_level: str
    filter_value: Optional[str] = None

class SliceRequest(BaseModel):
    dimension: str
    value: str
    measure: str

class DiceRequest(BaseModel):
    conditions: Dict[str, Any]
    measure: str

class PivotRequest(BaseModel):
    rows: str
    columns: str
    measure: str

@router.post('/rollup')
def perform_rollup(req: RollupRequest):
    try:
        return rollup(req.dimension, req.measure, req.hierarchy_level)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/drilldown')
def perform_drilldown(req: DrilldownRequest):
    try:
        return drilldown(req.dimension, req.measure, req.hierarchy_level, req.filter_value)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/slice')
def perform_slice(req: SliceRequest):
    try:
        return slice_op(req.dimension, req.value, req.measure)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/dice')
def perform_dice(req: DiceRequest):
    try:
        return dice(req.conditions, req.measure)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/pivot')
def perform_pivot(req: PivotRequest):
    try:
        return pivot(req.rows, req.columns, req.measure)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/dimensions')
def get_dimensions():
    return {
        "dimensions": ["time", "location", "user", "movie", "genre"],
        "measures": ["rating", "count"]
    }
