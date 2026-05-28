import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMascot } from '@/shared/data/mascots';
import { useT, useLang } from '@/shared/stores/langStore';

const playSound = (text, options = {}) => {
  if (typeof window === 'undefined') return;
  window.speechSynthesis?.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  // Detect if text contains Arabic characters
  const isArabic = /[\u0600-\u06FF]/.test(text);
  utt.lang = isArabic ? 'ar-SA' : (options.lang || 'en-US');
  utt.rate = options.rate || 0.7;
  utt.pitch = options.pitch || 1.3;
  window.speechSynthesis?.speak(utt);
};

const DEFAULT_CHALLENGES = {
  easy: [
    { word: 'CAT', emoji: '🐱', hint: 'Furry pet', distractors: ['O', 'B'] },
    { word: 'SUN', emoji: '☀️', hint: 'In the sky', distractors: ['M', 'R'] },
    { word: 'HAT', emoji: '🎩', hint: 'Wear on head', distractors: ['E', 'P'] },
  ],
  medium: [
    { word: 'DOG', emoji: '🐶', hint: 'Loyal pet', distractors: ['C', 'A', 'P'] },
    { word: 'BAT', emoji: '🦇', hint: 'Flies at night', distractors: ['S', 'I', 'M'] },
    { word: 'PIG', emoji: '🐷', hint: 'Pink farm animal', distractors: ['O', 'R', 'T'] },
  ],
  hard: [
    { word: 'FROG', emoji: '🐸', hint: 'Hops in pond', distractors: ['A', 'S', 'P', 'T'] },
    { word: 'STAR', emoji: '⭐', hint: 'Shines at night', distractors: ['M', 'B', 'I', 'N'] },
  ],
};

export default function WordBuilderActivity({ content, onComplete }) {
  const t = useT();
  const lang = useLang();
  const isRtl = lang === 'ar';

  const letter = (content?.letter || 'A').toUpperCase();
  const mascot = getMascot(letter, lang);
  const challenges = content?.challenges || DEFAULT_CHALLENGES;

  const [phase, setPhase] = useState('tutorial');
  const [progress, setProgress] = useState(0);
  const [difficulty, setDifficulty] = useState('easy');
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [allScores, setAllScores] = useState({ easy: [], medium: [], hard: [] });

  const currentChallenges = challenges[difficulty] || [];
  const currentChallenge = currentChallenges[challengeIdx];

  const calculateFinalScore = () => {
    const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    return Math.round(avg(allScores.easy) * 0.25 + avg(allScores.medium) * 0.35 + avg(allScores.hard) * 0.40);
  };

  const handleChallengeComplete = (score) => {
    const updated = { ...allScores, [difficulty]: [...allScores[difficulty], score] };
    setAllScores(updated);

    if (challengeIdx < currentChallenges.length - 1) {
      setChallengeIdx(challengeIdx + 1);
    } else {
      if (difficulty === 'easy') { setDifficulty('medium'); setChallengeIdx(0); setProgress(40); }
      else if (difficulty === 'medium') { setDifficulty('hard'); setChallengeIdx(0); setProgress(70); }
      else {
        setPhase('celebrate'); setProgress(100);
        const finalScore = Math.round(
          (updated.easy.length ? updated.easy.reduce((a, b) => a + b, 0) / updated.easy.length : 0) * 0.25 +
          (updated.medium.length ? updated.medium.reduce((a, b) => a + b, 0) / updated.medium.length : 0) * 0.35 +
          (updated.hard.length ? updated.hard.reduce((a, b) => a + b, 0) / updated.hard.length : 0) * 0.40
        );
        setTimeout(() => onComplete(Math.round(finalScore)), 4000);
      }
    }
  };

  return (
    <div className="flex flex-col h-full no-scrollbar" style={{ background: '#fafbf9', fontFamily: 'Lexend, sans-serif' }}>
      <div className="px-4 py-3 bg-white border-b" style={{ borderColor: '#eff6e7' }}>
        <div className="flex items-center gap-4 max-w-3xl mx-auto">
          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: mascot.bgGradient }} animate={{ width: `${progress}%` }} />
          </div>
          <div className="text-3xl">{mascot.emoji}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <AnimatePresence mode="wait">
            {phase === 'tutorial' && (
              <TutorialPhase key="tutorial" mascot={mascot} onContinue={() => { setPhase('build'); setProgress(10); }} t={t} lang={lang} />
            )}
            {phase === 'build' && currentChallenge && (
              <BuildChallenge key={`${difficulty}-${challengeIdx}`} mascot={mascot} challenge={currentChallenge} difficulty={difficulty} onComplete={handleChallengeComplete} t={t} lang={lang} />
            )}
            {phase === 'celebrate' && (
              <WBCelebratePhase key="celebrate" mascot={mascot} allScores={allScores} finalScore={calculateFinalScore()} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function TutorialPhase({ mascot, onContinue, t, lang }) {
  const [step, setStep] = useState(0);
  const demoWord = lang === 'ar' ? 'باب' : 'CAT';
  const demoEmoji = lang === 'ar' ? '🚪' : '🐱';

  useEffect(() => {
    const timer = setTimeout(() => {
      if (step < demoWord.length) {
        playSound(demoWord[step]);
        setStep(step + 1);
      }
      else {
        playSound(demoWord);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [step]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-8 py-4">
      <h1 className="text-3xl font-black" style={{ color: '#171d14' }}>🧱 {t('learning.wordBuilder')} 🧱</h1>
      <p className="text-lg font-semibold" style={{ color: '#3f4a3c' }}>{t('learning.tutorialTitle')}</p>
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-8xl">{demoEmoji}</motion.div>
      <div className="flex justify-center gap-3">
        {demoWord.split('').map((letter, idx) => (
          <motion.div key={idx} initial={{ scale: 0, y: -50 }} animate={idx < step ? { scale: 1, y: 0 } : { scale: 0, y: -50 }} transition={{ type: 'spring', delay: idx * 0.3 }} className="w-20 h-20 rounded-2xl shadow-xl flex items-center justify-center text-4xl font-black" style={{ background: idx < step ? mascot.bgGradient : 'transparent', color: 'white', border: `4px ${idx < step ? 'solid' : 'dashed'} ${mascot.color}` }}>
            {idx < step ? letter : ''}
          </motion.div>
        ))}
      </div>
      {step >= demoWord.length && (
        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.95 }} onClick={onContinue} className="px-12 py-5 rounded-2xl text-white text-xl font-black shadow-2xl" style={{ background: mascot.bgGradient }}>
          {t('learning.nowYouTry')} 🎯
        </motion.button>
      )}
    </motion.div>
  );
}

function BuildChallenge({ mascot, challenge, difficulty, onComplete, t, lang }) {
  const [slots, setSlots] = useState([]);
  const [available, setAvailable] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showWrong, setShowWrong] = useState(false);

  useEffect(() => {
    const targetLetters = challenge.word.split('');
    if (difficulty === 'easy') {
      setSlots(targetLetters.map((l, i) => i === 0 ? { letter: l, locked: true } : null));
    } else {
      setSlots(Array(targetLetters.length).fill(null));
    }
    const lettersToShow = difficulty === 'easy' ? targetLetters.slice(1) : targetLetters;
    const allLetters = [...lettersToShow, ...challenge.distractors]
      .map((l, i) => ({ id: `${challenge.word}-${i}`, letter: l, used: false }))
      .sort(() => Math.random() - 0.5);
    setAvailable(allLetters);
    setAttempts(0); setHintsUsed(0); setIsCorrect(false); setShowWrong(false);
    setTimeout(() => playSound(t('learning.buildWord')), 400);
  }, [challenge, difficulty, t]);

  const handleLetterTap = (lo) => {
    if (lo.used || isCorrect) return;
    const emptyIdx = slots.findIndex(s => s === null);
    if (emptyIdx === -1) return;
    const ns = [...slots];
    ns[emptyIdx] = { letter: lo.letter, fromId: lo.id, locked: false };
    setSlots(ns);
    setAvailable(available.map(l => l.id === lo.id ? { ...l, used: true } : l));
    playSound(lo.letter);
    if (ns.every(s => s !== null)) setTimeout(() => validate(ns), 600);
  };

  const handleSlotTap = (idx) => {
    if (isCorrect) return;
    const slot = slots[idx];
    if (!slot || slot.locked) return;
    const ns = [...slots]; ns[idx] = null; setSlots(ns);
    setAvailable(available.map(l => l.id === slot.fromId ? { ...l, used: false } : l));
  };

  const validate = (filledSlots) => {
    const built = filledSlots.map(s => s.letter).join('');
    if (built === challenge.word) {
      setIsCorrect(true);
      playSound(challenge.word);
      setTimeout(() => playSound(t('learning.wellDone')), 800);
      const base = attempts === 0 ? 100 : attempts === 1 ? 70 : 40;
      setTimeout(() => onComplete(Math.max(20, base - hintsUsed * 15)), 2000);
    } else {
      setAttempts(a => a + 1); setShowWrong(true); playSound(t('learning.tryAgain'));
      setTimeout(() => {
        setShowWrong(false);
        const tl = challenge.word.split('');
        setSlots(difficulty === 'easy' ? tl.map((l, i) => i === 0 ? { letter: l, locked: true } : null) : Array(tl.length).fill(null));
        setAvailable(available.map(l => ({ ...l, used: false })));
      }, 1200);
    }
  };

  const useHint = () => {
    if (difficulty === 'easy' || isCorrect) return;
    const tl = challenge.word.split('');
    const emptyIdx = slots.findIndex(s => s === null);
    if (emptyIdx === -1) return;
    const correctLetter = tl[emptyIdx];
    const toReveal = available.find(l => l.letter === correctLetter && !l.used);
    if (!toReveal) return;
    const ns = [...slots];
    ns[emptyIdx] = { letter: correctLetter, fromId: toReveal.id, locked: true };
    setSlots(ns);
    setAvailable(available.map(l => l.id === toReveal.id ? { ...l, used: true } : l));
    setHintsUsed(h => h + 1);
    playSound('Hint!');
  };

  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="text-center space-y-6 py-4">
      <div className="flex justify-between items-center">
        <div className="inline-block px-4 py-1 rounded-full text-sm font-bold" style={{ background: mascot.color, color: 'white' }}>{difficulty.toUpperCase()}</div>
        {difficulty === 'medium' && !isCorrect && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={useHint} disabled={hintsUsed >= 1} className="px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2" style={{ background: hintsUsed >= 1 ? '#9e9e9e' : 'linear-gradient(135deg,#ffd54f 0%,#ffb300 100%)', color: 'white', opacity: hintsUsed >= 1 ? 0.5 : 1 }}>
            💡 Hint (-15 pts)
          </motion.button>
        )}
      </div>
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-8xl cursor-pointer" onClick={() => playSound(challenge.word)}>{challenge.emoji}</motion.div>
      <p className="text-base font-semibold" style={{ color: '#6f7a6b' }}>💭 {challenge.hint}</p>
      <motion.div animate={showWrong ? { x: [-10, 10, -10, 10, 0] } : {}} className="flex justify-center gap-3">
        {slots.map((slot, idx) => (
          <motion.button key={idx} onClick={() => handleSlotTap(idx)} animate={isCorrect ? { scale: [1, 1.2, 1], y: [0, -10, 0], transition: { delay: idx * 0.1 } } : {}} className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black shadow-lg"
            style={{ background: slot ? (isCorrect ? mascot.bgGradient : showWrong ? '#ef5350' : 'white') : 'transparent', color: slot ? (isCorrect || showWrong ? 'white' : mascot.color) : 'transparent', border: `4px ${slot ? 'solid' : 'dashed'} ${mascot.color}`, cursor: slot && !slot.locked && !isCorrect ? 'pointer' : 'default' }}>
            {slot?.letter || ''}
          </motion.button>
        ))}
      </motion.div>
      <div className="flex justify-center gap-3 flex-wrap">
        {available.map(lo => (
          <motion.button key={lo.id} whileHover={!lo.used ? { scale: 1.1, y: -4 } : {}} whileTap={!lo.used ? { scale: 0.9 } : {}} onClick={() => handleLetterTap(lo)} disabled={lo.used || isCorrect} animate={lo.used ? { opacity: 0.3, scale: 0.8 } : { opacity: 1, scale: 1 }} className="w-16 h-16 rounded-2xl shadow-xl text-3xl font-black flex items-center justify-center" style={{ background: mascot.bgGradient, color: 'white' }}>
            {lo.letter}
          </motion.button>
        ))}
      </div>
      <div className="flex justify-center gap-4 text-sm font-semibold" style={{ color: '#6f7a6b' }}>
        <span>Attempt {attempts + 1}</span>
        {hintsUsed > 0 && <span>💡 Hints: {hintsUsed}</span>}
      </div>
      {isCorrect && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-3xl font-black" style={{ color: mascot.color }}>🎉 {challenge.word}!</motion.div>}
    </motion.div>
  );
}

function WBCelebratePhase({ mascot, allScores, finalScore }) {
  const stars = finalScore >= 90 ? 3 : finalScore >= 70 ? 2 : finalScore >= 50 ? 1 : 0;
  const message = stars === 3 ? 'Master Builder! 🏆' : stars === 2 ? 'Great Builder! 🎉' : stars === 1 ? 'Good Try! 💪' : 'Keep Building! 🧱';
  const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6 py-8">
      <motion.div animate={{ y: [0, -30, 0], rotate: [-15, 15, -15], scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-9xl">{mascot.emoji}</motion.div>
      <h1 className="text-4xl font-black" style={{ color: '#171d14' }}>{message}</h1>
      <div className="flex justify-center gap-3">
        {[1, 2, 3].map(i => <motion.div key={i} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3 * i, type: 'spring' }} className="text-7xl" style={{ filter: i <= stars ? 'none' : 'grayscale(100%) opacity(30%)' }}>⭐</motion.div>)}
      </div>
      <div className="inline-block px-8 py-4 rounded-2xl font-black text-3xl" style={{ background: mascot.bgGradient, color: 'white' }}>{finalScore}%</div>
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
        {['easy', 'medium', 'hard'].map(d => (
          <div key={d} className="p-4 rounded-2xl" style={{ background: '#eff6e7' }}>
            <div className="text-2xl font-black" style={{ color: mascot.color }}>{avg(allScores[d])}%</div>
            <div className="text-xs font-semibold" style={{ color: '#6f7a6b' }}>{d.toUpperCase()}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
