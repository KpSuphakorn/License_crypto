from fastapi import FastAPI
from app.routes import user_routes, otp_routes

app = FastAPI()

app.include_router(user_routes.router)
app.include_router(otp_routes.router)
