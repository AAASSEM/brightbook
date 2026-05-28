"""
Seed ALL learning activities for Groups 1-5 (all 26 English letters + word activities).
Run: python scripts/seed_learning_activities.py
"""
import sys, os, json
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlmodel import Session, select
from app.config.database import engine, create_db_and_tables
from app.models.models import Activity, Child, Level, Progress, ActivityProgress, ChildProgress
from app.models.enums import ActivityType

# ─── LETTER GROUPS ────────────────────────────────────────────────────────────
LETTER_GROUPS = {
    'group_1': ['S', 'A', 'T', 'I', 'P', 'N'],
    'group_2': ['C', 'K', 'E', 'H', 'R', 'M', 'D'],
    'group_3': ['G', 'O', 'U', 'L', 'F', 'B'],
    'group_4': ['J', 'V', 'W', 'X'],
    'group_5': ['Y', 'Z', 'Q'],
}

ARABIC_LETTER_GROUPS = {
    'group_1': ['ا', 'ب', 'ت', 'ث'],
    'group_2': ['ن', 'ي', 'م', 'ل'],
    'group_3': ['د', 'ذ', 'ر', 'ز'],
    'group_4': ['س', 'ش', 'ص', 'ض'],
    'group_5': ['ج', 'ح', 'خ'],
    'group_6': ['ع', 'غ', 'ف', 'ق'],
    'group_7': ['ك', 'هـ', 'و', 'ء'],
    'group_8': ['ط', 'ظ'],
}

# ─── MASCOT DATA ─────────────────────────────────────────────────────────────
MASCOTS = {
    'A':'Annie Ant','B':'Buddy Bear','C':'Clever Cat','D':'Dippy Duck',
    'E':'Eddy Elephant','F':'Fluffy Fish','G':'Goofy Giraffe','H':'Harry Horse',
    'I':'Iggy Iguana','J':'Jumpy Jellyfish','K':'Kicking Kangaroo','L':'Lucy Lion',
    'M':'Munching Mouse','N':'Ned Newt','O':'Olly Octopus','P':'Perry Pig',
    'Q':'Queen Quail','R':'Robber Rabbit','S':'Sammy Snake','T':'Timmy Tiger',
    'U':'Uppy Unicorn','V':'Vicky Vulture','W':'Wally Walrus','X':'X-ray Fox',
    'Y':'Yoyo Yak','Z':'Zippy Zebra',
}

ARABIC_MASCOTS = {
    'ا':'الأسد الكبير','ب':'البطة الجميلة','ت':'التفاحة الحلوة','ث':'الثعلب الذكي',
    'ن':'النحلة النشيطة','ي':'اليمامة','م':'القرد ميمون','ل':'الليمون الحامض',
    'س':'السمكة سلمى','ش':'الشمس المشرقة'
}

PHONETICS = {
    'A':'/ahhh/','B':'/buh/','C':'/kuh/','D':'/duh/','E':'/ehhh/',
    'F':'/fuh/','G':'/guh/','H':'/huh/','I':'/ihhh/','J':'/juh/',
    'K':'/kuh/','L':'/luh/','M':'/muh/','N':'/nuh/','O':'/awww/',
    'P':'/puh/','Q':'/kwuh/','R':'/ruh/','S':'/suh/','T':'/tuh/',
    'U':'/uhhh/','V':'/vuh/','W':'/wuh/','X':'/ks/','Y':'/yuh/','Z':'/zuh/',
}

ARABIC_PHONETICS = {
    'ا':'/ا/','ب':'/ب/','ت':'/ت/','ث':'/ث/',
    'ن':'/ن/','ي':'/ي/','م':'/م/','ل':'/ل/',
    'س':'/س/','ش':'/ش/'
}

EXAMPLES = {
    'A':[{'word':'APPLE','emoji':'🍎'},{'word':'ANT','emoji':'🐜'},{'word':'ARROW','emoji':'➡️'}],
    'B':[{'word':'BEAR','emoji':'🐻'},{'word':'BALL','emoji':'⚽'},{'word':'BANANA','emoji':'🍌'}],
    'C':[{'word':'CAT','emoji':'🐱'},{'word':'CAR','emoji':'🚗'},{'word':'CAKE','emoji':'🎂'}],
    'D':[{'word':'DUCK','emoji':'🦆'},{'word':'DOG','emoji':'🐶'},{'word':'DRUM','emoji':'🥁'}],
    'E':[{'word':'EGG','emoji':'🥚'},{'word':'EEL','emoji':'🐍'},{'word':'EAGLE','emoji':'🦅'}],
    'F':[{'word':'FISH','emoji':'🐟'},{'word':'FROG','emoji':'🐸'},{'word':'FIRE','emoji':'🔥'}],
    'G':[{'word':'GIRAFFE','emoji':'🦒'},{'word':'GOAT','emoji':'🐐'},{'word':'GRAPE','emoji':'🍇'}],
    'H':[{'word':'HORSE','emoji':'🐴'},{'word':'HAT','emoji':'🎩'},{'word':'HOUSE','emoji':'🏠'}],
    'I':[{'word':'IGLOO','emoji':'🏠'},{'word':'INK','emoji':'🖊️'},{'word':'INCH','emoji':'📏'}],
    'J':[{'word':'JELLY','emoji':'🍇'},{'word':'JAR','emoji':'🫙'},{'word':'JUMP','emoji':'🦘'}],
    'K':[{'word':'KANGAROO','emoji':'🦘'},{'word':'KEY','emoji':'🔑'},{'word':'KITE','emoji':'🪁'}],
    'L':[{'word':'LION','emoji':'🦁'},{'word':'LEAF','emoji':'🍃'},{'word':'LAMP','emoji':'💡'}],
    'M':[{'word':'MOUSE','emoji':'🐭'},{'word':'MOON','emoji':'🌙'},{'word':'MANGO','emoji':'🥭'}],
    'N':[{'word':'NEST','emoji':'🪺'},{'word':'NOSE','emoji':'👃'},{'word':'NET','emoji':'🥅'}],
    'O':[{'word':'OCTOPUS','emoji':'🐙'},{'word':'OWL','emoji':'🦉'},{'word':'ORANGE','emoji':'🍊'}],
    'P':[{'word':'PIG','emoji':'🐷'},{'word':'PAN','emoji':'🍳'},{'word':'PEN','emoji':'🖊️'}],
    'Q':[{'word':'QUEEN','emoji':'👑'},{'word':'QUILT','emoji':'🛏️'},{'word':'QUIZ','emoji':'❓'}],
    'R':[{'word':'RABBIT','emoji':'🐰'},{'word':'RAIN','emoji':'🌧️'},{'word':'RING','emoji':'💍'}],
    'S':[{'word':'SUN','emoji':'☀️'},{'word':'STAR','emoji':'⭐'},{'word':'SNAKE','emoji':'🐍'}],
    'T':[{'word':'TIGER','emoji':'🐯'},{'word':'TREE','emoji':'🌳'},{'word':'TOY','emoji':'🧸'}],
    'U':[{'word':'UMBRELLA','emoji':'☂️'},{'word':'UP','emoji':'⬆️'},{'word':'UNCLE','emoji':'👨'}],
    'V':[{'word':'VIOLIN','emoji':'🎻'},{'word':'VAN','emoji':'🚐'},{'word':'VASE','emoji':'🪷'}],
    'W':[{'word':'WALRUS','emoji':'🦭'},{'word':'WHALE','emoji':'🐋'},{'word':'WATER','emoji':'💧'}],
    'X':[{'word':'X-RAY','emoji':'🩻'},{'word':'XYLOPHONE','emoji':'🎵'},{'word':'BOX','emoji':'📦'}],
    'Y':[{'word':'YAK','emoji':'🐃'},{'word':'YOGURT','emoji':'🥛'},{'word':'YO-YO','emoji':'🪀'}],
    'Z':[{'word':'ZEBRA','emoji':'🦓'},{'word':'ZERO','emoji':'0️⃣'},{'word':'ZOO','emoji':'🦁'}],
}

SIMILAR_LETTERS = {
    'A':['O','E','U','R'],'B':['D','P','R','O'],'C':['G','O','Q','S'],'D':['B','P','G','Q'],
    'E':['A','F','I','L'],'F':['E','T','L','I'],'G':['C','Q','O','J'],'H':['N','M','W','K'],
    'I':['L','J','T','F'],'J':['I','L','G','Y'],'K':['H','R','X','C'],'L':['I','T','F','J'],
    'M':['N','W','H','R'],'N':['M','H','W','R'],'O':['Q','C','G','D'],'P':['B','D','R','F'],
    'Q':['O','C','G','D'],'R':['P','B','D','N'],'S':['Z','C','O','G'],'T':['I','L','F','J'],
    'U':['V','W','N','A'],'V':['W','U','Y','B'],'W':['V','M','N','U'],'X':['K','Z','Y','T'],
    'Y':['V','X','J','I'],'Z':['S','N','Z','L'],
}

# ─── WORD BANKS ───────────────────────────────────────────────────────────────
WORD_ACTIVITIES = {
    'group_1': {
        'sound_blender': [
            {'word':'SAT','emoji':'🪑','sounds':['sss','aaa','t']},
            {'word':'SIT','emoji':'💺','sounds':['sss','iii','t']},
            {'word':'PIN','emoji':'📌','sounds':['p','iii','nnn']},
            {'word':'TAP','emoji':'👆','sounds':['t','aaa','p']},
            {'word':'NAP','emoji':'😴','sounds':['nnn','aaa','p']},
            {'word':'PAN','emoji':'🍳','sounds':['p','aaa','nnn']},
        ],
        'word_builder': {
            'easy':[
                {'word':'SAT','emoji':'🪑','hint':'Sit down','distractors':['O','B']},
                {'word':'SIT','emoji':'💺','hint':'Take a seat','distractors':['M','R']},
                {'word':'PIN','emoji':'📌','hint':'Sharp point','distractors':['E','G']},
            ],
            'medium':[
                {'word':'SNAP','emoji':'🫰','hint':'Quick sound','distractors':['O','B','K']},
                {'word':'SPIN','emoji':'🌀','hint':'Go round','distractors':['O','B','K']},
            ],
            'hard':[
                {'word':'PANTS','emoji':'👖','hint':'Wear on legs','distractors':['O','B','K','M']},
            ],
        },
    },
    'group_2': {
        'sound_blender': [
            {'word':'CAT','emoji':'🐱','sounds':['k','aaa','t']},
            {'word':'HAT','emoji':'🎩','sounds':['h','aaa','t']},
            {'word':'MAT','emoji':'🧹','sounds':['mmm','aaa','t']},
            {'word':'RED','emoji':'🔴','sounds':['rrr','e','d']},
            {'word':'HEN','emoji':'🐔','sounds':['h','e','nnn']},
        ],
        'word_builder': {
            'easy':[
                {'word':'CAT','emoji':'🐱','hint':'Furry pet','distractors':['O','B']},
                {'word':'HAT','emoji':'🎩','hint':'Wear on head','distractors':['M','R']},
            ],
            'medium':[
                {'word':'CRAM','emoji':'📚','hint':'Stuff inside','distractors':['O','B','K']},
                {'word':'DRUM','emoji':'🥁','hint':'Musical bang','distractors':['S','I','M']},
            ],
            'hard':[
                {'word':'CREEK','emoji':'💧','hint':'Small stream','distractors':['A','S','P','T']},
            ],
        },
    },
    'group_3': {
        'sound_blender': [
            {'word':'DOG','emoji':'🐶','sounds':['d','aw','g']},
            {'word':'LOG','emoji':'🪵','sounds':['lll','aw','g']},
            {'word':'BUG','emoji':'🐛','sounds':['b','uh','g']},
            {'word':'FUN','emoji':'🎉','sounds':['fff','uh','nnn']},
        ],
        'word_builder': {
            'easy':[
                {'word':'DOG','emoji':'🐶','hint':'Loyal pet','distractors':['C','A']},
                {'word':'LOG','emoji':'🪵','hint':'Piece of wood','distractors':['M','R']},
            ],
            'medium':[
                {'word':'GLOB','emoji':'🫧','hint':'Sticky blob','distractors':['C','A','P']},
            ],
            'hard':[
                {'word':'FLOP','emoji':'🛌','hint':'Fall down','distractors':['A','S','P','T']},
            ],
        },
    },
}

ARABIC_EXAMPLES = {
    'ا':[{'word':'أرنب','emoji':'🐰'},{'word':'أسد','emoji':'🦁'}],
    'ب':[{'word':'بطة','emoji':'🦆'},{'word':'باب','emoji':'🚪'}],
    'ت':[{'word':'تفاحة','emoji':'🍎'},{'word':'تاج','emoji':'👑'}],
    'ث':[{'word':'ثعلب','emoji':'🦊'},{'word':'ثوم','emoji':'🧄'}],
    'ن':[{'word':'نحلة','emoji':'🐝'},{'word':'نار','emoji':'🔥'}],
    'ي':[{'word':'يد','emoji':'✋'},{'word':'يمامة','emoji':'🐦'}],
    'م':[{'word':'موز','emoji':'🍌'},{'word':'ماء','emoji':'💧'}],
    'ل':[{'word':'ليمون','emoji':'🍋'},{'word':'لحم','emoji':'🥩'}],
    'س':[{'word':'سمكة','emoji':'🐟'},{'word':'سيارة','emoji':'🚗'}],
    'ش':[{'word':'شمس','emoji':'☀️'},{'word':'شجرة','emoji':'🌳'}],
}

ARABIC_SIMILAR_LETTERS = {
    'ا':['ل','ك'],'ب':['ت','ث','ن'],'ت':['ب','ث','ن'],'ث':['ب','ت','ش'],
    'ن':['ب','ت','ز'],'ي':['ب','ت','ث'],'م':['ص','ط'],'ل':['ا','ك'],
    'س':['ش','ص'],'ش':['س','ض']
}

ARABIC_WORD_ACTIVITIES = {
    'group_1': {
        'sound_blender': [
            {'word':'باب','emoji':'🚪','sounds':['بَ','ا','ب']},
            {'word':'أب','emoji':'👨','sounds':['أَ','ب']},
            {'word':'أثاث','emoji':'🛋️','sounds':['أَ','ثَ','ا','ث']},
        ],
        'word_builder': {
            'easy':[
                {'word':'باب','emoji':'🚪','hint':'نفتح ونغلق','distractors':['ت','ث']},
                {'word':'أب','emoji':'👨','hint':'والدي','distractors':['ت','ث']},
            ],
            'medium':[
                {'word':'ثابت','emoji':'🗿','hint':'لا يتحرك','distractors':['ن','ي','م']},
            ],
            'hard':[
                {'word':'أثاث','emoji':'🛋️','hint':'في المنزل','distractors':['ن','م','ي','س']},
            ],
        },
    },
    'group_2': {
        'sound_blender': [
            {'word':'ماء','emoji':'💧','sounds':['مَ','ا','ء']},
            {'word':'نار','emoji':'🔥','sounds':['نَ','ا','ر']},
            {'word':'ليمون','emoji':'🍋','sounds':['لِ','ي','م','و','ن']},
        ],
        'word_builder': {
            'easy':[
                {'word':'ماء','emoji':'💧','hint':'نشربه','distractors':['ت','ب']},
                {'word':'نار','emoji':'🔥','hint':'حارة','distractors':['ل','م']},
            ],
            'medium':[
                {'word':'ليمون','emoji':'🍋','hint':'حامض','distractors':['س','ش']},
            ],
            'hard':[
                {'word':'نمل','emoji':'🐜','hint':'حشرة صغيرة','distractors':['ب','ت','ث']},
            ],
        },
    },
}

def get_group_for_letter(letter):
    for group, letters in LETTER_GROUPS.items():
        if letter in letters:
            return group
    for group, letters in ARABIC_LETTER_GROUPS.items():
        if letter in letters:
            return group
    return 'group_1'

def generate_quest_questions(letter, similar_letters_dict, phonetics_dict, examples_dict, is_arabic=False):
    wrong = similar_letters_dict.get(letter, ['X','Y'])[:2]
    if len(wrong) < 2: wrong = ['X','Y'] # Fallback
    examples = examples_dict.get(letter, [])
    
    if is_arabic:
        return [
            {'question': f'أي حرف صوته هو {phonetics_dict.get(letter,"?")}؟', 'options': [letter]+wrong, 'correct_answer': letter, 'type': 'sound_match'},
            {'question': f'ابحث عن الحرف {letter}', 'options': [letter]+wrong, 'correct_answer': letter, 'type': 'find_letter'},
            {'question': f'أي كلمة تبدأ بالحرف {letter}؟', 'options': [e['word'] for e in examples[:3]], 'correct_answer': examples[0]['word'] if examples else letter, 'type': 'picture_start'},
        ]

    return [
        {'question': f'Which letter says {phonetics_dict.get(letter,"?")}?', 'options': [letter]+wrong, 'correct_answer': letter, 'type': 'sound_match'},
        {'question': f'Find the letter {letter}', 'options': [letter]+wrong, 'correct_answer': letter, 'type': 'find_letter'},
        {'question': f'Which word starts with {letter}?', 'options': [e['word'] for e in examples[:3]], 'correct_answer': examples[0]['word'] if examples else letter, 'type': 'picture_start'},
    ]


def seed_learning_activities():
    create_db_and_tables()
    with Session(engine) as session:
        children = session.exec(select(Child)).all()
        print(f"Found {len(children)} children")

        if not children:
            print("No children found. Create a child account first.")
            return

        for child in children:
            print(f"\nProcessing {child.name} (ID: {child.Child_ID})")

            # Get or create progress
            progress = session.exec(select(Progress).where(Progress.Child_ID == child.Child_ID)).first()
            if not progress:
                progress = Progress(Child_ID=child.Child_ID, total_score=0)
                session.add(progress); session.commit(); session.refresh(progress)

            # Get or create child progress
            cp = session.exec(select(ChildProgress).where(ChildProgress.Child_ID == child.Child_ID)).first()
            if not cp:
                cp = ChildProgress(Child_ID=child.Child_ID, progress_id=progress.progress_id,
                                   current_letter_group='group_1', letters_mastered=json.dumps([]), streak_days=0)
                session.add(cp); session.commit()

            # Use raw SQL to avoid stale enum values in existing rows
            from sqlalchemy import text
            result = session.exec(text("SELECT activity_name FROM activity WHERE Child_ID = :cid").bindparams(cid=child.Child_ID))
            existing_names = {row[0] for row in result}
            print(f"  Existing activities: {len(existing_names)}")

            activity_count = 0

            # ── Letter activities (all groups) ─────────────────────────────
            is_arabic = getattr(child, 'native_language', 'English').lower() == 'arabic'
            
            groups_to_use = ARABIC_LETTER_GROUPS if is_arabic else LETTER_GROUPS
            mascots_to_use = ARABIC_MASCOTS if is_arabic else MASCOTS
            phonetics_to_use = ARABIC_PHONETICS if is_arabic else PHONETICS
            examples_to_use = ARABIC_EXAMPLES if is_arabic else EXAMPLES
            similar_letters_to_use = ARABIC_SIMILAR_LETTERS if is_arabic else SIMILAR_LETTERS
            words_to_use = ARABIC_WORD_ACTIVITIES if is_arabic else WORD_ACTIVITIES

            for group, letters in groups_to_use.items():
                for letter in letters:
                    mascot = mascots_to_use.get(letter, 'Learning Friend')
                    phonetic = phonetics_to_use.get(letter, f'/{letter}/')
                    examples = examples_to_use.get(letter, [])
                    base_content = {
                        'letter': letter,
                        'mascot_character': mascot,
                        'letter_display': {'uppercase': letter, 'lowercase': letter if is_arabic else letter.lower()},
                        'phonetic_sound': phonetic,
                        'visual_examples': examples,
                        'activity_group': group,
                    }

                    activities_to_create = []
                    if is_arabic:
                        activities_to_create = [
                            (f"تعرف على الحرف {letter}", ActivityType.meet_letter, 5, False, base_content),
                            (f"استمع لصوت الحرف {letter}", ActivityType.hear_sound, 5, False, base_content),
                            (f"ارسم الحرف {letter}", ActivityType.trace_write, 10, False, base_content),
                            (f"تحدي الحرف {letter}", ActivityType.mini_quest, 8, True,
                             {**base_content, 'quest_questions': generate_quest_questions(letter, similar_letters_to_use, phonetics_to_use, examples_to_use, True), 'is_boss_level': True}),
                        ]
                    else:
                        activities_to_create = [
                            (f"Meet Letter {letter}", ActivityType.meet_letter, 5, False, base_content),
                            (f"Hear Letter Sound {letter}", ActivityType.hear_sound, 5, False, base_content),
                            (f"Trace Letter {letter}", ActivityType.trace_write, 10, False, base_content),
                            (f"Letter {letter} Challenge", ActivityType.mini_quest, 8, True,
                             {**base_content, 'quest_questions': generate_quest_questions(letter, similar_letters_to_use, phonetics_to_use, examples_to_use, False), 'is_boss_level': True}),
                        ]

                    for name, atype, duration, is_boss, content in activities_to_create:
                        if name in existing_names:
                            continue
                        act = Activity(
                            activity_name=name, activity_type=atype,
                            activity_content=json.dumps(content),
                            activity_group=group, mascot_character=mascot,
                            estimated_duration_minutes=duration,
                            is_boss_level=is_boss, Child_ID=child.Child_ID
                        )
                        session.add(act); session.commit(); session.refresh(act)
                        activity_count += 1

            # ── Word activities (per group) ──────────────────────────────────
            for group, word_data in words_to_use.items():
                group_letters = groups_to_use.get(group, [])
                if not group_letters: continue
                first_letter = group_letters[0]
                
                # Sound Blender
                sb_name = f"دمج الأصوات - المجموعة {group.split('_')[1]}" if is_arabic else f"Sound Blender - {group.replace('_',' ').title()}"
                if sb_name not in existing_names:
                    act = Activity(
                        activity_name=sb_name, activity_type=ActivityType.sound_blender,
                        activity_content=json.dumps({'letter': first_letter, 'words': word_data.get('sound_blender', []), 'activity_group': group}),
                        activity_group=group, mascot_character=mascots_to_use.get(first_letter,'Learning Friend'),
                        estimated_duration_minutes=10, is_boss_level=False, Child_ID=child.Child_ID
                    )
                    session.add(act); session.commit(); session.refresh(act)
                    activity_count += 1
                    
                # Word Builder
                wb_name = f"بناء الكلمات - المجموعة {group.split('_')[1]}" if is_arabic else f"Word Builder - {group.replace('_',' ').title()}"
                if wb_name not in existing_names:
                    act = Activity(
                        activity_name=wb_name, activity_type=ActivityType.word_builder,
                        activity_content=json.dumps({'letter': first_letter, 'challenges': word_data.get('word_builder', {}), 'activity_group': group}),
                        activity_group=group, mascot_character=mascots_to_use.get(first_letter,'Learning Friend'),
                        estimated_duration_minutes=10, is_boss_level=False, Child_ID=child.Child_ID
                    )
                    session.add(act); session.commit(); session.refresh(act)
                    activity_count += 1
                    
                # Read Match
                rm_name = f"القراءة والمطابقة - المجموعة {group.split('_')[1]}" if is_arabic else f"Read and Match - {group.replace('_',' ').title()}"
                if rm_name not in existing_names:
                    easy_words = word_data.get('word_builder', {}).get('easy', [])
                    pairs = [{'word': w['word'], 'emoji': w['emoji']} for w in easy_words]
                    
                    if not pairs:
                        # Fallback to sound_blender if easy is empty
                        pairs = [{'word': w['word'], 'emoji': w['emoji']} for w in word_data.get('sound_blender', [])[:4]]
                        
                    act = Activity(
                        activity_name=rm_name, activity_type=ActivityType.read_match,
                        activity_content=json.dumps({'pairs': pairs, 'activity_group': group}),
                        activity_group=group, mascot_character=mascots_to_use.get(first_letter,'Learning Friend'),
                        estimated_duration_minutes=8, is_boss_level=False, Child_ID=child.Child_ID
                    )
                    session.add(act); session.commit(); session.refresh(act)
                    activity_count += 1

            print(f"  Created {activity_count} new activities")

            # Init progress for new activities (raw SQL to avoid enum mismatch)
            all_act_ids_result = session.exec(text("SELECT Activity_ID FROM activity WHERE Child_ID = :cid").bindparams(cid=child.Child_ID))
            all_act_ids = [row[0] for row in all_act_ids_result]

            existing_progress_result = session.exec(text("SELECT activity_id FROM activity_progress WHERE progress_id = :pid").bindparams(pid=progress.progress_id))
            existing_progress_ids = {row[0] for row in existing_progress_result}

            new_progress = 0
            for act_id in all_act_ids:
                if act_id not in existing_progress_ids:
                    ap = ActivityProgress(activity_id=act_id, progress_id=progress.progress_id,
                                         completion_status='not_started', stars_earned=0, mastery_level=0,
                                         total_time_spent_minutes=0, total_activities_completed=0)
                    session.add(ap)
                    new_progress += 1
            session.commit()
            print(f"  Initialized {new_progress} new progress records")

        print("\nSeeding complete!")


if __name__ == "__main__":
    print("Seeding all learning activities (Groups 1-5)...")
    seed_learning_activities()