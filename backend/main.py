from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models
from database import engine
from auth import router as auth_router
from activities import router as activities_router

# Create the tables in fittrack.db if they don't exist yet
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="FitTrack API")

# Lets the frontend (served from another address) talk to this API.
# "*" is fine while developing; we'll restrict it before going online.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(activities_router)


@app.get("/")
def home():
    return {"message": "FitTrack API is running"}