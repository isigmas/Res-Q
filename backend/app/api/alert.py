from fastapi import APIRouter
from pydantic import BaseModel
import json

router = APIRouter()

class Alert(BaseModel):
    id: str
    location: float

@router.get("/send")
async def read_alert(msg: str):
    data = json.loads(msg)
    return "Otrzymano zgłoszenie"

