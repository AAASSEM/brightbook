import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/shared/stores/authStore";
import { useChildStore } from "@/shared/stores/childStore";
import { useT, useLang } from "@/shared/stores/langStore";
import { motion, AnimatePresence } from "framer-motion";
import ParentGate from "@/shared/components/ui/ParentGate";

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const { selectedChild, isChildLockActive, setChildLock } = useChildStore();
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const [isGateOpen, setIsGateOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isRtl = lang === "ar";

  const tabs = [
    { to: "/dashboard", icon: "dashboard", labelKey: "nav.dashboard" },
    { to: "/learn", icon: "school", labelKey: "nav.home" },
    { to: "/support", icon: "headset_mic", labelKey: "nav.support" },
  ];

  // Route-guard: If lock is active, restrict navigation and force them back to the learning area
  useEffect(() => {
    if (isChildLockActive) {
      const allowedPaths = ["/learn", "/activity", "/assessment"];
      const isAllowed = allowedPaths.some(path => location.pathname.includes(path));
      if (!isAllowed) {
        navigate("/learn", { replace: true });
      }
    }
  }, [isChildLockActive, location.pathname, navigate]);
  // Handle lock/unlock actions
  const handleLockClick = () => {
    if (isChildLockActive) {
      // Open verification modal to unlock
      setIsGateOpen(true);
    } else {
      // Lock directly
      setChildLock(true);
      
      // If we are not already in the child learning zone, redirect to /learn
      if (!location.pathname.startsWith("/learn")) {
        navigate("/learn");
      }
    }
  };

  // Only display Home (Child Dashboard) when locked
  const activeTabs = isChildLockActive
    ? tabs.filter(tab => tab.to === "/learn")
    : tabs;

  return (
    <div className="page soft-bg">
      {/* Floating Glassmorphism Navbar */}
      <div className="fixed top-4 left-0 right-0 z-50 px-4 md:px-6 pointer-events-none">
        <div 
          className="mx-auto flex flex-col pointer-events-auto overflow-hidden transition-all duration-300"
          style={{
            maxWidth: "1200px",
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            borderRadius: isMobileMenuOpen ? "24px" : "100px",
            boxShadow: "0 12px 32px rgba(0, 110, 28, 0.12)",
          }}
        >
          {/* Top Row */}
          <div className="flex items-center justify-between px-2 py-2">
            {/* Left: Logo */}
            <NavLink 
              to={isChildLockActive ? "/learn" : "/"} 
              className="flex items-center gap-2 pl-3 pr-2 hover:opacity-80 transition-opacity no-underline"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "#4caf50", color: "#ffffff" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>menu_book</span>
              </div>
              <span className="text-base font-black tracking-wide" style={{ color: "#006e1c", fontFamily: "Lexend, sans-serif" }}>
                BrightBook
              </span>
            </NavLink>

            {/* Center: Desktop Tabs */}
            <div className="hidden md:flex items-center gap-1">
              {activeTabs.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${isActive ? "bg-green-50 text-[#006e1c]" : "text-[#3f4a3c] hover:bg-black/5 hover:text-[#171d14]"}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>{tab.icon}</span>
                  <span className="text-sm font-semibold">{t(tab.labelKey)}</span>
                </NavLink>
              ))}
            </div>

            {/* Right: Desktop Actions & Mobile Hamburger */}
            <div className="flex items-center gap-2 pr-2">
               {/* Lock Button (Always visible if active or in child zone, even on mobile) */}
               {(isChildLockActive || location.pathname.startsWith("/learn")) && (
                 <button
                   onClick={handleLockClick}
                   className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs border transition-all pointer-events-auto ${
                     isChildLockActive
                       ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                       : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                   }`}
                 >
                   <span className="material-symbols-outlined" style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1" }}>
                     {isChildLockActive ? "lock" : "lock_open"}
                   </span>
                   <span className="hidden sm:inline">
                     {isChildLockActive 
                       ? (isRtl ? "إلغاء القفل" : "Unlock") 
                       : (isRtl ? "قفل الطفل" : "Child Lock")}
                   </span>
                 </button>
               )}

               {/* Desktop User Actions */}
               {!isChildLockActive && (
                 <div className="hidden md:flex items-center gap-2">
                   <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.04)" }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: "#4caf50", color: "#ffffff" }}>
                        {user?.name?.[0]?.toUpperCase() || "P"}
                      </div>
                      <span className="text-sm font-semibold text-[#171d14]">{user?.name || "Parent"}</span>
                   </div>
                   <NavLink to="/settings" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors text-[#3f4a3c] hover:text-[#171d14]">
                     <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>settings</span>
                   </NavLink>
                   <button onClick={() => { logout(); navigate("/login"); }} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors text-[#3f4a3c] hover:text-red-600">
                     <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>logout</span>
                   </button>
                 </div>
               )}

               {/* Mobile Hamburger Button */}
               {!isChildLockActive && (
                 <button 
                   className="md:hidden w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 text-gray-700 hover:bg-gray-100"
                   onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                 >
                   <span className="material-symbols-outlined">{isMobileMenuOpen ? "close" : "menu"}</span>
                 </button>
               )}
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && !isChildLockActive && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden border-t border-gray-100"
              >
                <div className="flex flex-col p-4 gap-2">
                  {/* Mobile Profile Card */}
                  <div className="flex items-center gap-3 p-3 mb-2 rounded-xl bg-green-50/50 border border-green-100">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-[#4caf50] text-white">
                      {user?.name?.[0]?.toUpperCase() || "P"}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#171d14]">{user?.name || "Parent"}</p>
                      <p className="text-xs text-[#6f7a6b]">{user?.email || "parent@brightbook.com"}</p>
                    </div>
                  </div>

                  {/* Mobile Navigation */}
                  {activeTabs.map((tab) => (
                    <NavLink
                      key={tab.to}
                      to={tab.to}
                      end={tab.end}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${isActive ? "bg-green-50 text-[#006e1c] font-bold" : "text-[#3f4a3c] hover:bg-black/5"}`}
                    >
                      <span className="material-symbols-outlined">{tab.icon}</span>
                      <span>{t(tab.labelKey)}</span>
                    </NavLink>
                  ))}
                  
                  <hr className="my-2 border-gray-100" />
                  
                  {/* Mobile Bottom Actions */}
                  <div className="flex gap-2">
                    <NavLink 
                      to="/settings" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 text-gray-700 font-bold hover:bg-gray-100"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>settings</span>
                      Settings
                    </NavLink>
                    <button 
                      onClick={() => { setIsMobileMenuOpen(false); logout(); navigate("/login"); }} 
                      className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>logout</span>
                      Logout
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Parent Gate Modal */}
      <ParentGate 
        isOpen={isGateOpen}
        onClose={() => setIsGateOpen(false)}
        onSuccess={() => setChildLock(false)}
      />

      {/* Page content */}
      <motion.main
        key="main"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="page-content"
        style={{ paddingTop: "100px" }}
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
