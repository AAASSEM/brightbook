import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import api from "@/shared/services/api";
import { useChildStore } from "@/shared/stores/childStore";
import { useAuthStore } from "@/shared/stores/authStore";
import { toast } from "@/shared/stores/uiStore";
import { useT } from "@/shared/stores/langStore";
import Spinner from "@/shared/components/ui/Spinner";
import ProgressReportModal from "../components/ProgressReportModal";

export default function ParentDashboardPage() {
  const { selectedChild, children, setSelectedChild } = useChildStore();
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [regeneratingTips, setRegeneratingTips] = useState(false);
  const [showProgressReport, setShowProgressReport] = useState(false);
  const navigate = useNavigate();
  const t = useT();

  useEffect(() => {
    if (children.length === 0) loadChildren();
    else if (selectedChild) loadDashboard(selectedChild.Child_ID);
    else setLoading(false);
  }, [selectedChild?.Child_ID]); // Only reload when Child_ID changes, not the entire object

  const loadChildren = async () => {
    try {
      await useChildStore.getState().refreshChildren(api);
      const children = useChildStore.getState().children;
      if (children.length > 0) {
        const selectedChild = useChildStore.getState().selectedChild;
        if (selectedChild) {
          loadDashboard(selectedChild.Child_ID);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      // Handle 401 errors with retry logic
      if (error.response?.status === 401) {
        console.log("Auth error loading children, retrying once...");
        setTimeout(() => {
          loadChildren(); // Retry once
        }, 1000);
      } else {
        toast.error(t("settings.childUpdateFailed"));
        setLoading(false);
      }
    }
  };

  const fetchRecommendations = async (childId) => {
    setLoadingRecommendations(true);
    try {
      const res = await api.get(`/api/parent/recommendations/${childId}`);
      setRecommendations(res.data.recommendations || []);
    } catch (err) {
      console.error("Error loading AI recommendations:", err);
      // Fail gracefully with standard recommendations
      setRecommendations([
        "Practice letter sounds daily for 10-15 minutes",
        "Read stories together to build vocabulary",
        "Celebrate small wins to build confidence"
      ]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const loadDashboard = async (childId) => {
    setLoading(true);
    setRecommendations([]);
    try {
      const res = await api.get(`/api/parent/dashboard/${childId}`);
      setDashboard(res.data);
      // Trigger lazy load of AI recommendations
      fetchRecommendations(childId);
    } catch (err) {
      // Handle 401 errors with retry logic
      if (err.response?.status === 401) {
        console.log("Auth error loading dashboard, retrying once...");
        setTimeout(() => {
          loadDashboard(childId); // Retry once
        }, 1000);
      } else if (err.response?.status === 404) {
        // The child might have been deleted, resync children
        loadChildren();
      } else {
        console.error("Dashboard loading error:", err);
        toast.error(t("support.loadFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const regenerateAITips = async () => {
    if (!selectedChild) return;

    setRegeneratingTips(true);
    try {
      const res = await api.post(`/api/parent/regenerate-recommendations/${selectedChild.Child_ID}`);
      setRecommendations(res.data.recommendations);
      toast.success("New AI tips generated successfully!");
    } catch (err) {
      console.error("Error regenerating AI tips:", err);
      toast.error("Failed to regenerate AI tips. Please try again.");
    } finally {
      setRegeneratingTips(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6" style={{ minHeight: "60vh", textAlign: "center" }}>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "#e9f0e1" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "40px", color: "#006e1c" }}>child_care</span>
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#171d14" }}>{t("parent.noChildren")}</h2>
          <p className="text-sm mt-1" style={{ color: "#3f4a3c" }}>{t("onboarding.step1Sub")}</p>
        </div>
        <button className="kid-btn" style={{ width: "auto", padding: "16px 32px" }} onClick={() => navigate("/onboarding")}>
          {t("parent.addChild")}
        </button>
      </div>
    );
  }

  if (!dashboard) return null;

  const { child, progress, recent_achievements, weekly_scores } = dashboard;

  // Build weekly chart data - properly map assessment dates to days of the week
  // Use full day names as unique keys to avoid JS object duplicate-key collisions (e.g. two "T"s, two "S"s)
  const weekConfig = [
    { key: "Mon", label: "M" },
    { key: "Tue", label: "T" },
    { key: "Wed", label: "W" },
    { key: "Thu", label: "T" },
    { key: "Fri", label: "F" },
    { key: "Sat", label: "S" },
    { key: "Sun", label: "S" },
  ];
  // dayOfWeek index (0=Sun..6=Sat) → weekConfig index
  const jsToWeekIdx = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };

  // Initialise scores per unique day key
  const scoresByDay = {};
  weekConfig.forEach(d => { scoresByDay[d.key] = 0; });

  // Map weekly_scores to the correct day based on assessment date
  if (weekly_scores && Array.isArray(weekly_scores)) {
    weekly_scores.forEach(scoreEntry => {
      if (scoreEntry.date) {
        try {
          const assessmentDate = new Date(scoreEntry.date);
          const dayOfWeek = assessmentDate.getDay(); // 0 = Sunday … 6 = Saturday
          const idx = jsToWeekIdx[dayOfWeek];
          if (idx !== undefined) {
            const dayKey = weekConfig[idx].key;
            scoresByDay[dayKey] = Math.max(scoresByDay[dayKey], scoreEntry.score || 0);
          }
        } catch (e) {
          console.error("Invalid date format:", scoreEntry.date);
        }
      }
    });
  }

  const chartData = weekConfig.map(d => ({
    day: d.label,
    score: scoresByDay[d.key] ?? 0,
  }));


  return (
    <div className="pb-4">

      {/* Child switcher */}
      {children.length > 1 && (
        <div className="flex gap-3 overflow-x-auto no-scrollbar mb-6 pb-1">
          {children.map((c) => {
            const isActive = c.Child_ID === selectedChild?.Child_ID;
            return (
              <button
                key={c.Child_ID}
                onClick={() => setSelectedChild(c)}
                className="flex items-center gap-2 rounded-full px-4 py-2 flex-shrink-0 transition-all"
                style={{
                  border: isActive ? "2.5px solid #006e1c" : "2px solid #becab9",
                  background: isActive ? "#fff" : "transparent",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: isActive ? "#006e1c" : "#3f4a3c",
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: "#4caf50" }}
                >
                  {c.name[0]}
                </div>
                {c.name}
                {isActive && (
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#006e1c", fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Stats) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: "local_fire_department",
                iconColor: "#ff8f00",
                iconBg: "#ffdf9e",
                value: `${progress?.streak_days ?? 0}`,
                unit: t("child.days"),
                label: t("parent.currentStreak"),
                emptyMessage: progress?.streak_days === 0 ? "Start learning today!" : "",
              },
              {
                icon: "task_alt",
                iconColor: "#0061a4",
                iconBg: "#d1e4ff",
                value: `${progress?.activities_completed ?? 0}`,
                unit: "",
                label: t("parent.activities"),
                emptyMessage: progress?.activities_completed === 0 ? "Complete first activity" : "",
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="stat-card"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                  style={{ background: stat.iconBg }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: stat.iconColor, fontSize: "24px", fontVariationSettings: "'FILL' 1" }}
                  >
                    {stat.icon}
                  </span>
                </div>
                <div className="stat-value">
                  {stat.value} <span style={{ fontSize: "16px", fontWeight: 400 }}>{stat.unit}</span>
                </div>
                <div className="stat-label">{stat.label}</div>
                {stat.emptyMessage && (
                  <div className="text-xs mt-1" style={{ color: "#6f7a6b" }}>
                    {stat.emptyMessage}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Weekly Progress chart */}
          <div className="card h-[280px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg" style={{ color: "#171d14" }}>{t("parent.weeklyProgress")}</h2>
                <p className="text-sm" style={{ color: "#3f4a3c" }}>
                  {t("parent.weeklyActivitySub", { name: child.name })}
                </p>
              </div>
              <span className="material-symbols-outlined" style={{ color: "#4caf50", fontSize: "20px" }}>trending_up</span>
            </div>
            <div className="flex-1" style={{ minHeight: "200px" }}>
              {chartData && chartData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                  <BarChart data={chartData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9f0e1" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6f7a6b" }} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid #e3ebdc", borderRadius: 12, fontSize: 13 }}
                      cursor={{ fill: "rgba(76,175,80,0.08)" }}
                    />
                    <Bar dataKey="score" fill="#4caf50" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {(!chartData || chartData.length === 0) && (
                <div className="flex flex-col items-center justify-center h-full text-center" style={{ color: "#6f7a6b" }}>
                  <span className="material-symbols-outlined mb-2" style={{ fontSize: "32px", color: "#4caf50" }}>bar_chart</span>
                  <p style={{ fontSize: "14px", fontWeight: 600 }}>No weekly activity yet</p>
                  <p style={{ fontSize: "12px" }}>Complete activities to see progress</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Insights & Actions) */}
        <div className="space-y-6">
          {/* AI Tip */}
          {/* AI Tip (Lazy Loaded / Shimmer Loader) */}
          {loadingRecommendations ? (
            <div
              className="rounded-[24px] p-6 h-auto relative overflow-hidden"
              style={{ background: "#17305a" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="material-symbols-outlined animate-pulse"
                  style={{ color: "#fdc003", fontSize: "20px", fontVariationSettings: "'FILL' 1" }}
                >
                  smart_toy
                </span>
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "#fdc003", fontFamily: "Inter, sans-serif" }}
                >
                  {t("parent.aiTip")}
                </span>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-white/10 rounded w-11/12 animate-pulse" />
                <div className="h-4 bg-white/10 rounded w-5/6 animate-pulse" />
                <div className="h-2 bg-white/5 rounded w-2/3 animate-pulse mt-4" />
              </div>
            </div>
          ) : (
            recommendations?.length > 0 && (
              <div
                className="rounded-[24px] p-6 h-auto relative"
                style={{ background: "#17305a" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="material-symbols-outlined"
                      style={{ color: "#fdc003", fontSize: "20px", fontVariationSettings: "'FILL' 1" }}
                    >
                      smart_toy
                    </span>
                    <span
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: "#fdc003", fontFamily: "Inter, sans-serif" }}
                    >
                      {t("parent.aiTip")}
                    </span>
                  </div>
                  <button
                    onClick={regenerateAITips}
                    disabled={regeneratingTips}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: "#ffffff", background: "rgba(255,255,255,0.1)" }}
                  >
                    <span
                      className={`material-symbols-outlined ${regeneratingTips ? 'spin' : ''}`}
                      style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1" }}
                    >
                      {regeneratingTips ? "refresh" : "autorenew"}
                    </span>
                    {regeneratingTips ? "Generating..." : "Regenerate"}
                  </button>
                </div>
                <p className="font-bold text-lg" style={{ color: "#ffffff", lineHeight: 1.4 }}>
                  "{recommendations[0]}"
                </p>
                {recommendations[1] && (
                  <p className="text-sm mt-3" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {recommendations[1]}
                  </p>
                )}
              </div>
            )
          )}

          {/* Latest Achievement */}
          {recent_achievements?.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold" style={{ color: "#171d14" }}>{t("parent.latestAchievement")}</h3>
                <button style={{ color: "#006e1c", fontSize: "13px", fontWeight: 700 }}>{t("common.all")}</button>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#ffdf9e" }}
                >
                  <span className="material-symbols-outlined" style={{ color: "#785900", fontSize: "28px", fontVariationSettings: "'FILL' 1" }}>
                    emoji_events
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold" style={{ color: "#171d14" }}>{recent_achievements[0].name}</p>
                  <p className="text-sm" style={{ color: "#3f4a3c" }}>{recent_achievements[0].description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Download Report */}
          <button className="kid-btn mt-auto" onClick={() => setShowProgressReport(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", verticalAlign: "middle", marginRight: "8px" }}>download</span>
            {t("parent.downloadReport")}
          </button>
        </div>
      </div>

      {/* Progress Report Modal */}
      <AnimatePresence>
        {showProgressReport && selectedChild && (
          <ProgressReportModal
            child={selectedChild}
            onClose={() => setShowProgressReport(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
