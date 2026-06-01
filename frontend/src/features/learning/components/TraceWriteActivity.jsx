import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMascot } from '@/shared/data/mascots';
import learningService from '@/shared/services/learningService';

// ═══════════════════════════════════════════════════════════════════════
// LETTER PATH DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════
const LETTER_PATHS = {
  A: {
    paths: ['M 20 110 L 50 20 L 80 110', 'M 35 75 L 65 75'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 20, y: 110, label: '1' }, { x: 35, y: 75, label: '2' }],
    arrows: [{ x: 50, y: 65, angle: -60 }, { x: 50, y: 75, angle: 0 }],
    instructions: 'Up the mountain, down the mountain, then a line across!'
  },
  B: {
    paths: ['M 25 20 L 25 120', 'M 25 20 Q 70 20 70 50 Q 70 70 25 70', 'M 25 70 Q 75 70 75 95 Q 75 120 25 120'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 25, y: 20, label: '1' }, { x: 25, y: 20, label: '2' }, { x: 25, y: 70, label: '3' }],
    arrows: [{ x: 25, y: 70, angle: 90 }],
    instructions: 'Down the line, then make two bumps!'
  },
  C: {
    paths: ['M 80 35 Q 20 20 20 70 Q 20 120 80 105'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 80, y: 35, label: '1' }],
    arrows: [{ x: 20, y: 70, angle: 90 }],
    instructions: 'Curve like the moon!'
  },
  D: {
    paths: ['M 25 20 L 25 120', 'M 25 20 Q 80 20 80 70 Q 80 120 25 120'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 25, y: 20, label: '1' }, { x: 25, y: 20, label: '2' }],
    arrows: [{ x: 25, y: 70, angle: 90 }],
    instructions: 'Down the line, then a big round belly!'
  },
  E: {
    paths: ['M 75 25 L 25 25', 'M 25 25 L 25 115', 'M 25 70 L 65 70', 'M 25 115 L 75 115'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 75, y: 25, label: '1' }, { x: 25, y: 25, label: '2' }, { x: 25, y: 70, label: '3' }, { x: 25, y: 115, label: '4' }],
    arrows: [],
    instructions: 'Top line, down, middle line, bottom line!'
  },
  F: {
    paths: ['M 75 25 L 25 25', 'M 25 25 L 25 115', 'M 25 70 L 65 70'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 75, y: 25, label: '1' }, { x: 25, y: 25, label: '2' }, { x: 25, y: 70, label: '3' }],
    arrows: [],
    instructions: 'Top line, down, then a middle line!'
  },
  G: {
    paths: ['M 80 35 Q 20 20 20 70 Q 20 120 80 105', 'M 80 70 L 55 70'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 80, y: 35, label: '1' }, { x: 80, y: 70, label: '2' }],
    arrows: [{ x: 20, y: 70, angle: 90 }],
    instructions: 'Like a C, then add a little shelf!'
  },
  H: {
    paths: ['M 25 20 L 25 120', 'M 25 70 L 75 70', 'M 75 20 L 75 120'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 25, y: 20, label: '1' }, { x: 25, y: 70, label: '2' }, { x: 75, y: 20, label: '3' }],
    arrows: [],
    instructions: 'Down, across the middle, down again!'
  },
  I: {
    paths: ['M 25 25 L 75 25', 'M 50 25 L 50 115', 'M 25 115 L 75 115'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 25, y: 25, label: '1' }, { x: 50, y: 25, label: '2' }, { x: 25, y: 115, label: '3' }],
    arrows: [],
    instructions: 'Top line, down the middle, bottom line!'
  },
  J: {
    paths: ['M 65 25 L 65 95 Q 65 120 40 120 Q 20 120 20 100'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 65, y: 25, label: '1' }],
    arrows: [{ x: 65, y: 70, angle: 90 }],
    instructions: 'Straight down, then hook at the bottom!'
  },
  K: {
    paths: ['M 25 20 L 25 120', 'M 25 70 L 75 25', 'M 25 70 L 75 120'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 25, y: 20, label: '1' }, { x: 25, y: 70, label: '2' }, { x: 25, y: 70, label: '3' }],
    arrows: [],
    instructions: 'Down the line, then kick out two legs!'
  },
  L: {
    paths: ['M 25 20 L 25 115 L 75 115'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 25, y: 20, label: '1' }],
    arrows: [{ x: 25, y: 115, angle: 0 }],
    instructions: 'Straight down, then a foot at the bottom!'
  },
  M: {
    paths: ['M 20 120 L 20 20', 'M 20 20 L 50 70', 'M 50 70 L 80 20', 'M 80 20 L 80 120'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 20, y: 120, label: '1' }, { x: 20, y: 20, label: '2' }, { x: 50, y: 70, label: '3' }, { x: 80, y: 20, label: '4' }],
    arrows: [],
    instructions: 'Up, then two mountains, then down!'
  },
  N: {
    paths: ['M 25 120 L 25 20', 'M 25 20 L 75 120', 'M 75 120 L 75 20'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 25, y: 120, label: '1' }, { x: 25, y: 20, label: '2' }, { x: 75, y: 120, label: '3' }],
    arrows: [],
    instructions: 'Up, slide down to the right, then up again!'
  },
  O: {
    paths: ['M 50 20 Q 20 20 20 70 Q 20 120 50 120 Q 80 120 80 70 Q 80 20 50 20'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 50, y: 20, label: '1' }],
    arrows: [{ x: 20, y: 70, angle: 90 }],
    instructions: 'Round and round like a circle!'
  },
  P: {
    paths: ['M 25 20 L 25 120', 'M 25 20 Q 75 20 75 50 Q 75 80 25 80'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 25, y: 20, label: '1' }, { x: 25, y: 20, label: '2' }],
    arrows: [{ x: 25, y: 70, angle: 90 }],
    instructions: 'Down the line, then a bump on top!'
  },
  Q: {
    paths: ['M 50 20 Q 20 20 20 70 Q 20 120 50 120 Q 80 120 80 70 Q 80 20 50 20', 'M 60 95 L 80 120'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 50, y: 20, label: '1' }, { x: 60, y: 95, label: '2' }],
    arrows: [],
    instructions: 'Circle, then a little tail!'
  },
  R: {
    paths: ['M 25 20 L 25 120', 'M 25 20 Q 75 20 75 50 Q 75 80 25 80', 'M 25 80 L 75 120'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 25, y: 20, label: '1' }, { x: 25, y: 20, label: '2' }, { x: 25, y: 80, label: '3' }],
    arrows: [],
    instructions: 'Down the line, bump on top, then kick a leg out!'
  },
  S: {
    paths: ['M 70 30 Q 30 30 30 50 Q 30 70 50 70 Q 70 70 70 90 Q 70 110 30 110'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 70, y: 30, label: '1' }],
    arrows: [{ x: 50, y: 30, angle: 180 }, { x: 30, y: 70, angle: 90 }, { x: 50, y: 110, angle: 180 }],
    instructions: 'Start at the top right, curve left, then around like a snake!'
  },
  T: {
    paths: ['M 20 25 L 80 25', 'M 50 25 L 50 110'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 20, y: 25, label: '1' }, { x: 50, y: 25, label: '2' }],
    arrows: [{ x: 50, y: 25, angle: 0 }, { x: 50, y: 70, angle: 90 }],
    instructions: 'Across the top, then straight down!'
  },
  U: {
    paths: ['M 25 20 L 25 90 Q 25 120 50 120 Q 75 120 75 90 L 75 20'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 25, y: 20, label: '1' }],
    arrows: [{ x: 25, y: 90, angle: 90 }],
    instructions: 'Down, round the bottom, and back up!'
  },
  V: {
    paths: ['M 20 20 L 50 115 L 80 20'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 20, y: 20, label: '1' }],
    arrows: [{ x: 50, y: 115, angle: 0 }],
    instructions: 'Slide down to the middle, then back up!'
  },
  W: {
    paths: ['M 15 20 L 30 110', 'M 30 110 L 50 60', 'M 50 60 L 70 110', 'M 70 110 L 85 20'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 15, y: 20, label: '1' }, { x: 30, y: 110, label: '2' }, { x: 50, y: 60, label: '3' }, { x: 70, y: 110, label: '4' }],
    arrows: [],
    instructions: 'Two valleys going down and up!'
  },
  X: {
    paths: ['M 20 20 L 80 120', 'M 80 20 L 20 120'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 20, y: 20, label: '1' }, { x: 80, y: 20, label: '2' }],
    arrows: [],
    instructions: 'Slide down one way, then cross the other way!'
  },
  Y: {
    paths: ['M 20 20 L 50 70', 'M 80 20 L 50 70', 'M 50 70 L 50 120'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 20, y: 20, label: '1' }, { x: 80, y: 20, label: '2' }, { x: 50, y: 70, label: '3' }],
    arrows: [],
    instructions: 'Two lines meet in the middle, then go straight down!'
  },
  Z: {
    paths: ['M 20 25 L 80 25', 'M 80 25 L 20 115', 'M 20 115 L 80 115'],
    viewBox: '0 0 100 140',
    startPoints: [{ x: 20, y: 25, label: '1' }, { x: 80, y: 25, label: '2' }, { x: 20, y: 115, label: '3' }],
    arrows: [],
    instructions: 'Across the top, slide down, across the bottom!'
  },
};

// ═══════════════════════════════════════════════════════════════════════
// SOUND HELPER
// ═══════════════════════════════════════════════════════════════════════
const playSound = (text, options = {}) => {
  if (typeof window === 'undefined') return;
  window.speechSynthesis?.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'en-US';
  utt.rate = options.rate || 0.7;
  utt.pitch = options.pitch || 1.3;
  window.speechSynthesis?.speak(utt);
};

// ═══════════════════════════════════════════════════════════════════════
// SCORING ALGORITHM
// ═══════════════════════════════════════════════════════════════════════
const calculateTracingScore = (drawnPoints, letterPath, canvasWidth, canvasHeight) => {
  if (!drawnPoints || drawnPoints.length < 5) return 0;

  const scaleX = canvasWidth / 100;
  const scaleY = canvasHeight / 140;

  // Sample points along ALL ideal paths
  const idealPoints = [];
  for (const pathStr of letterPath.paths) {
    const pts = samplePathPoints(pathStr, 50);
    idealPoints.push(...pts.map(p => ({ x: p.x * scaleX, y: p.y * scaleY })));
  }
  if (idealPoints.length === 0) return 50;

  // For each drawn point, find distance to nearest ideal point
  const sampledDrawn = samplePointsEvenly(drawnPoints, Math.min(40, drawnPoints.length));
  let totalDistance = 0;
  for (const dp of sampledDrawn) {
    let minDist = Infinity;
    for (const ip of idealPoints) {
      const d = Math.sqrt((dp.x - ip.x) ** 2 + (dp.y - ip.y) ** 2);
      if (d < minDist) minDist = d;
    }
    totalDistance += minDist;
  }
  const avgDistance = totalDistance / sampledDrawn.length;

  // Forgiving scoring: 4-6 year olds naturally deviate 15-30px
  let score;
  if (avgDistance < 15) score = 100 - (avgDistance / 15) * 15;
  else if (avgDistance < 30) score = 85 - ((avgDistance - 15) / 15) * 15;
  else if (avgDistance < 50) score = 70 - ((avgDistance - 30) / 20) * 20;
  else if (avgDistance < 80) score = 50 - ((avgDistance - 50) / 30) * 50;
  else score = 0;

  // Coverage penalty: did they draw enough of the letter?
  const drawnLength = calculatePathLength(drawnPoints);
  const expectedMinLength = canvasHeight * 0.5;
  if (drawnLength < expectedMinLength) {
    score *= (drawnLength / expectedMinLength);
  }

  // Start point bonus: +10 if they started near a correct start point
  if (drawnPoints.length > 0 && letterPath.startPoints.length > 0) {
    const fp = drawnPoints[0];
    const nearStart = letterPath.startPoints.some(sp => {
      const dx = fp.x - sp.x * scaleX;
      const dy = fp.y - sp.y * scaleY;
      return Math.sqrt(dx * dx + dy * dy) < 50;
    });
    if (nearStart) score = Math.min(100, score + 10);
  }

  return Math.round(Math.max(0, Math.min(100, score)));
};

// Sample points along SVG path using the browser's real path math
const samplePathPoints = (pathData, count) => {
  try {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', pathData);
    svg.appendChild(path);

    const totalLength = path.getTotalLength();
    if (totalLength === 0) throw new Error('zero length');

    const points = [];
    for (let i = 0; i < count; i++) {
      const distance = (i / (count - 1)) * totalLength;
      const pt = path.getPointAtLength(distance);
      points.push({ x: pt.x, y: pt.y });
    }
    return points;
  } catch {
    const match = pathData.match(/M\s*([\d.]+)[\s,]+([\d.]+)/);
    if (match) return [{ x: parseFloat(match[1]), y: parseFloat(match[2]) }];
    return [{ x: 50, y: 70 }];
  }
};

// Calculate total pixel length of a drawn stroke
const calculatePathLength = (points) => {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
};

// Sample drawn points evenly
const samplePointsEvenly = (points, count) => {
  if (points.length <= count) return points;
  const step = Math.floor(points.length / count);
  return points.filter((_, i) => i % step === 0).slice(0, count);
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function TraceWriteActivity({ content, onComplete }) {
  const letter = (content.letter || 'S').toUpperCase();
  const mascot = getMascot(letter);
  const letterPath = LETTER_PATHS[letter] || LETTER_PATHS.S;

  const [phase, setPhase] = useState('demo'); // demo → guided → light → free → ai_feedback → celebrate
  const [progress, setProgress] = useState(0);
  const [phaseAttempts, setPhaseAttempts] = useState({ guided: 0, light: 0, free: 0 });
  const [phaseScores, setPhaseScores] = useState({ guided: [], light: [], free: [] });
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(0);
  const [showTryButton, setShowTryButton] = useState(false);
  const [aiHandwritingResult, setAiHandwritingResult] = useState(null);
  const [isAnalyzingHandwriting, setIsAnalyzingHandwriting] = useState(false);
  const freeCanvasRef = useRef(null); // set by TracingPhase when mode===free

  const advancePhase = (canvasEl) => {
    const phases = ['demo', 'guided', 'light', 'free', 'ai_feedback', 'celebrate'];
    const currentIdx = phases.indexOf(phase);
    const nextPhase = phases[currentIdx + 1];

    if (nextPhase === 'ai_feedback') {
      // Trigger AI handwriting analysis using the free-write canvas
      setPhase('ai_feedback');
      setProgress(88);
      runHandwritingAnalysis(canvasEl);
      return;
    }

    if (nextPhase === 'celebrate') {
      // Calculate final weighted score
      const guidedBest = phaseScores.guided.length > 0 ? Math.max(...phaseScores.guided) : 0;
      const lightBest = phaseScores.light.length > 0 ? Math.max(...phaseScores.light) : 0;
      const freeScore = phaseScores.free.length > 0 ? phaseScores.free[0] : 0;

      const finalScore = Math.round(
        (guidedBest * 0.3) + (lightBest * 0.3) + (freeScore * 0.4)
      );

      setProgress(100);
      setPhase('celebrate');
      setTimeout(() => onComplete(finalScore), 3500);
    } else {
      setPhase(nextPhase);
      setProgress(((currentIdx + 1) / 5) * 100);
      setCurrentStrokeIndex(0);
    }
  };

  const runHandwritingAnalysis = async (canvasEl) => {
    setIsAnalyzingHandwriting(true);
    try {
      if (!canvasEl) throw new Error('No canvas');
      const blob = await new Promise(resolve => canvasEl.toBlob(resolve, 'image/png'));
      if (!blob || blob.size < 500) throw new Error('Canvas too small or empty');

      const formData = new FormData();
      formData.append('image', blob, 'handwriting.png');
      formData.append('target_letter', letter);
      formData.append('child_age', String(content?.child_age || 7));
      formData.append('language', /[\u0600-\u06FF]/.test(letter) ? 'Arabic' : 'English');

      const response = await learningService.analyzeHandwriting(formData);
      setAiHandwritingResult(response.data);
    } catch (err) {
      console.error('Handwriting AI error:', err);
      setAiHandwritingResult({
        score: 75,
        is_recognizable: true,
        feedback: 'Great writing! You did a wonderful job!',
        strengths: ['Good effort', 'Nice shape'],
        improvement_tip: '',
        letter_recognized: letter,
      });
    } finally {
      setIsAnalyzingHandwriting(false);
    }
  };


  const recordAttempt = (score) => {
    if (phase === 'guided') {
      setPhaseScores(prev => ({
        ...prev,
        guided: [...prev.guided, score]
      }));
      setPhaseAttempts(prev => ({ ...prev, guided: prev.guided + 1 }));
    } else if (phase === 'light') {
      setPhaseScores(prev => ({
        ...prev,
        light: [...prev.light, score]
      }));
      setPhaseAttempts(prev => ({ ...prev, light: prev.light + 1 }));
    } else if (phase === 'free') {
      setPhaseScores(prev => ({
        ...prev,
        free: [...prev.free, score]
      }));
      setPhaseAttempts(prev => ({ ...prev, free: prev.free + 1 }));
    }
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
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            {phase === 'demo' && (
              <DemoPhase
                key="demo"
                mascot={mascot}
                letter={letter}
                letterPath={letterPath}
                onContinue={advancePhase}
              />
            )}
            {phase === 'guided' && (
              <TracingPhase
                key="guided"
                mascot={mascot}
                letter={letter}
                letterPath={letterPath}
                mode="guided"
                attempts={phaseAttempts.guided}
                maxAttempts={3}
                onRecord={recordAttempt}
                onContinue={advancePhase}
              />
            )}
            {phase === 'light' && (
              <TracingPhase
                key="light"
                mascot={mascot}
                letter={letter}
                letterPath={letterPath}
                mode="light"
                attempts={phaseAttempts.light}
                maxAttempts={2}
                onRecord={recordAttempt}
                onContinue={advancePhase}
              />
            )}
            {phase === 'free' && (
              <TracingPhase
                key="free"
                mascot={mascot}
                letter={letter}
                letterPath={letterPath}
                mode="free"
                attempts={phaseAttempts.free}
                maxAttempts={1}
                onRecord={recordAttempt}
                onContinue={(canvasEl) => advancePhase(canvasEl)}
                exposeCanvas={(el) => { freeCanvasRef.current = el; }}
              />
            )}
            {phase === 'ai_feedback' && (
              <AIHandwritingFeedbackPhase
                key="ai_feedback"
                mascot={mascot}
                letter={letter}
                aiResult={aiHandwritingResult}
                isAnalyzing={isAnalyzingHandwriting}
                onContinue={() => advancePhase()}
              />
            )}
            {phase === 'celebrate' && (
              <CelebratePhase
                key="celebrate"
                mascot={mascot}
                letter={letter}
                phaseScores={phaseScores}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 1: DEMO - Watch mascot write the letter
// ═══════════════════════════════════════════════════════════════════════
function DemoPhase({ mascot, letter, letterPath, onContinue }) {
  const [showContinue, setShowContinue] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    playSound(`Watch how I write the letter ${letter}! Start at the top...`);
    const timer = setTimeout(() => {
      setAnimationComplete(true);
      setShowContinue(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [letter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-6 py-4"
    >
      <h2 className="text-3xl font-black" style={{ color: '#171d14' }}>
        Watch Me! 👀
      </h2>

      <p className="text-lg font-semibold" style={{ color: mascot.color }}>
        {letterPath.instructions}
      </p>

      {/* SVG Demo */}
      <div className="flex justify-center">
        <svg
          width="300"
          height="420"
          viewBox={letterPath.viewBox}
          style={{ border: '4px solid #d0e8c8', borderRadius: '16px', background: 'white' }}
        >
          {letterPath.paths.map((path, i) => (
            <g key={i}>
              {/* Starting dot */}
              {letterPath.startPoints[i] && (
                <circle
                  cx={letterPath.startPoints[i].x}
                  cy={letterPath.startPoints[i].y}
                  r="8"
                  fill={mascot.color}
                >
                  {animationComplete && (
                    <animate
                      attributeName="r"
                      values="8;12;8"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
              )}
              {/* Number label */}
              {letterPath.startPoints[i] && (
                <text
                  x={letterPath.startPoints[i].x}
                  y={letterPath.startPoints[i].y - 15}
                  textAnchor="middle"
                  fontSize="20"
                  fontWeight="bold"
                  fill={mascot.color}
                >
                  {letterPath.startPoints[i].label}
                </text>
              )}
              {/* Path */}
              <path
                d={path}
                stroke={mascot.color}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="1000"
                strokeDashoffset="1000"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="1000"
                  to="0"
                  dur="2s"
                  begin={`${i * 0.5}s`}
                  fill="freeze"
                />
              </path>
            </g>
          ))}
        </svg>
      </div>

      {/* Animated mascot */}
      <motion.div
        animate={{
          y: [0, -10, 0],
          rotate: [-5, 5, -5],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-8xl"
      >
        {mascot.emoji}
      </motion.div>

      {showContinue && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onContinue}
          className="kid-btn w-full max-w-xs mx-auto text-xl py-4 shadow-xl hover:scale-105 transition-all"
          style={{ background: mascot.bgGradient }}
        >
          Now you try! →
        </motion.button>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TRACING PHASES (Guided, Light, Free)
// ═══════════════════════════════════════════════════════════════════════
function TracingPhase({ mascot, letter, letterPath, mode, attempts, maxAttempts, onRecord, onContinue, exposeCanvas }) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const drawnPointsRef = useRef([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState([]);
  const [showScore, setShowScore] = useState(null);
  const [strokeComplete, setStrokeComplete] = useState(false);

  const phaseTitle = mode === 'guided' ? 'Guided Trace' :
    mode === 'light' ? 'Light Trace' :
      'Free Write';

  const showGuidance = mode === 'guided';
  const showOutline = mode !== 'free';

  useEffect(() => {
    if (mode === 'free') {
      playSound(`Now write the letter ${letter} all by yourself!`);
    } else {
      playSound(`Trace the letter ${letter}!`);
    }
  }, [mode, letter]);

  // Draw the letter guide into the canvas background on mount / reset
  const drawGuide = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showOutline) return; // free-write mode: blank canvas

    // Parse the letterPath viewBox to get coordinate space
    const vb = (letterPath.viewBox || '0 0 300 420').split(' ').map(Number);
    const scaleX = canvas.width / vb[2];
    const scaleY = canvas.height / vb[3];

    ctx.save();
    ctx.scale(scaleX, scaleY);

    // Draw faint letter outline
    letterPath.paths.forEach((pathStr) => {
      const p = new Path2D(pathStr);
      ctx.strokeStyle = '#d8d8d8';
      ctx.lineWidth = 14 / scaleX;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke(p);
    });

    // Draw start dots + arrows
    letterPath.startPoints && letterPath.startPoints.forEach((sp, i) => {
      if (!sp) return;
      // Orange start dot
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 10 / scaleX, 0, Math.PI * 2);
      ctx.fillStyle = mascot.color || '#f5a623';
      ctx.fill();

      // Label
      if (showGuidance) {
        ctx.font = `bold ${18 / scaleX}px sans-serif`;
        ctx.fillStyle = mascot.color || '#f5a623';
        ctx.textAlign = 'center';
        ctx.fillText(sp.label || String(i + 1), sp.x, sp.y - 15 / scaleX);
      }
    });

    // Draw direction arrows
    if (showGuidance && letterPath.arrows) {
      letterPath.arrows.forEach((arrow) => {
        ctx.save();
        ctx.translate(arrow.x, arrow.y);
        ctx.rotate((arrow.angle * Math.PI) / 180);
        ctx.strokeStyle = mascot.color || '#f5a623';
        ctx.fillStyle = mascot.color || '#f5a623';
        ctx.lineWidth = 3 / scaleX;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(-10 / scaleX, 0);
        ctx.lineTo(10 / scaleX, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(10 / scaleX, 0);
        ctx.lineTo(4 / scaleX, -4 / scaleX);
        ctx.lineTo(4 / scaleX, 4 / scaleX);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
    }

    ctx.restore();
  };

  useEffect(() => {
    drawGuide();
    // Expose canvas ref to parent for AI analysis (free-write mode only)
    if (mode === 'free' && exposeCanvas) exposeCanvas(canvasRef.current);
  }, [mode, letter, letterPath]);

  const lastPosRef = useRef({ x: 0, y: 0 });

  const getCanvasPoint = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e) => {
    if (showScore !== null) return;
    const canvas = canvasRef.current;
    canvas.setPointerCapture(e.pointerId);

    const { x, y } = getCanvasPoint(e, canvas);
    lastPosRef.current = { x, y };
    isDrawingRef.current = true;
    drawnPointsRef.current = [{ x, y }];

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#2e7d32'; // dark green, always visible
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const handlePointerMove = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const { x, y } = getCanvasPoint(e, canvas);
    drawnPointsRef.current.push({ x, y });

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPosRef.current = { x, y };
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const pts = drawnPointsRef.current;
    const drawnLength = calculatePathLength(pts);
    if (pts.length > 5 && drawnLength > 40) {
      const canvas = canvasRef.current;
      const score = calculateTracingScore(pts, letterPath, canvas.width, canvas.height);
      onRecord(score);
      setShowScore(score);
      setStrokeComplete(true);
      setIsDrawing(false);

      if (score >= 70) {
        playSound(mascot.encouragements?.[Math.floor(Math.random() * 3)] || 'Great job!');
      } else if (score >= 40) {
        playSound('Good try! Keep going!');
      } else {
        playSound('Keep practicing, you can do it!');
      }
    }
  };

  const handleTryAgain = () => {
    drawnPointsRef.current = [];
    isDrawingRef.current = false;
    setShowScore(null);
    setStrokeComplete(false);
    setIsDrawing(false);
    // Restore guide on canvas
    setTimeout(drawGuide, 0);
  };

  const handleContinue = () => {
    if (attempts >= maxAttempts - 1) {
      // Pass canvas element when leaving free-write phase so parent can send it for AI analysis
      onContinue(mode === 'free' ? canvasRef.current : undefined);
    } else {
      handleTryAgain();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="text-center space-y-6 py-4"
    >
      <h2 className="text-2xl font-black" style={{ color: '#171d14' }}>
        {phaseTitle}
      </h2>

      {/* Attempt counter */}
      <div className="flex justify-center gap-2">
        {[...Array(maxAttempts)].map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full"
            style={{ background: i < attempts ? mascot.color : '#e0e0e0' }}
          />
        ))}
      </div>

      {/* Canvas - single element, guide drawn programmatically */}
      <div className="flex justify-center">
        <div style={{ position: 'relative', width: 300, height: 420 }}>
          <canvas
            ref={canvasRef}
            width="300"
            height="420"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              border: '4px solid #d0e8c8',
              borderRadius: '16px',
              background: 'white',
              cursor: showScore !== null ? 'default' : 'crosshair',
              touchAction: 'none',
              display: 'block',
            }}
          />

        </div>
      </div>

      {/* Mascot feedback */}
      <motion.div
        animate={{
          scale: isDrawing ? [1, 1.2, 1] : 1,
          rotate: isDrawing ? [-5, 5, -5] : 0,
        }}
        className="text-6xl"
      >
        {mascot.emoji}
      </motion.div>

      {/* Score display */}
      <AnimatePresence>
        {showScore !== null && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="inline-block px-8 py-4 rounded-2xl font-black text-2xl"
            style={{ background: mascot.bgGradient, color: 'white' }}
          >
            {showScore}% {showScore >= 80 ? '🌟' : showScore >= 70 ? '⭐' : '💪'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      {showScore !== null && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex gap-4 justify-center"
        >
          {attempts < maxAttempts - 1 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleTryAgain}
              className="px-8 py-3 rounded-full font-bold shadow-lg"
              style={{ background: '#9e9e9e', color: 'white' }}
            >
              Try Again
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleContinue}
            className="px-8 py-3 rounded-full font-bold shadow-lg"
            style={{ background: mascot.bgGradient, color: 'white' }}
          >
            {attempts >= maxAttempts - 1 ? 'Continue →' : 'Keep it! ✓'}
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 5: CELEBRATE
// ═══════════════════════════════════════════════════════════════════════
function CelebratePhase({ mascot, letter, phaseScores }) {
  const guidedBest = phaseScores.guided.length > 0 ? Math.max(...phaseScores.guided) : 0;
  const lightBest = phaseScores.light.length > 0 ? Math.max(...phaseScores.light) : 0;
  const freeScore = phaseScores.free.length > 0 ? phaseScores.free[0] : 0;

  const finalScore = Math.round(
    (guidedBest * 0.3) + (lightBest * 0.3) + (freeScore * 0.4)
  );

  const stars = finalScore >= 95 ? 3 : finalScore >= 80 ? 2 : finalScore >= 70 ? 1 : 0;
  const message = stars === 3 ? 'Perfect Writer! ✏️' :
    stars === 2 ? 'Great Tracing! 🎉' :
      stars === 1 ? 'Good Start! 💪' :
        'Keep Practicing! 📚';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-center space-y-6 py-8"
    >
      {/* Confetti */}
      <div className="relative h-32">
        {['🎉', '⭐', '🎊', '✨', '🌟', '✏️'].map((emoji, i) => (
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
        You wrote the letter {letter} beautifully!
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
        {finalScore}% • {stars} stars
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-6">
        <div className="p-4 rounded-2xl" style={{ background: '#eff6e7' }}>
          <div className="text-3xl font-black" style={{ color: mascot.color }}>
            {guidedBest}%
          </div>
          <div className="text-xs font-semibold" style={{ color: '#6f7a6b' }}>
            Guided
          </div>
        </div>
        <div className="p-4 rounded-2xl" style={{ background: '#eff6e7' }}>
          <div className="text-3xl font-black" style={{ color: mascot.color }}>
            {lightBest}%
          </div>
          <div className="text-xs font-semibold" style={{ color: '#6f7a6b' }}>
            Light
          </div>
        </div>
        <div className="p-4 rounded-2xl" style={{ background: '#eff6e7' }}>
          <div className="text-3xl font-black" style={{ color: mascot.color }}>
            {freeScore}%
          </div>
          <div className="text-xs font-semibold" style={{ color: '#6f7a6b' }}>
            Free
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// AI HANDWRITING FEEDBACK PHASE
// ═══════════════════════════════════════════════════════════════════════
function AIHandwritingFeedbackPhase({ mascot, letter, aiResult, isAnalyzing, onContinue }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="text-center space-y-6 py-4"
    >
      {isAnalyzing || !aiResult ? (
        /* Loading state */
        <div className="space-y-6 py-8">
          <motion.div
            animate={{ y: [0, -15, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-8xl"
          >
            {mascot.emoji}
          </motion.div>
          <h2 className="text-2xl font-black" style={{ color: '#171d14' }}>
            🤖 AI is checking your writing...
          </h2>
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-4 h-4 rounded-full"
                style={{ background: mascot.color }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>
          <p className="text-base font-semibold" style={{ color: '#6f7a6b' }}>
            Analyzing your letter {letter}...
          </p>
        </div>
      ) : (
        /* Results */
        <div className="space-y-5">
          <h2 className="text-2xl font-black" style={{ color: '#171d14' }}>
            {aiResult.score >= 70 ? '✏️ Great Writing!' : '✏️ Keep Practicing!'}
          </h2>

          {/* Score display */}
          <div className="flex justify-center">
            <div
              className="w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-xl"
              style={{
                background: aiResult.score >= 70 ? mascot.bgGradient : 'linear-gradient(135deg,#ff9800,#f57c00)',
                color: 'white'
              }}
            >
              <div className="text-3xl font-black">{aiResult.score}%</div>
              <div className="text-sm font-semibold opacity-80">
                {aiResult.score >= 80 ? '⭐⭐⭐' : aiResult.score >= 60 ? '⭐⭐' : '⭐'}
              </div>
            </div>
          </div>

          {/* AI Feedback sentence */}
          <div
            className="px-5 py-4 rounded-2xl text-base font-semibold"
            style={{ background: '#e8f5e9', color: '#1b5e20', border: '2px solid #4caf50' }}
          >
            ✨ {aiResult.feedback}
          </div>

          {/* Strengths */}
          {aiResult.strengths?.length > 0 && (
            <div className="text-left px-5 py-4 rounded-2xl" style={{ background: '#f3e5f5', border: '2px solid #9c27b0' }}>
              <p className="font-black text-sm mb-2" style={{ color: '#4a148c' }}>💪 What you did well:</p>
              {aiResult.strengths.map((s, i) => (
                <p key={i} className="text-sm font-semibold" style={{ color: '#6a1b9a' }}>✓ {s}</p>
              ))}
            </div>
          )}

          {/* Improvement tip (only show if score < 80) */}
          {aiResult.improvement_tip && aiResult.score < 80 && (
            <div
              className="px-5 py-4 rounded-2xl text-sm font-semibold text-left"
              style={{ background: '#fff3e0', color: '#e65100', border: '2px solid #ff9800' }}
            >
              💡 Tip: {aiResult.improvement_tip}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            onClick={onContinue}
            className="px-12 py-5 rounded-2xl text-white text-xl font-black shadow-2xl"
            style={{ background: mascot.bgGradient }}
          >
            🎉 See Results!
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}