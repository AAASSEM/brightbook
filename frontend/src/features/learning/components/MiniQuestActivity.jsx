import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMascot } from '@/shared/data/mascots';
import { useT, useLang } from '@/shared/stores/langStore';

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

export default function MiniQuestActivity({ content, onComplete }) {
  const t = useT();
  const lang = useLang();
  const isRtl = lang === 'ar';
  const letter = (content?.letter || 'A').toUpperCase();
  const mascot = getMascot(letter, lang);

  const [phase, setPhase] = useState('intro');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [bonusResult, setBonusResult] = useState(null);

  const advancePhase = () => {
    const phases = ['intro', 'recognition', 'sound', 'application', 'discrimination', 'bonus', 'final'];
    const idx = phases.indexOf(phase);
    const next = phases[idx + 1];
    if (next === 'final') {
      setPhase('final');
      setProgress(100);
      setTimeout(() => onComplete(calculateFinalScore()), 4000);
    } else {
      setPhase(next);
      setProgress(((idx + 1) / 6) * 100);
    }
  };

  const recordResult = (correct, timeSeconds, firstTry) => {
    setResults(prev => [...prev, { correct, timeSeconds, firstTry }]);
  };

  const calculateFinalScore = () => {
    if (results.length === 0) return 0;
    const correctCount = results.filter(r => r.correct).length;
    const baseScore = (correctCount / results.length) * 100;
    const avgTime = results.reduce((sum, r) => sum + r.timeSeconds, 0) / results.length;
    const speedBonus = avgTime < 5 ? 5 : 0;
    const firstTryBonus = (results.filter(r => r.firstTry).length / results.length) * 5;
    const bonusScore = bonusResult ? bonusResult * 10 : 0;
    return Math.min(100, Math.round(baseScore + speedBonus + firstTryBonus + bonusScore));
  };

  return (
    <div className="flex flex-col h-full no-scrollbar" style={{ background: '#fafbf9', fontFamily: 'Lexend, sans-serif' }}>
      <div className="px-4 py-3 bg-white border-b" style={{ borderColor: '#eff6e7' }}>
        <div className="flex items-center gap-4 max-w-3xl mx-auto">
          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: mascot.bgGradient }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
          </div>
          <div className="text-3xl">{mascot.emoji}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <AnimatePresence mode="wait">
            {phase === 'intro' && <IntroPhase key="intro" mascot={mascot} letter={letter} onContinue={advancePhase} t={t} />}
            {phase === 'recognition' && <RecognitionQuestion key="recognition" mascot={mascot} letter={letter} onAnswer={recordResult} onContinue={advancePhase} t={t} />}
            {phase === 'sound' && <SoundQuestion key="sound" mascot={mascot} letter={letter} onAnswer={recordResult} onContinue={advancePhase} t={t} />}
            {phase === 'application' && <ApplicationQuestion key="application" mascot={mascot} letter={letter} onAnswer={recordResult} onContinue={advancePhase} t={t} />}
            {phase === 'discrimination' && <DiscriminationQuestion key="discrimination" mascot={mascot} letter={letter} onAnswer={recordResult} onContinue={advancePhase} t={t} />}
            {phase === 'bonus' && <BonusRound key="bonus" mascot={mascot} letter={letter} onComplete={(acc) => { setBonusResult(acc); advancePhase(); }} onSkip={() => { setBonusResult(null); advancePhase(); }} t={t} />}
            {phase === 'final' && <FinalCelebration key="final" mascot={mascot} letter={letter} results={results} bonusResult={bonusResult} finalScore={calculateFinalScore()} t={t} />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function IntroPhase({ mascot, letter, onContinue, t }) {
  useEffect(() => { const timer = setTimeout(() => playSound(t('learning.readyStarChallenge')), 400); return () => clearTimeout(timer); }, [t]);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="text-center space-y-8 py-8">
      <motion.div animate={{ y: [0, -20, 0], rotate: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity }} className="text-9xl">{mascot.emoji}</motion.div>
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3, duration: 0.6 }} className="mx-auto inline-block px-12 py-4 rounded-2xl shadow-2xl" style={{ background: 'linear-gradient(135deg, #ffd54f 0%, #ffb300 100%)' }}>
        <h1 className="text-4xl font-black text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>⭐ {t('learning.starChallenge')} ⭐</h1>
      </motion.div>
      <p className="text-2xl font-bold" style={{ color: '#171d14' }}>{t('learning.buildWord')} <span style={{ color: mascot.color }}>{letter}</span>!</p>
      <div className="flex justify-center gap-3 text-5xl">
        {[0, 0.2, 0.4].map((d, i) => <motion.span key={i} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: d }}>⭐</motion.span>)}
      </div>
      <motion.button initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} whileTap={{ scale: 0.95 }} onClick={onContinue} className="px-12 py-5 rounded-2xl text-white text-2xl font-black shadow-2xl" style={{ background: mascot.bgGradient }}>{t('learning.begin')}</motion.button>
    </motion.div>
  );
}

function QuestionBase({ mascot, letter, label, question, options, correctKey, getKey, onAnswer, onContinue, renderOption, t }) {
  const [feedback, setFeedback] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const startTime = useRef(Date.now());

  const handlePick = (opt) => {
    if (feedback?.correct) return;
    const isCorrect = getKey(opt) === correctKey;
    if (isCorrect) {
      const timeSeconds = (Date.now() - startTime.current) / 1000;
      onAnswer(true, timeSeconds, attempts === 0);
      setFeedback({ opt, correct: true });
      playSound(mascot.encouragements[Math.floor(Math.random() * 3)]);
      setTimeout(onContinue, 1300);
    } else {
      setAttempts(a => a + 1);
      setFeedback({ opt, correct: false });
      playSound(t('learning.tryAgain'));
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="text-center space-y-8 py-4">
      <div className="inline-block px-4 py-1 rounded-full text-sm font-bold" style={{ background: mascot.color, color: 'white' }}>{label}</div>
      <h2 className="text-3xl font-black" style={{ color: '#171d14' }}>{question}</h2>
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {options.map((opt, i) => {
          const key = getKey(opt);
          const isPicked = feedback && getKey(feedback.opt) === key;
          const showCorrect = feedback && key === correctKey;
          const showWrong = isPicked && key !== correctKey;
          return (
            <motion.button key={i} whileHover={!feedback?.correct ? { scale: 1.05, y: -4 } : {}} whileTap={!feedback?.correct ? { scale: 0.95 } : {}} onClick={() => handlePick(opt)} disabled={!!feedback?.correct}
              animate={showCorrect ? { scale: [1, 1.2, 1.1] } : showWrong ? { x: [-10, 10, -10, 10, 0] } : {}}
              className="p-6 rounded-3xl shadow-xl font-black" style={{ fontSize: renderOption ? undefined : '4rem', background: showCorrect ? mascot.bgGradient : showWrong ? 'linear-gradient(135deg,#ef5350 0%,#c62828 100%)' : 'white', color: showCorrect || showWrong ? 'white' : '#171d14', border: `4px solid ${showCorrect ? mascot.color : showWrong ? '#c62828' : '#d0e8c8'}` }}>
              {renderOption ? renderOption(opt, showCorrect, showWrong) : opt}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function RecognitionQuestion({ mascot, letter, onAnswer, onContinue, t }) {
  const options = useMemo(() => { const w = [...mascot.similarLetters].sort(() => Math.random() - 0.5).slice(0, 3); return [letter, ...w].sort(() => Math.random() - 0.5); }, [letter, mascot]);
  const questionText = t('learning.questRecognition', { letter });
  useEffect(() => { setTimeout(() => playSound(questionText), 400); }, [questionText]);
  return <QuestionBase mascot={mascot} letter={letter} label={t('learning.questQuestionOf', { current: 1, total: 4 })} question={questionText} options={options} correctKey={letter} getKey={o => o} onAnswer={onAnswer} onContinue={onContinue} t={t} />;
}

function SoundQuestion({ mascot, letter, onAnswer, onContinue, t }) {
  const options = useMemo(() => { const w = [...mascot.similarLetters].sort(() => Math.random() - 0.5).slice(0, 3); return [letter, ...w].sort(() => Math.random() - 0.5); }, [letter, mascot]);
  useEffect(() => { setTimeout(() => playSound(mascot.soundLong), 400); }, [mascot]);
  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="text-center space-y-8 py-4">
      <div className="inline-block px-4 py-1 rounded-full text-sm font-bold" style={{ background: mascot.color, color: 'white' }}>{t('learning.questQuestionOf', { current: 2, total: 4 })}</div>
      <h2 className="text-3xl font-black" style={{ color: '#171d14' }}>{t('learning.questSound')}</h2>
      <motion.button whileTap={{ scale: 0.95 }} onClick={() => playSound(mascot.soundLong)} className="px-8 py-5 rounded-full text-white shadow-xl flex items-center justify-center gap-3 mx-auto" style={{ background: mascot.bgGradient }}>
        <span className="text-3xl">🔊</span><span className="text-xl font-black">{t('learning.tapToPlay')}</span>
      </motion.button>
      <QuestionBase mascot={mascot} letter={letter} label="" question="" options={options} correctKey={letter} getKey={o => o} onAnswer={onAnswer} onContinue={onContinue} t={t} />
    </motion.div>
  );
}

function ApplicationQuestion({ mascot, letter, onAnswer, onContinue, t }) {
  const wordOptions = useMemo(() => {
    const correct = mascot.wordSounds?.filter(w => w.startsWithLetter) || [];
    const wrong = mascot.wordSounds?.filter(w => !w.startsWithLetter) || [];
    if (!correct.length) return [];
    const cw = correct[Math.floor(Math.random() * correct.length)];
    const ww = [...wrong].sort(() => Math.random() - 0.5).slice(0, 2);
    return [cw, ...ww].sort(() => Math.random() - 0.5);
  }, [mascot]);

  useEffect(() => { setTimeout(() => playSound(t('learning.questApplication', { sound: mascot.sound })), 400); }, [mascot, t]);

  const [feedback, setFeedback] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const startTime = useRef(Date.now());

  if (!wordOptions.length) { setTimeout(() => { onAnswer(true, 1, true); onContinue(); }, 100); return null; }

  const handlePick = (word) => {
    if (feedback?.correct) return;
    const isCorrect = word.startsWithLetter;
    if (isCorrect) {
      const timeSpent = (Date.now() - startTime.current) / 1000;
      onAnswer(true, timeSpent, attempts === 0);
      setFeedback({ word, correct: true });
      playSound(word.word);
      setTimeout(onContinue, 1500);
    } else {
      setAttempts(a => a + 1);
      setFeedback({ word, correct: false });
      playSound(t('learning.tryAgain'));
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="text-center space-y-8 py-4">
      <div className="inline-block px-4 py-1 rounded-full text-sm font-bold" style={{ background: mascot.color, color: 'white' }}>{t('learning.questQuestionOf', { current: 3, total: 4 })}</div>
      <h2 className="text-3xl font-black" style={{ color: '#171d14' }}>{t('learning.questApplication', { sound: mascot.sound })}</h2>
      <div className="grid grid-cols-3 gap-3">
        {wordOptions.map((word, i) => {
          const isPicked = feedback?.word === word;
          const showCorrect = feedback && word.startsWithLetter;
          const showWrong = isPicked && !word.startsWithLetter;
          return (
            <motion.button key={i} whileHover={!feedback?.correct ? { scale: 1.05, y: -4 } : {}} whileTap={!feedback?.correct ? { scale: 0.95 } : {}} onClick={() => handlePick(word)} disabled={!!feedback?.correct}
              animate={showCorrect ? { scale: [1, 1.15, 1.05] } : showWrong ? { x: [-8, 8, -8, 8, 0] } : {}}
              className="p-4 rounded-3xl shadow-xl flex flex-col items-center gap-2"
              style={{ background: showCorrect ? mascot.bgGradient : showWrong ? 'linear-gradient(135deg,#ef5350 0%,#c62828 100%)' : 'white', color: showCorrect || showWrong ? 'white' : '#171d14', border: `4px solid ${showCorrect ? mascot.color : showWrong ? '#c62828' : '#d0e8c8'}` }}>
              <div className="text-5xl">{word.emoji}</div>
              <div className="text-base font-black">{word.word}</div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function DiscriminationQuestion({ mascot, letter, onAnswer, onContinue, t }) {
  const options = useMemo(() => { const odd = mascot.similarLetters[0]; return [letter, letter, letter, odd].sort(() => Math.random() - 0.5); }, [letter, mascot]);
  const oddIdx = options.findIndex(o => o !== letter);
  const questionText = t('learning.questDiscrimination', { letter });
  useEffect(() => { setTimeout(() => playSound(questionText), 400); }, [questionText]);
  const [feedback, setFeedback] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const startTime = useRef(Date.now());

  const handlePick = (idx) => {
    if (feedback?.correct) return;
    const isCorrect = idx === oddIdx;
    if (isCorrect) {
      onAnswer(true, (Date.now() - startTime.current) / 1000, attempts === 0);
      setFeedback({ idx, correct: true });
      playSound(mascot.encouragements[2]);
      setTimeout(onContinue, 1300);
    } else {
      setAttempts(a => a + 1);
      setFeedback({ idx, correct: false });
      playSound(t('learning.tryAgain'));
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="text-center space-y-8 py-4">
      <div className="inline-block px-4 py-1 rounded-full text-sm font-bold" style={{ background: mascot.color, color: 'white' }}>{t('learning.questQuestionOf', { current: 4, total: 4 })}</div>
      <h2 className="text-3xl font-black" style={{ color: '#171d14' }}>{questionText}</h2>
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {options.map((opt, idx) => {
          const showCorrect = feedback && idx === oddIdx;
          const showWrong = feedback?.idx === idx && idx !== oddIdx;
          return (
            <motion.button key={idx} whileHover={!feedback?.correct ? { scale: 1.05, y: -4 } : {}} whileTap={!feedback?.correct ? { scale: 0.95 } : {}} onClick={() => handlePick(idx)} disabled={!!feedback?.correct}
              animate={showCorrect ? { scale: [1, 1.2, 1.1] } : showWrong ? { x: [-10, 10, -10, 10, 0] } : {}}
              className="p-6 rounded-3xl shadow-xl text-7xl font-black"
              style={{ background: showCorrect ? mascot.bgGradient : showWrong ? 'linear-gradient(135deg,#ef5350 0%,#c62828 100%)' : 'white', color: showCorrect || showWrong ? 'white' : '#171d14', border: `4px solid ${showCorrect ? mascot.color : showWrong ? '#c62828' : '#d0e8c8'}` }}>
              {opt}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function BonusRound({ mascot, letter, onComplete, onSkip, t }) {
  const [started, setStarted] = useState(false);
  const [tapped, setTapped] = useState([]);
  const sentence = useMemo(() => {
    const w1 = mascot.wordSounds?.find(w => w.startsWithLetter)?.word || letter;
    const w2 = mascot.wordSounds?.filter(w => w.startsWithLetter)?.[1]?.word || letter;
    return `THE ${w1} AND THE ${w2}`;
  }, [mascot, letter]);
  const targetCount = sentence.split('').filter(c => c === letter).length;

  const handleTap = (idx) => {
    if (sentence[idx] !== letter || tapped.includes(idx)) return;
    const n = [...tapped, idx];
    setTapped(n);
    playSound('Yes!');
    if (n.length === targetCount) setTimeout(() => onComplete(1), 800);
  };

  if (!started) return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center space-y-8 py-8">
      <div className="mx-auto inline-block px-12 py-4 rounded-2xl shadow-2xl" style={{ background: 'linear-gradient(135deg, #ffd54f 0%, #ffb300 100%)' }}>
        <h1 className="text-4xl font-black text-white">{t('learning.questBonusRound')}</h1>
      </div>
      <p className="text-xl font-bold" style={{ color: '#171d14' }}>{t('learning.questBonusInstructions', { letter })}</p>
      <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 1, repeat: Infinity }} className="text-8xl">{mascot.emoji}</motion.div>
      <div className="flex gap-4 justify-center">
        <motion.button whileTap={{ scale: 0.95 }} onClick={onSkip} className="px-8 py-4 rounded-full font-bold shadow-lg" style={{ background: '#9e9e9e', color: 'white' }}>{t('common.cancel')}</motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setStarted(true)} className="px-8 py-4 rounded-full text-white font-black shadow-xl" style={{ background: 'linear-gradient(135deg,#ffd54f 0%,#ff9800 100%)' }}>{t('learning.questPlayBonus')}</motion.button>
      </div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-8 py-4">
      <h2 className="text-2xl font-black" style={{ color: '#171d14' }}>{t('learning.questBonusInstructions', { letter })}</h2>
      <div className="text-base font-bold" style={{ color: '#6f7a6b' }}>{tapped.length} / {targetCount} {t('learning.matchWord')}</div>
      <div className="bg-white rounded-3xl p-6 shadow-xl border-4" style={{ borderColor: '#d0e8c8' }}>
        <div className="flex flex-wrap justify-center gap-1 text-4xl font-black">
          {sentence.split('').map((char, idx) => {
            if (char === ' ') return <span key={idx} className="w-4" />;
            const isTgt = char === letter, isTapped = tapped.includes(idx);
            return (
              <motion.button key={idx} whileTap={isTgt && !isTapped ? { scale: 0.85 } : {}} onClick={() => handleTap(idx)} disabled={!isTgt || isTapped}
                animate={isTapped ? { scale: [1, 1.3, 1], rotate: [0, 360] } : {}}
                className="w-12 h-14 rounded-lg flex items-center justify-center"
                style={{ background: isTapped ? mascot.bgGradient : 'transparent', color: isTapped ? 'white' : isTgt ? '#171d14' : '#999', cursor: isTgt && !isTapped ? 'pointer' : 'default' }}>
                {char}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function FinalCelebration({ mascot, letter, results, bonusResult, finalScore, t }) {
  const correctCount = results.filter(r => r.correct).length;
  const stars = finalScore >= 95 && bonusResult ? 3 : finalScore >= 80 ? 2 : finalScore >= 60 ? 1 : 0;
  const message = stars === 3 ? t('learning.questLegendary') : stars === 2 ? t('learning.questAwesome') : stars === 1 ? t('learning.questGoodJob') : t('learning.questKeepTrying');
  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6 py-8">
      <motion.div animate={{ y: [0, -30, 0], rotate: [-15, 15, -15], scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-9xl">{mascot.emoji}</motion.div>
      <h1 className="text-5xl font-black" style={{ color: '#171d14' }}>{message}</h1>
      <div className="flex justify-center gap-3">
        {[1, 2, 3].map(i => (
          <motion.div key={i} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3 * i, type: 'spring' }} className="text-7xl" style={{ filter: i <= stars ? 'none' : 'grayscale(100%) opacity(30%)' }}>⭐</motion.div>
        ))}
      </div>
      <div className="inline-block px-8 py-4 rounded-2xl font-black text-3xl" style={{ background: mascot.bgGradient, color: 'white' }}>{finalScore}%</div>
      <p className="text-lg font-semibold" style={{ color: '#3f4a3c' }}>{t('assessment.scoreSummary', { correct: correctCount, total: results.length })}{bonusResult ? ' + Bonus completed!' : ''}</p>
    </motion.div>
  );
}
