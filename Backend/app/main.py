from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import licenses_routes, otp_routes, auth_routes

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(licenses_routes.router)
app.include_router(otp_routes.router)
app.include_router(auth_routes.router)
