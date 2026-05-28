from pydantic import ValidationError
from app.models.schemas import AnswerSubmit

# Test data similar to what's sent from React:
test_payloads = [
    # 1. Standard payload
    {
        "question_id": 1,
        "question_type": "capital_to_lowercase_match",
        "question_content": '{"id":1,"order":1,"group":"letter_word_recognition"}',
        "correct_answer": "a",
        "child_answer": "a",
        "is_correct": True,
        "time_spent_seconds": 5
    },
    # 2. Payload with empty strings / None
    {
        "question_id": 1,
        "question_type": None,
        "question_content": None,
        "correct_answer": None,
        "child_answer": "a",
        "is_correct": None,
        "time_spent_seconds": 0
    },
    # 3. Payload with missing optional fields
    {
        "question_id": 1,
        "child_answer": "a",
        "time_spent_seconds": 12
    },
    # 4. What about list of answers?
    {
        "question_id": 1,
        "question_type": "image_adjective_selection",
        "question_content": "{}",
        "correct_answer": '["Light","Wide","Long"]',
        "child_answer": '["Light","Wide","Long"]',
        "is_correct": True,
        "time_spent_seconds": 10
    }
]

for idx, payload in enumerate(test_payloads, 1):
    try:
        obj = AnswerSubmit(**payload)
        print(f"Payload {idx}: VALIDated successfully!")
    except ValidationError as e:
        print(f"Payload {idx} FAILED validation:")
        print(e.json(indent=2))
