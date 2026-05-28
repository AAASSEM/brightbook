import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/shared/stores/langStore";

export default function ParentGate({ isOpen, onClose, onSuccess }) {
  const lang = useLang();
  const isRtl = lang === "ar";

  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState(false);

  // Generate a random math question on open
  useEffect(() => {
    if (isOpen) {
      generateQuestion();
      setInputValue("");
      setError(false);
    }
  }, [isOpen]);

  const generateQuestion = () => {
    // Single digit numbers but slightly challenging (e.g., 3-9)
    const n1 = Math.floor(Math.random() * 7) + 3;
    const n2 = Math.floor(Math.random() * 7) + 3;
    setNum1(n1);
    setNum2(n2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const correctAnswer = num1 * num2;
    if (parseInt(inputValue.trim(), 10) === correctAnswer) {
      onSuccess();
      onClose();
    } else {
      setError(true);
      setInputValue("");
      generateQuestion(); // Generate a new one
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl border-4 border-[#e3ebdc] z-10 text-center"
          style={{ fontFamily: "Lexend, sans-serif" }}
        >
          {/* Lock Icon */}
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4 border-2 border-orange-200">
            <span className="material-symbols-outlined text-orange-600" style={{ fontSize: "32px" }}>
              security
            </span>
          </div>

          <h3 className="text-xl font-extrabold mb-1" style={{ color: "#171d14" }}>
            {isRtl ? "منطقة أولياء الأمور فقط" : "Parents Only Area"}
          </h3>
          <p className="text-sm mb-6 font-semibold" style={{ color: "#6f7a6b" }}>
            {isRtl
              ? "يرجى حل هذه المسألة الحسابية لتأكيد هويتك كولي أمر:"
              : "Please solve this math question to verify you are a parent:"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Equation Display */}
            <div className="bg-[#fcfdfa] border-2 border-[#e3ebdc] rounded-2xl py-4 font-black text-3xl text-[#006e1c] flex items-center justify-center gap-3">
              <span>{num1}</span>
              <span className="text-orange-500 font-bold">×</span>
              <span>{num2}</span>
              <span className="text-[#6f7a6b]">=</span>
              <span className="text-gray-300">?</span>
            </div>

            {/* Answer Input */}
            <div>
              <input
                type="number"
                pattern="[0-9]*"
                inputMode="numeric"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError(false);
                }}
                placeholder={isRtl ? "الرمز..." : "Answer..."}
                autoFocus
                className="w-full text-center font-bold text-xl py-3 rounded-2xl border-2 border-gray-200 focus:border-[#4caf50] focus:ring-0 outline-none transition-colors"
              />
              {error && (
                <p className="text-xs text-red-500 font-bold mt-1.5 animate-pulse">
                  {isRtl ? "إجابة غير صحيحة، حاول مجدداً!" : "Incorrect answer, try again!"}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-full font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-full font-bold text-sm text-white bg-[#006e1c] hover:bg-[#005215] transition-colors shadow-md hover:shadow-lg"
              >
                {isRtl ? "تأكيد" : "Submit"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
