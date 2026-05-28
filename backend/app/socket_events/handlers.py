from app.config.socket import sio


@sio.event
async def connect(sid, environ, auth):
    print(f"[Socket.IO] Client connected: {sid}")


@sio.event
async def disconnect(sid):
    print(f"[Socket.IO] Client disconnected: {sid}")


@sio.event
async def join_room(sid, data):
    """Client joins their scoped room: parent:{id} or child:{id}"""
    room = data.get("room")
    if room:
        await sio.enter_room(sid, room)
        await sio.emit("joined", {"room": room}, to=sid)
