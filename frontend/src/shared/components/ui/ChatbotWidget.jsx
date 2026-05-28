import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useT, useLang } from "@/shared/stores/langStore";
import { useChildStore } from "@/shared/stores/childStore";
import { faqDatabase, findMatchingFaq } from "@/shared/data/chatbotFaq";

export default function ChatbotWidget() {
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const { isChildLockActive } = useChildStore();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [currentCategory, setCurrentCategory] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const isRtl = lang === "ar";

  // Hide chatbot on child game activities, assessments, admin portals, or when Child Lock is active
  const shouldHideChatbot = 
    isChildLockActive ||
    location.pathname.includes("/activity/") || 
    location.pathname.includes("/assessment/") ||
    location.pathname.includes("/admin");

  // Categories list translation mappings
  const categories = [
    { id: "general", label: { en: "💡 General Info", ar: "💡 معلومات عامة" } },
    { id: "assessment", label: { en: "📝 Assessments", ar: "📝 التقييمات" } },
    { id: "activities", label: { en: "🎮 Games & Progress", ar: "🎮 الألعاب والتقدم" } },
    { id: "account", label: { en: "💳 Subscription & Plans", ar: "💳 الاشتراك والخطط" } },
    { id: "support", label: { en: "✉️ Support Ticket", ar: "✉️ تذكرة دعم" } }
  ];

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  // Reset chat and add greeting when opened
  const handleOpenToggle = () => {
    if (!isOpen && messages.length === 0) {
      setMessages([
        {
          id: "greet",
          sender: "bot",
          text: t("chatbot.greeting")
        }
      ]);
      setCurrentCategory(null);
    }
    setIsOpen(!isOpen);
  };

  const handleCategorySelect = (catId) => {
    if (catId === "support") {
      setMessages(prev => [
        ...prev,
        { id: `user_${Date.now()}`, sender: "user", text: isRtl ? "تذكرة دعم" : "Support Ticket" },
        {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: isRtl 
            ? "يمكنك الانتقال إلى صفحة الدعم لإنشاء تذكرة دعم جديدة لمشكلتك الفنية." 
            : "You can navigate to the Support page to submit a new ticket for your issue.",
          action: {
            text: t("chatbot.submitTicket"),
            onClick: () => {
              navigate("/support");
              setIsOpen(false);
            }
          }
        }
      ]);
      return;
    }

    const categoryLabel = categories.find(c => c.id === catId)?.label[lang];
    const categoryFaqs = faqDatabase.filter(f => f.category === catId);

    setMessages(prev => [
      ...prev,
      { id: `user_${Date.now()}`, sender: "user", text: categoryLabel },
      {
        id: `bot_${Date.now()}`,
        sender: "bot",
        text: isRtl ? "إليك بعض الأسئلة الشائعة حول هذا القسم:" : "Here are some common questions about this section:",
        options: categoryFaqs.map(faq => ({
          text: faq.question[lang],
          onClick: () => handleQuestionSelect(faq)
        }))
      }
    ]);
    setCurrentCategory(catId);
  };

  const handleQuestionSelect = (faq) => {
    setMessages(prev => [
      ...prev,
      { id: `user_${Date.now()}`, sender: "user", text: faq.question[lang] },
      {
        id: `bot_${Date.now()}`,
        sender: "bot",
        text: faq.answer[lang],
        showBackToMenu: true
      }
    ]);
  };

  const handleBackToMenu = () => {
    setMessages(prev => [
      ...prev,
      { id: `user_${Date.now()}`, sender: "user", text: t("chatbot.backToMenu") },
      {
        id: `bot_${Date.now()}`,
        sender: "bot",
        text: isRtl ? "اختر أحد الخيارات التالية لمتابعة المساعدة:" : "Select an option below to continue getting help:"
      }
    ]);
    setCurrentCategory(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setInputValue("");

    setMessages(prev => [...prev, { id: `user_${Date.now()}`, sender: "user", text: userText }]);

    // 1. Try local FAQ match first (instant)
    const match = findMatchingFaq(userText, lang);
    if (match) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            sender: "bot",
            text: match.answer[lang],
            showBackToMenu: true
          }
        ]);
      }, 400);
      return;
    }

    // 2. No local match — call AI backend
    setIsTyping(true);
    try {
      const res = await fetch("http://localhost:8000/api/chatbot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, lang })
      });
      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: data.reply,
          showBackToMenu: true
        }
      ]);
    } catch (err) {
      console.error("Chatbot AI error:", err);
      setMessages(prev => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: t("chatbot.noMatch"),
          action: {
            text: t("chatbot.submitTicket"),
            onClick: () => {
              navigate("/support");
              setIsOpen(false);
            }
          },
          showBackToMenu: true
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (shouldHideChatbot) return null;

  return (
    <div 
      className={`fixed bottom-6 ${isRtl ? "left-6" : "right-6"} z-50`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-[360px] max-w-[calc(100vw-2rem)] h-[490px] rounded-[2rem] bg-white shadow-2xl border border-gray-100 flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#006e1c] to-[#4caf50] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">
                  🤖
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide leading-tight">Brighty</h3>
                  <p className="text-[10px] text-green-100 font-medium">
                    {isRtl ? "مساعدك الرقمي متصل" : "Your helper is online"}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleOpenToggle}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-white"
                aria-label={t("chatbot.closeChat")}
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scrollbar-thin">
              {messages.map((msg, index) => (
                <div key={msg.id || index} className="space-y-3">
                  {/* Message Bubble */}
                  <div className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                        msg.sender === "user"
                          ? "bg-[#006e1c] text-white rounded-br-none rtl:rounded-bl-none rtl:rounded-br-2xl"
                          : "bg-white text-gray-800 border border-gray-100 rounded-bl-none rtl:rounded-br-none rtl:rounded-bl-2xl"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>

                  {/* Inline Action Button */}
                  {msg.action && (
                    <div className={`flex ${isRtl ? "justify-start" : "justify-end"} px-2`}>
                      <button
                        onClick={msg.action.onClick}
                        className="bg-[#e9f0e1] hover:bg-[#d8e7cb] text-[#006e1c] font-black text-xs px-4 py-2 rounded-full transition-all border border-[#c8dfc0]/50"
                      >
                        {msg.action.text}
                      </button>
                    </div>
                  )}

                  {/* Custom list options for categories */}
                  {msg.options && (
                    <div className="flex flex-col gap-2 p-1 pl-4 rtl:pl-0 rtl:pr-4">
                      {msg.options.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          onClick={opt.onClick}
                          className="bg-white hover:bg-green-50/50 text-[#006e1c] hover:border-[#006e1c]/30 text-xs font-bold text-left rtl:text-right px-4.5 py-2.5 rounded-2xl border border-gray-200 transition-all shadow-sm"
                        >
                          {opt.text}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Show Back to Menu Helper */}
                  {msg.showBackToMenu && (
                    <div className="flex gap-2 pl-4 rtl:pl-0 rtl:pr-4 pt-1">
                      <button
                        onClick={handleBackToMenu}
                        className="text-xs text-gray-500 font-bold hover:text-[#006e1c] flex items-center gap-1 transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                        {t("chatbot.backToMenu")}
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Show main menu category options if we are at root state */}
              {messages.length > 0 && !currentCategory && (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider pl-2 rtl:pl-0 rtl:pr-2">
                    {t("chatbot.suggestedQuestions")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className="bg-white hover:bg-green-50 text-gray-700 hover:text-[#006e1c] hover:border-[#c8dfc0] text-xs font-bold px-3 py-2 rounded-full border border-gray-200 transition-all shadow-sm"
                      >
                        {cat.label[lang]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none rtl:rounded-br-none rtl:rounded-bl-2xl px-4 py-3 shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4caf50] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-[#4caf50] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-[#4caf50] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form 
              onSubmit={handleSendMessage}
              className="border-t border-gray-100 p-3 bg-white flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t("chatbot.placeholder")}
                className="flex-1 bg-gray-50 rounded-full px-4 py-2 text-sm border border-gray-200 focus:outline-none focus:border-[#006e1c]/50 focus:bg-white transition-all text-gray-800"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-9 h-9 rounded-full bg-[#006e1c] text-white flex items-center justify-center hover:bg-[#005215] active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <span className="material-symbols-outlined text-sm font-bold transform rtl:rotate-180">send</span>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={handleOpenToggle}
        className={`w-14 h-14 rounded-full bg-gradient-to-tr from-[#006e1c] to-[#4caf50] text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all ${
          isOpen ? "rotate-90" : ""
        }`}
        aria-label="Toggle BrightBook chat assistant"
      >
        <span className="material-symbols-outlined text-[28px] font-bold">
          {isOpen ? "close" : "forum"}
        </span>
      </button>
    </div>
  );
}
