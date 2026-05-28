import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/shared/services/api";
import { toast } from "@/shared/stores/uiStore";
import { useT } from "@/shared/stores/langStore";
import Spinner from "@/shared/components/ui/Spinner";
import { useForm } from "react-hook-form";

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [feedbackSatisfied, setFeedbackSatisfied] = useState(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const t = useT();

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    try {
      const r = await api.get("/api/support/tickets");
      setTickets(r.data);
    } catch { toast.error(t("support.loadFailed")); }
    finally { setLoading(false); }
  };

  const onSubmit = async (data) => {
    try {
      const r = await api.post("/api/support/tickets", data);
      setTickets([r.data, ...tickets]);
      reset();
      setShowForm(false);
      toast.success(t("support.ticketSubmitted"));
    } catch { toast.error(t("support.ticketSubmitFailed")); }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "open": return { bg: "#ffdf9e", color: "#785900", icon: "help_center" };
      case "in_progress": return { bg: "#d1e4ff", color: "#00355d", icon: "sync" };
      case "resolved": return { bg: "#e9f0e1", color: "#006e1c", icon: "check_circle" };
      case "closed": return { bg: "#e9f0e1", color: "#006e1c", icon: "check_circle" };
      default: return { bg: "#f5fced", color: "#3f4a3c", icon: "info" };
    }
  };

  const handleSelectTicket = (ticket) => {
    setSelected(selected?.complaint_id === ticket.complaint_id ? null : ticket);
    setFeedbackSatisfied(null);
    setFeedbackComment("");
  };

  const handleSubmitFeedback = async () => {
    if (feedbackSatisfied === null) return;
    setSubmittingFeedback(true);
    try {
      const r = await api.post(`/api/support/tickets/${selected.complaint_id}/feedback`, {
        is_satisfied: feedbackSatisfied,
        user_feedback: feedbackComment
      });
      setTickets(tickets.map(t => t.complaint_id === r.data.complaint_id ? r.data : t));
      setSelected(r.data);
      toast.success(t("support.feedbackSubmitted"));
    } catch {
      toast.error(t("support.feedbackFailed"));
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">{t("support.title")}</h1>
          <p className="section-subtitle">{t("support.subtitle")}</p>
        </div>
        <button
          className="kid-btn"
          style={{ width: "auto", padding: "12px 24px", fontSize: "16px", display: "flex", gap: "8px" }}
          onClick={() => setShowForm(!showForm)}
        >
          <span className="material-symbols-outlined">{showForm ? "close" : "add"}</span>
          {showForm ? t("common.cancel") : t("support.newTicket")}
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#ffdf9e" }}>
            <span className="material-symbols-outlined" style={{ color: "#785900", fontSize: "28px", fontVariationSettings: "'FILL' 1" }}>support_agent</span>
          </div>
          <div>
            <div className="stat-value">{tickets.filter(t => t.status !== "resolved").length}</div>
            <div className="stat-label">{t("support.pending")}</div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#e9f0e1" }}>
            <span className="material-symbols-outlined" style={{ color: "#006e1c", fontSize: "28px", fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <div>
            <div className="stat-value">{tickets.filter(t => t.status === "resolved").length}</div>
            <div className="stat-label">{t("support.resolved")}</div>
          </div>
        </div>
      </div>

      {/* New Ticket Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4" style={{ border: "2px solid #becab9" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined" style={{ color: "#006e1c" }}>edit_document</span>
                <h2 className="text-lg font-bold" style={{ color: "#171d14" }}>{t("support.createRequest")}</h2>
              </div>
              
              <div>
                <label className="label">{t("support.subject")}</label>
                <div className="input-wrap">
                  <span className="material-symbols-outlined">title</span>
                  <input {...register("subject", { required: true })} className="input" placeholder={t("support.subjectPlaceholder")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t("support.category")}</label>
                  <div className="input-wrap">
                    <span className="material-symbols-outlined">category</span>
                    <select {...register("category")} className="input" style={{ appearance: "none", cursor: "pointer" }}>
                      <option value="technical">{t("support.categories.technical")}</option>
                      <option value="billing">{t("support.categories.billing")}</option>
                      <option value="content">{t("support.categories.content")}</option>
                      <option value="account">{t("support.categories.account")}</option>
                      <option value="other">{t("support.categories.other")}</option>
                    </select>
                    <span className="material-symbols-outlined" style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>expand_more</span>
                  </div>
                </div>
                <div>
                  <label className="label">{t("support.priority")}</label>
                  <div className="input-wrap">
                    <span className="material-symbols-outlined">flag</span>
                    <select {...register("priority")} className="input" style={{ appearance: "none", cursor: "pointer" }}>
                      <option value="low">{t("support.priorities.low")}</option>
                      <option value="medium">{t("support.priorities.medium")}</option>
                      <option value="high">{t("support.priorities.high")}</option>
                    </select>
                    <span className="material-symbols-outlined" style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>expand_more</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="label">{t("support.description")}</label>
                <textarea {...register("description", { required: true })} className="input min-h-[120px] resize-y"
                  placeholder={t("support.descPlaceholder")} style={{ padding: "16px" }} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn btn-primary flex-1" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner size="sm" /> : t("support.submit")}
                </button>
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowForm(false)}>
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tickets List */}
      <div>
        <h2 className="font-bold text-lg mb-4" style={{ color: "#171d14" }}>{t("support.recentTickets")}</h2>
        
        {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
          <div className="space-y-3">
            {tickets.length === 0 && (
              <div className="card text-center py-12" style={{ background: "transparent", border: "2px dashed #becab9", boxShadow: "none" }}>
                <span className="material-symbols-outlined mb-3" style={{ fontSize: "48px", color: "#becab9" }}>forum</span>
                <p className="font-bold" style={{ color: "#3f4a3c" }}>{t("support.noTickets")}</p>
                <p className="text-sm" style={{ color: "#6f7a6b" }}>{t("support.supportSub")}</p>
              </div>
            )}
            
            {tickets.map((ticket) => {
              const statusStyle = getStatusStyle(ticket.status);
              const isSelected = selected?.complaint_id === ticket.complaint_id;
              
              return (
                <motion.div key={ticket.complaint_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="card transition-all"
                  style={{
                    border: isSelected ? "2px solid #4caf50" : "1px solid rgba(255,255,255,0.8)",
                    padding: "20px"
                  }}>
                  
                  <div className="flex items-start gap-4 cursor-pointer" onClick={() => handleSelectTicket(ticket)}>
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: statusStyle.bg }}
                    >
                      <span className="material-symbols-outlined" style={{ color: statusStyle.color, fontVariationSettings: "'FILL' 1" }}>
                        {statusStyle.icon}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold truncate" style={{ color: "#171d14", fontSize: "16px" }}>{ticket.subject}</h3>
                        <span className="text-xs font-semibold" style={{ color: "#6f7a6b", whiteSpace: "nowrap" }}>
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm truncate" style={{ color: "#3f4a3c" }}>{ticket.description}</p>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                          style={{ background: statusStyle.bg, color: statusStyle.color }}
                        >
                          {t(`admin.statuses.${ticket.status}`)}
                        </span>
                        <span className="text-xs" style={{ color: "#6f7a6b" }}>• ID: #{ticket.complaint_id}</span>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isSelected && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-dashed space-y-4" style={{ borderColor: "#becab9" }}>
                        
                        {/* Initial Description */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <p className="text-sm font-semibold mb-1 text-gray-500">{t("support.yourRequest")}</p>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{ticket.description}</p>
                        </div>

                        {/* Admin Response */}
                        {ticket.admin_response && (
                          <div className="bg-green-50 p-4 rounded-xl border border-green-200 relative mt-4">
                            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-green-700 flex items-center justify-center border-4 border-white">
                              <span className="material-symbols-outlined text-white text-[16px]">shield_person</span>
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest text-green-700 mb-2 ml-3">{t("support.teamName")}</p>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{ticket.admin_response}</p>
                          </div>
                        )}

                        {/* Feedback Form (Only show if resolved and no feedback submitted yet) */}
                        {ticket.status === "resolved" && !ticket.is_satisfied && ticket.admin_response && (
                          <div className="mt-8 p-5 rounded-2xl border-2" style={{ background: "#ffffff", borderColor: "#becab9" }}>
                            <div className="flex items-center gap-3 mb-5">
                              <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                                <span className="material-symbols-outlined text-green-700" style={{ fontSize: "20px" }}>forum</span>
                              </div>
                              <div>
                                <h3 className="font-bold text-base" style={{ color: "#171d14" }}>{t("support.yourFeedback")}</h3>
                                <p className="text-xs" style={{ color: "#6f7a6b" }}>{t("support.satisfiedSub")}</p>
                              </div>
                            </div>

                            <div className="flex gap-3 mb-5">
                              <button
                                onClick={() => setFeedbackSatisfied(true)}
                                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                                  feedbackSatisfied === true ? "border-green-500 bg-green-50" : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                                }`}
                              >
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                  feedbackSatisfied === true ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                                }`}>
                                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check_circle</span>
                                </div>
                                <span className={`text-sm font-bold ${feedbackSatisfied === true ? "text-green-700" : "text-gray-500"}`}>{t("support.satisfied")}</span>
                              </button>

                              <button
                                onClick={() => setFeedbackSatisfied(false)}
                                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                                  feedbackSatisfied === false ? "border-red-500 bg-red-50" : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                                }`}
                              >
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                  feedbackSatisfied === false ? "bg-red-500 text-white" : "bg-gray-200 text-gray-500"
                                }`}>
                                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>cancel</span>
                                </div>
                                <span className={`text-sm font-bold ${feedbackSatisfied === false ? "text-red-700" : "text-gray-500"}`}>{t("support.notSatisfied")}</span>
                              </button>
                            </div>

                            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden mb-5">
                              <div className="bg-white px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                                <span className="material-symbols-outlined text-gray-400" style={{ fontSize: "16px" }}>edit_note</span>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t("support.yourComment")}</span>
                              </div>
                              <textarea
                                value={feedbackComment}
                                onChange={(e) => setFeedbackComment(e.target.value)}
                                placeholder={t("support.commentPlaceholder")}
                                className="w-full bg-transparent border-none text-sm p-3 text-gray-800 focus:ring-0 resize-y min-h-[80px] placeholder-gray-400"
                                style={{ outline: "none" }}
                              />
                            </div>

                            <button
                                onClick={handleSubmitFeedback}
                                disabled={feedbackSatisfied === null || submittingFeedback}
                                className="btn btn-primary w-full py-3"
                              >
                                {submittingFeedback ? <Spinner size="sm" /> : (
                                  <>
                                    <span className="material-symbols-outlined">send</span>
                                    {t("support.confirmFeedback")}
                                  </>
                                )}
                              </button>
                          </div>
                        )}

                        {ticket.is_satisfied !== null && (
                          <div className={`mt-4 p-4 rounded-xl flex items-start gap-3 ${ticket.is_satisfied ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
                            <span className="material-symbols-outlined" style={{ color: ticket.is_satisfied ? '#4caf50' : '#ff9800' }}>
                              {ticket.is_satisfied ? 'check_circle' : 'feedback'}
                            </span>
                            <div>
                              <p className="font-bold text-sm" style={{ color: ticket.is_satisfied ? '#2e7d32' : '#e65100' }}>
                                {ticket.is_satisfied ? t("support.markedSatisfied") : t("support.markedUnsatisfied")}
                              </p>
                              {ticket.user_feedback && (
                                <p className="text-sm mt-1 text-gray-700 italic">"{ticket.user_feedback}"</p>
                              )}
                            </div>
                          </div>
                        )}

                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
