import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "@/shared/services/api";
import { useAuthStore } from "@/shared/stores/authStore";
import { toast } from "@/shared/stores/uiStore";
import { useT, useLangStore } from "@/shared/stores/langStore";
import { useChildStore } from "@/shared/stores/childStore";
import { useNavigate } from "react-router-dom";
import Spinner from "@/shared/components/ui/Spinner";
import ConfirmationModal from "@/shared/components/ui/ConfirmationModal";

export default function SettingsPage() {
  const [tab, setTab] = useState("account");
  const [children, setChildren] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, logout, updateUser } = useAuthStore();
  const { selectedChild, setSelectedChild, children: storeChildren, setChildren: setStoreChildren } = useChildStore();
  const navigate = useNavigate();
  const t = useT();
  const { lang, setLang } = useLangStore();

  // Notification states
  const [notificationPrefs, setNotificationPrefs] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const [isEditingParent, setIsEditingParent] = useState(false);
  const [parentForm, setParentForm] = useState({ name: user?.name || "", phone_number: user?.phone_number || "" });

  const [editingChildId, setEditingChildId] = useState(null);
  const [childForm, setChildForm] = useState({ name: "", native_language: "" });

  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChildForm, setNewChildForm] = useState({ name: "", date_of_birth: "", native_language: "English" });

  const [passwordForm, setPasswordForm] = useState({ old_password: "", new_password: "" });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    try {
      await api.put("/api/parent/change-password", passwordForm);
      toast.success("Password updated successfully!");
      setPasswordForm({ old_password: "", new_password: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update password");
    }
  };


  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    confirmColor: "",
    onConfirm: () => {},
  });

  const closeModal = () => setModalConfig((prev) => ({ ...prev, isOpen: false }));

  useEffect(() => {
    api.get("/api/children/").then((r) => setChildren(r.data)).catch(() => {});
    api.get("/api/subscription/status").then((r) => setSubscription(r.data)).catch(() => {});

    // Load notification preferences
    api.get("/api/parent/notification/preferences").then((r) => {
      setNotificationPrefs(r.data.notification_preferences);
    }).catch(() => {
      // Set default preferences if none exist
      setNotificationPrefs({
        assessment_result: { enabled: true, email: true },
        level_up: { enabled: true, email: true },
        achievement_earned: { enabled: true, email: true },
        streak_milestone: { enabled: true, email: true },
        payment_success: { enabled: true, email: true },
        payment_failed: { enabled: true, email: true },
        support_reply: { enabled: true, email: true },
        weekly_report: { enabled: true, email: false }
      });
    });

    // Load notification history
    setLoadingNotifications(true);
    api.get("/api/parent/notifications").then((r) => {
      setNotifications(r.data);
    }).catch(() => {}).finally(() => {
      setLoadingNotifications(false);
    });
  }, []);

  const planType = subscription?.planType || "basic";
  const canAddChild = (planType === "basic" && children.length < 1) || (["family", "annual"].includes(planType) && children.length < 3);

  const TABS = [
    { id: "account", label: t("settings.account") },
    { id: "children", label: t("settings.children") },
    { id: "subscription", label: t("settings.subscription") },
    { id: "notifications", label: t("settings.notifications") },
  ];

  const handleParentUpdate = async () => {
    try {
      await api.put("/api/parent/me", { name: parentForm.name, phone_number: parentForm.phone_number, preferred_language: lang });
      updateUser({ name: parentForm.name, phone_number: parentForm.phone_number });
      setIsEditingParent(false);
      toast.success(t("settings.profileUpdated"));
    } catch (err) {
      toast.error(t("settings.profileUpdateFailed"));
    }
  };

  const handleChildUpdate = async (id) => {
    try {
      const res = await api.put(`/api/children/${editingChildId}`, childForm);
      const updatedList = children.map(c => c.Child_ID === editingChildId ? res.data : c);
      setChildren(updatedList);
      setStoreChildren(updatedList);
      if (selectedChild?.Child_ID === editingChildId) {
        setSelectedChild(res.data);
      }
      setEditingChildId(null);
      toast.success(t("settings.childUpdated"));
    } catch (err) {
      toast.error(t("settings.childUpdateFailed"));
    }
  };

  const handleDeleteChild = (id) => {
    setModalConfig({
      isOpen: true,
      title: t("settings.deleteChildTitle"),
      message: t("settings.deleteChildConfirm"),
      confirmText: t("common.delete"),
      confirmColor: "#ba1a1a",
      onConfirm: async () => {
        try {
          await api.delete(`/api/children/${id}`);
          const updatedList = children.filter(c => c.Child_ID !== id);
          setChildren(updatedList);
          setStoreChildren(updatedList);
          if (selectedChild?.Child_ID === id) {
            setSelectedChild(updatedList.length > 0 ? updatedList[0] : null);
          }
          toast.success(t("settings.childDeleted"));
        } catch (err) {
          toast.error(t("settings.childDeleteFailed"));
        }
      }
    });
  };

  const handleCreateChild = async () => {
    if (!newChildForm.name || !newChildForm.date_of_birth) {
      return toast.error("Name and Date of Birth are required");
    }
    try {
      const res = await api.post("/api/children/", newChildForm);
      const updatedList = [...children, res.data];
      setChildren(updatedList);
      setStoreChildren(updatedList);
      setIsAddingChild(false);
      setNewChildForm({ name: "", date_of_birth: "", native_language: "English" });
      toast.success(t("settings.childAdded"));
      // Redirect to the assessment of the new child
      navigate(`/learn/assessment/${res.data.Child_ID}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || t("settings.childAddFailed"));
    }
  };

  const handleDeleteAccount = () => {
    setModalConfig({
      isOpen: true,
      title: t("settings.deleteAccount"),
      message: t("settings.deleteAccountConfirm"),
      confirmText: t("settings.deleteAccount"),
      confirmColor: "#ba1a1a",
      onConfirm: async () => {
        try {
          await api.delete("/api/parent/me");
          toast.success(t("settings.accountDeleted"));
          logout();
        } catch {
          toast.error(t("settings.accountDeleteFailed"));
        }
      }
    });
  };

  const handleNotificationPreferenceUpdate = async (type, key, value) => {
    const updatedPrefs = {
      ...notificationPrefs,
      [type]: {
        ...notificationPrefs[type],
        [key]: value
      }
    };

    try {
      await api.put("/api/parent/notification/preferences", { notification_preferences: updatedPrefs });
      setNotificationPrefs(updatedPrefs);
      toast.success(t("settings.notificationPrefsUpdated"));
    } catch {
      toast.error(t("settings.notificationPrefsUpdateFailed"));
    }
  };

  const handleMarkNotificationRead = async (notifId) => {
    try {
      await api.put(`/api/parent/notifications/${notifId}/read`);
      setNotifications(notifications.map(n =>
        n.notification_id === notifId ? { ...n, is_read: true } : n
      ));
    } catch {
      toast.error(t("settings.actionFailed"));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => !n.is_read).map(n =>
          api.put(`/api/parent/notifications/${n.notification_id}/read`)
        )
      );
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      toast.success(t("settings.markedAllRead"));
    } catch {
      toast.error(t("settings.actionFailed"));
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-6">
      <ConfirmationModal {...modalConfig} onClose={closeModal} />

      <div>
        <h1 className="section-title">{t("settings.title")}</h1>
        <p className="section-subtitle">{t("settings.subtitle")}</p>
      </div>

      {/* Tab Pills */}
      <div
        className="flex gap-2 p-1 rounded-2xl overflow-x-auto no-scrollbar"
        style={{ background: "#e9f0e1" }}
      >
        {TABS.map((tItem) => (
          <button
            key={tItem.id}
            onClick={() => setTab(tItem.id)}
            className="flex-shrink-0 px-4 py-2 text-sm font-bold rounded-xl transition-all"
            style={
              tab === tItem.id
                ? { background: "#ffffff", color: "#006e1c", boxShadow: "0 2px 8px rgba(0,110,28,0.12)" }
                : { color: "#3f4a3c" }
            }
          >
            {tItem.label}
          </button>
        ))}
      </div>

      {/* Account Tab */}
      {tab === "account" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: "#4caf50", color: "#ffffff", boxShadow: "0 4px 12px rgba(76,175,80,0.3)" }}
            >
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-lg" style={{ color: "#171d14" }}>{user?.name}</p>
              <p className="text-sm" style={{ color: "#3f4a3c" }}>{user?.email}</p>
            </div>
            <button 
              className="ml-auto flex items-center justify-center w-10 h-10 rounded-full" 
              style={isEditingParent ? { background: "#ffeaea", color: "#ba1a1a" } : { background: "#e9f0e1", color: "#006e1c" }}
              onClick={() => {
                setIsEditingParent(!isEditingParent);
                setParentForm({ name: user?.name || "", phone_number: user?.phone_number || "" });
              }}
            >
              <span className="material-symbols-outlined">{isEditingParent ? "close" : "edit"}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">{t("settings.fullName")}</label>
              <div className="input-wrap">
                <span className="material-symbols-outlined">person</span>
                <input 
                  className="input" 
                  value={isEditingParent ? parentForm.name : (user?.name || "")} 
                  onChange={e => setParentForm({ ...parentForm, name: e.target.value })}
                  disabled={!isEditingParent} 
                />
              </div>
            </div>
            <div>
              <label className="label">{t("settings.emailReadOnly")}</label>
              <div className="input-wrap opacity-70">
                <span className="material-symbols-outlined">mail</span>
                <input className="input" value={user?.email || ""} disabled />
              </div>
            </div>
            <div>
              <label className="label">{t("settings.phoneField")}</label>
              <div className="input-wrap">
                <span className="material-symbols-outlined">phone</span>
                <input 
                  className="input" 
                  placeholder="e.g. +1234567890"
                  value={isEditingParent ? parentForm.phone_number : (user?.phone_number || "")} 
                  onChange={e => setParentForm({ ...parentForm, phone_number: e.target.value })}
                  disabled={!isEditingParent} 
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="label">{t("settings.languagePreference")}</label>
              <div className="input-wrap">
                <span className="material-symbols-outlined">language</span>
                <select
                  className="input"
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  style={{ appearance: "none", cursor: "pointer" }}
                >
                  <option value="en">English (US)</option>
                  <option value="ar">العربية (Arabic)</option>
                </select>
                <span className="material-symbols-outlined" style={{ position: "absolute", [lang === 'ar' ? 'left' : 'right']: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                  expand_more
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: "#6f7a6b" }}>{t("settings.languageSub")}</p>
            </div>
          </div>

          {isEditingParent && (
            <button className="btn btn-primary w-full mt-2" onClick={handleParentUpdate}>
              {t("settings.saveChanges")}
            </button>
          )}

          {/* Change Password Section */}
          <div className="pt-6 mt-6 border-t border-dashed" style={{ borderColor: "#becab9" }}>
            <button 
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#eff6e7] flex items-center justify-center text-[#006e1c] group-hover:bg-[#006e1c] group-hover:text-white transition-all">
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>lock</span>
                </div>
                <h3 className="font-bold text-lg" style={{ color: "#171d14" }}>Change Password</h3>
              </div>
              <span className={`material-symbols-outlined transition-transform duration-300 ${isChangingPassword ? "rotate-180" : ""}`} style={{ color: "#3f4a3c" }}>
                expand_more
              </span>
            </button>

            {isChangingPassword && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-4 pt-6">
                  <div>
                    <label className="label">Current Password</label>
                    <div className="input-wrap">
                      <span className="material-symbols-outlined">lock_open</span>
                      <input
                        type="password"
                        className="input"
                        placeholder="Enter current password"
                        value={passwordForm.old_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">New Password</label>
                    <div className="input-wrap">
                      <span className="material-symbols-outlined">lock</span>
                      <input
                        type="password"
                        className="input"
                        placeholder="Min 6 characters"
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      />
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary w-full"
                    onClick={handleChangePassword}
                    disabled={!passwordForm.old_password || passwordForm.new_password.length < 6}
                  >
                    Update Password
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-dashed" style={{ borderColor: "#becab9" }}>
            <button onClick={() => logout()} className="btn btn-secondary w-full mb-3" style={{ color: "#171d14" }}>
              <span className="material-symbols-outlined">logout</span>
              {t("settings.logout")}
            </button>
            <button 
              className="btn btn-danger w-full" 
              style={{ background: "transparent", color: "#ba1a1a", boxShadow: "none", border: "2px solid #ba1a1a" }}
              onClick={handleDeleteAccount}
            >
              {t("settings.deleteAccount")}
            </button>
          </div>
        </motion.div>
      )}

      {/* Children Tab */}
      {tab === "children" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-bold" style={{ color: "#171d14" }}>{t("settings.children")} ({children.length})</h2>
          </div>
          {children.map((c) => (
            <div key={c.Child_ID} className="card flex flex-col gap-4 p-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                  style={{ background: "#ffdf9e", color: "#5b4300" }}
                >
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate" style={{ color: "#171d14" }}>{c.name}</p>
                  <p className="text-sm truncate" style={{ color: "#3f4a3c" }}>
                    {t("child.age")} {c.age} · {t("child.level")} {c.current_level} · {c.native_language}
                  </p>
                </div>
                <button 
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" 
                  style={editingChildId === c.Child_ID ? { background: "#ffeaea", color: "#ba1a1a" } : { background: "#e9f0e1", color: "#006e1c" }}
                  onClick={() => {
                    if (editingChildId === c.Child_ID) {
                      setEditingChildId(null);
                    } else {
                      setEditingChildId(c.Child_ID);
                      setChildForm({ name: c.name, native_language: c.native_language });
                    }
                  }}
                >
                  <span className="material-symbols-outlined">{editingChildId === c.Child_ID ? "close" : "edit"}</span>
                </button>
              </div>
              
              {editingChildId === c.Child_ID && (
                <div className="mt-2 pt-4 border-t border-dashed" style={{ borderColor: "#becab9" }}>
                  <div className="space-y-4">
                    <div>
                      <label className="label">{t("onboarding.childName")}</label>
                      <input 
                        className="input" 
                        value={childForm.name} 
                        onChange={(e) => setChildForm({ ...childForm, name: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="label">{t("child.nativeLanguage")}</label>
                      <input 
                        className="input" 
                        value={childForm.native_language} 
                        onChange={(e) => setChildForm({ ...childForm, native_language: e.target.value })} 
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button className="btn btn-primary flex-1 py-2 text-sm" onClick={() => handleChildUpdate(c.Child_ID)}>
                        {t("common.save")}
                      </button>
                      <button className="btn btn-danger flex-none w-12 py-2" onClick={() => handleDeleteChild(c.Child_ID)}>
                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {children.length === 0 && (
            <div className="card text-center" style={{ color: "#6f7a6b" }}>{t("parent.noChildren")}</div>
          )}

          {!isAddingChild ? (
            <div className="pt-2">
              <button 
                className={`btn w-full border-dashed ${canAddChild ? 'btn-secondary' : 'opacity-50 cursor-not-allowed'}`} 
                style={canAddChild ? { borderStyle: "dashed" } : { borderStyle: "dashed", background: "#f1f1f1", color: "#999" }}
                onClick={() => canAddChild && setIsAddingChild(true)}
                disabled={!canAddChild}
              >
                <span className="material-symbols-outlined">add</span>
                {t("parent.addChild")}
              </button>
              {!canAddChild && (
                <p className="text-center text-xs mt-2" style={{ color: "#ba1a1a" }}>
                  {planType === "basic" ? t("settings.planLimitBasic") : t("settings.planLimitFamily")}
                </p>
              )}
            </div>
          ) : (
            <div className="card p-4 border border-green-200">
              <h3 className="font-bold mb-4" style={{ color: "#171d14" }}>{t("settings.addChildTitle")}</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">{t("onboarding.childName")}</label>
                  <input 
                    className="input" 
                    placeholder={t("onboarding.namePlaceholder")}
                    value={newChildForm.name} 
                    onChange={(e) => setNewChildForm({ ...newChildForm, name: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="label">{t("settings.dateOfBirth")}</label>
                  <input 
                    type="date"
                    className="input" 
                    value={newChildForm.date_of_birth} 
                    onChange={(e) => setNewChildForm({ ...newChildForm, date_of_birth: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="label">{t("child.nativeLanguage")}</label>
                  <select 
                    className="input" 
                    value={newChildForm.native_language} 
                    onChange={(e) => setNewChildForm({ ...newChildForm, native_language: e.target.value })} 
                  >
                    <option value="English">English</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button className="btn btn-primary flex-1 py-2 text-sm" onClick={handleCreateChild}>
                    {t("settings.addProfile")}
                  </button>
                  <button className="btn flex-none py-2 text-sm" style={{ background: "#f1f5f9", color: "#475569" }} onClick={() => setIsAddingChild(false)}>
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Subscription Tab */}
      {tab === "subscription" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#006e1c" }}>
              <span className="material-symbols-outlined text-white">workspace_premium</span>
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "#171d14" }}>{t("settings.subscription")}</h2>
              <p className="text-sm" style={{ color: "#3f4a3c" }}>{t("settings.manageBilling")}</p>
            </div>
          </div>

          {subscription ? (
            <>
              <div className="p-4 rounded-2xl mb-4" style={{ background: "#17305a", color: "#fff" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#fdc003" }}>{t("settings.activePlan")}</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-bold capitalize">{subscription.planType}</span>
                  <span className={`badge ${subscription.subscription_status === "active" ? "badge-green" : "badge-red"} capitalize`} style={{ alignSelf: "center" }}>
                    {subscription.subscription_status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{t("settings.startDate")}</p>
                    <p className="text-sm font-semibold">{subscription.startDate || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{t("settings.nextBilling")}</p>
                    <p className="text-sm font-semibold">{subscription.endDate || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  className="btn btn-secondary flex-1" 
                  style={{ background: "#eff6e7" }}
                  onClick={() => navigate("/plans")}
                >
                  {t("settings.manageSubscription")}
                </button>
                {subscription.subscription_status === "active" ? (
                  <button className="btn btn-danger flex-1" onClick={() => {
                    setModalConfig({
                      isOpen: true,
                      title: t("settings.cancelSubscriptionTitle"),
                      message: t("settings.cancelSubscriptionConfirm"),
                      confirmText: t("settings.cancelSubscriptionTitle"),
                      confirmColor: "#ba1a1a",
                      onConfirm: () => {
                        api.delete("/api/subscription/cancel").then(() => {
                          toast.success(t("settings.subscriptionCancelled"));
                          setSubscription((s) => ({ ...s, subscription_status: "cancelled" }));
                        }).catch(() => toast.error(t("settings.actionFailed")));
                      }
                    });
                  }}>
                    {t("common.cancel")}
                  </button>
                ) : (
                  <button className="btn btn-primary flex-1" onClick={() => {
                    api.put("/api/subscription/reactivate").then(() => {
                      toast.success(t("settings.subscriptionReactivated"));
                      setSubscription((s) => ({ ...s, subscription_status: "active" }));
                    }).catch(() => toast.error(t("settings.actionFailed")));
                  }}>
                    {t("common.reactivate")}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center p-6 rounded-2xl" style={{ background: "#eff6e7" }}>
              <span className="material-symbols-outlined mb-2" style={{ fontSize: "32px", color: "#6f7a6b" }}>credit_card_off</span>
              <p className="font-semibold" style={{ color: "#3f4a3c" }}>{t("settings.noSubscription")}</p>
              <button className="btn btn-primary mt-4" onClick={() => navigate("/plans")}>{t("common.viewPlans")}</button>
            </div>
          )}
        </motion.div>
      )}

      {/* Notifications Tab */}
      {tab === "notifications" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Notification Preferences */}
          <div className="card space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#ffdf9e" }}>
                <span className="material-symbols-outlined" style={{ color: "#5b4300" }}>notifications</span>
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: "#171d14" }}>{t("settings.notificationPreferences")}</h2>
                <p className="text-sm" style={{ color: "#3f4a3c" }}>{t("settings.manageNotifications")}</p>
              </div>
            </div>

            {notificationPrefs ? (
              <div className="space-y-3">
                {Object.entries({
                  assessment_result: { icon: "quiz", label: t("settings.assessmentResults") },
                  level_up: { icon: "trending_up", label: t("settings.levelUpProgress") },
                  achievement_earned: { icon: "military_tech", label: t("settings.achievements") },
                  streak_milestone: { icon: "local_fire_department", label: t("settings.streakMilestones") },
                  payment_success: { icon: "payments", label: t("settings.paymentSuccess") },
                  payment_failed: { icon: "error", label: t("settings.paymentFailed") },
                  support_reply: { icon: "support_agent", label: t("settings.supportReplies") },
                  weekly_report: { icon: "calendar_month", label: t("settings.weeklyReports") },
                }).map(([key, { icon, label }]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#f9fafb" }}>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined" style={{ color: "#4caf50" }}>{icon}</span>
                      <span className="font-medium" style={{ color: "#171d14" }}>{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleNotificationPreferenceUpdate(key, "enabled", !notificationPrefs[key]?.enabled)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          notificationPrefs[key]?.enabled
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {notificationPrefs[key]?.enabled ? t("settings.on") : t("settings.off")}
                      </button>
                      <button
                        onClick={() => handleNotificationPreferenceUpdate(key, "email", !notificationPrefs[key]?.email)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          notificationPrefs[key]?.email
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        Email
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: "#6f7a6b" }}>
                <Spinner />
              </div>
            )}
          </div>

          {/* Notification History */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#e9f0e1" }}>
                  <span className="material-symbols-outlined" style={{ color: "#006e1c" }}>history</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "#171d14" }}>{t("settings.notificationHistory")}</h2>
                  <p className="text-sm" style={{ color: "#3f4a3c" }}>{t("settings.recentNotifications")}</p>
                </div>
              </div>
              {notifications.some(n => !n.is_read) && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm font-bold px-3 py-1 rounded-lg"
                  style={{ background: "#e9f0e1", color: "#006e1c" }}
                >
                  {t("settings.markAllRead")}
                </button>
              )}
            </div>

            {loadingNotifications ? (
              <div className="text-center py-8">
                <Spinner />
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.notification_id}
                    className={`p-4 rounded-xl transition-all cursor-pointer ${
                      !notif.is_read ? "bg-green-50 border-2 border-green-200" : "bg-gray-50 border-2 border-transparent"
                    }`}
                    onClick={() => !notif.is_read && handleMarkNotificationRead(notif.notification_id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        !notif.is_read ? "bg-green-200" : "bg-gray-200"
                      }`}>
                        <span className="material-symbols-outlined text-lg" style={{ color: "#006e1c" }}>
                          {notif.notification_type === "assessment_result" ? "quiz" :
                           notif.notification_type === "level_up" ? "trending_up" :
                           notif.notification_type === "achievement_earned" ? "military_tech" :
                           notif.notification_type === "streak_milestone" ? "local_fire_department" :
                           notif.notification_type === "payment_success" ? "payments" :
                           notif.notification_type === "payment_failed" ? "error" :
                           notif.notification_type === "support_reply" ? "support_agent" :
                           notif.notification_type === "weekly_report" ? "calendar_month" :
                           "notifications"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${!notif.is_read ? "font-bold" : ""}`} style={{ color: "#171d14" }}>
                          {notif.message}
                        </p>
                        {notif.sent_time && (
                          <p className="text-xs mt-1" style={{ color: "#6f7a6b" }}>
                            {new Date(notif.sent_time).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {!notif.is_read && (
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: "#4caf50" }}></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 rounded-xl" style={{ background: "#f9fafb", color: "#6f7a6b" }}>
                <span className="material-symbols-outlined mb-2" style={{ fontSize: "32px" }}>notifications_off</span>
                <p className="font-medium">{t("settings.noNotifications")}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

    </div>
  );
}
