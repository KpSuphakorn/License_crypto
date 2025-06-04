from fastapi import FastAPI
from app.routes import licenses_routes, otp_routes

app = FastAPI()

app.include_router(licenses_routes.router)
app.include_router(otp_routes.router)
