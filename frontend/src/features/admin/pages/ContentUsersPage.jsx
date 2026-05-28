import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "@/shared/services/api";
import { toast } from "@/shared/stores/uiStore";
import { useT } from "@/shared/stores/langStore";
import Spinner from "@/shared/components/ui/Spinner";
import ConfirmationModal from "@/shared/components/ui/ConfirmationModal";

export default function ContentUsersPage() {
  const [tab, setTab] = useState("users");
  const [activityView, setActivityView] = useState("templates"); // "templates" or "personalized"
  const [parents, setParents] = useState([]);
  const [children, setChildren] = useState([]);
  const [activities, setActivities] = useState([]);
  const [personalizedActivities, setPersonalizedActivities] = useState([]);
  const [levels, setLevels] = useState([]);
  const [assessmentQuestions, setAssessmentQuestions] = useState([]);
  const [questionStats, setQuestionStats] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: "", message: "", confirmText: "", confirmColor: "", onConfirm: () => {} });
  const t = useT();

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const TABS = [
    { id: "users", label: "Users", icon: "group" },
    { id: "activities", label: "Activities", icon: "library_books" },
    { id: "levels", label: "Levels", icon: "moving" },
    { id: "questions", label: "Assessment Questions", icon: "quiz" }
  ];

  const seedLevels = async () => {
    try {
      await api.post("/api/admin/levels/seed");
      toast.success("Levels seeded successfully!");
      loadAll(); // Reload to show the new levels
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error("Levels already exist in database");
      } else {
        toast.error(err.response?.data?.detail || "Failed to seed levels");
      }
    }
  };

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [p, c, a, l, pa, q, qs] = await Promise.allSettled([
      api.get("/api/admin/users/parents"),
      api.get("/api/admin/users/children"),
      api.get("/api/admin/activities"),
      api.get("/api/admin/levels"),
      api.get("/api/admin/activities/personalized"),
      api.get("/api/admin/assessment-questions"),
      api.get("/api/admin/assessment-questions/stats"),
    ]);
    if (p.status === "fulfilled") setParents(p.value.data);
    if (c.status === "fulfilled") setChildren(c.value.data);
    if (a.status === "fulfilled") setActivities(a.value.data);
    if (l.status === "fulfilled") setLevels(l.value.data);
    if (pa.status === "fulfilled") setPersonalizedActivities(pa.value.data);
    if (q.status === "fulfilled") setAssessmentQuestions(q.value.data);
    if (qs.status === "fulfilled") setQuestionStats(qs.value.data);
    setLoading(false);
  };

  const deleteParent = (id) => {
    setModalConfig({
      isOpen: true,
      title: "Delete Parent",
      message: "Delete this parent and all their data? This cannot be undone.",
      confirmText: "Delete",
      confirmColor: "#ba1a1a",
      onConfirm: async () => {
        try {
          await api.delete(`/api/admin/users/parents/${id}`);
          setParents(parents.filter((p) => p.id !== id));
          toast.success("Parent deleted");
        } catch (err) { 
          toast.error(err.response?.data?.detail || "Failed to delete parent"); 
        }
      }
    });
  };

  const deleteActivity = (id) => {
    setModalConfig({
      isOpen: true,
      title: "Delete Activity",
      message: "Are you sure you want to delete this activity?",
      confirmText: "Delete",
      confirmColor: "#ba1a1a",
      onConfirm: async () => {
        try {
          await api.delete(`/api/admin/activities/${id}`);
          setActivities(activities.filter((a) => a.Activity_ID !== id));
          toast.success("Activity deleted");
        } catch (err) { 
          toast.error(err.response?.data?.detail || "Failed to delete activity"); 
        }
      }
    });
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6 pb-8">
      <ConfirmationModal {...modalConfig} onClose={closeModal} />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="section-title">Content & Users</h1>
          <p className="section-subtitle">Manage platform content and user accounts</p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-2 p-1 rounded-2xl overflow-x-auto no-scrollbar w-fit"
        style={{ background: "#e9f0e1" }}
      >
        {TABS.map((tItem) => (
          <button
            key={tItem.id}
            onClick={() => setTab(tItem.id)}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl transition-all"
            style={
              tab === tItem.id
                ? { background: "#ffffff", color: "#006e1c", boxShadow: "0 2px 8px rgba(0,110,28,0.12)" }
                : { color: "#3f4a3c" }
            }
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tItem.icon}</span>
            {tItem.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === "users" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: "#171d14" }}>Parents ({parents.length})</h2>
            <button className="text-sm font-bold" style={{ color: "#006e1c" }}>Export CSV</button>
          </div>
          <div className="table-wrap" style={{ background: "#ffffff", border: "1.5px solid #e3ebdc" }}>
            <table className="table">
              <thead><tr>
                <th>Name</th><th>Email</th><th>Phone</th><th>Children</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {parents.map((p) => (
                  <tr key={p.id}>
                    <td className="font-bold" style={{ color: "#171d14" }}>{p.name}</td>
                    <td style={{ color: "#3f4a3c" }}>{p.email}</td>
                    <td style={{ color: "#3f4a3c" }}>{p.phone || "—"}</td>
                    <td>
                      <span className="badge" style={{ background: "#e9f0e1", color: "#006e1c" }}>
                        {p.children_count}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => deleteParent(p.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        style={{ color: "#ba1a1a", background: "transparent" }}
                        onMouseOver={(e) => e.currentTarget.style.background = "#ffdad6"}
                        onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {parents.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8" style={{ color: "#6f7a6b" }}>No parents registered yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Activities Tab */}
      {tab === "activities" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold" style={{ color: "#171d14" }}>Activities</h2>
              <p className="text-sm" style={{ color: "#6f7a6b" }}>Manage template and personalized activities</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActivityView("templates")}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={
                  activityView === "templates"
                    ? { background: "#ffffff", color: "#006e1c", boxShadow: "0 2px 8px rgba(0,110,28,0.12)" }
                    : { background: "transparent", color: "#3f4a3c" }
                }
              >
                Templates ({activities.length})
              </button>
              <button
                onClick={() => setActivityView("personalized")}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={
                  activityView === "personalized"
                    ? { background: "#ffffff", color: "#006e1c", boxShadow: "0 2px 8px rgba(0,110,28,0.12)" }
                    : { background: "transparent", color: "#3f4a3c" }
                }
              >
                Personalized ({personalizedActivities.length})
              </button>
            </div>
          </div>

          {activityView === "templates" && (
            <div className="table-wrap" style={{ background: "#ffffff", border: "1.5px solid #e3ebdc" }}>
              <table className="table">
                <thead><tr>
                  <th>Name</th><th>Type</th><th>Group</th><th>Difficulty</th><th>Language</th><th>Duration</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {activities.map((a) => (
                    <tr key={a.Activity_ID}>
                      <td className="font-bold max-w-48 truncate" style={{ color: "#171d14" }}>{a.activity_name}</td>
                      <td>
                        <span className="badge" style={{ background: "#d1e4ff", color: "#00355d", textTransform: "capitalize" }}>
                          {a.activity_type?.replace("_", " ") || "unknown"}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: "#e9f0e1", color: "#006e1c" }}>
                          {a.activity_group || "default"}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: "#ffdf9e", color: "#785900", textTransform: "capitalize" }}>
                          {a.difficulty_level}
                        </span>
                      </td>
                      <td style={{ color: "#3f4a3c" }}>{a.language}</td>
                      <td style={{ color: "#3f4a3c" }}>{a.estimated_duration_minutes}m</td>
                      <td>
                        <button
                          onClick={() => deleteActivity(a.Activity_ID)}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                          style={{ color: "#ba1a1a", background: "transparent" }}
                          onMouseOver={(e) => e.currentTarget.style.background = "#ffdad6"}
                          onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {activities.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8" style={{ color: "#6f7a6b" }}>No template activities found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activityView === "personalized" && (
            <div className="table-wrap" style={{ background: "#ffffff", border: "1.5px solid #e3ebdc" }}>
              <table className="table">
                <thead><tr>
                  <th>Name</th><th>Type</th><th>Child ID</th><th>Difficulty</th><th>Language</th><th>Duration</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {personalizedActivities.map((a) => (
                    <tr key={a.Activity_ID}>
                      <td className="font-bold max-w-48 truncate" style={{ color: "#171d14" }}>{a.activity_name}</td>
                      <td>
                        <span className="badge" style={{ background: "#d1e4ff", color: "#00355d", textTransform: "capitalize" }}>
                          {a.activity_type?.replace("_", " ") || "unknown"}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: "#ffdf9e", color: "#785900" }}>
                          Child #{a.Child_ID}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: "#ffdf9e", color: "#785900", textTransform: "capitalize" }}>
                          {a.difficulty_level}
                        </span>
                      </td>
                      <td style={{ color: "#3f4a3c" }}>{a.language}</td>
                      <td style={{ color: "#3f4a3c" }}>{a.estimated_duration_minutes}m</td>
                      <td>
                        <button
                          onClick={() => deleteActivity(a.Activity_ID)}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                          style={{ color: "#ba1a1a", background: "transparent" }}
                          onMouseOver={(e) => e.currentTarget.style.background = "#ffdad6"}
                          onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {personalizedActivities.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8" style={{ color: "#6f7a6b" }}>No personalized activities found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Levels Tab */}
      {tab === "levels" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold" style={{ color: "#171d14" }}>Levels ({levels.length})</h2>
              <p className="text-sm" style={{ color: "#6f7a6b" }}>Manage literacy learning levels and requirements</p>
            </div>
          </div>
          <div className="space-y-3">
            {levels.map((l) => (
              <div key={l.Level_ID} className="card flex items-center justify-between gap-4" style={{ padding: "16px", border: "1.5px solid #e3ebdc" }}>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black shrink-0"
                  style={{ background: "#e9f0e1", color: "#006e1c" }}
                >
                  {l.level_number}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold" style={{ color: "#171d14" }}>{l.level_name}</p>
                    <span className="badge" style={{ background: "#ffdf9e", color: "#785900", textTransform: "capitalize", fontSize: "10px" }}>
                      {l.difficulty}
                    </span>
                  </div>
                  <p className="text-sm mb-2" style={{ color: "#3f4a3c" }}>{l.description}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-semibold" style={{ color: "#6f7a6b" }}>
                      👶 {l.age_range || "N/A"}
                    </span>
                    <span className="font-semibold" style={{ color: "#6f7a6b" }}>
                      📝 {l.num_activities_required} activities required
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{ color: "#ba1a1a", background: "transparent" }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#ffdad6"}
                    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                  </button>
                </div>
              </div>
            ))}
            {levels.length === 0 && (
              <div className="text-center py-12" style={{ color: "#6f7a6b" }}>
                <span className="material-symbols-outlined mb-2" style={{ fontSize: "48px", color: "#becab9" }}>school</span>
                <p className="font-bold mb-2">No levels found</p>
                <p className="text-sm">Database literacy levels are not yet initialized.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Assessment Questions Tab */}
      {tab === "questions" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold" style={{ color: "#171d14" }}>Assessment Questions</h2>
              <p className="text-sm" style={{ color: "#6f7a6b" }}>Manage the 25 literacy assessment questions</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(assessmentQuestions, null, 2));
                  const dlAnchor = document.createElement('a');
                  dlAnchor.setAttribute("href", dataStr);
                  dlAnchor.setAttribute("download", "literacy_questions.json");
                  dlAnchor.click();
                }}
                className="btn btn-secondary text-sm"
              >
                <span className="material-symbols-outlined mr-1" style={{ fontSize: "16px" }}>download</span>
                Export JSON
              </button>
              <label className="btn btn-primary text-sm cursor-pointer">
                <span className="material-symbols-outlined mr-1" style={{ fontSize: "16px" }}>upload</span>
                Import JSON
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async (evt) => {
                      try {
                        const json = JSON.parse(evt.target.result);
                        await api.put("/api/admin/assessment-questions", json);
                        toast.success("Questions imported successfully!");
                        loadAll();
                      } catch (err) {
                        toast.error("Invalid JSON file structure");
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
          </div>

          {/* Statistics */}
          {questionStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total Questions", value: questionStats.total_questions, icon: "quiz", bg: "#d1e4ff", color: "#00355d" },
                { label: "Assessments Completed", value: questionStats.total_assessments_completed, icon: "assessment", bg: "#e9f0e1", color: "#006e1c" },
                { label: "Question Types", value: Object.keys(questionStats.question_types || {}).length, icon: "category", bg: "#ffdf9e", color: "#785900" },
                { label: "Question Groups", value: questionStats.question_groups, icon: "folder", bg: "#ffdad6", color: "#93000a" },
              ].map((stat, i) => (
                <div key={i} className="card" style={{ padding: "16px", border: "1.5px solid #e3ebdc" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: stat.bg }}>
                      <span className="material-symbols-outlined" style={{ color: stat.color, fontSize: "20px" }}>{stat.icon}</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                      <div className="text-xs font-semibold" style={{ color: "#6f7a6b" }}>{stat.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-3">
            {assessmentQuestions.map((q) => (
              <div key={q.id} className="card" style={{ padding: "16px", border: "1.5px solid #e3ebdc" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "#e9f0e1", color: "#006e1c" }}>
                        {q.order}
                      </span>
                      <h3 className="font-bold" style={{ color: "#171d14" }}>{q.title_en}</h3>
                      <span className="text-xs" style={{ color: "#6f7a6b" }}>• {q.title_ar}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="badge" style={{ background: "#d1e4ff", color: "#00355d", fontSize: "10px" }}>
                        {q.type.replace(/_/g, " ")}
                      </span>
                      <span className="badge" style={{ background: "#ffdf9e", color: "#785900", fontSize: "10px" }}>
                        {q.group}
                      </span>
                    </div>
                    <p className="text-sm mb-2" style={{ color: "#3f4a3c" }}>{q.instruction_en}</p>
                    <p className="text-xs italic" style={{ color: "#6f7a6b" }}>{q.instruction_ar}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditingQuestion(q)}
                      className="px-4 py-2 rounded-xl text-sm font-bold transition-all" 
                      style={{ background: "#d1e4ff", color: "#00355d" }}
                    >
                      Edit JSON
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "#e3ebdc" }}>
              <div>
                <h3 className="text-xl font-bold" style={{ color: "#171d14" }}>Edit Question #{editingQuestion.id}</h3>
                <p className="text-sm" style={{ color: "#6f7a6b" }}>{editingQuestion.title_en}</p>
              </div>
              <button onClick={() => setEditingQuestion(null)} className="material-symbols-outlined text-gray-400 hover:text-gray-600">close</button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
              <textarea 
                className="w-full h-[400px] p-4 font-mono text-sm border rounded-2xl focus:ring-2 focus:ring-green-500 outline-none"
                style={{ background: "#ffffff", borderColor: "#e3ebdc" }}
                defaultValue={JSON.stringify(editingQuestion, null, 2)}
                id="json-editor"
              />
            </div>
            <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: "#e3ebdc" }}>
              <button onClick={() => setEditingQuestion(null)} className="btn btn-secondary">Cancel</button>
              <button 
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    const updated = JSON.parse(document.getElementById("json-editor").value);
                    const all = assessmentQuestions.map(q => q.id === updated.id ? updated : q);
                    await api.put("/api/admin/assessment-questions", all);
                    toast.success("Question updated!");
                    setEditingQuestion(null);
                    loadAll();
                  } catch (err) {
                    toast.error("Invalid JSON syntax");
                  }
                }}
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
