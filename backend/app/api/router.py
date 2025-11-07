from fastapi import FastAPI
from . import status, alert


def register_router(app: FastAPI):
    app.include_router(status.router, prefix="/status", tags=["test"])
    app.include_router(alert.router, prefix="/alert", tags=["send"])
    print("register")