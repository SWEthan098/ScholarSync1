from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from app.config import settings
from app.database import get_db
from app.services.context_builder import build_student_context
import io

router = APIRouter(prefix="/voice", tags=["voice"])
openai = AsyncOpenAI(api_key=settings.openai_api_key)


@router.post("/chat")
async def voice_chat(
    audio: UploadFile = File(...),
    user_id: str = Form(...)
):
    try:
        audio_bytes = await audio.read()
        transcript = await openai.audio.transcriptions.create(
            model="whisper-1",
            file=(audio.filename or "recording.webm", io.BytesIO(audio_bytes), audio.content_type or "audio/webm"),
        )
        student_text = transcript.text

        context = await build_student_context(user_id)

        chat_response = await openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": context},
                {"role": "user", "content": student_text},
            ],
            max_tokens=300,
        )
        reply_text = chat_response.choices[0].message.content

        db = get_db()
        db.table("voice_history").insert({
            "user_id": user_id,
            "transcript": student_text,
            "ai_response": reply_text,
            "context_used": {"summary": "context_sent"},
        }).execute()

        tts_response = await openai.audio.speech.create(
            model="tts-1",
            voice="nova",
            input=reply_text,
        )

        async def audio_stream():
            async for chunk in tts_response.iter_bytes(chunk_size=4096):
                yield chunk

        return StreamingResponse(audio_stream(), media_type="audio/mpeg")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{user_id}")
async def get_voice_history(user_id: str, limit: int = 10):
    db = get_db()
    result = db.table("voice_history") \
        .select("id, transcript, ai_response, created_at") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .limit(limit) \
        .execute()
    return result.data or []