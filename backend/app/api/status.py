from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def server_status():
    return "Active"