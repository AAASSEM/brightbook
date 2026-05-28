import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/shared/services/api";
import { toast } from "@/shared/stores/uiStore";
import { useT } from "@/shared/stores/langStore";
import Spinner from "@/shared/components/ui/Spinner";

const getStatusStyle = (status) => {
  switch (status) {
    case "open": return { bg: "#ffdf9e", color: "#785900", icon: "help_center" };
    case "in_progress": return { bg: "#d1e4ff", color: "#00355d", icon: "sync" };
    case "resolved": return { bg: "#e9f0e1", color: "#006e1c", icon: "check_circle" };
    default: return { bg: "#f5fced", color: "#3f4a3c", icon: "info" };
  }
};

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("in_progress");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const t = useT();

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    try {
      const r = await api.get("/api/admin/tickets");
      setTickets(r.data);
    } catch { toast.error(t("support.loadFailed")); }
    finally { setLoading(false); }
  };

  const handleSelectTicket = (ticket) => {
    setSelected(ticket);
    setReply("");
    setStatus(ticket.status === "closed" ? "closed" : "in_progress");
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setSubmitting(true);
    try {
      const r = await api.put(`/api/admin/tickets/${selected.complaint_id}/reply`, {
        admin_response: reply,
        status: status,
      });

      setTickets(tickets.map((ticket) => ticket.complaint_id === r.data.complaint_id ? r.data : ticket));
      setSelected(r.data);
      setReply("");
      toast.success(t("admin.replySent"));
    } catch { toast.error(t("admin.replyFailed")); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="section-title">{t("admin.supportTickets")}</h1>
        <p className="section-subtitle">{tickets.filter((tkt) => tkt.status === "open").length} {t("common.open")} · {tickets.length} {t("common.all")}</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-2 space-y-3">
          {tickets.length === 0 && (
            <div className="card text-center py-12" style={{ border: "2px dashed #becab9", background: "transparent", boxShadow: "none" }}>
              <span className="material-symbols-outlined mb-2" style={{ fontSize: "40px", color: "#becab9" }}>inbox</span>
              <p className="font-bold" style={{ color: "#3f4a3c" }}>{t("admin.noTickets")}</p>
            </div>
          )}
          {tickets.map((ticket) => {
            const style = getStatusStyle(ticket.status);
            const isSelected = selected?.complaint_id === ticket.complaint_id;
            
            return (
              <motion.div
                key={ticket.complaint_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => handleSelectTicket(ticket)}
                className="card cursor-pointer transition-all"
                style={{
                  padding: "16px",
                  border: isSelected ? "2px solid #4caf50" : "1px solid #e3ebdc",
                  background: isSelected ? "#f5fced" : "#ffffff",
                  boxShadow: isSelected ? "0 4px 12px rgba(76,175,80,0.15)" : "0 4px 12px rgba(0,0,0,0.04)"
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: style.bg }}
                  >
                    <span className="material-symbols-outlined" style={{ color: style.color, fontSize: "20px" }}>
                      {style.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ background: style.bg, color: style.color }}>
                        {t(`admin.statuses.${ticket.status}`)}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: "#6f7a6b", whiteSpace: "nowrap" }}>
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-bold truncate mt-1" style={{ color: "#171d14" }}>{ticket.subject}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "#3f4a3c" }}>{ticket.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Reply Panel */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="card flex items-center justify-center text-center" style={{ height: "400px", background: "transparent", border: "2px dashed #becab9", boxShadow: "none" }}>
              <div>
                <span className="material-symbols-outlined mb-2" style={{ fontSize: "48px", color: "#becab9" }}>support_agent</span>
                <p className="font-bold" style={{ color: "#3f4a3c" }}>{t("admin.selectTicket")}</p>
              </div>
            </div>
          ) : (
            <motion.div key={selected.complaint_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4">
              <div className="border-b pb-4 mb-4" style={{ borderColor: "#e3ebdc" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest" style={{ background: getStatusStyle(selected.status).bg, color: getStatusStyle(selected.status).color }}>
                    {t(`admin.statuses.${selected.status}`)}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest" style={{ background: "#e9f0e1", color: "#3f4a3c" }}>
                    {t(`support.priorities.${selected.priority}`)}
                  </span>
                  {selected.category && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest" style={{ background: "#e9f0e1", color: "#3f4a3c" }}>
                      {t(`support.categories.${selected.category}`)}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: "#171d14" }}>{selected.subject}</h2>
                <p className="text-sm" style={{ color: "#3f4a3c", whiteSpace: "pre-wrap" }}>{selected.description}</p>
              </div>

              {selected.admin_response && (
                <div className="p-4 rounded-2xl mb-4 flex gap-3" style={{ background: "#e9f0e1", border: "1px solid #becab9" }}>
                  <span className="material-symbols-outlined" style={{ color: "#006e1c" }}>quickreply</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#006e1c" }}>{t("admin.previousReply")}</p>
                    <p className="text-sm font-semibold" style={{ color: "#171d14", whiteSpace: "pre-wrap" }}>{selected.admin_response}</p>
                  </div>
                </div>
              )}

              {selected.is_satisfied !== null && (
                <div className={`p-4 rounded-2xl mb-4 flex gap-3 ${selected.is_satisfied ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
                  <span className="material-symbols-outlined" style={{ color: selected.is_satisfied ? '#4caf50' : '#ff9800' }}>
                    {selected.is_satisfied ? 'check_circle' : 'feedback'}
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: selected.is_satisfied ? '#2e7d32' : '#e65100' }}>
                      {selected.is_satisfied ? t("admin.userSatisfied") : t("admin.userNotSatisfied")}
                    </p>
                    {selected.user_feedback && (
                      <p className="text-sm" style={{ color: "#171d14", whiteSpace: "pre-wrap" }}>"{selected.user_feedback}"</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="label">{t("admin.updateStatus")}</label>
                  <div className="input-wrap">
                    <span className="material-symbols-outlined">update</span>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="input" style={{ appearance: "none", cursor: "pointer" }}>
                      <option value="in_progress">{t("admin.statuses.in_progress")}</option>
                      <option value="resolved">{t("admin.statuses.resolved")}</option>
                      <option value="closed">{t("admin.statuses.closed")}</option>
                    </select>
                    <span className="material-symbols-outlined" style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>expand_more</span>
                  </div>
                </div>
                
                <div>
                  <label className="label">{t("admin.replyMessage")}</label>
                  <textarea value={reply} onChange={(e) => setReply(e.target.value)}
                    className="input min-h-[120px] resize-y" placeholder={t("admin.replyPlaceholder")} style={{ padding: "16px" }} />
                </div>
                
                <button
                  onClick={handleReply}
                  disabled={!reply.trim() || submitting}
                  className="btn btn-primary w-full"
                  style={{ padding: "14px" }}
                >
                  {submitting ? <Spinner size="sm" /> : (
                    <>
                      <span className="material-symbols-outlined mr-2">send</span>
                      {t("admin.sendReply")}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
