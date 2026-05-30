import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { motion } from "framer-motion";
import api from "@/shared/services/api";
import { useAuthStore } from "@/shared/stores/authStore";
import { toast } from "@/shared/stores/uiStore";
import Spinner from "@/shared/components/ui/Spinner";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password required"),
});

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const res = await api.post("/api/auth/admin/login", data);
      login(
        { name: res.data.name, email: data.email, role: "admin", id: res.data.user_id },
        res.data.access_token,
        res.data.refresh_token
      );
      toast.success("Welcome, Admin!");
      navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div
      className="min-h-screen soft-bg flex flex-col items-center justify-center p-6"
      style={{ background: "#f5fced" }}
    >
      {/* Decorative leaf */}
      <div style={{ position: "fixed", bottom: 0, right: 0, opacity: 0.06, pointerEvents: "none" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "320px", color: "#006e1c", fontVariationSettings: "'FILL' 1" }}>
          eco
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "#ffffff", boxShadow: "0 8px 24px rgba(0,110,28,0.12)" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "32px", color: "#006e1c", fontVariationSettings: "'FILL' 1" }}
            >
              menu_book
            </span>
          </div>
          <h1 className="text-2xl font-black" style={{ color: "#171d14", fontFamily: "Lexend, sans-serif" }}>
            BrightBook
          </h1>
          <p
            className="text-xs font-bold tracking-widest uppercase mt-1"
            style={{ color: "#3f4a3c", fontFamily: "Inter, sans-serif" }}
          >
            Administrator Portal
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "24px",
            padding: "28px",
            boxShadow: "0 16px 48px rgba(0,110,28,0.10)",
          }}
        >
          <h2 className="text-xl font-bold mb-1" style={{ color: "#171d14" }}>Secure Sign In</h2>
          <p className="text-sm mb-6" style={{ color: "#3f4a3c" }}>Please enter your administrative credentials</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="input-wrap">
                <span className="material-symbols-outlined">alternate_email</span>
                <input
                  {...register("email")}
                  className={`input${errors.email ? " input-error" : ""}`}
                  placeholder="name@brightbook.edu"
                  type="email"
                />
              </div>
              {errors.email && <p className="error-msg">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label" style={{ marginBottom: 0 }}>Password</label>
              </div>
              <div className="input-wrap">
                <span className="material-symbols-outlined">lock</span>
                <input
                  {...register("password")}
                  className={`input${errors.password ? " input-error" : ""}`}
                  placeholder="••••••••••••"
                  type="password"
                />
              </div>
              {errors.password && <p className="error-msg">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full"
              style={{ width: "100%", marginTop: "8px", fontSize: "15px", padding: "14px" }}
            >
              {isSubmitting ? <Spinner size="sm" /> : (
                <>
                  Authenticate Session
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>login</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security badges */}
        <div className="mt-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-4 text-xs" style={{ color: "#6f7a6b" }}>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1", color: "#006e1c" }}>verified_user</span>
              256-bit SSL
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1", color: "#006e1c" }}>security</span>
              BrightBook Shield Active
            </span>
          </div>
          <p className="text-xs" style={{ color: "#6f7a6b" }}>
            By logging in, you agree to the BrightBook Data Protection Agreement.
          </p>
          <Link to="/login" className="text-xs" style={{ color: "#006e1c" }}>
            ← Back to parent login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
