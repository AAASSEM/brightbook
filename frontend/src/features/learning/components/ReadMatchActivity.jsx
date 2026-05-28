import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT, useLang } from '@/shared/stores/langStore';

export default function ReadMatchActivity({ content, onComplete }) {
  const t = useT();
  const lang = useLang();
  const isRtl = lang === 'ar';
  
  const [startTime] = useState(Date.now());
  const [selectedWord, setSelectedWord] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [wrongMatch, setWrongMatch] = useState(null);
  
  // Scramble the pairs for left/right columns
  const { words, pictures } = useMemo(() => {
    const pairs = content?.pairs || [
      { word: "CAT", emoji: "🐱" },
      { word: "SUN", emoji: "☀️" },
      { word: "DOG", emoji: "🐶" },
      { word: "PIG", emoji: "🐷" }
    ];
    
    // Create independent shuffled arrays
    const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);
    
    return {
      words: shuffle(pairs.map((p, i) => ({ id: i, word: p.word }))),
      pictures: shuffle(pairs.map((p, i) => ({ id: i, emoji: p.emoji })))
    };
  }, [content]);

  // Check win condition
  useEffect(() => {
    if (matchedPairs.length === words.length && words.length > 0) {
      setTimeout(() => {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        onComplete(100);
      }, 1500);
    }
  }, [matchedPairs, words.length, onComplete, startTime]);

  const handleWordClick = (wordId) => {
    if (matchedPairs.includes(wordId)) return;
    setSelectedWord(wordId);
    setWrongMatch(null);
  };

  const handlePictureClick = (picId) => {
    if (matchedPairs.includes(picId) || selectedWord === null) return;

    if (selectedWord === picId) {
      // Match!
      setMatchedPairs(prev => [...prev, picId]);
      setSelectedWord(null);
    } else {
      // Wrong!
      setWrongMatch(picId);
      setTimeout(() => setWrongMatch(null), 800);
      setSelectedWord(null);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#fafbf9] p-6 ${isRtl ? 'rtl' : 'ltr'}`} style={{ fontFamily: "Lexend, sans-serif" }}>
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-black mb-2" style={{ color: "#171d14" }}>{t('learning.readMatchTitle')}</h3>
        <p className="text-lg font-bold" style={{ color: "#6f7a6b" }}>{t('learning.matchWord')}</p>
      </div>

      {/* Play Area */}
      <div className={`flex-1 max-w-4xl w-full mx-auto flex items-center justify-center gap-12 relative ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Words Column */}
        <div className={`flex flex-col gap-6 flex-1 ${isRtl ? 'items-start' : 'items-end'}`}>
          {words.map(w => {
            const isSelected = selectedWord === w.id;
            const isMatched = matchedPairs.includes(w.id);
            
            return (
              <motion.button
                key={`word-${w.id}`}
                whileHover={!isMatched ? { scale: 1.05 } : {}}
                whileTap={!isMatched ? { scale: 0.95 } : {}}
                onClick={() => handleWordClick(w.id)}
                className="w-48 py-4 rounded-2xl font-black text-2xl shadow-sm transition-all"
                style={{
                  background: isMatched ? "#e8f5e9" : isSelected ? "#e3f2fd" : "white",
                  color: isMatched ? "#2e7d32" : isSelected ? "#1565c0" : "#171d14",
                  border: `3px solid ${isMatched ? "#a5d6a7" : isSelected ? "#64b5f6" : "#e0e0e0"}`,
                  opacity: isMatched ? 0.7 : 1,
                  cursor: isMatched ? "default" : "pointer"
                }}
              >
                {w.word}
              </motion.button>
            );
          })}
        </div>

        {/* Connector Area (Visual spacing) */}
        <div className="w-16 flex flex-col items-center justify-center">
          <span className="text-4xl" style={{ opacity: 0.2 }}>🔗</span>
        </div>

        {/* Pictures Column */}
        <div className={`flex flex-col gap-6 flex-1 ${isRtl ? 'items-end' : 'items-start'}`}>
          {pictures.map(p => {
            const isMatched = matchedPairs.includes(p.id);
            const isWrong = wrongMatch === p.id;
            
            return (
              <motion.button
                key={`pic-${p.id}`}
                animate={isWrong ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                whileHover={!isMatched && selectedWord !== null ? { scale: 1.05 } : {}}
                whileTap={!isMatched && selectedWord !== null ? { scale: 0.95 } : {}}
                onClick={() => handlePictureClick(p.id)}
                className="w-24 h-24 rounded-3xl text-5xl flex items-center justify-center shadow-sm transition-all relative"
                style={{
                  background: isMatched ? "#e8f5e9" : isWrong ? "#ffebee" : "white",
                  border: `3px solid ${isMatched ? "#a5d6a7" : isWrong ? "#ef5350" : selectedWord !== null ? "#64b5f6" : "#e0e0e0"}`,
                  opacity: isMatched ? 0.7 : 1,
                  cursor: isMatched ? "default" : selectedWord !== null ? "pointer" : "default"
                }}
              >
                {p.emoji}
                {isMatched && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center bg-[#4caf50] text-white shadow-md text-sm"
                  >
                    ✓
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Bottom Area Celebration */}
      <AnimatePresence>
        {matchedPairs.length === words.length && words.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <div className="inline-block px-8 py-4 rounded-full font-black text-2xl shadow-xl" style={{ background: "#ffdf9e", color: "#785900", border: "4px solid white" }}>
              🎉 {t('learning.wellDone')} 🎉
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

