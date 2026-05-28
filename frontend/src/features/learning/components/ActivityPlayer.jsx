import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import learningService from '@/shared/services/learningService';
import { useT } from '@/shared/stores/langStore';
import Spinner from '@/shared/components/ui/Spinner';
import MeetLetterActivity from './MeetLetterActivity';
import HearSoundActivity from './HearSoundActivity';
import TraceWriteActivity from './TraceWriteActivity';
import MiniQuestActivity from './MiniQuestActivity';
import SoundBlenderActivity from './SoundBlenderActivity';
import WordBuilderActivity from './WordBuilderActivity';
import ReadMatchActivity from './ReadMatchActivity';
import { getMascot } from '@/shared/data/mascots';
import { useLang } from '@/shared/stores/langStore';

// ─── Audio Helper ────────────────────────────────────────────────────────────
const speakText = (text, lang = "en") => {
  if (!text || typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
  const utt = new SpeechSynthesisUtterance(String(text));
  utt.lang = lang === "ar" ? "ar-SA" : "en-US";
  utt.rate = 0.85;
  window.speechSynthesis?.speak(utt);
};

export default function ActivityPlayer({ activity, childId, onComplete, onCancel }) {
  console.log("ActivityPlayer Rendering with:", activity);
  const [loading, setLoading] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const t = useT();
  const lang = useLang();
  const hasMounted = useRef(false);

  useEffect(() => {
    hasMounted.current = true;
    const startTime = Date.now();
    document.body.style.overflow = 'hidden';

    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      clearInterval(timer);
      hasMounted.current = false;
      document.body.style.overflow = '';
    };
  }, []);

  const handleComplete = async (finalScore) => {
    setLoading(true);
    try {
      const result = await learningService.completeActivity(activity.Activity_ID, {
        score: finalScore,
        time_spent: timeSpent,
        completed: true
      });

      if (onComplete) {
        onComplete({ ...result.data, activityId: activity.Activity_ID, timeSpent });
      }
    } catch (error) {
      console.error('Failed to complete activity:', error);
      setLoading(false);
      if (onComplete) {
        onComplete({ stars_earned: 0, mastery_level: 0, passed: false, activityId: activity.Activity_ID, timeSpent, error: true });
      }
    }
  };

  const parsedContent = useMemo(() => {
    let content = activity.activity_content;
    if (typeof content === 'string') {
      try { content = JSON.parse(content); } catch { content = {}; }
    }
    if (typeof content === 'string') {
      try { content = JSON.parse(content); } catch { content = {}; }
    }
    return content;
  }, [activity.activity_content]);

  const renderActivity = () => {
    const content = parsedContent;

    switch (activity.activity_type) {
      case 'meet_letter':   return <MeetLetterActivity content={content} onComplete={handleComplete} />;
      case 'hear_sound':    return <HearSoundActivity content={content} onComplete={handleComplete} />;
      case 'trace_write':   return <TraceWriteActivity content={content} onComplete={handleComplete} />;
      case 'mini_quest':    return <MiniQuestActivity content={content} onComplete={handleComplete} />;
      case 'sound_blender': return <SoundBlenderActivity content={content} onComplete={handleComplete} />;
      case 'word_builder':  return <WordBuilderActivity content={content} onComplete={handleComplete} />;
      case 'read_match':    return <ReadMatchActivity content={content} onComplete={handleComplete} />;
      default:
        return (
          <div className="text-center p-12">
            <div className="text-6xl mb-4">🚧</div>
            <p className="font-bold text-xl" style={{ color: '#171d14' }}>{t("learning.activityComingSoon")}</p>
          </div>
        );
    }
  };

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-0 font-kid"
      style={{ fontFamily: "Lexend, sans-serif" }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[32px] max-w-4xl w-full h-[85vh] overflow-hidden shadow-2xl flex flex-col mx-4"
      >
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b-2" style={{ borderColor: "#eff6e7" }}>
          <button
            onClick={onCancel}
            className="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0"
            style={{ background: "#ffffff", color: "#171d14", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <div className="flex-1">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "#171d14" }}>
                  {t(`learning.activityNames.${activity.activity_type}`, { 
                    letter: parsedContent.letter || parsedContent.targetLetter || "",
                    word: parsedContent.word || parsedContent.targetWord || ""
                  }) || activity.activity_name}
                </h2>
                <p className="text-sm font-semibold" style={{ color: "#6f7a6b" }}>
                  {parsedContent.letter ? getMascot(parsedContent.letter, lang).name : (activity.mascot_character || t("learning.learningActivity"))}
                </p>
              </div>
              <div className="flex items-center gap-2 font-bold text-base px-4 py-2 rounded-full" style={{ color: "#3f4a3c", background: "#f4faf0" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>timer</span>
                {timeSpent}s
              </div>
            </div>
          </div>
        </div>

        {/* Activity Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar" style={{ background: "#fafbf9" }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Spinner size="lg" />
                <p className="mt-4 font-semibold" style={{ color: "#6f7a6b" }}>{t("learning.savingProgress")}</p>
              </div>
            </div>
          ) : (
            renderActivity()
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="px-6 py-3 bg-white border-t" style={{ borderColor: "#eff6e7" }}>
            <div className="flex items-center justify-center gap-2 text-sm font-semibold" style={{ color: "#6f7a6b" }}>
              <span className="material-symbols-outlined" style={{ color: "#ffca28", fontSize: "20px" }}>star</span>
              <span>{t("learning.keepUpWork")}</span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
}
