# Literacy Evaluation Seed Data
**Project:** Children's Literacy Assessment (Ages 3–8)  
**Questions:** 25 | **Languages:** English & Arabic | **Format:** JSON

---

## File

```
literacy_questions_seed.json
```

---

## Structure Overview

Each question object contains the following fields:

| Field | Type | Description |
|---|---|---|
| `id` | number | Unique question ID |
| `order` | number | Display order in the assessment |
| `group` | string | Which block the question belongs to |
| `type` | string | The specific question mechanic |
| `title_en` / `title_ar` | string | Display title in English / Arabic |
| `instruction_en` / `instruction_ar` | string | User-facing instruction |
| `stimulus` | object \| null | What is shown/played to the user |
| `options` | array \| null | Answer choices (where applicable) |
| `correct_answer` | string \| null | The correct answer key |
| `depends_on` | number \| null | ID of the question this one depends on |
| `measures` | array | Extra data points recorded (e.g. reading time) |

---

## Question Groups & Sequencing

### Group 1 — `letter_word_recognition` (Q1–Q8)
Standalone questions. No dependencies between them.

| ID | Type | Mechanic |
|---|---|---|
| 1 | `capital_to_lowercase_match` | Hear a capital letter → pick the lowercase |
| 2 | `lowercase_to_capital_match` | Hear a lowercase letter → pick the capital |
| 3 | `word_starts_with_letter` | Given a letter → pick the word that starts with it |
| 4 | `word_ends_with_letter` | Given a letter → pick the word that ends with it |
| 5 | `image_to_word_match` | See an image → pick the correct word |
| 6 | `heard_word_to_written` | Hear a word → find it among written options |
| 7 | `written_word_to_sound` | See a word → pick the matching audio |
| 8 | `letter_to_image_sound_match` | See a letter → click images to hear names → pick matching |

---

### Group 2 — `image_comprehension` (Q9–Q10)
Standalone questions. No dependencies.

| ID | Type | Mechanic |
|---|---|---|
| 9 | `image_adjective_selection` | See image → select **3** correct adjectives |
| 10 | `image_action_sentence` | See image → select the sentence describing the action |

---

### Group 3 — `reading_block_1` (Q11–Q14)
⚠️ **Q12, Q13, Q14 all depend on Q11.** Must be presented after Q11.

| ID | Type | Mechanic | depends_on |
|---|---|---|---|
| 11 | `reading_timed` | Read passage, press Finished (time recorded) | — |
| 12 | `comprehension_hero` | Who is the hero of the story? | 11 |
| 13 | `comprehension_action` | What did the character do/see? | 11 |
| 14 | `comprehension_detail_color` | What color was mentioned? | 11 |

---

### Group 4 — `reading_block_2` (Q15–Q18)
⚠️ **Q16, Q17, Q18 all depend on Q15.** The same passage is re-displayed for interaction.

| ID | Type | Mechanic | depends_on |
|---|---|---|---|
| 15 | `reading_timed` | Read longer passage, press Finished (time recorded) | — |
| 16 | `word_location_in_text` | Passage shown again → click on a specific word | 15 |
| 17 | `adjective_location_in_text` | Passage shown again → click on a specific adjective/color | 15 |
| 18 | `grammatical_elements_selection` | Passage shown again → select **3** verbs/nouns/adjectives | 15 |

---

### Group 5 — `visual_discrimination_grammar` (Q19–Q22)
Standalone questions. No dependencies.

| ID | Type | Mechanic |
|---|---|---|
| 19 | `letter_visual_discrimination` | Find the correctly oriented letter in a grid of distorted ones |
| 20 | `odd_letter_frequency` | Find the letter that appears 3× (others appear 2×) |
| 21 | `identify_verb_in_sentence` | Short sentence → click the verb |
| 22 | `identify_subject_in_sentence` | Longer sentence → click the subject |

---

### Group 6 — `reading_block_3` (Q23–Q25)
⚠️ **Q24 and Q25 both depend on Q23.** Must be presented after Q23.

| ID | Type | Mechanic | depends_on |
|---|---|---|---|
| 23 | `reading_timed` | Read final passage, press Finished (time recorded) | — |
| 24 | `comprehension_sequence` | What happened first chronologically? | 23 |
| 25 | `comprehension_title_selection` | Choose the best title for the story | 23 |

---

## Dependency Graph

```
Q1  Q2  Q3  Q4  Q5  Q6  Q7  Q8   ← standalone
Q9  Q10                           ← standalone

Q11 ──► Q12
    ──► Q13
    ──► Q14

Q15 ──► Q16
    ──► Q17
    ──► Q18

Q19  Q20  Q21  Q22               ← standalone

Q23 ──► Q24
    ──► Q25
```

---

## Seeding Instructions

### Node.js / JavaScript
```js
const fs = require('fs');
const questions = JSON.parse(fs.readFileSync('./literacy_questions_seed.json', 'utf8'));
await Question.insertMany(questions); // MongoDB example
```

### Python / Django
```python
import json
from myapp.models import Question

with open('literacy_questions_seed.json') as f:
    data = json.load(f)

Question.objects.bulk_create([Question(**q) for q in data])
```

### Laravel / PHP
```php
$questions = json_decode(file_get_contents('literacy_questions_seed.json'), true);
foreach ($questions as $q) {
    Question::create($q);
}
```

---

## Notes

- **`stimulus.text_ref`** — For questions 16, 17, 18: the value references `id` of the reading passage question (15). Your frontend should fetch and re-display that passage.
- **`correct_answers_count`** — For multi-select questions (Q9, Q18), this tells you how many correct selections are required.
- **`audio_key` / `image_key`** — These are placeholder keys. Replace with actual file paths or CDN URLs in your media table.
- **`measures`** — For timed reading questions (Q11, Q15, Q23), record `reading_time_seconds` from when the passage is shown until the user clicks "Finished".
- **Grid randomization** — For Q19 and Q20, the `grid` arrays should be shuffled per session to prevent memorization.
