import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMascot } from '@/shared/data/mascots';
import { useT, useLang } from '@/shared/stores/langStore';

// ─── Sound Helper ──────────────────────────────────────────────────────────────
const playSound = (text, options = {}) => {
  if (typeof window === 'undefined') return;
  window.speechSynthesis?.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  const isArabic = /[\u0600-\u06FF]/.test(text);
  utt.lang = isArabic ? 'ar-SA' : (options.lang || 'en-US');
  utt.rate = options.rate || 0.7;
  utt.pitch = options.pitch || 1.3;
  window.speechSynthesis?.speak(utt);
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function HearSoundActivity({ content, onComplete }) {
  const t = useT();
  const lang = useLang();
  const isRtl = lang === 'ar';
  const letter = (content.letter || 'S').toUpperCase();
  const mascot = getMascot(letter, lang);

  const [phase, setPhase] = useState('listen'); // listen → match → words → speed → celebrate
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const advancePhase = () => {
    const phases = ['listen', 'match', 'words', 'speed', 'celebrate'];
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
      setProgress(((currentIdx + 1) / 4) * 100);
    }
  };

  const recordAnswer = (isCorrect) => {
    setScore(s => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#fafbf9', fontFamily: 'Lexend, sans-serif' }}>

      {/* Top Progress Bar */}
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
            {phase === 'listen' && (
              <ListenPhase
                key="listen"
                mascot={mascot}
                letter={letter}
                onContinue={advancePhase}
                t={t}
              />
            )}
            {phase === 'match' && (
              <SoundMatchPhase
                key="match"
                mascot={mascot}
                letter={letter}
                onContinue={advancePhase}
                recordAnswer={recordAnswer}
                t={t}
              />
            )}
            {phase === 'words' && (
              <WordSoundPhase
                key="words"
                mascot={mascot}
                letter={letter}
                onContinue={advancePhase}
                recordAnswer={recordAnswer}
                t={t}
              />
            )}
            {phase === 'speed' && (
              <SpeedRoundPhase
                key="speed"
                mascot={mascot}
                letter={letter}
                onContinue={advancePhase}
                recordAnswer={recordAnswer}
                t={t}
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
// PHASE 1: LISTEN - Tap speaker to hear sound
// ═══════════════════════════════════════════════════════════════════════
function ListenPhase({ mascot, letter, onContinue, t }) {
  const [taps, setTaps] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const targetTaps = 2;

  const handleTap = () => {
    setIsPlaying(true);
    playSound(mascot.soundLong);
    setTaps(t => Math.min(t + 1, targetTaps));
    setTimeout(() => setIsPlaying(false), 1500);
  };

  useEffect(() => {
    if (taps >= targetTaps) {
      onContinue();
    }
  }, [taps, onContinue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-8 py-4"
    >
      <h2 className="text-3xl font-black" style={{ color: '#171d14' }}>
        {t('learning.hearSound')}
      </h2>

      {/* Mascot pulses with sound */}
      <motion.div
        animate={isPlaying ? {
          scale: [1, 1.3, 1, 1.3, 1],
          rotate: [-10, 10, -10, 10, 0],
        } : {}}
        transition={{ duration: 1.5 }}
        className="text-9xl"
      >
        {mascot.emoji}
      </motion.div>

      {/* Big tappable speaker */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        animate={isPlaying ? {
          boxShadow: [
            `0 0 0 0 ${mascot.color}66`,
            `0 0 0 40px ${mascot.color}00`,
          ],
        } : {}}
        transition={{ duration: 1.5, repeat: isPlaying ? Infinity : 0 }}
        onClick={handleTap}
        className="w-56 h-56 mx-auto rounded-full shadow-2xl flex items-center justify-center cursor-pointer relative"
        style={{ background: mascot.bgGradient }}
      >
        <motion.span
          animate={isPlaying ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3, repeat: isPlaying ? 4 : 0 }}
          className="text-9xl"
        >
          🔊
        </motion.span>

        {/* Sound waves */}
        {isPlaying && (
          <>
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0.7 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
                className="absolute inset-0 rounded-full"
                style={{ border: `4px solid ${mascot.color}` }}
              />
            ))}
          </>
        )}
      </motion.button>

      {/* Sound text */}
      <motion.div
        animate={isPlaying ? { scale: [1, 1.2, 1] } : {}}
        className="text-5xl font-black"
        style={{ color: mascot.color }}
      >
        /{mascot.sound}/
      </motion.div>

      {/* Tap counter */}
      <div className="flex justify-center gap-2">
        {[...Array(targetTaps)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ scale: i < taps ? 1.3 : 1 }}
            className="w-4 h-4 rounded-full"
            style={{ background: i < taps ? mascot.color : '#e0e0e0' }}
          />
        ))}
      </div>

      <p className="text-lg font-semibold" style={{ color: '#6f7a6b' }}>
        {taps === 0 && t('learning.tapToPlay')}
        {taps === 1 && t('learning.nowYouTry')}
        {taps >= 2 && t('learning.wellDone')}
      </p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 2: SOUND MATCH - Hear sound, pick letter
// ═══════════════════════════════════════════════════════════════════════
function SoundMatchPhase({ mascot, letter, onContinue, recordAnswer, t }) {
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const totalRounds = 3;

  const options = useMemo(() => {
    const wrongs = [...(mascot.similarLetters || [])]
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    return [letter, ...wrongs].sort(() => Math.random() - 0.5);
  }, [round, letter, mascot]);

  // Auto-play sound at start of each round
  useEffect(() => {
    const timer = setTimeout(() => playSound(mascot.soundLong), 600);
    return () => clearTimeout(timer);
  }, [round, mascot]);

  const handlePick = (picked) => {
    if (feedback) return;
    const isCorrect = picked === letter;
    recordAnswer(isCorrect);
    setFeedback({ picked, correct: isCorrect });

    if (isCorrect) playSound(t('learning.wellDone'), { rate: 0.9 });

    setTimeout(() => {
      if (round < totalRounds - 1) {
        setRound(r => r + 1);
        setFeedback(null);
      } else {
        onContinue();
      }
    }, 1300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="text-center space-y-6 py-4"
    >
      {/* Round dots */}
      <div className="flex justify-center gap-2">
        {[...Array(totalRounds)].map((_, i) => (
          <div
            key={i}
            className="h-2 w-12 rounded-full transition-colors"
            style={{ background: i <= round ? mascot.color : '#e0e0e0' }}
          />
        ))}
      </div>

      <h2 className="text-2xl font-black" style={{ color: '#171d14' }}>
        {t('learning.questSound')}
      </h2>

      {/* Replay button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => playSound(mascot.soundLong)}
        className="px-8 py-5 rounded-full font-black text-white shadow-xl flex items-center justify-center gap-3 mx-auto"
        style={{ background: mascot.bgGradient }}
      >
        <span className="text-3xl">🔊</span>
        <span className="text-xl">{t('learning.tapToPlay')}</span>
      </motion.button>

      {/* Letter Options */}
      <div className="flex justify-center gap-4 flex-wrap pt-4">
        {options.map((opt) => {
          const isPicked = feedback?.picked === opt;
          const isCorrectAnswer = opt === letter;
          const showCorrectHighlight = feedback && isCorrectAnswer;
          const showWrongHighlight = feedback && isPicked && !isCorrectAnswer;

          return (
            <motion.button
              key={`${round}-${opt}`}
              whileHover={!feedback ? { scale: 1.05, y: -4 } : {}}
              whileTap={!feedback ? { scale: 0.95 } : {}}
              onClick={() => handlePick(opt)}
              disabled={!!feedback}
              animate={
                showCorrectHighlight
                  ? { scale: [1, 1.2, 1.1], rotate: [0, 8, -8, 0] }
                  : showWrongHighlight
                    ? { x: [-10, 10, -10, 10, 0] }
                    : {}
              }
              className="w-32 h-32 rounded-3xl font-black shadow-xl text-7xl flex items-center justify-center transition-colors"
              style={{
                background: showCorrectHighlight
                  ? mascot.bgGradient
                  : showWrongHighlight
                    ? 'linear-gradient(135deg, #ef5350 0%, #e53935 100%)'
                    : 'white',
                color: showCorrectHighlight || showWrongHighlight ? 'white' : '#171d14',
                border: `4px solid ${
                  showCorrectHighlight ? mascot.color :
                  showWrongHighlight ? '#c62828' :
                  '#d0e8c8'
                }`,
              }}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {feedback?.correct && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="text-3xl font-black"
            style={{ color: mascot.color }}
          >
            🎉 {t('learning.wellDone')}
          </motion.div>
        )}
        {feedback && !feedback.correct && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="text-2xl font-bold"
            style={{ color: mascot.color }}
          >
            💪 {t('learning.questDiscrimination', { letter: letter })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 3: WORD SOUND - Which word starts with this sound?
// ═══════════════════════════════════════════════════════════════════════
function WordSoundPhase({ mascot, letter, onContinue, recordAnswer, t }) {
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const totalRounds = 3;

  // Generate word options for this round
  const wordOptions = useMemo(() => {
    const correctWords = (mascot.wordSounds || []).filter(w => w.startsWithLetter);
    const wrongWords = (mascot.wordSounds || []).filter(w => !w.startsWithLetter);

    const correct = correctWords.length ? correctWords[round % correctWords.length] : null;
    const wrongs = [...wrongWords].sort(() => Math.random() - 0.5).slice(0, 2);

    const result = [];
    if (correct) result.push(correct);
    result.push(...wrongs);
    return result.sort(() => Math.random() - 0.5);
  }, [round, mascot]);

  const correctWord = wordOptions.find(w => w?.startsWithLetter);

  // Auto-play sound at start
  useEffect(() => {
    const timer = setTimeout(() => playSound(mascot.soundLong), 600);
    return () => clearTimeout(timer);
  }, [round, mascot]);

  const handlePick = (word) => {
    if (feedback) return;
    const isCorrect = word.startsWithLetter;
    recordAnswer(isCorrect);
    setFeedback({ word, correct: isCorrect });

    if (isCorrect) {
      playSound(word.word, { rate: 0.8 });
    }

    setTimeout(() => {
      if (round < totalRounds - 1) {
        setRound(r => r + 1);
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
      className="text-center space-y-6 py-4"
    >
      {/* Round dots */}
      <div className="flex justify-center gap-2">
        {[...Array(totalRounds)].map((_, i) => (
          <div
            key={i}
            className="h-2 w-12 rounded-full"
            style={{ background: i <= round ? mascot.color : '#e0e0e0' }}
          />
        ))}
      </div>

      <h2 className="text-2xl font-black" style={{ color: '#171d14' }}>
        {t('learning.questApplication', { sound: mascot.sound })}
      </h2>

      {/* Replay sound button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => playSound(mascot.soundLong)}
        className="px-6 py-3 rounded-full font-bold shadow-md flex items-center gap-2 mx-auto"
        style={{ background: 'white', border: `3px solid ${mascot.color}`, color: mascot.color }}
      >
        <span className="text-2xl">🔊</span>
        <span>{t('learning.tapToPlay')}</span>
      </motion.button>

      {/* Word Cards */}
      <div className="grid grid-cols-3 gap-4 pt-4">
        {wordOptions.map((word) => {
          const isPicked = feedback?.word === word;
          const showCorrect = feedback && word.startsWithLetter;
          const showWrong = feedback && isPicked && !word.startsWithLetter;

          return (
            <motion.button
              key={`${round}-${word.word}`}
              whileHover={!feedback ? { scale: 1.05, y: -4 } : {}}
              whileTap={!feedback ? { scale: 0.95 } : {}}
              onClick={() => handlePick(word)}
              disabled={!!feedback}
              animate={
                showCorrect ? { scale: [1, 1.15, 1.05] } :
                showWrong ? { x: [-8, 8, -8, 8, 0] } : {}
              }
              className="p-4 rounded-3xl shadow-xl flex flex-col items-center gap-2"
              style={{
                background: showCorrect
                  ? mascot.bgGradient
                  : showWrong
                    ? 'linear-gradient(135deg, #ef5350 0%, #e53935 100%)'
                    : 'white',
                color: showCorrect || showWrong ? 'white' : '#171d14',
                border: `4px solid ${
                  showCorrect ? mascot.color :
                  showWrong ? '#c62828' :
                  '#d0e8c8'
                }`,
              }}
            >
              <div className="text-6xl">{word.emoji}</div>
              <div className="text-lg font-black">{word.word}</div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {feedback?.correct && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="text-3xl font-black"
            style={{ color: mascot.color }}
          >
            🎉 {t('learning.wellDone')}
          </motion.div>
        )}
        {feedback && !feedback.correct && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="text-xl font-bold"
            style={{ color: mascot.color }}
          >
            👀 {t('learning.tryAgain')}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 4: SPEED ROUND - Tap when you hear the sound
// ═══════════════════════════════════════════════════════════════════════
function SpeedRoundPhase({ mascot, letter, onContinue, recordAnswer, t }) {
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [showLetter, setShowLetter] = useState(false);
  const totalRounds = 4;

  // Sequence: alternates between target letter and similar letters
  const sequence = useMemo(() => {
    const similar = mascot.similarLetters || [];
    const items = [
      { char: letter, isTarget: true },
      { char: similar[0] || 'A', isTarget: false },
      { char: letter, isTarget: true },
      { char: similar[1] || similar[0] || 'B', isTarget: false },
    ];
    return items.sort(() => Math.random() - 0.5);
  }, [letter, mascot]);

  const current = sequence[round];

  // Show letter with animation, play sound
  useEffect(() => {
    setShowLetter(false);
    const showTimer = setTimeout(() => {
      setShowLetter(true);
      // Play sound for the letter shown
      const soundToPlay = current.isTarget ? mascot.soundLong : current.char.toLowerCase();
      playSound(soundToPlay);
    }, 400);
    return () => clearTimeout(showTimer);
  }, [round, current, mascot]);

  const handleTap = (saidYes) => {
    if (feedback) return;
    const isCorrect = saidYes === current.isTarget;
    recordAnswer(isCorrect);
    setFeedback({ correct: isCorrect });

    setTimeout(() => {
      if (round < totalRounds - 1) {
        setRound(r => r + 1);
        setFeedback(null);
      } else {
        onContinue();
      }
    }, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="text-center space-y-6 py-4"
    >
      {/* Round dots */}
      <div className="flex justify-center gap-2">
        {[...Array(totalRounds)].map((_, i) => (
          <div
            key={i}
            className="h-2 w-10 rounded-full"
            style={{ background: i <= round ? mascot.color : '#e0e0e0' }}
          />
        ))}
      </div>

      <h2 className="text-2xl font-black" style={{ color: '#171d14' }}>
        {t('learning.questApplication', { sound: mascot.sound })}
      </h2>

      <p className="text-base font-semibold" style={{ color: '#6f7a6b' }}>
        {t('learning.nowYouTry')}
      </p>

      {/* Big animated letter */}
      <div className="h-64 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {showLetter && (
            <motion.div
              key={round}
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="w-48 h-48 rounded-3xl shadow-2xl flex items-center justify-center"
              style={{
                background: feedback
                  ? feedback.correct
                    ? mascot.bgGradient
                    : 'linear-gradient(135deg, #ef5350 0%, #e53935 100%)'
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
          )}
        </AnimatePresence>
      </div>

      {/* Replay sound */}
      <button
        onClick={() => {
          const soundToPlay = current.isTarget ? mascot.soundLong : current.char.toLowerCase();
          playSound(soundToPlay);
        }}
        className="text-2xl"
      >
        🔊
      </button>

      {/* Yes / No buttons */}
      <div className="flex justify-center gap-6">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => handleTap(true)}
          disabled={!!feedback}
          className="w-28 h-28 rounded-3xl text-6xl shadow-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)',
            opacity: feedback ? 0.5 : 1,
          }}
        >
          ✅
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => handleTap(false)}
          disabled={!!feedback}
          className="w-28 h-28 rounded-3xl text-6xl shadow-xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #ef5350 0%, #e53935 100%)',
            opacity: feedback ? 0.5 : 1,
          }}
        >
          ❌
        </motion.button>
      </div>

      <AnimatePresence>
        {feedback?.correct && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="text-2xl font-black"
            style={{ color: mascot.color }}
          >
            ⚡ {t('learning.wellDone')}
          </motion.div>
        )}
        {feedback && !feedback.correct && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="text-xl font-bold"
            style={{ color: '#c62828' }}
          >
            💭 {t('learning.tryAgain')}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 5: CELEBRATE
// ═══════════════════════════════════════════════════════════════════════
function CelebratePhase({ mascot, letter, score, t }) {
  const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 100;
  const stars = percentage >= 95 ? 3 : percentage >= 80 ? 2 : 1;

  const message = stars === 3 ? t('learning.questLegendary') :
                  stars === 2 ? t('learning.questAwesome') :
                  t('learning.questGoodJob');

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-center space-y-6 py-8"
    >
      {/* Confetti */}
      <div className="relative h-32">
        {['🎉', '⭐', '🎊', '✨', '🌟', '🔊'].map((emoji, i) => (
          <motion.div
            key={i}
            initial={{ y: -50, x: 0, opacity: 0 }}
            animate={{
              y: [0, 100, 200],
              x: (i - 2.5) * 80,
              opacity: [0, 1, 0],
              rotate: 360,
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
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
        {message}
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
            style={{ filter: i <= stars ? 'none' : 'grayscale(100%) opacity(30%)' }}
          >
            ⭐
          </motion.div>
        ))}
      </div>

      <div
        className="inline-block px-8 py-4 rounded-2xl font-black text-2xl"
        style={{ background: mascot.bgGradient, color: 'white' }}
      >
        {percentage}% • {score.correct}/{score.total} {t('assessment.accuracy')}
      </div>
    </motion.div>
  );
}