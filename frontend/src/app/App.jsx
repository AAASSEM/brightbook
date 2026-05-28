import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import Toast from "@/shared/components/ui/Toast";
import ChatbotWidget from "@/shared/components/ui/ChatbotWidget";
import ProtectedRoute from "@/shared/components/common/ProtectedRoute";
import { PageLoader } from "@/shared/components/ui/Spinner";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

// Lazy-loaded pages
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const AdminLoginPage = lazy(() => import("@/features/auth/pages/AdminLoginPage"));
const OnboardingPage = lazy(() => import("@/features/onboarding/pages/OnboardingPage"));
const ParentDashboardPage = lazy(() => import("@/features/parent/pages/ParentDashboardPage"));
const SettingsPage = lazy(() => import("@/features/parent/pages/SettingsPage"));
const SupportPage = lazy(() => import("@/features/support/pages/SupportPage"));
const PlansPage = lazy(() => import("@/features/subscription/pages/PlansPage"));
const ChildDashboardPage = lazy(() => import("@/features/learning/pages/ChildDashboardPage"));
const ActivityPage = lazy(() => import("@/features/learning/pages/ActivityPage"));
const AssessmentPage = lazy(() => import("@/features/assessment/pages/AssessmentPage"));
const AdminDashboardPage = lazy(() => import("@/features/admin/pages/AdminDashboardPage"));
const ContentUsersPage = lazy(() => import("@/features/admin/pages/ContentUsersPage"));
const SupportTicketsPage = lazy(() => import("@/features/admin/pages/SupportTicketsPage"));
const ResetPasswordPage = lazy(() => import("@/features/auth/pages/ResetPasswordPage"));

const LandingPage = lazy(() => import("@/features/public/pages/LandingPage"));

import { useEffect, useState } from "react";

function AdminShortcutHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + Shift + D
      if (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        sessionStorage.setItem("admin_unlocked", "true");
        navigate("/admin/login");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return null;
}

const AdminRouteGuard = ({ children }) => {
  const isUnlocked = sessionStorage.getItem("admin_unlocked") === "true";
  if (!isUnlocked) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <AdminShortcutHandler />
      <Toast />
      <ChatbotWidget />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route 
            path="/admin/login" 
            element={
              <AdminRouteGuard>
                <AdminLoginPage />
              </AdminRouteGuard>
            } 
          />

          {/* Unified Portal */}
          <Route element={<ProtectedRoute requiredRole="parent"><MainLayout /></ProtectedRoute>}>
            {/* Parent Pages */}
            <Route path="/dashboard" element={<ParentDashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* Child Pages */}
            <Route path="/learn" element={<ChildDashboardPage />} />
            <Route path="/learn/activity/:id" element={<ActivityPage />} />
            <Route path="/learn/assessment/:childId" element={<AssessmentPage />} />
          </Route>

          {/* Admin Panel */}
          <Route element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/content" element={<ContentUsersPage />} />
            <Route path="/admin/tickets" element={<SupportTicketsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

