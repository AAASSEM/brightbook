import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMascot } from '@/shared/data/mascots';
import { useT, useLang } from '@/shared/stores/langStore';

// ─── Sound Helper ──────────────────────────────────────────────────────────────
const playSound = (text, lang = 'en-US') => {
  if (typeof window === 'undefined') return;
  window.speechSynthesis?.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  const isArabic = /[\u0600-\u06FF]/.test(text);
  utt.lang = isArabic ? 'ar-SA' : lang;
  utt.rate = 0.7;
  utt.pitch = 1.3;
  window.speechSynthesis?.speak(utt);
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function MeetLetterActivity({ content, onComplete }) {
  const t = useT();
  const lang = useLang();
  const isRtl = lang === 'ar';
  
  const letter = (content.letter || 'S').toUpperCase();
  const mascot = getMascot(letter, lang);

  const [phase, setPhase] = useState('intro');
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    if (phase === 'intro') {
      const timer = setTimeout(() => playSound(mascot.intro, lang === 'ar' ? 'ar-SA' : 'en-US'), 500);
      return () => clearTimeout(timer);
    }
  }, [phase, mascot.intro, lang]);

  const advancePhase = () => {
    const phases = ['intro', 'tap', 'spot', 'find', 'discriminate', 'celebrate'];
    const currentIdx = phases.indexOf(phase);
    const nextPhase = phases[currentIdx + 1];

    if (nextPhase === 'celebrate') {
      const finalScore = score.total > 0
        ? Math.round((score.correct / score.total) * 100)
        : 100;
      setProgress(100);
      setPhase('celebrate');
      setTimeout(() => onComplete(finalScore), 3500);
    } else {
      setPhase(nextPhase);
      setProgress(((currentIdx + 1) / 5) * 100);
    }
  };

  const recordAnswer = (isCorrect) => {
    setScore(s => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
  };

  return (
    <div className={`flex flex-col h-full ${isRtl ? 'rtl' : 'ltr'}`} style={{ background: '#fafbf9', fontFamily: 'Lexend, sans-serif' }}>

      {/* Top Bar: Progress + Mascot */}
      <div className="px-4 py-3 bg-white border-b" style={{ borderColor: '#eff6e7' }}>
        <div className="flex items-center gap-4 max-w-3xl mx-auto">
          {/* Progress Bar */}
          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: mascot.bgGradient }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Mascot peek */}
          <div className="text-3xl">{mascot.emoji}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            {phase === 'intro' && (
              <IntroPhase key="intro" mascot={mascot} letter={letter} onContinue={advancePhase} />
            )}
            {phase === 'tap' && (
              <TapToHearPhase key="tap" mascot={mascot} letter={letter} onContinue={advancePhase} />
            )}
            {phase === 'spot' && (
              <SpotTheLetterPhase
                key="spot"
                mascot={mascot}
                letter={letter}
                onContinue={advancePhase}
                recordAnswer={recordAnswer}
              />
            )}
            {phase === 'find' && (
              <FindInWordPhase
                key="find"
                mascot={mascot}
                letter={letter}
                onContinue={advancePhase}
                recordAnswer={recordAnswer}
              />
            )}
            {phase === 'discriminate' && (
              <DiscriminatePhase
                key="discriminate"
                mascot={mascot}
                letter={letter}
                onContinue={advancePhase}
                recordAnswer={recordAnswer}
              />
            )}
            {phase === 'celebrate' && (
              <CelebratePhase
                key="celebrate"
                mascot={mascot}
                letter={letter}
                score={score}
                t={t}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 1: INTRO
// ═══════════════════════════════════════════════════════════════════════
function IntroPhase({ mascot, letter, onContinue }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-8 py-8"
    >
      {/* Bouncing mascot */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [-5, 5, -5],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-9xl"
      >
        {mascot.emoji}
      </motion.div>

      {/* Speech bubble */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="relative max-w-md mx-auto p-6 rounded-3xl shadow-lg"
        style={{ background: 'white', border: `4px solid ${mascot.color}` }}
      >
        <p className="text-2xl font-black" style={{ color: '#171d14' }}>
          Hi! I'm {mascot.name}!
        </p>
        <p className="text-xl mt-2" style={{ color: mascot.color }}>
          I say <span className="font-black">{mascot.sound}</span>!
        </p>
        {/* Tail */}
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rotate-45"
          style={{ background: 'white', borderTop: `4px solid ${mascot.color}`, borderLeft: `4px solid ${mascot.color}` }}
        />
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2 }}
        onClick={onContinue}
        whileTap={{ scale: 0.95 }}
        className="kid-btn w-full max-w-xs mx-auto text-xl py-5 shadow-xl hover:scale-105 transition-all"
        style={{ background: mascot.bgGradient }}
      >
        Let's Go! →
      </motion.button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 2: TAP TO HEAR
// ═══════════════════════════════════════════════════════════════════════
function TapToHearPhase({ mascot, letter, onContinue }) {
  const [taps, setTaps] = useState(0);
  const targetTaps = 3;

  const handleTap = () => {
    playSound(mascot.soundLong);
    setTaps(t => Math.min(t + 1, targetTaps));
  };

  useEffect(() => {
    if (taps >= targetTaps) {
      onContinue();
    }
  }, [taps, onContinue]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center space-y-8 py-8"
    >
      <h2 className="text-3xl font-black" style={{ color: '#171d14' }}>
        Tap the letter to hear it!
      </h2>

      {/* Tap Counter */}
      <div className="flex justify-center gap-2">
        {[...Array(targetTaps)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ scale: i < taps ? 1.2 : 1 }}
            className="w-4 h-4 rounded-full"
            style={{ background: i < taps ? mascot.color : '#e0e0e0' }}
          />
        ))}
      </div>

      {/* Big tappable letter */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleTap}
        className="w-64 h-64 mx-auto rounded-[3rem] shadow-2xl flex items-center justify-center cursor-pointer"
        style={{ background: mascot.bgGradient }}
      >
        <motion.span
          key={taps}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.15, 1] }}
          className="font-black text-white"
          style={{ fontSize: '180px', lineHeight: 1 }}
        >
          {letter}
        </motion.span>
      </motion.button>

      <p className="text-lg font-semibold" style={{ color: '#6f7a6b' }}>
        {taps === 0 && '👆 Tap the letter!'}
        {taps === 1 && '🎵 Great! Tap it again!'}
        {taps === 2 && '⭐ One more time!'}
        {taps >= 3 && '🎉 Awesome!'}
      </p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 3: SPOT THE LETTER
// ═══════════════════════════════════════════════════════════════════════
function SpotTheLetterPhase({ mascot, letter, onContinue, recordAnswer }) {
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const totalRounds = 3;

  const options = useMemo(() => {
    const wrongs = [...(mascot.similarLetters || [])].sort(() => Math.random() - 0.5).slice(0, 2);
    return [letter, ...wrongs].sort(() => Math.random() - 0.5);
  }, [round, letter, mascot]);

  const handlePick = (picked) => {
    if (feedback) return;
    const isCorrect = picked === letter;
    recordAnswer(isCorrect);
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      playSound('Yes!');
    }

    setTimeout(() => {
      if (round < totalRounds - 1) {
        setRound(r => r + 1);
        setFeedback(null);
      } else {
        onContinue();
      }
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="text-center space-y-8 py-4"
    >
      {/* Round indicator */}
      <div className="flex justify-center gap-2">
        {[...Array(totalRounds)].map((_, i) => (
          <div
            key={i}
            className="h-2 w-12 rounded-full transition-colors"
            style={{ background: i <= round ? mascot.color : '#e0e0e0' }}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-4">
        <span className="text-5xl">{mascot.emoji}</span>
        <h2 className="text-2xl font-black" style={{ color: '#171d14' }}>
          Tap the letter <span style={{ color: mascot.color }}>{letter}</span>!
        </h2>
      </div>

      {/* Letter options */}
      <div className="flex justify-center gap-4 flex-wrap">
        {options.map((opt) => (
          <motion.button
            key={`${round}-${opt}`}
            whileHover={{ scale: feedback ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePick(opt)}
            disabled={!!feedback}
            animate={
              feedback === 'correct' && opt === letter
                ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
                : feedback === 'wrong' && opt === letter
                  ? { scale: [1, 1.1, 1] }
                  : {}
            }
            className="w-32 h-32 rounded-3xl font-black shadow-xl text-7xl flex items-center justify-center"
            style={{
              background:
                feedback === 'correct' && opt === letter ? mascot.bgGradient :
                feedback === 'wrong' && opt === letter ? mascot.bgGradient :
                'white',
              color:
                (feedback === 'correct' && opt === letter) ||
                (feedback === 'wrong' && opt === letter) ? 'white' : '#171d14',
              border: `4px solid ${
                feedback === 'correct' && opt === letter ? mascot.color :
                feedback === 'wrong' && opt === letter ? mascot.color :
                '#d0e8c8'
              }`,
            }}
          >
            {opt}
          </motion.button>
        ))}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback === 'correct' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="text-4xl"
          >
            🎉 Yes!
          </motion.div>
        )}
        {feedback === 'wrong' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="text-2xl font-bold"
            style={{ color: mascot.color }}
          >
            💪 This is the {letter}!
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 4: FIND IN WORD
// ═══════════════════════════════════════════════════════════════════════
function FindInWordPhase({ mascot, letter, onContinue, recordAnswer }) {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const example = mascot.examples[exampleIdx];

  const handleLetterTap = (index) => {
    if (feedback) return;
    const isCorrect = index === example.letterIndex;
    recordAnswer(isCorrect);
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      playSound(example.word);
    }

    setTimeout(() => {
      if (exampleIdx < mascot.examples.length - 1) {
        setExampleIdx(i => i + 1);
        setFeedback(null);
      } else {
        onContinue();
      }
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="text-center space-y-8 py-4"
    >
      <h2 className="text-2xl font-black" style={{ color: '#171d14' }}>
        Find the <span style={{ color: mascot.color }}>{letter}</span> in this word!
      </h2>

      {/* Big emoji */}
      <motion.div
        key={exampleIdx}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="text-9xl"
      >
        {example.emoji}
      </motion.div>

      {/* Word with tappable letters */}
      <div className="flex justify-center gap-2 flex-wrap">
        {example.word.split('').map((char, idx) => {
          const isTarget = idx === example.letterIndex;
          const showCorrect = feedback && isTarget;

          return (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleLetterTap(idx)}
              disabled={!!feedback}
              animate={showCorrect ? { y: [0, -20, 0], scale: [1, 1.3, 1.1] } : {}}
              className="w-16 h-20 rounded-2xl text-5xl font-black flex items-center justify-center shadow-lg"
              style={{
                background: showCorrect ? mascot.bgGradient : 'white',
                color: showCorrect ? 'white' : '#171d14',
                border: `4px solid ${showCorrect ? mascot.color : '#d0e8c8'}`,
              }}
            >
              {char}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {feedback === 'correct' && (
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="text-2xl font-black"
            style={{ color: mascot.color }}
          >
            🎉 {example.word}!
          </motion.p>
        )}
        {feedback === 'wrong' && (
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="text-xl font-bold"
            style={{ color: mascot.color }}
          >
            👀 Look for the {letter}!
          </motion.p>
        )}
      </AnimatePresence>

      {/* Round indicator */}
      <div className="flex justify-center gap-2">
        {mascot.examples.map((_, i) => (
          <div
            key={i}
            className="h-2 w-8 rounded-full"
            style={{ background: i <= exampleIdx ? mascot.color : '#e0e0e0' }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 5: DISCRIMINATE
// ═══════════════════════════════════════════════════════════════════════
function DiscriminatePhase({ mascot, letter, onContinue, recordAnswer }) {
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const totalRounds = 4;

  const sequence = useMemo(() => {
    const items = [
      { char: letter, isTarget: true },
      { char: mascot.similarLetters[0], isTarget: false },
      { char: letter, isTarget: true },
      { char: mascot.similarLetters[1] || mascot.similarLetters[0], isTarget: false },
    ];
    return items.sort(() => Math.random() - 0.5);
  }, [letter, mascot]);

  const current = sequence[round];

  const handleAnswer = (saidYes) => {
    if (feedback) return;
    const isCorrect = saidYes === current.isTarget;
    recordAnswer(isCorrect);
    setFeedback(isCorrect ? 'correct' : 'wrong');

    setTimeout(() => {
      if (round < totalRounds - 1) {
        setRound(r => r + 1);
        setFeedback(null);
      } else {
        onContinue();
      }
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="text-center space-y-8 py-4"
    >
      <h2 className="text-2xl font-black" style={{ color: '#171d14' }}>
        Is this the letter <span style={{ color: mascot.color }}>{letter}</span>?
      </h2>

      {/* Big letter */}
      <motion.div
        key={round}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        className="w-48 h-48 mx-auto rounded-3xl shadow-2xl flex items-center justify-center"
        style={{
          background: feedback
            ? (current.isTarget ? mascot.bgGradient : '#ef5350')
            : 'white',
          border: `6px solid ${mascot.color}`,
        }}
      >
        <span
          className="font-black"
          style={{
            fontSize: '140px',
            color: feedback ? 'white' : '#171d14',
          }}
        >
          {current.char}
        </span>
      </motion.div>

      {/* Yes / No buttons */}
      <div className="flex justify-center gap-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleAnswer(true)}
          disabled={!!feedback}
          className="w-32 h-32 rounded-3xl text-6xl shadow-xl flex items-center justify-center"
          style={{ background: '#66bb6a' }}
        >
          ✅
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleAnswer(false)}
          disabled={!!feedback}
          className="w-32 h-32 rounded-3xl text-6xl shadow-xl flex items-center justify-center"
          style={{ background: '#ef5350' }}
        >
          ❌
        </motion.button>
      </div>

      {/* Round indicator */}
      <div className="flex justify-center gap-2">
        {[...Array(totalRounds)].map((_, i) => (
          <div
            key={i}
            className="h-2 w-8 rounded-full"
            style={{ background: i <= round ? mascot.color : '#e0e0e0' }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 6: CELEBRATE
// ═══════════════════════════════════════════════════════════════════════
function CelebratePhase({ mascot, letter, score, t }) {
  const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 100;
  const stars = percentage >= 95 ? 3 : percentage >= 80 ? 2 : 1;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-center space-y-6 py-8"
    >
      {/* Confetti emojis */}
      <div className="relative h-32">
        {['🎉', '⭐', '🎊', '✨', '🌟'].map((emoji, i) => (
          <motion.div
            key={i}
            initial={{ y: -50, x: 0, opacity: 0 }}
            animate={{
              y: [0, 100, 200],
              x: (i - 2) * 80,
              opacity: [0, 1, 0],
              rotate: 360,
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            className="absolute left-1/2 text-4xl"
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      {/* Dancing mascot */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          rotate: [-15, 15, -15],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 1, repeat: Infinity }}
        className="text-9xl"
      >
        {mascot.emoji}
      </motion.div>

      <h2 className="text-4xl font-black" style={{ color: '#171d14' }}>
        {t('learning.greatJob')}!
      </h2>
      <p className="text-xl font-semibold" style={{ color: '#3f4a3c' }}>
        {t('assessment.scoreSummary', { correct: score.correct, total: score.total })}
      </p>

      {/* Stars */}
      <div className="flex justify-center gap-3">
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3 * i, type: 'spring' }}
            className="text-6xl"
            style={{
              filter: i <= stars ? 'none' : 'grayscale(100%) opacity(30%)',
            }}
          >
            ⭐
          </motion.div>
        ))}
      </div>

      <div
        className="inline-block px-8 py-4 rounded-2xl font-black text-2xl"
        style={{ background: mascot.bgGradient, color: 'white' }}
      >
        {percentage}%
      </div>
    </motion.div>
  );
}
