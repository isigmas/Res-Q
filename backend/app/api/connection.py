import asyncio

from fastapi import APIRouter, WebSocket
from starlette.websockets import WebSocketDisconnect
from .dto.message import Message
from .dto.user import User
import time

router = APIRouter()

connections_tourist: list[WebSocket] = []
connections_rescuer: list[WebSocket] = []

sharing: bool = False

@router.websocket("/{con_type}")
async def websocket_connection(websocket: WebSocket, con_type: str):
    await websocket.accept()
    global sharing

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

            # print("----- [NEW DATA] -----")
            # print(data)
            # print("----- [END DATA] -----")

            # ----- Forwarding location messages ----- #

            if sharing and con_type == User.TOURIST and data.get("type_msg", None) == "tourist_location":
                new_mes = Message(
                    type_msg="tourist_location",
                    latitude=data["payload"]["latitude"],
                    longitude=data["payload"]["longitude"],
                    altitude=data["payload"]["altitude"],
                    accuracy=data["payload"]["accuracy"],
                    timestamp=data["payload"]["timestamp"]
                )
                print("[TOURIST]: Send location to rescuer")
                await send_to(User.RESCUER, new_mes)
                print("[TOURIST]: Message sent")

            elif sharing and con_type == User.RESCUER and data.get("type_msg", None) == "rescuer_location":
                new_mes = Message(
                    type_msg="rescuer_location",
                    latitude=data["payload"]["latitude"],
                    longitude=data["payload"]["longitude"],
                    altitude=data["payload"]["altitude"],
                    accuracy=data["payload"]["accuracy"],
                    timestamp=data["payload"]["timestamp"]
                )
                print("[RESCUER]: Send location to tourist")
                await send_to(User.TOURIST, new_mes)
                print("[RESCUER]: Message sent")

            # ----- Start/end location sharing ----- #

            elif con_type == User.TOURIST and data.get("type_msg", None) == "start_rescue":
                sharing = True
                print("[TOURIST]: Rescue started")
                await send_to(User.RESCUER, Message(
                    type_msg="start_rescue"
                ))
                print("[TOURIST]: Message sent")

            elif con_type == User.RESCUER and data.get("type_msg", None) == "stop_rescue":
                sharing = False
                print("[RESCUER]: Stop rescue")
                await send_to(User.TOURIST, Message(
                    type_msg="stop_rescue"
                ))
                print("[RESCUER]: Message sent")

    except WebSocketDisconnect:
        connections.remove(websocket)
        print("[INFO]: Connection Closed")


async def send_to(receiver_type: User, msg: Message):
    if receiver_type == User.TOURIST:
        receiver_list = connections_tourist
    else:
        receiver_list = connections_rescuer

    for receiver in receiver_list:
        await receiver.send_json({
            "type": msg.type_msg,
            "data": msg.to_dict()
        })


@router.websocket("/test/{con_type}")
async def websocket_test(websocket: WebSocket, con_type: str):
    await websocket.accept()

    try:
        while True:
            await asyncio.sleep(3)
            new_mes = Message(
                type_msg="tourist_location",
                latitude=51.108867564129866,
                longitude=17.056756409952886,
                altitude=122.6724967956543,
                accuracy=35,
                timestamp=int(time.time())
            )
            await websocket.send_json({
                "type": "tourist_location",
                "data": new_mes.to_dict()
            })

            data = await websocket.receive_json()

            print("----- [NEW DATA - TEST] -----")
            print(data)
            print("----- [END DATA - TEST] -----")

    except WebSocketDisconnect:
        pass
