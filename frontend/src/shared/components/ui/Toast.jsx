import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "../../stores/uiStore";

const icons = {
  success: "✅",
  error: "❌",
  info: "ℹ️",
  warning: "⚠️",
};
const colors = {
  success: "border-primary-500 bg-primary-500/10",
  error: "border-red-500 bg-red-500/10",
  info: "border-parent-500 bg-parent-500/10",
  warning: "border-yellow-500 bg-yellow-500/10",
};

function ToastItem({ toast }) {
  const removeToast = useUIStore((s) => s.removeToast);

  useEffect(() => {
    const t = setTimeout(() => removeToast(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, removeToast]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm
                  min-w-[280px] max-w-sm shadow-card cursor-pointer ${colors[toast.type] || colors.info}`}
      onClick={() => removeToast(toast.id)}
    >
      <span className="text-xl">{icons[toast.type]}</span>
      <p className="text-sm text-slate-800 font-medium flex-1" style={{ paddingTop: "2px" }}>
        {typeof toast.message === 'string' ? toast.message : JSON.stringify(toast.message)}
      </p>
    </motion.div>
  );
}

export default function Toast() {
  const toasts = useUIStore((s) => s.toasts);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}

