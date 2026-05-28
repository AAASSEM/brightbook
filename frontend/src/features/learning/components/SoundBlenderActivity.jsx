import React, { useState, useEffect } from 'react';
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

const DEFAULT_WORDS = [
  { word: 'CAT', emoji: '🐱', sounds: ['k', 'aa', 't'] },
  { word: 'SUN', emoji: '☀️', sounds: ['sss', 'uh', 'n'] },
  { word: 'HAT', emoji: '🎩', sounds: ['h', 'aa', 't'] },
  { word: 'DOG', emoji: '🐶', sounds: ['d', 'aw', 'g'] },
];

// Transform AI-generated word format to component format
function transformWords(aiWords, letter) {
  // If AI generated simple string array, convert to word objects
  if (aiWords.length > 0 && typeof aiWords[0] === 'string') {
    const letterEmojis = {
      'G': '🦒', 'O': '🐙', 'U': '🦄', 'L': '🦁', 'F': '🐟', 'B': '🐻',
      'S': '🐍', 'A': '🐜', 'T': '🐯', 'I': '🦎', 'P': '🐷', 'N': '🎵',
      'C': '🐱', 'K': '🦘', 'E': '🐘', 'H': '🐴', 'R': '🐰', 'M': '🐭', 'D': '🦆'
    };

    return aiWords.map(word => ({
      word: word.toUpperCase(),
      emoji: letterEmojis[letter.toUpperCase()] || '📚',
      sounds: word.toUpperCase().split('')
    }));
  }

  // If already in correct format, return as-is
  return aiWords;
}

export default function SoundBlenderActivity({ content, onComplete }) {
  const t = useT();
  const lang = useLang();

  const letter = (content?.letter || 'A').toUpperCase();
  const mascot = getMascot(letter, lang);

  // Transform AI-generated words to component format
  const rawWords = content?.words?.length > 0 ? content.words : DEFAULT_WORDS;
  const words = transformWords(rawWords, letter);

  const [phase, setPhase] = useState('intro');
  const [progress, setProgress] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [scores, setScores] = useState([]);

  const currentWord = words[wordIdx];

  const advancePhase = () => {
    if (phase === 'intro') { setPhase('listen'); setProgress(20); }
    else if (phase === 'listen') { setPhase('blend'); setProgress(50); }
    else if (phase === 'blend') { setPhase('build'); setProgress(75); }
    else if (phase === 'build') {
      if (wordIdx < words.length - 1) { setWordIdx(wordIdx + 1); setPhase('listen'); setProgress(50); }
      else {
        setPhase('celebrate'); setProgress(100);
        const avg = scores.length > 0 ? scores.reduce((a,b)=>a+b,0)/scores.length : 0;
        setTimeout(() => onComplete(Math.round(avg)), 3500);
      }
    }
  };

  return (
    <div className="flex flex-col h-full no-scrollbar" style={{ background: 'linear-gradient(180deg,#fafbf9 0%,#f0f4ff 100%)', fontFamily: 'Lexend, sans-serif' }}>
      <div className="px-4 py-3 bg-white border-b z-10" style={{ borderColor: '#eff6e7' }}>
        <div className="flex items-center gap-4 max-w-3xl mx-auto">
          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: mascot.bgGradient }} animate={{ width: `${progress}%` }} />
          </div>
          <div className="text-3xl">{mascot.emoji}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar z-10">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <AnimatePresence mode="wait">
            {phase === 'intro' && <SBIntroPhase key="intro" mascot={mascot} word={currentWord} onContinue={advancePhase} t={t} />}
            {phase === 'listen' && <ListenPhase key={`listen-${wordIdx}`} mascot={mascot} word={currentWord} onContinue={advancePhase} t={t} />}
            {phase === 'blend' && <BlendPhase key={`blend-${wordIdx}`} mascot={mascot} word={currentWord} onContinue={advancePhase} t={t} />}
            {phase === 'build' && <BuildPhase key={`build-${wordIdx}`} mascot={mascot} word={currentWord} onComplete={(score) => { setScores(prev=>[...prev,score]); advancePhase(); }} t={t} />}
            {phase === 'celebrate' && <SBCelebratePhase key="celebrate" mascot={mascot} scores={scores} words={words} t={t} />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SBIntroPhase({ mascot, word, onContinue, t }) {
  useEffect(() => { setTimeout(() => playSound(t('learning.blenderTitle')), 400); }, [t]);
  return (
    <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0}} className="text-center space-y-8 py-8">
      <motion.div animate={{y:[0,-20,0]}} transition={{duration:2,repeat:Infinity}} className="text-9xl">{mascot.emoji}</motion.div>
      <h1 className="text-4xl font-black" style={{color:'#171d14'}}>🎵 {t('learning.blenderTitle')} 🎵</h1>
      <p className="text-xl font-semibold" style={{color:'#3f4a3c'}}>{t('learning.tutorialTitle')}</p>
      <div className="flex justify-center gap-3">
        {[...Array(3)].map((_,i)=>(
          <motion.div key={i} animate={{y:[0,-10,0]}} transition={{duration:1.5,repeat:Infinity,delay:i*0.2}} className="w-20 h-20 rounded-2xl border-4 border-dashed flex items-center justify-center text-3xl" style={{borderColor:mascot.color,color:mascot.color}}>?</motion.div>
        ))}
      </div>
      <motion.button whileTap={{scale:0.95}} onClick={onContinue} className="px-12 py-5 rounded-2xl text-white text-2xl font-black shadow-2xl" style={{background:mascot.bgGradient}}>{t('onboarding.continue')} ✨</motion.button>
    </motion.div>
  );
}

function ListenPhase({ mascot, word, onContinue, t }) {
  const [tappedSounds, setTappedSounds] = useState([]);
  const allTapped = tappedSounds.length === word.sounds.length;
  const handleTap = (sound, idx) => { playSound(sound); if(!tappedSounds.includes(idx)) setTappedSounds([...tappedSounds,idx]); };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-center space-y-8 py-4">
      <h2 className="text-2xl font-black" style={{color:'#171d14'}}>Tap each sound to hear it!</h2>
      <div className="text-9xl cursor-pointer" onClick={()=>playSound(word.word)}>{word.emoji}</div>
      <div className="flex justify-center gap-4 flex-wrap">
        {word.sounds.map((sound,idx)=>{
          const tapped=tappedSounds.includes(idx);
          return (
            <motion.button key={idx} whileHover={{scale:1.1}} whileTap={{scale:0.9}} onClick={()=>handleTap(sound,idx)} className={`w-24 h-24 rounded-full shadow-xl flex items-center justify-center text-3xl font-black transition-colors ${tapped ? 'ring-4 ring-offset-2' : ''}`} style={{background:tapped?mascot.bgGradient:'white',color:tapped?'white':mascot.color,border:`4px solid ${mascot.color}`, ringColor: mascot.color}}>{sound}</motion.button>
          );
        })}
      </div>
      <p className="text-base font-semibold" style={{color:'#6f7a6b'}}>{!allTapped?'👆 Tap each sound bubble!':"✨ Great! Now let's blend them!"}</p>
      {allTapped && <motion.button initial={{opacity:0}} animate={{opacity:1}} onClick={onContinue} className="px-10 py-4 rounded-full text-white text-xl font-black shadow-xl" style={{background:mascot.bgGradient}}>Blend them! 🎵</motion.button>}
    </motion.div>
  );
}

function BlendPhase({ mascot, word, onContinue }) {
  const [tappedOrder, setTappedOrder] = useState([]);
  const [merged, setMerged] = useState(false);

  const handleTap = (idx) => {
    if (merged||tappedOrder.includes(idx)) return;
    if (idx!==tappedOrder.length) { playSound('Tap them in order!'); return; }
    playSound(word.sounds[idx]);
    const n=[...tappedOrder,idx];
    setTappedOrder(n);
    if (n.length===word.sounds.length) {
      setTimeout(()=>{ setMerged(true); playSound(word.word,{rate:0.6}); setTimeout(()=>playSound(word.word),1200); },600);
    }
  };

  return (
    <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.9}} className="text-center space-y-8 py-4">
      <h2 className="text-2xl font-black" style={{color:'#171d14'}}>{merged?'✨ Magic happened! ✨':'Tap sounds in order!'}</h2>
      <div className="relative h-48 flex items-center justify-center">
        {!merged ? (
          <div className="flex gap-6">
            {word.sounds.map((sound,idx)=>{
              const tapped=tappedOrder.includes(idx);
              return (
                <motion.button key={idx} whileTap={{scale:0.9}} onClick={()=>handleTap(idx)} className={`w-24 h-24 rounded-full shadow-xl flex items-center justify-center text-2xl font-black transition-colors ${tapped ? 'ring-4 ring-offset-2' : ''}`} style={{background:tapped?mascot.bgGradient:'white',color:tapped?'white':mascot.color,border:`4px solid ${mascot.color}`, ringColor: mascot.color}}>/{sound}/</motion.button>
              );
            })}
          </div>
        ) : (
          <motion.div initial={{scale:0}} animate={{scale:1}} className="px-12 py-6 rounded-3xl shadow-2xl" style={{background:mascot.bgGradient}}>
            <div className="text-5xl mb-2">{word.emoji}</div>
            <div className="text-4xl font-black text-white">{word.word}</div>
          </motion.div>
        )}
      </div>
      {merged && (
        <>
          <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-2xl font-black" style={{color:mascot.color}}>{word.sounds.join('-')} = {word.word}!</motion.p>
          <motion.button initial={{opacity:0}} animate={{opacity:1}} onClick={onContinue} className="px-10 py-4 rounded-full text-white text-xl font-black shadow-xl" style={{background:mascot.bgGradient}}>Now you build it! 🧱</motion.button>
        </>
      )}
    </motion.div>
  );
}

function BuildPhase({ mascot, word, onComplete }) {
  const [slots, setSlots] = useState(Array(word.word.length).fill(null));
  const [available, setAvailable] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);

  // Initialize available letters only once when the word changes
  useEffect(() => {
    const letters = word.word.split('').map((l, i) => ({
      id: `${word.word}-${i}-${l}`, // Stable unique ID
      letter: l,
      used: false
    }));
    const scrambled = [...letters].sort(() => Math.random() - 0.5);
    setAvailable(scrambled);
    setSlots(Array(word.word.length).fill(null));
    setAttempts(0);
    setIsCorrect(false);
    
    const introTimer = setTimeout(() => playSound(`Build the word ${word.word}!`), 400);
    return () => clearTimeout(introTimer);
  }, [word.word]); 

  const handleLetterTap = (lo) => {
    if (lo.used || isCorrect) return;
    const emptySlot = slots.findIndex(s => s === null);
    if (emptySlot === -1) return;
    
    const ns = [...slots];
    ns[emptySlot] = lo;
    setSlots(ns);
    setAvailable(available.map(l => l.id === lo.id ? { ...l, used: true } : l));
    playSound(lo.letter);
    
    if (ns.every(s => s !== null)) {
      setTimeout(() => validate(ns), 500);
    }
  };

  const handleSlotTap = (si) => {
    if (isCorrect) return;
    const letter = slots[si];
    if (!letter) return;
    
    const ns = [...slots];
    ns[si] = null;
    setSlots(ns);
    setAvailable(available.map(l => l.id === letter.id ? { ...l, used: false } : l));
  };

  const validate = (filledSlots) => {
    const built = filledSlots.map(s => s.letter).join('');
    if (built === word.word) {
      setIsCorrect(true);
      const score = attempts === 0 ? 100 : attempts === 1 ? 70 : 40;
      playSound(word.word);
      setTimeout(() => playSound('Well done!'), 800);
      setTimeout(() => onComplete(score), 2500);
    } else {
      setAttempts(a => a + 1);
      playSound('Try again!');
      setTimeout(() => {
        setSlots(Array(word.word.length).fill(null));
        setAvailable(available.map(l => ({ ...l, used: false })));
      }, 1000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -50 }} 
      className="text-center space-y-8 py-4"
    >
      <h2 className="text-3xl font-black" style={{ color: '#171d14' }}>Build the word!</h2>
      
      <motion.div 
        animate={{ scale: [1, 1.1, 1] }} 
        transition={{ duration: 2, repeat: Infinity }} 
        className="text-9xl cursor-pointer" 
        onClick={() => playSound(word.word)}
      >
        {word.emoji}
      </motion.div>

      {/* Target Slots */}
      <div className="flex justify-center gap-4">
        {slots.map((slot, idx) => (
          <motion.button 
            key={idx} 
            layout
            onClick={() => handleSlotTap(idx)} 
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl font-black shadow-xl" 
            style={{ 
              background: slot ? (isCorrect ? mascot.bgGradient : 'white') : 'transparent', 
              color: slot && !isCorrect ? mascot.color : 'white', 
              border: `4px ${slot ? 'solid' : 'dashed'} ${mascot.color}` 
            }}
          >
            {slot?.letter || ''}
          </motion.button>
        ))}
      </div>

      {/* Available Letters - Uses opacity 0 to maintain space */}
      <div className="flex justify-center gap-4 flex-wrap min-h-[100px]">
        {available.map(lo => (
          <motion.button 
            key={lo.id} 
            layout
            whileHover={!lo.used ? { scale: 1.1, y: -4 } : {}} 
            whileTap={!lo.used ? { scale: 0.9 } : {}} 
            onClick={() => handleLetterTap(lo)} 
            disabled={lo.used} 
            animate={{ 
              opacity: lo.used ? 0 : 1, 
              scale: lo.used ? 0.5 : 1,
              pointerEvents: lo.used ? 'none' : 'auto'
            }} 
            className="w-20 h-20 rounded-3xl shadow-2xl text-4xl font-black flex items-center justify-center" 
            style={{ 
              background: mascot.bgGradient, 
              color: 'white',
              cursor: 'pointer'
            }}
          >
            {lo.letter}
          </motion.button>
        ))}
      </div>
      
      {isCorrect && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-4xl font-black" style={{ color: mascot.color }}>
          🎉 {word.word}!
        </motion.div>
      )}
    </motion.div>
  );
}

function SBCelebratePhase({ mascot, scores, words, t }) {
  const avg = scores.length > 0 ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
  const stars = avg>=90?3:avg>=70?2:avg>=50?1:0;
  const message = stars===3?'Word Master! 🎓':stars===2?'Great Builder! 🏗️':stars===1?'Good Try! 💪':'Keep Practicing! 📚';
  
  return (
    <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} className="text-center space-y-6 py-8">
      <motion.div animate={{y:[0,-30,0],rotate:[-15,15,-15],scale:[1,1.2,1]}} transition={{duration:1,repeat:Infinity}} className="text-9xl">{mascot.emoji}</motion.div>
      <h1 className="text-4xl font-black" style={{color:'#171d14'}}>{message}</h1>
      <div className="flex justify-center gap-3 flex-wrap max-w-md mx-auto">
        {words.map((w,i)=>(
          <motion.div key={i} initial={{scale:0,rotate:-180}} animate={{scale:1,rotate:0}} transition={{delay:0.2*i,type:'spring'}} className="px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2" style={{background:'white',border:`3px solid ${mascot.color}`}}>
            <span className="text-2xl">{w.emoji}</span><span className="font-black" style={{color:mascot.color}}>{w.word}</span>
          </motion.div>
        ))}
      </div>
      <div className="flex justify-center gap-3">
        {[1,2,3].map(i=><motion.div key={i} initial={{scale:0,rotate:-180}} animate={{scale:1,rotate:0}} transition={{delay:0.3*i,type:'spring'}} className="text-7xl" style={{filter:i<=stars?'none':'grayscale(100%) opacity(30%)'}} >⭐</motion.div>)}
      </div>
      <div className="inline-block px-8 py-4 rounded-2xl font-black text-3xl" style={{background:mascot.bgGradient,color:'white'}}>{avg}%</div>
    </motion.div>
  );
}

