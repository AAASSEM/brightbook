import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

export default function ProtectedRoute({ children, requiredRole }) {
  const { accessToken, role } = useAuthStore();
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // Redirect to correct home for their role
    const roleHome = { parent: "/dashboard", admin: "/admin", child: "/learn" };
    return <Navigate to={roleHome[role] || "/login"} replace />;
  }

  return children;
}

