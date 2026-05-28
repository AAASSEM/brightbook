import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/shared/stores/authStore";
import { useT } from "@/shared/stores/langStore";
import { motion } from "framer-motion";

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const t = useT();

  const tabs = [
    { to: "/admin", icon: "dashboard", labelKey: "nav.dashboard", end: true },
    { to: "/admin/content", icon: "group", labelKey: "nav.users" },
    { to: "/admin/content", icon: "library_books", labelKey: "nav.content" },
    { to: "/admin/tickets", icon: "support_agent", labelKey: "nav.support" },
  ];

  const adminTabs = [
    { to: "/admin", icon: "dashboard", labelKey: "nav.dashboard", end: true },
    { to: "/admin/content", icon: "dataset", labelKey: "nav.users" },
    { to: "/admin/tickets", icon: "support_agent", labelKey: "nav.support" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="page soft-bg">
      {/* Floating Glassmorphism Navbar */}
      <div className="fixed top-4 left-0 right-0 z-50 px-6 pointer-events-none">
        <div 
          className="mx-auto flex items-center justify-between px-2 py-2 pointer-events-auto"
          style={{
            maxWidth: "1200px",
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            borderRadius: "100px",
            boxShadow: "0 12px 32px rgba(0, 110, 28, 0.12)",
          }}
        >
          {/* Left: Logo */}
          <NavLink 
            to="/" 
            className="flex items-center gap-2 pl-3 pr-2 hover:opacity-80 transition-opacity no-underline"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#006e1c", color: "#ffffff" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1" }}>shield_person</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-wide" style={{ color: "#006e1c", fontFamily: "Lexend, sans-serif" }}>
                BrightBook
              </span>
              <span className="badge badge-green hidden sm:inline-flex" style={{ fontSize: "10px", padding: "2px 8px" }}>
                Admin
              </span>
            </div>
          </NavLink>

          {/* Center: Tabs */}
          <div className="flex items-center gap-1">
            {adminTabs.map((tab) => (
              <NavLink
                key={tab.to + tab.labelKey}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${isActive ? "bg-green-50 text-[#006e1c]" : "text-[#3f4a3c] hover:bg-black/5 hover:text-[#171d14]"}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>{tab.icon}</span>
                <span className="text-sm font-semibold">{t(tab.labelKey)}</span>
              </NavLink>
            ))}
          </div>

          {/* Right: User / Actions */}
          <div className="flex items-center gap-2 pr-2">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.04)" }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: "#006e1c", color: "#ffffff" }}>
                  {user?.name?.[0]?.toUpperCase() || "A"}
                </div>
                <span className="text-sm font-semibold text-[#171d14] hidden sm:inline">{user?.name || "Admin"}</span>
             </div>
             <button onClick={handleLogout} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors text-[#3f4a3c] hover:text-red-600">
               <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>logout</span>
             </button>
          </div>
        </div>
      </div>

      <motion.main
        key="admin-main"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="page-content-wide"
        style={{ paddingTop: "100px" }}
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
