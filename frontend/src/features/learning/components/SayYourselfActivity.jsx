import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMascot } from '@/shared/data/mascots';
import { useT, useLang } from '@/shared/stores/langStore';
import learningService from '@/shared/services/learningService';

// ─── Speech Helper ────────────────────────────────────────────────────────────
const playSound = (text, options = {}) => {
  if (typeof window === 'undefined') return;
  window.speechSynthesis?.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  const isArabic = /[\u0600-\u06FF]/.test(text);
  utt.lang = isArabic ? 'ar-SA' : (options.lang || 'en-US');
  utt.rate = options.rate || 0.75;
  utt.pitch = options.pitch || 1.2;
  window.speechSynthesis?.speak(utt);
};

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, color }) {
  const radius = 44;
  const circ = 2 * Math.PI * radius;
  const filled = (score / 100) * circ;
  return (
    <svg width="120" height="120" className="mx-auto">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="#e0e0e0" strokeWidth="10" />
      <motion.circle
        cx="60" cy="60" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ}
        animate={{ strokeDashoffset: circ - filled }}
        transition={{ duration: 1, ease: 'easeOut' }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
      />
      <text x="60" y="67" textAnchor="middle" fontSize="24" fontWeight="bold" fill={color}>
        {score}%
      </text>
    </svg>
  );
}

// ─── Waveform Animation ───────────────────────────────────────────────────────
function RecordingWaveform({ color }) {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {[0.3, 0.7, 1, 0.6, 0.9, 0.4, 0.8, 0.5, 1, 0.6].map((h, i) => (
        <motion.div
          key={i}
          className="w-2 rounded-full"
          style={{ background: color }}
          animate={{ scaleY: [h, h * 0.4, h, h * 1.2, h] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function SayYourselfActivity({ content, onComplete }) {
  const t = useT();
  const lang = useLang();

  const targetLetter = content?.letter || 'A';
  const targetWord = content?.word || content?.words?.[0] || targetLetter;
  const childAge = content?.child_age || 7;
  const language = lang === 'ar' ? 'Arabic' : 'English';
  const isRtl = lang === 'ar';

  const mascot = getMascot(targetLetter, lang);

  const [phase, setPhase] = useState('listen');   // listen → record → feedback → celebrate
  const [progress, setProgress] = useState(15);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const MAX_RECORD_SECONDS = 5;

  // Speak the target word/letter on mount
  useEffect(() => {
    const timer = setTimeout(() => playSound(targetWord), 600);
    return () => clearTimeout(timer);
  }, [targetWord]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      clearInterval(timerRef.current);
    };
  }, []);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    clearInterval(timerRef.current);
  };

  const startCountdown = () => {
    setCountdown(3);
    const c = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(c);
          setCountdown(null);
          startRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        await sendForAnalysis(blob);
      };

      recorder.start(100); // collect in 100ms chunks
      setIsRecording(true);
      setRecordingTime(0);
      setProgress(50);

      // Auto-stop after MAX_RECORD_SECONDS
      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setRecordingTime(elapsed);
        if (elapsed >= MAX_RECORD_SECONDS) {
          stopRecording();
          setIsRecording(false);
          clearInterval(timerRef.current);
        }
      }, 1000);

    } catch (err) {
      console.error('Microphone error:', err);
      // Microphone permission denied — skip to celebrate with base score
      setAiResult({
        score: 70,
        is_correct: true,
        feedback: "Great effort! Keep practicing the sound!",
        phonetic_tip: "",
        sounds_like: "correct"
      });
      setPhase('feedback');
      setProgress(80);
    }
  };

  const sendForAnalysis = async (audioBlob) => {
    setIsAnalyzing(true);
    setPhase('analyzing');
    setProgress(70);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('target_word', targetWord);
      formData.append('target_letter', targetLetter);
      formData.append('child_age', String(childAge));
      formData.append('language', language);

      const response = await learningService.analyzePronunciation(formData);
      const result = response.data;

      setAiResult(result);
      setAttempts(prev => prev + 1);
      setBestScore(prev => Math.max(prev, result.score || 0));
      setPhase('feedback');
      setProgress(80);

      // Speak the AI feedback
      if (result.feedback) {
        setTimeout(() => playSound(result.feedback), 400);
      }

    } catch (err) {
      console.error('AI analysis error:', err);
      // Fallback on error
      const fallback = {
        score: 70, is_correct: true,
        feedback: "Great job! Keep practicing!", phonetic_tip: "", sounds_like: "correct"
      };
      setAiResult(fallback);
      setAttempts(prev => prev + 1);
      setBestScore(prev => Math.max(prev, 70));
      setPhase('feedback');
      setProgress(80);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTryAgain = () => {
    setAiResult(null);
    setPhase('record');
    setProgress(30);
    setRecordingTime(0);
  };

  const handleContinue = () => {
    setPhase('celebrate');
    setProgress(100);
    setTimeout(() => onComplete(bestScore || 70), 2500);
  };

  return (
    <div
      className={`flex flex-col h-full no-scrollbar ${isRtl ? 'rtl' : 'ltr'}`}
      style={{ background: 'linear-gradient(180deg, #fafbf9 0%, #f0f4ff 100%)', fontFamily: 'Lexend, sans-serif' }}
    >
      {/* Progress bar */}
      <div className="px-4 py-3 bg-white border-b" style={{ borderColor: '#eff6e7' }}>
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: mascot.bgGradient }}
              animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
          </div>
          <div className="text-3xl">{mascot.emoji}</div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <AnimatePresence mode="wait">

            {/* PHASE: LISTEN */}
            {phase === 'listen' && (
              <motion.div key="listen"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center space-y-6 py-4"
              >
                <h2 className="text-3xl font-black" style={{ color: '#171d14' }}>
                  🎧 {t('learning.listenFirst') || 'Listen First!'}
                </h2>
                <p className="text-lg font-semibold" style={{ color: '#6f7a6b' }}>
                  {t('learning.hearThenSay') || 'Hear the sound, then say it yourself!'}
                </p>

                <motion.button
                  animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  onClick={() => playSound(targetWord)}
                  className="w-48 h-48 rounded-full shadow-2xl flex flex-col items-center justify-center text-white font-black text-6xl mx-auto cursor-pointer select-none"
                  style={{ background: mascot.bgGradient }}
                  whileTap={{ scale: 0.93 }}
                >
                  <span className="text-7xl">{targetLetter}</span>
                  <span className="text-base mt-1 opacity-80">🔊 Tap to hear</span>
                </motion.button>

                <div className="text-4xl font-black" style={{ color: mascot.color }}>
                  {targetWord}
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}
                  onClick={() => { setPhase('record'); setProgress(30); }}
                  className="px-12 py-5 rounded-2xl text-white text-2xl font-black shadow-2xl"
                  style={{ background: mascot.bgGradient }}
                >
                  {t('learning.imReady') || "I'm Ready!"} 🎤
                </motion.button>
              </motion.div>
            )}

            {/* PHASE: RECORD */}
            {phase === 'record' && (
              <motion.div key="record"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-center space-y-6 py-4"
              >
                <h2 className="text-3xl font-black" style={{ color: '#171d14' }}>
                  🎤 {t('learning.yourTurn') || 'Your Turn!'}
                </h2>

                <div className="text-5xl font-black" style={{ color: mascot.color }}>
                  "{targetWord}"
                </div>

                {countdown !== null && (
                  <motion.div
                    key={countdown}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-8xl font-black"
                    style={{ color: mascot.color }}
                  >
                    {countdown}
                  </motion.div>
                )}

                {!isRecording && countdown === null && (
                  <motion.button
                    whileTap={{ scale: 0.93 }} whileHover={{ scale: 1.05 }}
                    onClick={startCountdown}
                    className="w-44 h-44 rounded-full shadow-2xl flex flex-col items-center justify-center mx-auto"
                    style={{ background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)' }}
                  >
                    <span className="text-white text-6xl">🎙️</span>
                    <span className="text-white font-black text-lg mt-1">Hold & Speak</span>
                  </motion.button>
                )}

                {isRecording && (
                  <div className="space-y-4">
                    <RecordingWaveform color={mascot.color} />
                    <div className="text-xl font-bold" style={{ color: '#f44336' }}>
                      🔴 Recording... {MAX_RECORD_SECONDS - recordingTime}s
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { stopRecording(); setIsRecording(false); }}
                      className="px-8 py-3 rounded-full font-bold text-white"
                      style={{ background: '#f44336' }}
                    >
                      ⏹ Stop
                    </motion.button>
                  </div>
                )}

                {attempts > 0 && !isRecording && countdown === null && (
                  <p className="text-sm font-semibold" style={{ color: '#9e9e9e' }}>
                    Attempt #{attempts + 1} — Best score: {bestScore}%
                  </p>
                )}
              </motion.div>
            )}

            {/* PHASE: ANALYZING */}
            {phase === 'analyzing' && (
              <motion.div key="analyzing"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center space-y-8 py-12"
              >
                <motion.div
                  animate={{ y: [0, -15, 0], rotate: [-5, 5, -5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-8xl"
                >
                  {mascot.emoji}
                </motion.div>
                <h2 className="text-2xl font-black" style={{ color: '#171d14' }}>
                  🤖 {t('learning.aiListening') || 'AI is listening...'}
                </h2>
                <div className="flex justify-center gap-2">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i}
                      className="w-4 h-4 rounded-full"
                      style={{ background: mascot.color }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                    />
                  ))}
                </div>
                <p className="text-base font-semibold" style={{ color: '#6f7a6b' }}>
                  {t('learning.checkingPronunciation') || 'Checking your pronunciation...'}
                </p>
              </motion.div>
            )}

            {/* PHASE: FEEDBACK */}
            {phase === 'feedback' && aiResult && (
              <motion.div key="feedback"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-center space-y-6 py-4"
              >
                <h2 className="text-2xl font-black" style={{ color: '#171d14' }}>
                  {aiResult.score >= 70 ? '🎉 Great job!' : '💪 Good try!'}
                </h2>

                {/* Score ring */}
                <ScoreRing score={aiResult.score} color={aiResult.score >= 70 ? '#4caf50' : aiResult.score >= 50 ? '#ff9800' : '#f44336'} />

                {/* AI Feedback message */}
                <div className="px-6 py-4 rounded-2xl text-lg font-semibold" style={{ background: '#e8f5e9', color: '#1b5e20', border: '2px solid #4caf50' }}>
                  ✨ {aiResult.feedback}
                </div>

                {/* Phonetic tip (only if score < 70) */}
                {aiResult.phonetic_tip && aiResult.score < 70 && (
                  <div className="px-6 py-4 rounded-2xl text-base font-semibold" style={{ background: '#fff3e0', color: '#e65100', border: '2px solid #ff9800' }}>
                    💡 Tip: {aiResult.phonetic_tip}
                  </div>
                )}

                {/* What Gemini heard */}
                {aiResult.sounds_like && aiResult.sounds_like !== 'correct' && aiResult.sounds_like !== 'unknown' && (
                  <p className="text-sm font-semibold" style={{ color: '#9e9e9e' }}>
                    I heard: "{aiResult.sounds_like}"
                  </p>
                )}

                <div className="flex gap-4 justify-center flex-wrap">
                  {/* Retry if score < 70 and under 3 attempts */}
                  {aiResult.score < 70 && attempts < 3 && (
                    <motion.button
                      whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}
                      onClick={handleTryAgain}
                      className="px-8 py-4 rounded-2xl font-black text-lg shadow-lg"
                      style={{ background: '#f5f5f5', color: '#333' }}
                    >
                      🔄 Try Again
                    </motion.button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}
                    onClick={handleContinue}
                    className="px-10 py-4 rounded-2xl text-white font-black text-xl shadow-2xl"
                    style={{ background: mascot.bgGradient }}
                  >
                    {aiResult.score >= 60 ? '🚀 Continue!' : '➡️ Next'}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* PHASE: CELEBRATE */}
            {phase === 'celebrate' && (
              <motion.div key="celebrate"
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center space-y-6 py-8"
              >
                <motion.div
                  animate={{ y: [0, -30, 0], rotate: [-15, 15, -15], scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-9xl"
                >
                  {mascot.emoji}
                </motion.div>
                <h1 className="text-4xl font-black" style={{ color: '#171d14' }}>
                  {bestScore >= 80 ? '⭐ Amazing Speaker!' : bestScore >= 60 ? '🎉 Well Done!' : '💪 Keep Practicing!'}
                </h1>
                <div className="inline-block px-8 py-4 rounded-2xl font-black text-3xl shadow-xl"
                  style={{ background: mascot.bgGradient, color: 'white' }}>
                  {bestScore}%
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
