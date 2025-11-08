from fastapi import APIRouter, WebSocket
from starlette.websockets import WebSocketDisconnect
from .dto.message import Message
from .dto.user import User

router = APIRouter()

connections_tourist: list[WebSocket] = []
connections_rescuer: list[WebSocket] = []

@router.websocket("/{con_type}")
async def websocket_connection(websocket: WebSocket, con_type: str):
    await websocket.accept()

    if con_type == "tourist":
        con_type: User = User.TOURIST
        connections = connections_tourist
    else:
        con_type: User = User.RESCUER
        connections = connections_rescuer

    connections.append(websocket)
    print("[INFO]: New Connection")

    try:
        while True:
            data = await websocket.receive_json()

            if con_type == User.TOURIST and data.get("type_msg", None) == "tourist_location":
                new_mes = Message(
                    type_msg="tourist_location",
                    latitude=data["latitude"],
                    longitude=data["longitude"],
                    altitude=data["altitude"],
                    accuracy=data["accuracy"],
                    timestamp=data["timestamp"]
                )
                await send_to(User.RESCUER, new_mes)

            elif con_type == User.TOURIST and data.get("type_msg", None) == "rescuer_location":
                new_mes = Message(
                    type_msg="rescuer_location",
                    latitude=data["latitude"],
                    longitude=data["longitude"],
                    altitude=data["altitude"],
                    accuracy=data["accuracy"],
                    timestamp=data["timestamp"]
                )
                await send_to(User.TOURIST, new_mes)

    except WebSocketDisconnect:
        connections.remove(websocket)
        print("[INFO]: Connection Closed")


async def send_to(receiver_type: User, msg: Message):
    if receiver_type == User.TOURIST:
        receiver_list = connections_tourist
    else:
        receiver_list = connections_rescuer

    for receiver in receiver_list:
        await receiver.send_json(msg.to_dict())