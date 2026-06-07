import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/shared/services/api";
import { useChildStore } from "@/shared/stores/childStore";
import { toast } from "@/shared/stores/uiStore";
import { useT } from "@/shared/stores/langStore";
import Spinner from "@/shared/components/ui/Spinner";
import learningService from "@/shared/services/learningService";
import ActivityPlayer from "../components/ActivityPlayer";
import { getMascot } from "@/shared/data/mascots";
import { useLang } from "@/shared/stores/langStore";
import LevelMap, { buildLevelList } from "../components/LevelMap";
import { calculateOverallMasteryLevel } from "../utils/levelCalculator";

export default function ChildDashboardPage() {
  const { selectedChild } = useChildStore();
  const [activities, setActivities] = useState([]);
  const [progress, setProgress] = useState(null);
  const [learningProgress, setLearningProgress] = useState({ activity_progress: {} });
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const navigate = useNavigate();
  const t = useT();
  const lang = useLang();

  const [achievements, setAchievements] = useState([]);

  const ALL_ACHIEVEMENTS = [
    // Achievement Badges (5)
    { name: t("child.achievementsList.firstSteps"), emoji: "🌱", color: "#ffdf9e", iconColor: "#785900", description: t("child.achievementsList.firstStepsDesc") },
    { name: t("child.achievementsList.letterHero"), emoji: "🔤", color: "#e8f5e9", iconColor: "#2e7d32", description: t("child.achievementsList.letterHeroDesc") },
    { name: t("child.achievementsList.soundDetective"), emoji: "🔊", color: "#d1e4ff", iconColor: "#0061a4", description: t("child.achievementsList.soundDetectiveDesc") },
    { name: t("child.achievementsList.wordBuilder"), emoji: "🧱", color: "#f3e5f5", iconColor: "#ab47bc", description: t("child.achievementsList.wordBuilderDesc") },
    { name: t("child.achievementsList.readingStar"), emoji: "⭐", color: "#fff9c4", iconColor: "#ff6d00", description: t("child.achievementsList.readingStarDesc") },
    // Performance Badges (4)
    { name: t("child.achievementsList.speedReader"), emoji: "⚡", color: "#ffecb3", iconColor: "#ff8f00", description: t("child.achievementsList.speedReaderDesc") },
    { name: t("child.achievementsList.perfectScore"), emoji: "💯", color: "#c8e6c9", iconColor: "#388e3c", description: t("child.achievementsList.perfectScoreDesc") },
    { name: t("child.achievementsList.sharpShooter"), emoji: "🎯", color: "#b39ddb", iconColor: "#5e35b1", description: t("child.achievementsList.sharpShooterDesc") },
    { name: t("child.achievementsList.wiseOwl"), emoji: "🦉", color: "#b3e5fc", iconColor: "#0277bd", description: t("child.achievementsList.wiseOwlDesc") },
    // Habit Badges (3)
    { name: t("child.achievementsList.threeDayStreak"), emoji: "🔥", color: "#ffccbc", iconColor: "#d84315", description: t("child.achievementsList.threeDayStreakDesc") },
    { name: t("child.achievementsList.weeklyWarrior"), emoji: "📅", color: "#ffccbc", iconColor: "#d84315", description: t("child.achievementsList.weeklyWarriorDesc") },
    { name: t("child.achievementsList.dedicatedLearner"), emoji: "💎", color: "#e1bee7", iconColor: "#7b1fa2", description: t("child.achievementsList.dedicatedLearnerDesc") },
  ];

  useEffect(() => {
    if (selectedChild) loadData();
  }, [selectedChild?.Child_ID]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Refresh child profile to keep level/name/age in sync with database
      const childRes = await api.get(`/api/children/${selectedChild.Child_ID}`);
      useChildStore.getState().updateChild(childRes.data);

      const [activitiesRes, progressRes, achievementsRes] = await Promise.allSettled([
        learningService.getChildActivities(selectedChild.Child_ID),
        learningService.getChildProgress(selectedChild.Child_ID),
        learningService.getAchievements(selectedChild.Child_ID),
      ]);

      if (activitiesRes.status === "fulfilled") setActivities(activitiesRes.value.data);
      if (progressRes.status === "fulfilled") setLearningProgress(progressRes.value.data);
      if (achievementsRes.status === "fulfilled") setAchievements(achievementsRes.value.data);

      const regularProgress = await api.get(`/api/learning/progress/${selectedChild.Child_ID}`);
      setProgress(regularProgress.data);
    } catch (error) {
      console.error("Error loading activities:", error);
      toast.error("Couldn't load your activities");
    } finally {
      setLoading(false);
    }
  };

  const handleActivityComplete = (result) => {
    const starsEarned = result.stars_earned || (result.score >= 95 ? 3 : result.score >= 80 ? 2 : result.score >= 70 ? 1 : 0);
    if (result.error) {
      toast.error(t("learning.activityError"));
    } else {
      toast.success(t("learning.starsEarned", { stars: starsEarned }));
      if (result.ai_feedback) {
        setTimeout(() => {
          toast(result.ai_feedback, { icon: '🤖' });
        }, 1500);
      }
    }

    if (result.new_achievements && result.new_achievements.length > 0) {
      setAchievements(prev => {
        const existingNames = prev.map(a => a.name);
        const uniqueNew = result.new_achievements.filter(a => !existingNames.includes(a.name));
        return [...prev, ...uniqueNew];
      });
      result.new_achievements.forEach(ach => {
        toast.success(t("learning.achievementUnlocked", { name: ach.name }));
      });
    }

    // Boss Level Celebration Logic
    if (['sound_blender', 'word_builder', 'read_match'].includes(selectedActivity.activity_type)) {
      const wordGroup = selectedActivity.activity_group;
      const groupActs = activities.filter(a => a.activity_group === wordGroup && ['sound_blender', 'word_builder', 'read_match'].includes(a.activity_type));

      const allCompleted = groupActs.every(a =>
        a.Activity_ID === selectedActivity.Activity_ID ||
        learningProgress.activity_progress[a.Activity_ID]?.completion_status === 'completed'
      );

      if (allCompleted) {
        // Massive confetti for finishing the Boss Level
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);
          const particleCount = 50 * (timeLeft / duration);
          confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
          confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);

        toast.success(t("learning.bossLevelMastered"));
      } else {
        // Small confetti for individual word activity
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
      }
    }

    setLearningProgress(prev => ({
      ...prev,
      activity_progress: {
        ...prev.activity_progress,
        [selectedActivity.Activity_ID]: {
          completion_status: 'completed',
          stars_earned: starsEarned,
          mastery_level: result.mastery_level || result.score || 0,
        },
      },
    }));

    setProgress(prev => ({
      ...prev,
      streak_days: prev.streak_days + 1,
      total_score: prev.total_score + (result.score || 0),
    }));

    setSelectedActivity(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <span className="material-symbols-outlined animate-bounce" style={{ fontSize: "64px", color: "#4caf50", fontVariationSettings: "'FILL' 1" }}>menu_book</span>
          <div className="mt-4"><Spinner size="lg" /></div>
        </div>
      </div>
    );
  }

  const activityProgress = learningProgress?.activity_progress || {};
  const completedCount = activities.filter(a => activityProgress[a.Activity_ID]?.completion_status === 'completed').length;

  // Calculate overall mastery level based on boss level completion and AI-assigned level
  const level = calculateOverallMasteryLevel(activities, activityProgress, lang, selectedChild?.current_level);

  // Total stars
  const totalStars = Object.values(activityProgress).reduce((sum, p) => sum + (p.stars_earned || 0), 0);

  const ACTIVITY_ICONS = {
    meet_letter: "waving_hand", hear_sound: "hearing", say_yourself: "record_voice_over",
    action_story: "theater_comedy", trace_write: "draw", mini_quest: "military_tech",
    sound_blender: "blender", word_builder: "extension", read_match: "library_books", read_aloud: "menu_book",
  };

  return (
    <div className="space-y-6 pb-4 font-kid" style={{ fontFamily: "Lexend, sans-serif" }}>

      {/* Stats bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "#ffdf9e", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#ff6d00", fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
          <span className="font-bold text-base" style={{ color: "#5b4300" }}>{progress?.streak_days ?? 0} {t("child.days")}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "#d1e4ff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#0061a4", fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="font-bold text-base" style={{ color: "#00355d" }}>{t("child.level")} {level}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "#fff9c4", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <span style={{ fontSize: "16px" }}>⭐</span>
          <span className="font-bold text-base" style={{ color: "#5b4300" }}>{totalStars} {t("child.stars")}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "#e8f5e9", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#2e7d32", fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <span className="font-bold text-base" style={{ color: "#1b5e20" }}>{completedCount}/{activities.length}</span>
        </div>
      </div>

      {/* Main Journey Map */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {activities.length > 0 ? (
          <LevelMap
            activities={activities}
            activityProgress={activityProgress}
            onSelectActivity={setSelectedActivity}
          />
        ) : (
          <div className="text-center py-12 rounded-2xl" style={{ background: '#f9fafb', border: '2px dashed #e0e0e0' }}>
            <div className="text-5xl mb-3">🚀</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#171d14' }}>{t("child.noActivitiesTitle")}</h3>
            <p className="text-sm" style={{ color: '#6f7a6b' }}>{t("child.noActivitiesSub")}</p>
          </div>
        )}
      </motion.div>

      {/* Daily Progress */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-kid">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-xl" style={{ color: "#171d14" }}>{t("child.dailyProgress")}</h3>
          <div className="text-2xl font-bold" style={{ color: "#4caf50" }}>
            {activities.length > 0 ? Math.round((completedCount / activities.length) * 100) : 0}%
          </div>
        </div>
        <div className="progress-track">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${activities.length > 0 ? (completedCount / activities.length) * 100 : 0}%` }}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
            className="progress-fill"
          />
        </div>
        <div className="flex justify-between mt-2 text-sm font-semibold" style={{ color: "#6f7a6b" }}>
          <span>{t("child.keepLearningStars")}</span>
          <span>{t("child.doneOf", { completed: completedCount, total: activities.length })}</span>
        </div>
      </motion.div>

      {/* Achievements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-2xl" style={{ color: "#171d14" }}>{t("child.achievements")}</h3>
          <button className="text-sm font-bold" style={{ color: "#006e1c" }}>{t("child.seeAll")}</button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
          {ALL_ACHIEVEMENTS.map((badge, i) => {
            const isUnlocked = achievements.some(a => a.name === badge.name);
            const isLocked = !isUnlocked;
            return (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2" style={{ width: "100px", opacity: isLocked ? 0.5 : 1, filter: isLocked ? "grayscale(1)" : "none" }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: isLocked ? "#e9f0e1" : badge.color, border: `5px solid ${isLocked ? "#dee5d6" : "rgba(255,255,255,0.8)"}`, boxShadow: isLocked ? "none" : "0 4px 12px rgba(0,0,0,0.08)" }}>
                  {isLocked ? (
                    <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "#becab9" }}>lock</span>
                  ) : (
                    <span style={{ fontSize: "36px" }}>{badge.emoji}</span>
                  )}
                </div>
                <span className="text-sm font-bold text-center" style={{ color: "#171d14" }}>{badge.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Goal */}
      <div className="flex items-center gap-4 rounded-[28px] p-5" style={{ background: "#e9f0e1", border: "2px solid rgba(255,255,255,0.6)" }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#ffdf9e" }}>
          <span className="material-symbols-outlined" style={{ color: "#ff6d00", fontSize: "28px", fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
        </div>
        <div>
          <h4 className="font-bold text-lg" style={{ color: "#171d14" }}>{t("child.nextGoal")}</h4>
          <p className="text-sm" style={{ color: "#3f4a3c" }}>{t("child.levelGoal")}</p>
        </div>
      </div>

      {/* Activity Player Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <ActivityPlayer
            key="activity-player"
            activity={selectedActivity}
            childId={selectedChild?.Child_ID}
            onComplete={handleActivityComplete}
            onCancel={() => {
              console.log("Cancelling activity");
              setSelectedActivity(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
