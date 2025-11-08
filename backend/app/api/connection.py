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
            print(f"[INFO]: Received data from {con_type}: {data}")

            # Tourist sends start/stop rescue
            if con_type == User.TOURIST and data.get("type_msg") in ["start_rescue", "stop_rescue"]:
                print(f"[INFO]: Forwarding {data.get('type_msg')} to rescuers")
                await send_to(User.RESCUER, data)

            # Tourist sends their location
            elif con_type == User.TOURIST and data.get("type_msg") == "tourist_location":
                new_mes = Message(
                    type_msg="tourist_location",
                    latitude=data["latitude"],
                    longitude=data["longitude"],
                    altitude=data["altitude"],
                    accuracy=data["accuracy"],
                    timestamp=data["timestamp"]
                )
                print(f"[INFO]: Forwarding tourist location to rescuers")
                await send_to(User.RESCUER, new_mes)

            # Rescuer sends their location
            elif con_type == User.RESCUER and data.get("type_msg") == "rescuer_location":
                new_mes = Message(
                    type_msg="rescuer_location",
                    latitude=data["latitude"],
                    longitude=data["longitude"],
                    altitude=data["altitude"],
                    accuracy=data["accuracy"],
                    timestamp=data["timestamp"]
                )
                print(f"[INFO]: Forwarding rescuer location to tourists")
                await send_to(User.TOURIST, new_mes)

    except WebSocketDisconnect:
        connections.remove(websocket)
        print("[INFO]: Connection Closed")


async def send_to(receiver_type: User, msg):
    if receiver_type == User.TOURIST:
        receiver_list = connections_tourist
    else:
        receiver_list = connections_rescuer

    # If msg is a Message object, convert to dict
    if isinstance(msg, Message):
        msg = msg.to_dict()

    for receiver in receiver_list:
        await receiver.send_json(msg)