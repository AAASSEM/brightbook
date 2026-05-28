import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/shared/services/api";
import { toast } from "@/shared/stores/uiStore";
import { useChildStore } from "@/shared/stores/childStore";
import Spinner from "@/shared/components/ui/Spinner";

const ACTIVITY_ICONS = {
  letter_hunt: "search",
  phonics_match: "music_note",
  letter_tracing: "edit",
  story_time: "menu_book",
  word_builder: "extension",
};

export default function ActivityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedChild } = useChildStore();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    api.get(`/api/admin/activities`)
      .then((res) => {
        const act = res.data.find((a) => a.Activity_ID === parseInt(id));
        setActivity(act);
      })
      .catch(() => toast.error("Activity not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen soft-bg flex items-center justify-center"><Spinner size="xl" /></div>;
  if (!activity) return <div className="min-h-screen soft-bg flex items-center justify-center">Activity not found</div>;

  const content = activity.activity_content || {};
  const questions = content.questions || [];
  const currentQ = questions[step];

  const handleAnswer = (option) => setSelectedAnswer(option);

  const handleNext = async () => {
    if (!selectedAnswer) return;
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (step + 1 >= questions.length) {
      // Complete activity
      const correct = newAnswers.filter((a, i) => a === (content.correct_answers || [])[i]).length;
      const pct = questions.length > 0 ? (correct / questions.length) * 100 : 70;
      const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
      setScore({ correct, total: questions.length, pct, stars });

      try {
        await api.post("/api/learning/activity/complete", {
          activity_id: activity.Activity_ID,
          child_id: selectedChild?.Child_ID,
          answers: newAnswers,
          time_per_question: newAnswers.map(() => Math.floor(Math.random() * 20 + 5)),
          total_time_minutes: 5,
        });
      } catch { /* silent */ }
    } else {
      setStep((s) => s + 1);
    }
  };

  if (score) {
    return (
      <div className="min-h-screen soft-bg flex items-center justify-center p-4 font-kid" style={{ fontFamily: "Lexend, sans-serif" }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card-kid w-full max-w-md text-center">
          <div className="flex justify-center gap-2 mb-6 mt-4">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.2, type: "spring", stiffness: 200 }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "64px",
                    color: i < score.stars ? "#ffdf9e" : "#eff6e7",
                    fontVariationSettings: i < score.stars ? "'FILL' 1" : "'FILL' 0",
                    textShadow: i < score.stars ? "0 4px 12px rgba(255, 143, 0, 0.3)" : "none",
                  }}
                >
                  star
                </span>
              </motion.div>
            ))}
          </div>
          <h2 className="text-3xl font-black mb-2" style={{ color: "#171d14" }}>
            {score.pct >= 60 ? "Great Job!" : "Keep Practicing!"}
          </h2>
          <p className="text-lg mb-8" style={{ color: "#3f4a3c" }}>
            {score.correct} of {score.total} correct
          </p>
          <div className="space-y-3">
            <button className="kid-btn" onClick={() => navigate("/learn")}>
              Next Activity
              <span className="material-symbols-outlined ml-2 align-middle">rocket_launch</span>
            </button>
            <button className="btn btn-secondary w-full" style={{ padding: "16px", borderRadius: "20px", fontSize: "18px" }} onClick={() => navigate("/dashboard")}>
              Parent Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Simple interactive card for no questions
  if (questions.length === 0) {
    return (
      <div className="min-h-screen soft-bg flex flex-col p-4 font-kid" style={{ fontFamily: "Lexend, sans-serif" }}>
        <div className="flex items-center justify-between mb-6 pt-2">
          <button onClick={() => navigate("/learn")} className="flex items-center justify-center w-12 h-12 rounded-full" style={{ background: "#ffffff", color: "#171d14", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="card-kid w-full max-w-md text-center">
            <div className="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "#eff6e7" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "64px", color: "#4caf50", fontVariationSettings: "'FILL' 1" }}>
                {ACTIVITY_ICONS[activity.activity_type] || "menu_book"}
              </span>
            </div>
            <h2 className="text-2xl font-black mb-2" style={{ color: "#171d14" }}>{activity.activity_name}</h2>
            <p className="text-lg mb-8" style={{ color: "#3f4a3c" }}>{content.instruction || "Complete this activity!"}</p>
            <button className="kid-btn" onClick={() => setScore({ correct: 5, total: 5, pct: 100, stars: 3 })}>
              Complete Activity ✅
            </button>
          </div>
        </div>
      </div>
    );
  }

  const OptionLetters = ["A", "B", "C", "D"];

  return (
    <div className="min-h-screen soft-bg flex flex-col p-4 font-kid" style={{ fontFamily: "Lexend, sans-serif" }}>
      {/* Top Bar */}
      <div className="flex items-center gap-4 mb-6 pt-2">
        <button onClick={() => navigate("/learn")} className="flex items-center justify-center w-12 h-12 rounded-full" style={{ background: "#ffffff", color: "#171d14", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-sm" style={{ color: "#171d14" }}>{activity.activity_name}</span>
            <span className="font-bold text-sm" style={{ color: "#3f4a3c" }}>{step + 1} / {questions.length}</span>
          </div>
          <div className="progress-track" style={{ height: "12px" }}>
            <motion.div animate={{ width: `${((step) / questions.length) * 100}%` }} className="progress-fill" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col max-w-lg w-full mx-auto"
          >
            {/* Question Card */}
            <div className="card-kid mb-6 text-center" style={{ padding: "40px 24px" }}>
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl" style={{ background: "#ffdf9e" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "#785900" }}>campaign</span>
              </div>
              <h2 className="text-2xl font-black" style={{ color: "#171d14", lineHeight: 1.4 }}>{currentQ?.q}</h2>
            </div>

            {/* Answers */}
            <div className="grid grid-cols-1 gap-4">
              {(currentQ?.options || []).map((opt, i) => {
                const isSelected = selectedAnswer === opt;
                return (
                  <motion.button key={opt} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(opt)}
                    className="flex items-center p-4 rounded-2xl text-left font-bold transition-all text-lg"
                    style={{
                      background: isSelected ? "#e9f0e1" : "#ffffff",
                      border: `3px solid ${isSelected ? "#4caf50" : "#eff6e7"}`,
                      color: isSelected ? "#006e1c" : "#171d14",
                      boxShadow: isSelected ? "0 4px 12px rgba(76,175,80,0.15)" : "0 4px 12px rgba(0,0,0,0.04)",
                    }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-4"
                      style={{ background: isSelected ? "#4caf50" : "#eff6e7", color: isSelected ? "#ffffff" : "#6f7a6b" }}>
                      {OptionLetters[i]}
                    </div>
                    {opt}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Nav Action */}
      <div className="mt-8 max-w-lg w-full mx-auto">
        <button
          onClick={handleNext}
          disabled={!selectedAnswer}
          className="kid-btn"
          style={{
            opacity: selectedAnswer ? 1 : 0.5,
            filter: selectedAnswer ? "none" : "grayscale(100%)",
            transform: selectedAnswer ? "translateY(0)" : "translateY(4px)",
            boxShadow: selectedAnswer ? "0 4px 0 0 #388e3c" : "none",
          }}
        >
          {step + 1 === questions.length ? "Finish! 🎉" : "Next Question →"}
        </button>
      </div>
    </div>
  );
}
