from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.analytics.visualization.charts import get_chart_data, get_available_columns

router = APIRouter()

class ChartDataRequest(BaseModel):
    chart_type: str
    dataset: str
    x_axis: str
    y_axis: str
    filters: Optional[Dict[str, Any]] = None
    limit: Optional[int] = 20

@router.post('/data')
def fetch_chart_data(req: ChartDataRequest):
    try:
        return get_chart_data(req.chart_type, req.dataset, req.x_axis, req.y_axis, req.filters, req.limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/columns/{dataset}')
def fetch_columns(dataset: str):
    try:
        return get_available_columns(dataset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
