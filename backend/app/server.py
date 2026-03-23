import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=[],
)

fastapi_app = FastAPI(title="Entangl Backend", version="0.1.0")

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app = socketio.ASGIApp(sio, fastapi_app)


@fastapi_app.get("/api/health")
async def health_check():
    return {"status": "ok"}
