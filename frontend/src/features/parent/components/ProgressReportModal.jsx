import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/shared/services/api";
import { toast } from "@/shared/stores/uiStore";
import { useT } from "@/shared/stores/langStore";
import Spinner from "@/shared/components/ui/Spinner";

export default function ProgressReportModal({ child, onClose }) {
  const t = useT();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef(null);

  const downloadPDF = async () => {
    try {
      setDownloading(true);

      // Dynamic import to ensure packages are available
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const element = reportRef.current;
      if (!element) {
        toast.error("Could not find report content to download");
        setDownloading(false);
        return;
      }

      // Create canvas from the report element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      const fileName = `${report.child_name || 'child'}_progress_report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast.success("Progress report downloaded successfully!");
    } catch (error) {
      console.error("PDF download error:", error);
      toast.error("Failed to download report. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (child) {
      loadReport();
    }
  }, [child]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/learning/progress-report/${child.Child_ID}`);
      setReport(response.data);
    } catch (err) {
      console.error("Error loading progress report:", err);
      setError("Failed to load progress report");
      toast.error(t("parent.reportLoadError"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 text-center">
          <Spinner size="lg" />
          <p className="mt-4 font-semibold" style={{ color: "#3f4a3c" }}>
            {t("parent.generatingReport")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: "#171d14" }}>
            {t("parent.reportError")}
          </h3>
          <p className="mb-6" style={{ color: "#6f7a6b" }}>{error}</p>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-semibold"
            style={{ background: "#006e1c", color: "white" }}
          >
            {t("onboarding.close")}
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const { academic_progress, engagement_insights, ai_recommendations, parent_encouragement, celebration_points } = report;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl border-b p-6 z-10" style={{ borderColor: "#eff6e7" }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black" style={{ color: "#171d14" }}>
                {report.child_name}'s {t("parent.progressReport")}
              </h2>
              <p className="text-sm" style={{ color: "#6f7a6b" }}>
                {t("parent.reportDate")}: {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={downloadPDF}
                disabled={downloading}
                className="px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                style={{ background: "#006e1c", color: "white" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>
                {downloading ? "Downloading..." : "Download PDF"}
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{ background: "#f0f0f0" }}
              >
                <span className="material-symbols-outlined" style={{ color: "#666", fontSize: "20px" }}>close</span>
              </button>
            </div>
          </div>
        </div>

        <div ref={reportRef} className="p-6 space-y-6">
          {/* Academic Progress Section */}
          <div className="rounded-2xl p-6" style={{ background: "#e8f5e9", border: "2px solid #4caf50" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#4caf50" }}>
                <span className="material-symbols-outlined" style={{ color: "white", fontSize: "24px", fontVariationSettings: "'FILL' 1" }}>trending_up</span>
              </div>
              <h3 className="text-xl font-black" style={{ color: "#1b5e20" }}>
                {t("parent.academicProgress")}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: "#2e7d32" }}>
                  {t("parent.currentLevel")}
                </p>
                <div className="text-2xl font-bold" style={{ color: "#1b5e20" }}>
                  {academic_progress.current_level}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: "#2e7d32" }}>
                  {t("parent.skillsMastered")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {academic_progress.skills_mastered?.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-sm font-semibold"
                      style={{ background: "#4caf50", color: "white" }}
                    >
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: "#2e7d32" }}>
                  {t("parent.skillsInProgress")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {academic_progress.skills_in_progress?.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-sm font-semibold"
                      style={{ background: "#fff9c4", color: "#f57f17" }}
                    >
                      🔧 {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl" style={{ background: "white" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "#2e7d32" }}>
                  {t("parent.performanceSummary")}
                </p>
                <p className="text-sm" style={{ color: "#3f4a3c" }}>
                  {academic_progress.activities_summary}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: "#2e7d32" }}>
                    {t("parent.trend")}:
                  </span>
                  <span
                    className="px-2 py-1 rounded-full text-xs font-bold"
                    style={{
                      background:
                        academic_progress.performance_trend === "improving"
                          ? "#4caf50"
                          : academic_progress.performance_trend === "stable"
                          ? "#ff9800"
                          : "#f44336",
                      color: "white"
                    }}
                  >
                    {academic_progress.performance_trend}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Insights Section */}
          <div className="rounded-2xl p-6" style={{ background: "#e3f2fd", border: "2px solid #2196f3" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#2196f3" }}>
                <span className="material-symbols-outlined" style={{ color: "white", fontSize: "24px", fontVariationSettings: "'FILL' 1" }}>schedule</span>
              </div>
              <h3 className="text-xl font-black" style={{ color: "#0d47a1" }}>
                {t("parent.engagementInsights")}
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl" style={{ background: "white" }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: "#1565c0" }}>
                    {t("parent.learningStreak")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "#0d47a1" }}>
                    {engagement_insights.learning_consistency}
                  </p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "white" }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: "#1565c0" }}>
                    {t("parent.totalTime")}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "#0d47a1" }}>
                    {engagement_insights.total_learning_time}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl" style={{ background: "white" }}>
                <p className="text-sm font-semibold mb-2" style={{ color: "#1565c0" }}>
                  {t("parent.favoriteActivities")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {engagement_insights.activity_preferences?.map((activity, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-sm font-semibold"
                      style={{ background: "#e3f2fd", color: "#1565c0", border: "1px solid #2196f3" }}
                    >
                      🎯 {activity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl" style={{ background: "white" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "#1565c0" }}>
                  {t("parent.motivationPatterns")}
                </p>
                <p className="text-sm" style={{ color: "#3f4a3c" }}>
                  {engagement_insights.motivation_patterns}
                </p>
              </div>
            </div>
          </div>

          {/* AI Recommendations Section */}
          <div className="rounded-2xl p-6" style={{ background: "#fff3e0", border: "2px solid #ff9800" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#ff9800" }}>
                <span className="material-symbols-outlined" style={{ color: "white", fontSize: "24px", fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
              </div>
              <h3 className="text-xl font-black" style={{ color: "#e65100" }}>
                {t("parent.aiRecommendations")}
              </h3>
            </div>

            <div className="space-y-3">
              {ai_recommendations?.map((recommendation, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl flex items-start gap-3"
                  style={{ background: "white" }}
                >
                  <span className="text-xl">💡</span>
                  <p className="text-sm flex-1" style={{ color: "#3f4a3c" }}>
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Celebration Points Section */}
          <div className="rounded-2xl p-6" style={{ background: "#f3e5f5", border: "2px solid #9c27b0" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#9c27b0" }}>
                <span className="material-symbols-outlined" style={{ color: "white", fontSize: "24px", fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <h3 className="text-xl font-black" style={{ color: "#4a148c" }}>
                {t("parent.celebrations")}
              </h3>
            </div>

            <div className="space-y-3">
              {celebration_points?.map((point, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl flex items-center gap-3"
                  style={{ background: "white" }}
                >
                  <span className="text-2xl">🎉</span>
                  <p className="text-sm font-semibold flex-1" style={{ color: "#4a148c" }}>
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Parent Encouragement */}
          <div className="p-6 rounded-2xl text-center" style={{ background: "#ffebee", border: "2px solid #f44336" }}>
            <p className="text-lg font-semibold" style={{ color: "#b71c1c" }}>
              "{parent_encouragement}"
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}