from fastapi import APIRouter, WebSocket
from starlette.websockets import WebSocketDisconnect

router = APIRouter()

active_connections: list[WebSocket] = []

@router.websocket("/")
async def websocket_connection(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    print("[INFO]: New Connection")

    try:
        while True:
            data = await websocket.receive_json()
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        print("[INFO]: Connection Closed")