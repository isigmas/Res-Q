from fastapi import FastAPI
from . import test


def register_router(app: FastAPI):
    app.include_router(test.router, prefix="/test", tags=["test"])
    print("register")