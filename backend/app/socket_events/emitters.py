from app.config.socket import sio


async def emit_answer_result(child_id: int, correct: bool, feedback: str, stars_earned: int):
    await sio.emit("activity:answer_result", {
        "correct": correct,
        "feedback": feedback,
        "stars_earned": stars_earned,
    }, room=f"child:{child_id}")


async def emit_activity_completed(child_id: int, score: int, badges_earned: list):
    await sio.emit("activity:completed", {
        "score": score,
        "badges_earned": badges_earned,
    }, room=f"child:{child_id}")


async def emit_level_unlocked(child_id: int, parent_id: int, new_level: int, child_name: str):
    payload = {"new_level": new_level, "child_name": child_name}
    await sio.emit("level:unlocked", payload, room=f"child:{child_id}")
    await sio.emit("level:unlocked", payload, room=f"parent:{parent_id}")


async def emit_progress_updated(parent_id: int, child_id: int, score: int, streak: int):
    await sio.emit("progress:updated", {
        "child_id": child_id,
        "score": score,
        "streak": streak,
    }, room=f"parent:{parent_id}")


async def emit_notification(parent_id: int, notif_type: str, message: str):
    await sio.emit("notification:new", {
        "type": notif_type,
        "message": message,
    }, room=f"parent:{parent_id}")
