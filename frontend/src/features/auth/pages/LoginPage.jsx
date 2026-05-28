import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/shared/services/api";
import { useAuthStore } from "@/shared/stores/authStore";
import { toast } from "@/shared/stores/uiStore";
import { useLangStore, useT, useLang, useSetLang } from "@/shared/stores/langStore";
import Spinner from "@/shared/components/ui/Spinner";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function LoginPage() {
  const [tab, setTab] = useState("login");
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const t = useT();
  const lang = useLang();
  const setLang = useSetLang();

  const loginForm = useForm({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm({ resolver: zodResolver(registerSchema) });

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const onForgot = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error("Please enter your email");
    setIsSending(true);
    try {
      await api.post("/api/auth/forgot-password", { email: forgotEmail });
      toast.success("Reset link sent! Check your email.");
      setShowForgot(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Something went wrong");
    } finally {
      setIsSending(false);
    }
  };

  const onLogin = async (data) => {
    try {
      const res = await api.post("/api/auth/login", data);
      login(
        { name: res.data.name, email: data.email, role: res.data.role, id: res.data.user_id },
        res.data.access_token,
        res.data.refresh_token
      );
      toast.success(`Welcome back, ${res.data.name}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    }
  };

  const onRegister = async (data) => {
    try {
      const res = await api.post("/api/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
        language: lang,
      });
      login(
        { name: res.data.name, email: data.email, role: res.data.role, id: res.data.user_id },
        res.data.access_token,
        res.data.refresh_token
      );
      toast.success("Welcome to BrightBook!");
      navigate("/onboarding");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div
      className="min-h-screen soft-bg flex flex-col items-center justify-start pt-8 px-4 pb-12"
      style={{ background: "#f5fced" }}
    >
      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[28px] p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#eff6e7] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[#006e1c]" style={{ fontSize: "32px" }}>lock_reset</span>
                </div>
                <h2 className="text-2xl font-bold text-[#171d14]">Reset Password</h2>
                <p className="text-sm text-[#3f4a3c] mt-2">Enter your email and we'll send you a magic link to get back in.</p>
              </div>

              <form onSubmit={onForgot} className="space-y-4">
                <div>
                  <label className="label">Email Address</label>
                  <div className="input-wrap">
                    <span className="material-symbols-outlined">mail</span>
                    <input
                      type="email"
                      className="input"
                      placeholder="hello@parent.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="flex-1 py-3 text-sm font-bold rounded-2xl border-2 border-[#becab9] text-[#3f4a3c]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex-[2] kid-btn py-3"
                    style={{ marginTop: 0 }}
                  >
                    {isSending ? <Spinner size="sm" /> : "Send Link"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Language Toggle */}
      <div className="w-full max-w-sm flex justify-end mb-4">
        <button
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all"
          style={{
            background: "rgba(255,255,255,0.85)",
            border: "1.5px solid #becab9",
            color: "#006e1c",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>language</span>
          {lang === "en" ? "عربي" : "English"}
        </button>
      </div>

      {/* Illustration + Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-6"
      >
        {/* Book icon circle */}
        <div className="relative mb-3">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #fdc003, #ff8f00)" }}
          >
            <span
              className="material-symbols-outlined text-white"
              style={{ fontSize: "56px", fontVariationSettings: "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 48" }}
            >
              menu_book
            </span>
          </div>
          <div
            className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "#fdc003", border: "2px solid #fff" }}
          >
            <span className="material-symbols-outlined text-white" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
        </div>
        <h1 className="text-3xl font-black" style={{ color: "#006e1c", fontFamily: "Lexend, sans-serif" }}>
          BrightBook
        </h1>
        <p className="text-center text-sm mt-1 max-w-[220px]" style={{ color: "#3f4a3c" }}>
          {t("auth.tagline")}
        </p>
      </motion.div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm"
        style={{
          background: "#ffffff",
          borderRadius: "28px",
          padding: "24px",
          boxShadow: "0 16px 48px rgba(0,110,28,0.12)",
        }}
      >
        {/* Tab switcher */}
        <div
          className="flex p-1 mb-6 rounded-2xl"
          style={{ background: "#eff6e7" }}
        >
          {[
            { key: "login", label: t("auth.login") },
            { key: "register", label: t("auth.signup") },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
              style={
                tab === key
                  ? { background: "#ffffff", color: "#006e1c", boxShadow: "0 2px 8px rgba(0,110,28,0.12)" }
                  : { color: "#3f4a3c" }
              }
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "login" ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: lang === "ar" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: lang === "ar" ? -20 : 20 }}
              transition={{ duration: 0.2 }}
              onSubmit={loginForm.handleSubmit(onLogin)}
              className="space-y-4"
            >
              <div>
                <label className="label">{t("auth.email")}</label>
                <div className="input-wrap">
                  <span className="material-symbols-outlined">mail</span>
                  <input
                    {...loginForm.register("email")}
                    className={`input${loginForm.formState.errors.email ? " input-error" : ""}`}
                    placeholder="hello@parent.com"
                    type="email"
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="error-msg">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label" style={{ marginBottom: 0 }}>{t("auth.password")}</label>
                  <button type="button" onClick={() => setShowForgot(true)} className="text-xs font-bold" style={{ color: "#006e1c" }}>
                    {t("auth.forgot")}
                  </button>
                </div>
                <div className="input-wrap">
                  <span className="material-symbols-outlined">lock</span>
                  <input
                    {...loginForm.register("password")}
                    className={`input${loginForm.formState.errors.password ? " input-error" : ""}`}
                    placeholder="••••••••"
                    type="password"
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <p className="error-msg">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loginForm.formState.isSubmitting}
                className="kid-btn"
                style={{ marginTop: "8px" }}
              >
                {loginForm.formState.isSubmitting ? <Spinner size="sm" /> : t("auth.cta")}
              </button>



              <p className="text-center text-sm" style={{ color: "#3f4a3c" }}>
                {t("auth.noAccount")}{" "}
                <button type="button" onClick={() => setTab("register")} className="font-bold" style={{ color: "#006e1c" }}>
                  {t("auth.joinMagic")}
                </button>
              </p>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: lang === "ar" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: lang === "ar" ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={registerForm.handleSubmit(onRegister)}
              className="space-y-4"
            >
              <div>
                <label className="label">{t("auth.name")}</label>
                <div className="input-wrap">
                  <span className="material-symbols-outlined">person</span>
                  <input
                    {...registerForm.register("name")}
                    className={`input${registerForm.formState.errors.name ? " input-error" : ""}`}
                    placeholder={lang === "ar" ? "اسمك الكامل" : "Your full name"}
                  />
                </div>
                {registerForm.formState.errors.name && (
                  <p className="error-msg">{registerForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="label">{t("auth.email")}</label>
                <div className="input-wrap">
                  <span className="material-symbols-outlined">mail</span>
                  <input
                    {...registerForm.register("email")}
                    className={`input${registerForm.formState.errors.email ? " input-error" : ""}`}
                    placeholder="hello@parent.com"
                    type="email"
                  />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="error-msg">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="label">{t("auth.password")}</label>
                <div className="input-wrap">
                  <span className="material-symbols-outlined">lock</span>
                  <input
                    {...registerForm.register("password")}
                    className={`input${registerForm.formState.errors.password ? " input-error" : ""}`}
                    placeholder="••••••••"
                    type="password"
                  />
                </div>
                {registerForm.formState.errors.password && (
                  <p className="error-msg">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="label">{t("auth.confirmPassword")}</label>
                <div className="input-wrap">
                  <span className="material-symbols-outlined">lock_reset</span>
                  <input
                    {...registerForm.register("confirmPassword")}
                    className={`input${registerForm.formState.errors.confirmPassword ? " input-error" : ""}`}
                    placeholder="••••••••"
                    type="password"
                  />
                </div>
                {registerForm.formState.errors.confirmPassword && (
                  <p className="error-msg">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={registerForm.formState.isSubmitting}
                className="kid-btn"
                style={{ marginTop: "8px" }}
              >
                {registerForm.formState.isSubmitting ? <Spinner size="sm" /> : t("auth.createAccount")}
              </button>

              <p className="text-center text-sm" style={{ color: "#3f4a3c" }}>
                {t("auth.hasAccount")}{" "}
                <button type="button" onClick={() => setTab("login")} className="font-bold" style={{ color: "#006e1c" }}>
                  {t("auth.signIn")}
                </button>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer */}
      <div className="mt-6 text-center space-y-3">
        <div className="flex items-center justify-center gap-4 text-xs" style={{ color: "#6f7a6b" }}>
          {["Terms", "Privacy", "Help"].map((item) => (
            <button key={item} className="hover:underline">{item}</button>
          ))}
        </div>
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
          style={{ background: "rgba(76,175,80,0.1)", color: "#006e1c" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1" }}>verified_user</span>
          {t("auth.secure")}
        </div>

      </div>
    </div>
  );
}
