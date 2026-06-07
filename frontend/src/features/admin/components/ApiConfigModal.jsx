import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/shared/services/api";
import { toast } from "@/shared/stores/uiStore";

export default function ApiConfigModal({ isOpen, onClose, onSaved }) {
  const [anthropicKey, setAnthropicKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!anthropicKey && !geminiKey) {
      toast.error("Please provide at least one API key");
      return;
    }
    
    setLoading(true);
    try {
      await api.post("/api/admin/config/api-keys", {
        anthropic_api_key: anthropicKey || null,
        gemini_api_key: geminiKey || null
      });
      toast.success("API keys updated successfully!");
      setAnthropicKey("");
      setGeminiKey("");
      onSaved(); // trigger reload of status
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update API keys");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#f5fced]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#006e1c] text-2xl">vpn_key</span>
              <h2 className="text-xl font-bold text-[#171d14]">Configure AI APIs</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            <p className="text-sm text-[#6f7a6b] leading-relaxed">
              Updating these keys will overwrite the values in the server's configuration and instantly re-initialize the AI client. Provide only the keys you want to update.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#171d14] mb-1">
                  Anthropic API Key (Claude)
                </label>
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4caf50] focus:ring-2 focus:ring-[#4caf50]/20 transition-all text-sm font-mono"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1 ml-1">Preferred model: claude-haiku-4-5</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#171d14] mb-1">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4caf50] focus:ring-2 focus:ring-[#4caf50]/20 transition-all text-sm font-mono"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1 ml-1">Preferred model: gemini-2.0-flash</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || (!anthropicKey && !geminiKey)}
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#006e1c] hover:bg-[#005c17] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">save</span>
                  Save & Test
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
