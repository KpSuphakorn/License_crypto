from fastapi import FastAPI
from app.routes import user_routes, otp_routes

app = FastAPI()

<<<<<<< HEAD
app.include_router(user_routes.router)
=======
app.include_router(user_routes.router)
app.include_router(otp_routes.router)
>>>>>>> 027c0d1f42149b0c8c6fed7ed0ec0b7246c0c6b3
