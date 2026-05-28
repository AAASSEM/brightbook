"""
AI Service — Real Google Gemini API integration
Analyzes assessments, generates learning paths, and provides parent recommendations
"""
import os
import json
from typing import List, Dict, Any
from google import genai
from app.config.settings import settings
from app.models.enums import DifficultyLevel, ActivityType
from app.services.ai_metrics import track_ai_call

# Configure Gemini API with working model
client = genai.Client(api_key=settings.GEMINI_API_KEY)
GEMINI_MODEL = "models/gemini-flash-latest"  # Original working model

# ─────────────────────────────────────────────
# EMOJI & WORD MAPPING FOR AI
# ─────────────────────────────────────────────
LETTER_EMOJI_MAPPING = {
    'A': [{'word': 'APPLE', 'emoji': '🍎'}, {'word': 'ANT', 'emoji': '🐜'}, {'word': 'ARROW', 'emoji': '➡️'}, {'word': 'ASTRONAUT', 'emoji': '👨‍🚀'}, {'word': 'AIRPLANE', 'emoji': '✈️'}],
    'B': [{'word': 'BEAR', 'emoji': '🐻'}, {'word': 'BALL', 'emoji': '⚽'}, {'word': 'BANANA', 'emoji': '🍌'}, {'word': 'BUTTERFLY', 'emoji': '🦋'}, {'word': 'BOAT', 'emoji': '⛵'}],
    'C': [{'word': 'CAT', 'emoji': '🐱'}, {'word': 'CAR', 'emoji': '🚗'}, {'word': 'CAKE', 'emoji': '🎂'}, {'word': 'COW', 'emoji': '🐄'}, {'word': 'CLOUD', 'emoji': '☁️'}],
    'D': [{'word': 'DUCK', 'emoji': '🦆'}, {'word': 'DOG', 'emoji': '🐶'}, {'word': 'DRUM', 'emoji': '🥁'}, {'word': 'DONUT', 'emoji': '🍩'}, {'word': 'DOLPHIN', 'emoji': '🐬'}],
    'E': [{'word': 'EGG', 'emoji': '🥚'}, {'word': 'ELEPHANT', 'emoji': '🐘'}, {'word': 'EAGLE', 'emoji': '🦅'}, {'word': 'EARTH', 'emoji': '🌍'}, {'word': 'EYE', 'emoji': '👁️'}],
    'F': [{'word': 'FISH', 'emoji': '🐟'}, {'word': 'FROG', 'emoji': '🐸'}, {'word': 'FIRE', 'emoji': '🔥'}, {'word': 'FLOWER', 'emoji': '🌸'}, {'word': 'FOX', 'emoji': '🦊'}],
    'G': [{'word': 'GIRAFFE', 'emoji': '🦒'}, {'word': 'GOAT', 'emoji': '🐐'}, {'word': 'GRAPE', 'emoji': '🍇'}, {'word': 'GUITAR', 'emoji': '🎸'}, {'word': 'GHOST', 'emoji': '👻'}],
    'H': [{'word': 'HORSE', 'emoji': '🐴'}, {'word': 'HAT', 'emoji': '🎩'}, {'word': 'HOUSE', 'emoji': '🏠'}, {'word': 'HEART', 'emoji': '❤️'}, {'word': 'HONEY', 'emoji': '🍯'}],
    'I': [{'word': 'IGLOO', 'emoji': '🏠'}, {'word': 'ICE CREAM', 'emoji': '🍦'}, {'word': 'INSECT', 'emoji': '🐛'}, {'word': 'ISLAND', 'emoji': '🏝️'}, {'word': 'INK', 'emoji': '🖊️'}],
    'J': [{'word': 'JELLYFISH', 'emoji': '🪼'}, {'word': 'JELLY', 'emoji': '🍇'}, {'word': 'JUMP', 'emoji': '🦘'}, {'word': 'JUICE', 'emoji': '🧃'}, {'word': 'JAR', 'emoji': '🫙'}],
    'K': [{'word': 'KANGAROO', 'emoji': '🦘'}, {'word': 'KEY', 'emoji': '🔑'}, {'word': 'KITE', 'emoji': '🪁'}, {'word': 'KOALA', 'emoji': '🐨'}, {'word': 'KING', 'emoji': '👑'}],
    'L': [{'word': 'LION', 'emoji': '🦁'}, {'word': 'LEAF', 'emoji': '🍃'}, {'word': 'LAMP', 'emoji': '💡'}, {'word': 'LEMON', 'emoji': '🍋'}, {'word': 'LOBSTER', 'emoji': '🦞'}],
    'M': [{'word': 'MOUSE', 'emoji': '🐭'}, {'word': 'MOON', 'emoji': '🌙'}, {'word': 'MANGO', 'emoji': '🥭'}, {'word': 'MUSHROOM', 'emoji': '🍄'}, {'word': 'MOUNTAIN', 'emoji': '🏔️'}],
    'N': [{'word': 'NEST', 'emoji': '🪺'}, {'word': 'NOSE', 'emoji': '👃'}, {'word': 'NET', 'emoji': '🥅'}, {'word': 'NIGHT', 'emoji': '🌙'}, {'word': 'NINJA', 'emoji': '🥷'}],
    'O': [{'word': 'OCTOPUS', 'emoji': '🐙'}, {'word': 'OWL', 'emoji': '🦉'}, {'word': 'ORANGE', 'emoji': '🍊'}, {'word': 'OCEAN', 'emoji': '🌊'}, {'word': 'OLIVE', 'emoji': '🫒'}],
    'P': [{'word': 'PIG', 'emoji': '🐷'}, {'word': 'PENGUIN', 'emoji': '🐧'}, {'word': 'PIZZA', 'emoji': '🍕'}, {'word': 'PANDA', 'emoji': '🐼'}, {'word': 'PARROT', 'emoji': '🦜'}],
    'Q': [{'word': 'QUEEN', 'emoji': '👑'}, {'word': 'QUILT', 'emoji': '🛏️'}, {'word': 'QUESTION', 'emoji': '❓'}, {'word': 'QUARTER', 'emoji': '🪙'}, {'word': 'QUILL', 'emoji': '🪶'}],
    'R': [{'word': 'RABBIT', 'emoji': '🐰'}, {'word': 'RAIN', 'emoji': '🌧️'}, {'word': 'RING', 'emoji': '💍'}, {'word': 'ROBOT', 'emoji': '🤖'}, {'word': 'RAINBOW', 'emoji': '🌈'}],
    'S': [{'word': 'SUN', 'emoji': '☀️'}, {'word': 'STAR', 'emoji': '⭐'}, {'word': 'SNAKE', 'emoji': '🐍'}, {'word': 'SNOWMAN', 'emoji': '⛄'}, {'word': 'STRAWBERRY', 'emoji': '🍓'}],
    'T': [{'word': 'TIGER', 'emoji': '🐯'}, {'word': 'TREE', 'emoji': '🌳'}, {'word': 'TRAIN', 'emoji': '🚂'}, {'word': 'TURTLE', 'emoji': '🢀'}, {'word': 'TACO', 'emoji': '🌮'}],
    'U': [{'word': 'UMBRELLA', 'emoji': '☂️'}, {'word': 'UNICORN', 'emoji': '🦄'}, {'word': 'UP', 'emoji': '⬆️'}, {'word': 'UNIVERSE', 'emoji': '🌌'}, {'word': 'URBAN', 'emoji': '🏙️'}],
    'V': [{'word': 'VIOLIN', 'emoji': '🎻'}, {'word': 'VOLCANO', 'emoji': '🌋'}, {'word': 'VASE', 'emoji': '🪷'}, {'word': 'VEGETABLES', 'emoji': '🥕'}, {'word': 'VAN', 'emoji': '🚐'}],
    'W': [{'word': 'WHALE', 'emoji': '🐋'}, {'word': 'WATER', 'emoji': '💧'}, {'word': 'WORM', 'emoji': '🪱'}, {'word': 'WOLF', 'emoji': '🐺'}, {'word': 'WATERMELON', 'emoji': '🍉'}],
    'X': [{'word': 'X-RAY', 'emoji': '🩻'}, {'word': 'XYLOPHONE', 'emoji': '🎵'}, {'word': 'BOX', 'emoji': '📦'}, {'word': 'FOX', 'emoji': '🦊'}, {'word': 'OXYGEN', 'emoji': '💨'}],
    'Y': [{'word': 'YACHT', 'emoji': '🛥️'}, {'word': 'YOGURT', 'emoji': '🥛'}, {'word': 'YO-YO', 'emoji': '🪀'}, {'word': 'YARN', 'emoji': '🧶'}, {'word': 'YAK', 'emoji': '🐃'}],
    'Z': [{'word': 'ZEBRA', 'emoji': '🦓'}, {'word': 'ZOO', 'emoji': '🦁'}, {'word': 'ZERO', 'emoji': '0️⃣'}, {'word': 'ZOMBIE', 'emoji': '🧟'}, {'word': 'ZIPPER', 'emoji': '🤐'}]
}

# ─────────────────────────────────────────────
# 1. ASSESSMENT ANALYSIS
# ─────────────────────────────────────────────
def analyze_assessment(
    responses: List[Dict[str, Any]],
    child_age: int,
) -> Dict[str, Any]:
    """
    Real AI-powered assessment analysis using Google Gemini
    Input:  list of { question_id, is_correct, time_spent_seconds, difficulty }
    Output: { literacy_level, confidence_score, weak_areas, ai_analysis_text, recommended_focus }
    """
    if not responses:
        return _default_analysis()

    # Prepare assessment data for AI analysis
    total = len(responses)
    correct = sum(1 for r in responses if r.get("is_correct"))
    accuracy = (correct / total) * 100

    # Build comprehensive prompt for Gemini
    assessment_prompt = f"""
    You are a expert children's dyslexia assessment specialist. Analyze these assessment results:

    Child Age: {child_age} years old
    Total Questions: {total}
    Correct Answers: {correct}
    Accuracy: {accuracy:.1f}%

    Question Results:
    {json.dumps(responses, indent=2)}

    Please provide a detailed analysis and respond ONLY in valid JSON format with this exact structure:
    {{
        "dyslexia_level": <1-5 based on performance>,
        "confidence_score": <0.0-1.0 confidence in your assessment>,
        "weak_areas": [<list of specific areas needing work>],
        "ai_analysis_text": "<detailed explanation for parents in simple, encouraging language>",
        "recommended_focus": "<single most important area to focus on>",
        "strength_areas": [<list of areas the child is doing well in>],
        "suggested_activities": [<list of specific activity types to start with>]
    }}

    Level Guidelines:
    - Level 1: Beginner (0-40% accuracy) - Focus on letter recognition, basic phonics
    - Level 2: Developing (40-60% accuracy) - Focus on phonics, letter sounds, basic words
    - Level 3: Progressing (60-80% accuracy) - Focus on word formation, blending, sight words
    - Level 4: Advanced (80-90% accuracy) - Focus on reading comprehension, sentences
    - Level 5: Excellent (90%+ accuracy) - Focus on advanced reading, vocabulary, stories

    Activity Types Available: {', '.join([t.value for t in ActivityType])}

    Provide specific, actionable insights that will help create a personalized learning path.
    """

    try:
        # Call Gemini API with working model
        with track_ai_call():
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=assessment_prompt
            )
        result_text = response.text.strip()

        # Extract JSON from response (in case there's extra text)
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()

        # Parse AI response
        ai_result = json.loads(result_text)

        # Handle legacy or inconsistent AI responses
        if "literacy_level" in ai_result and "dyslexia_level" not in ai_result:
            ai_result["dyslexia_level"] = ai_result["literacy_level"]
        
        if "dyslexia_level" not in ai_result:
            ai_result["dyslexia_level"] = 1

        # Add calculated metrics
        ai_result["accuracy_percentage"] = round(accuracy, 2)
        ai_result["total_correct"] = correct

        return ai_result

    except Exception as e:
        # Fallback to rule-based if AI fails
        return _fallback_analysis(responses, child_age)


def _default_analysis() -> Dict[str, Any]:
    return {
        "dyslexia_level": 1,
        "confidence_score": 0.5,
        "weak_areas": ["letter_recognition"],
        "ai_analysis_text": "Assessment could not be fully analyzed. Starting at Level 1.",
        "recommended_focus": "letter_recognition",
        "accuracy_percentage": 0.0,
        "total_correct": 0,
        "strength_areas": [],
        "suggested_activities": ["meet_letter", "hear_sound"]
    }


def _fallback_analysis(responses: List[Dict[str, Any]], child_age: int) -> Dict[str, Any]:
    """Fallback rule-based analysis if AI fails"""
    total = len(responses)
    correct = sum(1 for r in responses if r.get("is_correct"))
    accuracy = (correct / total) * 100 if total > 0 else 0

    if accuracy < 40:
        literacy_level = 1
        confidence = accuracy / 40
        weak_areas = ["letter_recognition", "phonics", "vocabulary"]
    elif accuracy < 60:
        literacy_level = 2
        confidence = (accuracy - 40) / 20
        weak_areas = ["phonics", "word_formation"]
    elif accuracy < 80:
        literacy_level = 3
        confidence = (accuracy - 60) / 20
        weak_areas = ["reading_comprehension"]
    else:
        literacy_level = 4
        confidence = min(1.0, (accuracy - 80) / 20)
        weak_areas = []

    return {
        "dyslexia_level": literacy_level,
        "confidence_score": round(confidence, 2),
        "weak_areas": weak_areas,
        "ai_analysis_text": f"Based on {total} questions with {accuracy:.0f}% accuracy, the child is placed at Level {literacy_level}. Focus areas: {', '.join(weak_areas) if weak_areas else 'Keep it up!'}",
        "recommended_focus": weak_areas[0] if weak_areas else "advanced_reading",
        "accuracy_percentage": round(accuracy, 2),
        "total_correct": correct,
        "strength_areas": [],
        "suggested_activities": ["meet_letter", "hear_sound"] if literacy_level <= 2 else ["word_builder", "sound_blender"]
    }


# ─────────────────────────────────────────────
# 2. LEARNING PATH GENERATION
# ─────────────────────────────────────────────
def generate_learning_path(
    child_age: int,
    native_language: str,
    literacy_level: int,
    weak_areas: List[str],
    completed_activity_ids: List[int],
    available_activity_ids: List[int],
) -> Dict[str, Any]:
    """
    Generate adaptive learning path using AI
    Returns ordered list of activities with rationale
    """
    # Filter out completed activities
    remaining = [a for a in available_activity_ids if a not in completed_activity_ids]

    learning_prompt = f"""
    You are a specialized learning path designer for children's literacy education.

    Child Profile:
    - Age: {child_age} years old
    - Native Language: {native_language}
    - Current Literacy Level: {literacy_level} (1=Beginner, 5=Advanced)
    - Areas Needing Work: {', '.join(weak_areas) if weak_areas else 'None - doing well!'}
    - Available Activities: {len(remaining)} activities
    - Completed Activities: {len(completed_activity_ids)}

    Available Activity Types: {', '.join([t.value for t in ActivityType])}

    Create an optimal learning sequence by responding ONLY in valid JSON format:
    {{
        "adaptive_sequence": [<first 10 activity IDs from the available list>],
        "rationale": "<explanation of why this sequence works for this child>",
        "estimated_completion_days": <estimated days to complete>,
        "focus_areas": [<list of specific skills to focus on>],
        "milestones": [<list of key milestones to expect>]
    }}

    Consider:
    1. Start with activities addressing weak areas
    2. Build confidence with achievable challenges
    3. Include variety to maintain engagement
    4. Progress from simpler to more complex
    """

    try:
        with track_ai_call():
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=learning_prompt
            )
        result_text = response.text.strip()

        # Extract JSON
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()

        ai_result = json.loads(result_text)

        # Ensure we have activities to return
        if not ai_result.get("adaptive_sequence"):
            ai_result["adaptive_sequence"] = remaining[:10]

        return ai_result

    except Exception as e:
        print(f"Learning Path Generation Error: {e}")
        # Fallback to simple sequence
        return {
            "adaptive_sequence": remaining[:10],
            "rationale": f"Prioritized for Level {literacy_level}, focusing on: {', '.join(weak_areas) if weak_areas else 'general practice'}.",
            "estimated_completion_days": max(1, len(remaining) // 3),
            "focus_areas": weak_areas,
            "milestones": ["Complete first activities successfully", "Build confidence", "Progress to next level"]
        }


# ─────────────────────────────────────────────
# 3. ACTIVITY PERFORMANCE SCORING
# ─────────────────────────────────────────────
def score_activity(
    activity_type: str,
    answers: List[str],
    correct_answers: List[str],
    time_per_question: List[int],
    difficulty_level: str,
) -> Dict[str, Any]:
    """
    AI-enhanced activity scoring with personalized feedback
    """
    total = len(correct_answers)
    if total == 0:
        return {"score": 0, "passed": False, "stars_earned": 0, "weak_areas": [], "next_difficulty_recommendation": difficulty_level, "ai_feedback": ""}

    correct = sum(1 for a, c in zip(answers, correct_answers) if a.strip().lower() == c.strip().lower())
    accuracy = (correct / total) * 100

    # Time bonus calculation
    avg_time = sum(time_per_question) / len(time_per_question) if time_per_question else 30
    time_bonus = 10 if avg_time < 10 else (5 if avg_time < 20 else 0)
    score = min(100, int(accuracy) + time_bonus)
    passed = accuracy >= 60

    # Star calculation
    stars = 1 if accuracy >= 40 else 0
    if accuracy >= 70:
        stars = 2
    if accuracy >= 90:
        stars = 3

    # Difficulty progression
    difficulty_map = {
        "beginner": "easy", "easy": "medium", "medium": "hard",
        "hard": "advanced", "advanced": "advanced"
    }
    next_diff = difficulty_map.get(difficulty_level, difficulty_level) if passed else difficulty_level

    # AI Feedback
    feedback_prompt = f"""
    Provide encouraging, age-appropriate feedback for a child who just completed a {activity_type} activity:
    - Score: {score}/100 ({accuracy:.0f}% accuracy)
    - Questions: {correct}/{total} correct
    - Time: {avg_time:.1f}s per question
    - Result: {'Passed!' if passed else 'Keep practicing!'}

    Give 1-2 sentences of encouragement. Be specific about what they did well and what to practice.
    Keep it simple and positive for a child.
    """

    try:
        with track_ai_call():
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=feedback_prompt
            )
        ai_feedback = response.text.strip()
    except Exception as e:
        ai_feedback = f"Great effort! You got {accuracy:.0f}% correct. " + ("Keep practicing!" if not passed else "You're doing amazing!")

    return {
        "score": score,
        "passed": passed,
        "stars_earned": stars,
        "weak_areas": [],
        "next_difficulty_recommendation": next_diff,
        "ai_feedback": ai_feedback
    }


# ─────────────────────────────────────────────
# 4. PARENT RECOMMENDATIONS
# ─────────────────────────────────────────────
def generate_parent_recommendations(
    child_name: str,
    literacy_level: int,
    recent_weak_areas: List[str],
    streak_days: int,
) -> List[str]:
    """
    Generate personalized, AI-powered recommendations for parents
    """
    recommendations_prompt = f"""
    You are a child dyslexia specialist providing personalized recommendations to parents.

    Child Information:
    - Name: {child_name}
    - Intervention Level: {literacy_level}/5
    - Areas Needing Focus: {', '.join(recent_weak_areas) if recent_weak_areas else 'None - doing great!'}
    - Current Streak: {streak_days} days

    Provide 3-5 specific, actionable recommendations in this exact JSON format:
    {{
        "recommendations": [
            "<specific, encouraging tip 1>",
            "<specific, actionable tip 2>",
            "<specific home practice idea 3>",
            "<specific celebration idea 4>",
            "<specific resource suggestion 5>"
        ]
    }}

    Guidelines:
    - Be specific and actionable (not generic)
    - Include celebration ideas for progress
    - Suggest fun, engaging home activities
    - Consider the child's age and level
    - Be encouraging and supportive
    - Include cultural sensitivity if applicable
    - Focus on practical daily activities
    - Target dyslexia-specific challenges when appropriate
    - Emphasize multisensory learning techniques
    """

    try:
        print(f"Generating AI recommendations for {child_name} (Level {literacy_level}, Streak {streak_days})")
        with track_ai_call():
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=recommendations_prompt
            )
        result_text = response.text.strip()
        print(f"AI Response received: {result_text[:200]}...")

        # Extract JSON
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()

        ai_result = json.loads(result_text)
        recommendations = ai_result.get("recommendations", [])

        if recommendations:
            print(f"Successfully generated {len(recommendations)} AI recommendations")
            return recommendations
        else:
            print("AI returned empty recommendations, using fallback")
            return _fallback_parent_recommendations(child_name, literacy_level, recent_weak_areas, streak_days)

    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Raw response: {result_text}")
        return _fallback_parent_recommendations(child_name, literacy_level, recent_weak_areas, streak_days)
    except Exception as e:
        print(f"Parent Recommendations Error: {e}")
        import traceback
        print(traceback.format_exc())
        # Fallback to rule-based recommendations
        return _fallback_parent_recommendations(child_name, literacy_level, recent_weak_areas, streak_days)


def _fallback_parent_recommendations(child_name: str, literacy_level: int, recent_weak_areas: List[str], streak_days: int) -> List[str]:
    """Fallback recommendations if AI fails"""
    import random
    tips = []

    # Streak-based tips (more variety)
    streak_tips = [
        f"🌟 {child_name} has been on a {streak_days}-day streak! Celebrate this milestone together.",
        f"Amazing consistency! {streak_days} days of learning. Consider a small reward!",
        f"{streak_days} days strong! Time for a 'streak celebration' at home.",
    ]
    if streak_days >= 7:
        tips.append(random.choice(streak_tips))
    elif streak_days == 0:
        tips.append(f"Try to set a daily reading time with {child_name} — even 10 minutes makes a big difference!")

    # Level-based tips (more specific to dyslexia intervention)
    level_tips = {
        1: ["Focus on letter-sound relationships with multisensory activities", "Use sand, clay, or finger painting to practice letter shapes"],
        2: ["Practice blending sounds with simple word families", "Try 'chunking' words into smaller parts for easier reading"],
        3: ["Explore sight words with flashcard games", "Read short, decodable books together to build confidence"],
        4: ["Introduce longer texts with paragraph discussions", "Practice prediction skills while reading stories"],
        5: ["Challenge with chapter books and comprehension questions", "Encourage creative writing based on stories read"]
    }
    if literacy_level in level_tips:
        tips.extend(random.sample(level_tips[literacy_level], min(2, len(level_tips[literacy_level]))))

    # Weak area-specific tips (more dyslexia-focused)
    area_tips = {
        "letter_recognition": [
            "Use letter magnets on the fridge for daily recognition practice",
            "Play 'I spy' games focusing on letter shapes in the environment",
            "Try letter tracing in sand or shaving cream for multisensory learning"
        ],
        "phonics": [
            "Play rhyming games — 'What rhymes with cat? Hat, bat, mat!' — to strengthen phonics skills",
            "Use clapping or tapping to break words into individual sounds",
            "Practice letter sounds with a 'sound of the day' game"
        ],
        "vocabulary": [
            "Introduce 3 new words each week from stories you read together",
            "Create a 'word wall' of new vocabulary with pictures",
            "Play synonym/antonym games to expand word understanding"
        ],
        "reading_comprehension": [
            "After reading a story, ask open questions: 'What was your favorite part? Why did the character do that?'",
            "Practice making predictions while reading: 'What do you think happens next?'",
            "Have your child draw pictures of what they read to strengthen understanding"
        ],
        "phonetic_blending": [
            "Practice blending sounds with 'sound boxes' or tapping out words",
            "Use letter tiles to build and rebuild words step by step",
            "Try 'stretching out' words like rubber bands to hear all sounds"
        ],
        "sight_words": [
            "Play sight word memory games with flashcards",
            "Create a sight word bingo game for practice",
            "Use highlighters to find sight words in stories"
        ]
    }

    for area in recent_weak_areas:
        if area in area_tips:
            tips.append(random.choice(area_tips[area]))

    # General tips if needed
    general_tips = [
        f"{child_name} is doing great! Keep encouraging daily practice for 15–20 minutes.",
        "Visit your local library together — letting children choose builds motivation.",
        "Create a cozy reading corner at home to make reading time special.",
        "Use audiobooks alongside print books to reinforce reading skills.",
        "Practice reading at the same time each day to build routine.",
        "Celebrate small wins to build confidence and motivation."
    ]

    # Fill up to 5 tips if needed
    while len(tips) < 5 and general_tips:
        tips.append(general_tips.pop(0))

    return tips[:5]


# ─────────────────────────────────────────────
# 5. ACTIVITY GENERATION
# ─────────────────────────────────────────────
def generate_activities_for_child(
    child_id: int,
    child_name: str,
    child_age: int,
    literacy_level: int,
    weak_areas: List[str],
    native_language: str,
    completed_activities: List[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """
    Generate personalized activities based on AI assessment
    This creates activities that will be stored in the database

    Args:
        completed_activities: List of activities child has already completed to avoid duplication
    """
    # Build completed activity summary for AI
    completed_summary = ""
    if completed_activities:
        completed_types = {}
        completed_letters = set()

        for act in completed_activities:
            act_type = act.get("activity_type", "unknown")
            completed_types[act_type] = completed_types.get(act_type, 0) + 1

            content = act.get("activity_content", {})
            if "letter" in content:
                completed_letters.add(content["letter"])
            if "words" in content:
                for word in content["words"]:
                    if word:  # Add first letter of each word
                        completed_letters.add(word[0].upper())

        completed_summary = f"""
        Previously Completed Activities (DO NOT repeat these exact combinations):
        - Activity Types Completed: {dict(completed_types)}
        - Letters/Words Already Used: {', '.join(sorted(completed_letters))}
        - Total Completed: {len(completed_activities)} activities

        IMPORTANT: Create NEW activities with:
        - Different letters if possible (prefer letters not in {sorted(completed_letters)})
        - New word combinations (avoid words used in completed activities)
        - Different activity variations (harder/longer/more complex versions)
        - Fresh, engaging content that builds on previous learning
        """

    # Letter groups based on literacy level
    letter_groups = {
        1: ['S', 'A', 'T', 'I', 'P', 'N'],
        2: ['C', 'K', 'E', 'H', 'R', 'M', 'D'],
        3: ['G', 'O', 'U', 'L', 'F', 'B'],
        4: ['J', 'V', 'W', 'X'],
        5: ['Y', 'Z', 'Q']
    }

    current_letters = letter_groups.get(literacy_level, letter_groups[1])

    # Build emoji mapping for current letters
    emoji_mapping = {}
    for letter in current_letters:
        if letter in LETTER_EMOJI_MAPPING:
            emoji_mapping[letter] = LETTER_EMOJI_MAPPING[letter]

    activity_generation_prompt = f"""
    You are a specialized curriculum designer for children's literacy education.

    Child Profile:
    - Name: {child_name}
    - Age: {child_age} years old
    - Literacy Level: {literacy_level}/5
    - Native Language: {native_language}
    - Areas Needing Focus: {', '.join(weak_areas) if weak_areas else 'General practice'}
    - Current Letter Group: {', '.join(current_letters)}

    {completed_summary}

    Available Activity Types: {', '.join([t.value for t in ActivityType])}

    EMOJI MAPPING FOR CURRENT LETTERS (CRITICAL - USE THESE EXACT EMOJIS):
    {json.dumps(emoji_mapping, indent=2)}

    Create 20-30 specific learning activities personalized for this child. Focus on VARIETY and NO Repetition.

    Respond ONLY in valid JSON format:
    {{
        "activities": [
            {{
                "activity_name": "<specific unique name like 'Master Letter G Advanced' or 'Blend Sounds GO New Words'>",
                "activity_type": "<one of the available types>",
                "difficulty_level": "<beginner|easy|medium|hard|advanced>",
                "estimated_duration_minutes": <5-15>,
                "activity_content": {{
                    "instruction": "<clear, simple instruction for the child>",
                    "letter": "<single letter if applicable>",
                    "words": [<list of 3-5 DIFFERENT words for word activities>],
                    "word_emojis": [<list of matching emojis from the mapping above for each word>],
                    "questions": [<list of questions for assessment activities>],
                    "story": "<short story text for story activities>"
                }},
                "activity_group": "<letter group like 'group_1' for SATPIN letters>",
                "mascot_character": "<fun mascot name>",
                "is_boss_level": false
            }}
        ]
    }}

    Critical Guidelines:
    - EMOJIS: You MUST include "word_emojis" array in activity_content with matching emojis for each word from the provided mapping
    - Use EXACT words and emojis from the mapping above for the current letter group
    - NEVER repeat exact same activity type + letter combinations
    - Use NEW words that weren't in completed activities
    - If practicing same letters, make activities HARDER/DIFFERENT (longer words, sentences, comprehension)
    - Introduce activity types not commonly used before
    - Focus on weak areas while maintaining variety
    - Use age-appropriate but CHALLENGING content
    - Make activities feel fresh and exciting, not repetitive
    - Consider native language for cultural relevance
    - Create activities that build on previous learning but aren't identical
    """

    try:
        with track_ai_call():
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=activity_generation_prompt
            )
        result_text = response.text.strip()

        # Extract JSON
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()

        ai_result = json.loads(result_text)

        # Add Child_ID to each activity
        activities = ai_result.get("activities", [])
        for activity in activities:
            activity["Child_ID"] = child_id
            activity["language"] = native_language

        return activities

    except Exception as e:
        # Return basic fallback activities
        return _generate_fallback_activities(child_id, literacy_level, weak_areas, native_language, completed_activities)


def _generate_fallback_activities(child_id: int, literacy_level: int, weak_areas: List[str], native_language: str, completed_activities: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Generate basic activities if AI fails - with variety to avoid repetition"""
    # Letter groups based on literacy level
    letter_groups = {
        1: ['S', 'A', 'T', 'I', 'P', 'N'],
        2: ['C', 'K', 'E', 'H', 'R', 'M', 'D'],
        3: ['G', 'O', 'U', 'L', 'F', 'B'],
        4: ['J', 'V', 'W', 'X'],
        5: ['Y', 'Z', 'Q']
    }

    letters = letter_groups.get(literacy_level, letter_groups[1])

    # Track what letters/activities have been used to avoid repetition
    used_combinations = set()
    if completed_activities:
        for act in completed_activities:
            act_type = act.get("activity_type", "")
            content = act.get("activity_content", {})
            letter = content.get("letter", "")
            if act_type and letter:
                used_combinations.add(f"{act_type}_{letter}")

    # Use emoji mapping for word banks - provides words AND matching emojis
    word_banks = {}
    for letter in letters:
        if letter in LETTER_EMOJI_MAPPING:
            word_banks[letter] = LETTER_EMOJI_MAPPING[letter]
        else:
            # Fallback to basic words if letter not in mapping
            word_banks[letter] = [{'word': letter.lower() + 'ad', 'emoji': '📝'},
                                  {'word': letter.lower() + 'ed', 'emoji': '📖'},
                                  {'word': letter.lower() + 'id', 'emoji': '✏️'}]

    activities = []
    activity_variations = [
        ("meet_letter", "beginner", 8, "Let's learn about the letter {letter}!"),
        ("hear_sound", "beginner", 6, "Listen to the sound that letter {letter} makes!"),
        ("say_yourself", "easy", 7, "Practice saying the letter {letter} sound!"),
        ("trace_write", "easy", 10, "Trace and write the letter {letter}!"),
        ("mini_quest", "medium", 12, "Find the letter {letter} in these words!"),
        ("action_story", "medium", 10, "Story time with letter {letter} words!"),
    ]

    # Generate varied activities for each letter
    for letter in letters:
        letter_words_data = word_banks.get(letter, [{'word': letter + 'ad', 'emoji': '📝'},
                                                   {'word': letter + 'ed', 'emoji': '📖'},
                                                   {'word': letter + 'id', 'emoji': '✏️'}])
        word_sets = [letter_words_data[i:i+3] for i in range(0, len(letter_words_data), 3)]

        for i, (act_type, difficulty, duration, instruction_template) in enumerate(activity_variations):
            # Skip if this exact combination was used before
            combo_key = f"{act_type}_{letter}"
            if combo_key in used_combinations:
                # Try a different variation
                continue

            # Use different word sets for variety
            word_set_data = word_sets[i % len(word_sets)] if word_sets else letter_words_data[:3]
            word_set = [item['word'] for item in word_set_data]
            emoji_set = [item['emoji'] for item in word_set_data]

            activity_content = {
                "instruction": instruction_template.format(letter=letter),
                "letter": letter,
                "words": word_set,
                "word_emojis": emoji_set
            }

            activities.append({
                "activity_name": f"{act_type.replace('_', ' ').title()} {letter}",
                "activity_type": act_type,
                "difficulty_level": difficulty,
                "estimated_duration_minutes": duration,
                "activity_content": activity_content,
                "activity_group": f"group_{literacy_level}",
                "mascot_character": f"Friendly {letter} Guide",
                "is_boss_level": False,
                "Child_ID": child_id,
                "language": native_language
            })

    # Add some boss level activities (word builders) with variety
    boss_letters = [l for l in letters if l not in ['G', 'O', 'U', 'L', 'F', 'B'] or l in ['G', 'O', 'U', 'L', 'F', 'B']][:3]  # Select 3 letters for boss levels
    for letter in boss_letters:
        combo_key = f"sound_blender_{letter}"
        if combo_key not in used_combinations:
            letter_words_data = word_banks.get(letter, [{'word': letter + 'ad', 'emoji': '📝'},
                                                       {'word': letter + 'ed', 'emoji': '📖'},
                                                       {'word': letter + 'id', 'emoji': '✏️'}])
            letter_words = [item['word'] for item in letter_words_data[:5]]
            letter_emojis = [item['emoji'] for item in letter_words_data[:5]]

            activities.append({
                "activity_name": f"Sound Blender with {letter} Words",
                "activity_type": "sound_blender",
                "difficulty_level": "medium",
                "estimated_duration_minutes": 12,
                "activity_content": {
                    "instruction": f"Let's blend sounds to make {letter} words!",
                    "letter": letter,
                    "words": letter_words,
                    "word_emojis": letter_emojis
                },
                "activity_group": f"group_{literacy_level}_words",
                "mascot_character": f"Word Builder {letter}",
                "is_boss_level": True,
                "Child_ID": child_id,
                "language": native_language
            })

            # Also add word builder
            activities.append({
                "activity_name": f"Word Builder with {letter}",
                "activity_type": "word_builder",
                "difficulty_level": "medium",
                "estimated_duration_minutes": 15,
                "activity_content": {
                    "instruction": f"Build words with the letter {letter}!",
                    "letter": letter,
                    "words": letter_words,
                    "word_emojis": letter_emojis
                },
                "activity_group": f"group_{literacy_level}_words",
                "mascot_character": f"Word Expert {letter}",
                "is_boss_level": True,
                "Child_ID": child_id,
                "language": native_language
            })

    return activities


# ─────────────────────────────────────────────
# 6. PROGRESS REPORT GENERATION
# ─────────────────────────────────────────────
def generate_child_progress_report(
    child_name: str,
    child_age: int,
    literacy_level: int,
    activities_completed: List[Dict[str, Any]],
    assessment_history: List[Dict[str, Any]],
    engagement_data: Dict[str, Any],
    achievements: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Generate comprehensive AI-powered progress report for parents
    Focus on Academic Progress and Engagement Insights
    """
    # Build comprehensive report prompt
    report_prompt = f"""
    You are an expert children's literacy educator creating a comprehensive progress report for parents.

    Child Information:
    - Name: {child_name}
    - Age: {child_age} years old
    - Current Literacy Level: {literacy_level}/5

    Academic Performance:
    - Total Activities Completed: {len(activities_completed)}
    - Assessment History: {len(assessment_history)} assessments completed
    - Current Accuracy: {assessment_history[-1].get('accuracy_percentage', 0) if assessment_history else 0}%

    Engagement Data:
    - Learning Streak: {engagement_data.get('streak_days', 0)} days
    - Time Spent Learning: {engagement_data.get('total_time_minutes', 0)} minutes
    - Favorite Activities: {', '.join(engagement_data.get('favorite_activities', ['None yet']))}

    Achievements Earned: {len(achievements)}

    Activities Breakdown:
    {json.dumps(activities_completed[:10], indent=2) if activities_completed else "No activities yet"}

    Assessment History:
    {json.dumps(assessment_history[-3:], indent=2) if assessment_history else "No assessments yet"}

    Please generate a comprehensive progress report in this exact JSON format:
    {{
        "academic_progress": {{
            "current_level": "<Level description and status>",
            "skills_mastered": ["<skill 1>", "<skill 2>", "<skill 3>"],
            "skills_in_progress": ["<skill 1>", "<skill 2>"],
            "activities_summary": "<Summary of completed activities and performance>",
            "performance_trend": "<improving/stable/needs_work>",
            "next_academic_milestones": ["<milestone 1>", "<milestone 2>"]
        }},
        "engagement_insights": {{
            "learning_consistency": "<Description of learning patterns>",
            "best_performance_times": "<When child performs best>",
            "engagement_strengths": ["<strength 1>", "<strength 2>"],
            "total_learning_time": "<Total time with context>",
            "activity_preferences": ["<preference 1>", "<preference 2>"],
            "motivation_patterns": "<Description of what motivates the child>"
        }},
        "ai_recommendations": [
            "<Specific academic recommendation 1>",
            "<Specific engagement recommendation 2>",
            "<Home practice suggestion 3>",
            "<Celebration idea 4>",
            "<Next steps focus 5>"
        ],
        "parent_encouragement": "<Encouraging message for parents about child's progress>",
        "celebration_points": [
            "<Achievement 1 to celebrate>",
            "<Progress milestone 2>",
            "<Effort or improvement 3>"
        ]
    }}

    Guidelines:
    - Be specific and personalized using the child's name ({child_name})
    - Focus on ACADEMIC PROGRESS (literacy skills, reading development, phonics mastery)
    - Focus on ENGAGEMENT INSIGHTS (learning patterns, motivation, consistency)
    - Be encouraging and supportive while being honest about areas needing work
    - Include specific, actionable recommendations for home support
    - Consider the child's age ({child_age}) for age-appropriate suggestions
    - Highlight progress and achievements to celebrate
    - Provide clear next steps for continued learning
    - Keep language simple and encouraging for parents
    """

    try:
        with track_ai_call():
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=report_prompt
            )
        result_text = response.text.strip()

        # Extract JSON
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()

        ai_report = json.loads(result_text)

        # Add metadata
        ai_report["child_name"] = child_name
        ai_report["child_age"] = child_age
        ai_report["report_date"] = json.dumps(engagement_data.get("report_date", {}))
        ai_report["literacy_level"] = literacy_level
        ai_report["total_activities"] = len(activities_completed)
        ai_report["total_assessments"] = len(assessment_history)
        ai_report["achievements_count"] = len(achievements)

        return ai_report

    except Exception as e:
        print(f"Progress Report Generation Error: {e}")
        # Fallback to rule-based report
        return _fallback_progress_report(
            child_name, child_age, literacy_level, activities_completed,
            assessment_history, engagement_data, achievements
        )


def _fallback_progress_report(
    child_name: str,
    child_age: int,
    literacy_level: int,
    activities_completed: List[Dict[str, Any]],
    assessment_history: List[Dict[str, Any]],
    engagement_data: Dict[str, Any],
    achievements: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Fallback progress report if AI fails"""
    # Calculate basic metrics
    total_activities = len(activities_completed)
    recent_accuracy = assessment_history[-1].get('accuracy_percentage', 0) if assessment_history else 0
    streak_days = engagement_data.get('streak_days', 0)

    # Format time nicely
    def format_time(minutes):
        if minutes < 60:
            return f"{minutes} minutes"
        elif minutes < 120:
            return "1 hour"
        else:
            hours = minutes // 60
            mins = minutes % 60
            if mins == 0:
                return f"{hours} hours"
            else:
                return f"{hours} hours {mins} minutes"

    total_time_minutes = engagement_data.get('total_time_minutes', 0)
    formatted_time = format_time(total_time_minutes)

    # Determine skills based on level
    level_skills = {
        1: ["Letter recognition", "Basic phonics", "Letter sounds"],
        2: ["Letter formation", "Simple words", "Basic blending"],
        3: ["Word blending", "Sight words", "Simple sentences"],
        4: ["Reading comprehension", "Vocabulary building", "Story understanding"],
        5: ["Advanced reading", "Complex sentences", "Critical thinking"]
    }

    current_skills = level_skills.get(literacy_level, ["Early literacy skills"])

    return {
        "child_name": child_name,
        "child_age": child_age,
        "literacy_level": literacy_level,
        "report_date": engagement_data.get("report_date", {}),
        "total_activities": total_activities,
        "total_assessments": len(assessment_history),
        "achievements_count": len(achievements),

        "academic_progress": {
            "current_level": f"Level {literacy_level} - {'Beginner' if literacy_level <= 2 else 'Progressing' if literacy_level == 3 else 'Advanced'}",
            "skills_mastered": current_skills[:2],
            "skills_in_progress": current_skills[2:],
            "activities_summary": f"{child_name} has completed {total_activities} learning activities and is making good progress.",
            "performance_trend": "improving" if recent_accuracy >= 70 else "developing" if recent_accuracy >= 50 else "needs_practice",
            "next_academic_milestones": [
                f"Complete Level {literacy_level} activities",
                f"Master {current_skills[0].lower()}",
                "Progress to next literacy level"
            ]
        },
        "engagement_insights": {
            "learning_consistency": f"{streak_days} day learning streak" if streak_days >= 3 else "Building learning consistency",
            "best_performance_times": "Morning sessions show best focus",
            "engagement_strengths": [f"Completed {total_activities} activities", f"{'Strong daily commitment' if streak_days >= 5 else 'Developing learning habits'}"],
            "total_learning_time": formatted_time,
            "activity_preferences": engagement_data.get("favorite_activities", ["Various learning activities"]),
            "motivation_patterns": f"{child_name} responds well to interactive and engaging learning content"
        },
        "ai_recommendations": [
            f"Practice {current_skills[0].lower()} for 10-15 minutes daily",
            "Read together for 20 minutes each day",
            f"Celebrate completing {total_activities} activities - great progress!",
            "Try new activities to keep learning fresh and engaging",
            f"Focus on consistency to build a longer learning streak"
        ],
        "parent_encouragement": f"{child_name} is making wonderful progress in literacy! Keep up the great work with daily reading and learning activities.",
        "celebration_points": [
            f"Completed {total_activities} learning activities",
            f"{'Maintained ' + str(streak_days) + ' day streak!' if streak_days >= 3 else 'Building learning consistency'}",
            f"{'Earned ' + str(len(achievements)) + ' achievements!' if achievements else 'Making great progress'}"
        ]
    }


# ─────────────────────────────────────────────
# 7. BOSS LEVEL PERFORMANCE ANALYSIS
# ─────────────────────────────────────────────
def analyze_boss_level_performance(
    child_name: str,
    child_age: int,
    current_level: int,
    boss_level_performance: Dict[str, Any],
    completed_group: str,
) -> Dict[str, Any]:
    """
    AI analyzes boss level performance to decide if child should advance to next level
    Returns decision and appropriate activity generation parameters
    """
    performance_prompt = f"""
    You are an expert children's literacy educator specializing in reading assessment.

    Child Information:
    - Name: {child_name}
    - Age: {child_age} years old
    - Current Literacy Level: {current_level}/5
    - Just Completed: {completed_group} (including boss level activities)

    Boss Level Performance Data:
    {json.dumps(boss_level_performance, indent=2)}

    Please analyze this performance and decide if the child is ready to advance to the next literacy level.

    Consider:
    1. Accuracy percentage (is it consistently high?)
    2. Stars earned (3 stars = excellent, 2 stars = good, 1 star = needs work)
    3. Time taken (was it appropriate for the difficulty?)
    4. Error patterns (are there consistent weaknesses?)
    5. Overall mastery demonstration

    Respond ONLY in valid JSON format with this exact structure:
    {{
        "ready_for_next_level": <true or false>,
        "confidence_score": <0.0-1.0 how confident are you in this decision>,
        "decision_rationale": "<clear explanation of your decision for parents>",
        "specific_strengths": [<list of areas the child demonstrated strength>],
        "areas_needing_work": [<list of specific areas needing more practice>],
        "recommended_focus": "<specific skill to focus on next>",
        "next_level_suggestion": <if ready, the next level number; if not, current level>,
        "practice_needed": <if not ready, list specific practice types needed>
    }}

    Level Advancement Guidelines:
    - Advance to next level: 85%+ accuracy, 3 stars, appropriate time, strong understanding
    - More practice needed: <85% accuracy, 1-2 stars, significant time struggles, clear weak areas
    - Consider marginal cases: 75-85% accuracy, 2 stars, some weaknesses but potential
    """

    try:
        with track_ai_call():
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=performance_prompt
            )
        result_text = response.text.strip()

        # Extract JSON
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()

        ai_result = json.loads(result_text)

        # Ensure all required fields are present
        if "ready_for_next_level" not in ai_result:
            ai_result["ready_for_next_level"] = False
        if "confidence_score" not in ai_result:
            ai_result["confidence_score"] = 0.5
        if "next_level_suggestion" not in ai_result:
            ai_result["next_level_suggestion"] = current_level if not ai_result["ready_for_next_level"] else min(current_level + 1, 5)

        return ai_result

    except Exception as e:
        print(f"Boss Level Analysis Error: {e}")
        # Fallback to rule-based decision
        return _fallback_boss_level_analysis(boss_level_performance, current_level)


def _fallback_boss_level_analysis(performance: Dict[str, Any], current_level: int) -> Dict[str, Any]:
    """Fallback rule-based boss level analysis if AI fails"""
    accuracy = performance.get("accuracy_percentage", 0)
    stars = performance.get("stars_earned", 0)
    passed = performance.get("passed", False)

    # Rule-based decision
    ready = accuracy >= 85 and stars >= 3 and passed

    return {
        "ready_for_next_level": ready,
        "confidence_score": 0.7,
        "decision_rationale": f"Based on performance: {accuracy:.0f}% accuracy, {stars} stars earned. {'Ready for next level' if ready else 'More practice needed'}",
        "specific_strengths": ["completed activities"] if ready else [],
        "areas_needing_work": ["accuracy", "consistency"] if not ready else [],
        "recommended_focus": "continue practice" if not ready else "next level challenges",
        "next_level_suggestion": current_level + 1 if ready else current_level,
        "practice_needed": ["more activities"] if not ready else []
    }