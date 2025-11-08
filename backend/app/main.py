from fastapi import FastAPI
from .api.router import register_router

app = FastAPI()

# register endpoints
register_router(app)