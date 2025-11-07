from fastapi import APIRouter

router = APIRouter()

@router.get("/send")
async def read_alert():
    return "[ALERT]: alert otrzymany"