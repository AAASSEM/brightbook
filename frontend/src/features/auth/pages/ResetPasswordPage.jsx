import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/shared/services/api";
import { toast } from "@/shared/stores/uiStore";
import Spinner from "@/shared/components/ui/Spinner";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error("Invalid reset link");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");

    setIsSubmitting(true);
    try {
      await api.post("/api/auth/reset-password", {
        token,
        new_password: newPassword
      });
      toast.success("Password reset successfully! You can now log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen soft-bg flex items-center justify-center p-4">
        <div className="card max-w-sm text-center">
          <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error</span>
          <h2 className="text-xl font-bold">Invalid Link</h2>
          <p className="text-sm text-gray-600 mt-2">This password reset link is invalid or has expired.</p>
          <button className="kid-btn mt-6" onClick={() => navigate("/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen soft-bg flex flex-col items-center justify-start pt-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-[28px] p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#eff6e7] flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[#006e1c]" style={{ fontSize: "32px" }}>lock_reset</span>
          </div>
          <h1 className="text-2xl font-bold text-[#171d14]">Create New Password</h1>
          <p className="text-sm text-[#3f4a3c] mt-2">Set a strong password for your family account.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="label">New Password</label>
            <div className="input-wrap">
              <span className="material-symbols-outlined">lock</span>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <div className="input-wrap">
              <span className="material-symbols-outlined">lock_reset</span>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="kid-btn"
            style={{ marginTop: "12px" }}
          >
            {isSubmitting ? <Spinner size="sm" /> : "Reset Password"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
