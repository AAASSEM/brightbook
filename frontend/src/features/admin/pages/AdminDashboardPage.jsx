import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/shared/services/api";
import { toast } from "@/shared/stores/uiStore";
import { useT } from "@/shared/stores/langStore";
import Spinner from "@/shared/components/ui/Spinner";

export default function AdminDashboardPage() {
  const [health, setHealth] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const t = useT();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [healthRes, aiRes] = await Promise.allSettled([
          api.get("/api/admin/system-health"),
          api.get("/api/admin/ai-status")
        ]);
        if (healthRes.status === "fulfilled") setHealth(healthRes.value.data);
        if (aiRes.status === "fulfilled") setAiStatus(aiRes.value.data);
      } catch (err) {
        toast.error("Failed to load admin dashboard data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const stats = health ? [
    { label: "Active Parents", value: health.total_parents, icon: "family_restroom", bg: "#d1e4ff", color: "#00355d" },
    { label: "Total Children", value: health.total_children, icon: "child_care", bg: "#ffdf9e", color: "#785900" },
    { label: "Active Subscriptions", value: health.active_subscriptions, icon: "workspace_premium", bg: "#e9f0e1", color: "#006e1c" },
    { label: "Open Tickets", value: health.open_complaints, icon: "support_agent", bg: health.open_complaints > 0 ? "#ffdad6" : "#e9f0e1", color: health.open_complaints > 0 ? "#93000a" : "#006e1c" },
    { label: "Total Assessments", value: health.total_assessments, icon: "assignment", bg: "#eff6e7", color: "#3f4a3c" },
    { label: "Progress Records", value: health.total_activities_completed, icon: "monitoring", bg: "#eff6e7", color: "#3f4a3c" },
  ] : [];

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">{t("admin.overview")}</h1>
          <p className="section-subtitle">{t("admin.managementSub")}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "#e9f0e1", border: "1.5px solid #becab9" }}>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#006e1c" }}>{t("admin.productionLive")}</span>
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="stat-card"
            style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: stat.bg }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "28px", color: stat.color, fontVariationSettings: "'FILL' 1" }}>
                {stat.icon}
              </span>
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: "24px" }}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* AI Audit section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: "#171d14" }}>AI System Status</h2>
            <span className="material-symbols-outlined" style={{ color: "#006e1c" }}>smart_toy</span>
          </div>

          {aiStatus ? (
            <div className="space-y-3">
              {/* AI Service Status — real ping result */}
              <div
                className="p-4 rounded-xl flex items-start gap-4"
                style={{
                  background: !aiStatus.api_configured
                    ? "#ffdad6"
                    : aiStatus.ai_reachable
                    ? "#f5fced"
                    : "#fff3e0",
                  border: "1px solid #e3ebdc",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    color: !aiStatus.api_configured
                      ? "#ba1a1a"
                      : aiStatus.ai_reachable
                      ? "#4caf50"
                      : "#e65100",
                    marginTop: "2px",
                  }}
                >
                  {!aiStatus.api_configured
                    ? "error"
                    : aiStatus.ai_reachable
                    ? "check_circle"
                    : "warning"}
                </span>
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: "#171d14" }}>
                    {!aiStatus.api_configured
                      ? "AI Service: Not Configured"
                      : aiStatus.ai_reachable
                      ? `AI Service: Active`
                      : `AI Service: ${aiStatus.ai_error_type === "quota_exceeded" ? "Quota Exceeded" : aiStatus.ai_error_type === "invalid_key" ? "Invalid Key" : "Unreachable"}`}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#6f7a6b" }}>
                    {!aiStatus.api_configured
                      ? "Configure API keys to enable AI features"
                      : aiStatus.ai_reachable
                      ? `${aiStatus.ai_provider} · ${aiStatus.ai_model}`
                      : aiStatus.ai_error_message}
                  </p>
                </div>
              </div>

              {/* Usage Statistics */}
              {aiStatus.api_configured && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl" style={{ background: "#ffffff", border: "1.5px solid #e3ebdc" }}>
                    <p className="text-xs font-semibold" style={{ color: "#6f7a6b" }}>API Calls Today</p>
                    <p className="text-2xl font-bold" style={{ color: "#006e1c" }}>{aiStatus.api_calls_today || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: "#ffffff", border: "1.5px solid #e3ebdc" }}>
                    <p className="text-xs font-semibold" style={{ color: "#6f7a6b" }}>Success Rate</p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: (aiStatus.success_rate ?? 0) >= 80 ? "#006e1c" : (aiStatus.success_rate ?? 0) >= 50 ? "#e65100" : "#ba1a1a" }}
                    >
                      {aiStatus.api_calls_today > 0 ? `${aiStatus.success_rate ?? 0}%` : "—"}
                    </p>
                  </div>
                </div>
              )}

              {/* Failures today warning */}
              {(aiStatus.failures_today || 0) > 0 && (
                <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: "#fff3e0", border: "1.5px solid #ffcc80" }}>
                  <span className="material-symbols-outlined" style={{ color: "#e65100", fontSize: "18px" }}>report</span>
                  <p className="text-xs font-semibold" style={{ color: "#bf360c" }}>
                    {aiStatus.failures_today} failed AI call{aiStatus.failures_today > 1 ? "s" : ""} today
                  </p>
                </div>
              )}

              {/* Quality Metrics */}
              <div className="p-4 rounded-xl" style={{ background: "#ffffff", border: "1.5px solid #e3ebdc" }}>
                <p className="font-bold text-sm mb-3" style={{ color: "#171d14" }}>AI Quality Metrics</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#6f7a6b" }}>Assessment Analysis Accuracy</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full" style={{ background: "#e3ebdc" }}>
                        <div className="h-2 rounded-full" style={{ background: "#4caf50", width: `${aiStatus.assessment_accuracy ?? 0}%` }}></div>
                      </div>
                      <span className="text-xs font-bold" style={{ color: "#006e1c" }}>
                        {aiStatus.total_assessments_processed > 0 ? `${aiStatus.assessment_accuracy ?? 0}%` : "No data"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#6f7a6b" }}>Avg Response Time</span>
                    <span className="text-xs font-bold" style={{ color: "#006e1c" }}>
                      {aiStatus.api_calls_today > 0 ? `${aiStatus.avg_response_time ?? 0}s` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#6f7a6b" }}>Total Assessments Processed</span>
                    <span className="text-xs font-bold" style={{ color: "#006e1c" }}>{aiStatus.total_assessments_processed ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Configuration Button */}
              <button className="btn btn-secondary w-full text-sm">
                <span className="material-symbols-outlined mr-1" style={{ fontSize: "16px" }}>settings</span>
                Configure API Keys
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl text-center" style={{ background: "#f5fced", border: "1px solid #e3ebdc" }}>
              <span className="material-symbols-outlined mb-2" style={{ color: "#4caf50", fontSize: "32px" }}>smart_toy</span>
              <p className="font-bold text-sm" style={{ color: "#171d14" }}>AI System Active</p>
              <p className="text-xs mt-1" style={{ color: "#6f7a6b" }}>AI features are currently running</p>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: "#171d14" }}>Quick Actions</h2>
            <span className="material-symbols-outlined" style={{ color: "#006e1c" }}>bolt</span>
          </div>
          <div className="space-y-3">
            {[
              { label: "Manage Users & Content", icon: "groups", href: "/admin/content" },
              { label: "Handle Support Tickets", icon: "support_agent", href: "/admin/tickets" },
            ].map((link, i) => (
              <Link
                key={i}
                to={link.href}
                className="flex items-center justify-between p-3 rounded-xl transition-all"
                style={{ background: "#ffffff", border: "1.5px solid #e3ebdc", color: "#171d14" }}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined" style={{ color: "#4caf50" }}>{link.icon}</span>
                  <span className="font-bold text-sm">{link.label}</span>
                </div>
                <span className="material-symbols-outlined" style={{ color: "#becab9" }}>arrow_forward</span>
              </Link>
            ))}
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl transition-all"
              style={{ background: "#ffffff", border: "1.5px solid #e3ebdc", color: "#171d14" }}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined" style={{ color: "#4caf50" }}>api</span>
                <span className="font-bold text-sm">API Documentation</span>
              </div>
              <span className="material-symbols-outlined" style={{ color: "#becab9" }}>open_in_new</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
