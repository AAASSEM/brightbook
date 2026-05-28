import re
import json

path = r"C:\Users\20100\bookv2\brightbook\frontend\src\shared\data\mascots.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    "A": ("'aaa'", "'aaaaaa'", "'ah'", "'ahhh'", "I say ahhh!"),
    "B": ("'b'", "'buh'", "'buh'", "'buhhh'", "I say buh!"),
    "C": ("'k'", "'kuh'", "'kuh'", "'kuhhh'", "I say kuh!"),
    "D": ("'d'", "'duh'", "'duh'", "'duhhh'", "I say duh!"),
    "E": ("'e'", "'ehhh'", "'eh'", "'ehhh'", "I say ehhh!"),
    "F": ("'fff'", "'fffff'", "'fuh'", "'fuhhh'", "I say fuh!"),
    "G": ("'g'", "'guh'", "'guh'", "'guhhh'", "I say guh!"),
    "H": ("'h'", "'huh'", "'huh'", "'huhhh'", "I say huh!"),
    "I": ("'iii'", "'iiiii'", "'ih'", "'ihhh'", "I say ihhh!"),
    "J": ("'j'", "'juh'", "'juh'", "'juhhh'", "I say juh!"),
    "K": ("'k'", "'kuh'", "'kuh'", "'kuhhh'", "I say kuh!"),
    "L": ("'lll'", "'lllll'", "'luh'", "'luhhh'", "I say luh!"),
    "M": ("'mmm'", "'mmmmm'", "'muh'", "'muhhh'", "I say muh!"),
    "N": ("'nnn'", "'nnnnn'", "'nuh'", "'nuhhh'", "I say nuh!"),
    "O": ("'o'", "'ohhh'", "'aw'", "'awww'", "I say awww!"),
    "P": ("'ppp'", "'ppppp'", "'puh'", "'puhhh'", "I say puh!"),
    "Q": ("'kw'", "'kwuh'", "'kwuh'", "'kwuhhh'", "I say kwuh!"),
    "R": ("'rrr'", "'rrrrr'", "'ruh'", "'ruhhh'", "I say ruh!"),
    "S": ("'sss'", "'ssssss'", "'suh'", "'suhhh'", "I say suhhh!"),
    "T": ("'t'", "'ttt'", "'tuh'", "'tuhhh'", "I say tuh!"),
    "U": ("'uh'", "'uhhh'", "'uh'", "'uhhh'", "I say uhhh!"),
    "V": ("'vvv'", "'vvvvv'", "'vuh'", "'vuhhh'", "I say vuh!"),
    "W": ("'www'", "'wwww'", "'wuh'", "'wuhhh'", "I say wuh!"),
    "X": ("'ks'", "'ksss'", "'ks'", "'kssss'", "I say ks!"),
    "Y": ("'y'", "'yuh'", "'yuh'", "'yuhhh'", "I say yuh!"),
    "Z": ("'zzz'", "'zzzzz'", "'zuh'", "'zuhhh'", "I say zuh!"),
}

def replace_line(match):
    letter = match.group(1)
    if letter in replacements:
        old_snd, old_lng, new_snd, new_lng, intro_text = replacements[letter]
        line = match.group(0)
        # Regex replace sound, soundLong, and intro string
        line = re.sub(r"sound:'[^']+'", f"sound:{new_snd}", line)
        line = re.sub(r"soundLong:'[^']+'", f"soundLong:{new_lng}", line)
        line = re.sub(r'intro:"Hi! I\'m [^!]+! I say [^!]+!"', f'intro:"Hi! I\'m {letter} {match.group(2)}! {intro_text}"', line)
        # some intros have different formats, just replace "I say ..."
        line = re.sub(r'I say [^!]+!', intro_text, line)
        return line
    return match.group(0)

# The lines start with `  A: { name:'Annie Ant', ...`
content = re.sub(r"^  ([A-Z]): \{ name:'([^']+)'(.+)$", replace_line, content, flags=re.MULTILINE)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Mascots updated successfully!")
