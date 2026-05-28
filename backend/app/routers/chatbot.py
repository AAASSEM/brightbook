"""
Chatbot Router — AI-powered FAQ assistant using Gemini.
No models or schema changes needed. Uses the existing Gemini client.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from google import genai
from app.config.settings import settings
from app.services.ai_metrics import track_ai_call

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])

# Reuse the same Gemini client
client = genai.Client(api_key=settings.GEMINI_API_KEY)
GEMINI_MODEL = "models/gemini-flash-latest"

# ── BrightBook knowledge base (injected as system context) ──────────────
BRIGHTBOOK_CONTEXT = """
You are "Brighty", the friendly AI assistant for BrightBook — an AI-powered
literacy learning platform designed to help children with dyslexia.

CORE FACTS ABOUT BRIGHTBOOK:
1. BrightBook uses AI (Google Gemini) to personalize each child's learning path.
2. Children take an initial dyslexia assessment (10 questions, ~15 minutes).
3. The AI places them into one of 5 literacy levels based on accuracy.
4. Each level contains interactive activities: Meet the Letter, Hear the Sound,
   Trace & Write, Mini Quest, Sound Blender, Word Builder, Read & Match, and
   Read Aloud.
5. Parents track progress via the Parent Dashboard (accuracy charts, streak days,
   AI-powered learning tips, and downloadable PDF reports).
6. The platform supports English and Arabic.
7. BrightBook offers Free Trial, Monthly, and Yearly subscription plans.
8. Parents can submit support tickets from the Support page.
9. Data privacy: all child data is stored securely and only accessible by the
   parent who created the child profile.
10. Password reset is available via the "Forgot Password" link on login.
11. Parents can add multiple children under one account.
12. The assessment can be retaken from the Settings page.
13. We recommend 15-20 minutes of daily use for best results.
14. Activities use gamification: stars, streaks, achievements, and boss levels.
15. Boss levels are milestone challenges at the end of each letter group.

RULES FOR YOUR RESPONSES:
- Keep answers SHORT (2-4 sentences max), friendly, and helpful.
- If the question is about BrightBook, answer from the facts above.
- If the question is NOT about BrightBook or education, politely say:
  "I'm best at helping with BrightBook questions! For other topics, please
  reach out to our support team."
- Never invent features that don't exist.
- Always be encouraging and supportive when discussing children's learning.
- Respond in the SAME LANGUAGE the user writes in (English or Arabic).
"""


class ChatRequest(BaseModel):
    message: str
    lang: Optional[str] = "en"


class ChatResponse(BaseModel):
    reply: str
    source: str  # "ai" or "fallback"


@router.post("/ask", response_model=ChatResponse)
def chatbot_ask(req: ChatRequest):
    """
    Accept a user message and return an AI-generated answer grounded in
    the BrightBook knowledge base.
    """
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    user_message = req.message.strip()

    # Build the prompt
    prompt = f"""{BRIGHTBOOK_CONTEXT}

USER LANGUAGE: {"Arabic" if req.lang == "ar" else "English"}
USER QUESTION: {user_message}

Provide a helpful, concise answer:"""

    try:
        with track_ai_call():
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt
            )
        reply_text = response.text.strip()

        # Clean up any markdown formatting the model might add
        if reply_text.startswith('"') and reply_text.endswith('"'):
            reply_text = reply_text[1:-1]

        return ChatResponse(reply=reply_text, source="ai")

    except Exception as e:
        print(f"Chatbot AI error: {e}")
        # Graceful fallback
        fallback = (
            "عذراً، لم أتمكن من معالجة سؤالك الآن. يرجى المحاولة مرة أخرى أو تقديم تذكرة دعم."
            if req.lang == "ar"
            else "Sorry, I couldn't process your question right now. Please try again or submit a support ticket."
        )
        return ChatResponse(reply=fallback, source="fallback")
