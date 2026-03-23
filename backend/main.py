import uvicorn

# Import handler module to register Socket.IO events
from app.ws import handler  # noqa: F401
from app.server import app

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
