import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/shared/stores/langStore";

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText, confirmColor = "#ba1a1a", cancelText }) {
  const t = useT();
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
          style={{ background: "rgba(23, 29, 20, 0.4)", backdropFilter: "blur(4px)" }}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-sm rounded-[24px] p-6 shadow-xl"
          style={{ background: "#ffffff", border: "1px solid #e3ebdc" }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2" style={{ color: "#171d14" }}>
              {title}
            </h2>
            <p className="text-sm" style={{ color: "#3f4a3c", lineHeight: 1.5 }}>
              {message}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors"
              style={{ background: "#f1f5f9", color: "#475569" }}
            >
              {cancelText || t("common.cancel")}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-colors"
              style={{ background: confirmColor }}
            >
              {confirmText || t("common.confirm")}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
