from fastapi import FastAPI
from . import status, alert, connection


def register_router(app: FastAPI):
    app.include_router(status.router, prefix="/status", tags=["test"])
    app.include_router(alert.router, prefix="/alert", tags=["send"])
    app.include_router(connection.router, prefix="/ws", tags=["connection"])