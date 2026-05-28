import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/shared/services/api";
import { useChildStore } from "@/shared/stores/childStore";
import { toast } from "@/shared/stores/uiStore";
import { useT } from "@/shared/stores/langStore";
import Spinner from "@/shared/components/ui/Spinner";

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [child, setChild] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const navigate = useNavigate();
  const { setChildren, setSelectedChild } = useChildStore();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm();
  const t = useT();

  const STEPS = [
    t("onboarding.createChild"), 
    t("onboarding.choosePlan"), 
    "Payment", // New Step
    t("onboarding.done")
  ];

  const onCreateChild = async (data) => {
    try {
      const res = await api.post("/api/children/", data);
      setChild(res.data);
      const allChildren = await api.get("/api/children/");
      setChildren(allChildren.data);
      setSelectedChild(res.data);
      toast.success(`${res.data.name}'s profile created!`);

      try {
        const subRes = await api.get("/api/subscription/status");
        if (subRes.data && subRes.data.subscription_status === "active") {
          setStep(3); // Skip to Done
          return;
        }
      } catch (e) {}

      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create child profile");
    }
  };

  const onSelectPlan = (planId) => {
    setSelectedPlan(plans.find(p => p.id === planId));
    setStep(2); // Go to Payment
  };

  const onConfirmPayment = async () => {
    setPlanLoading(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      await api.post("/api/subscription/subscribe", { plan_type: selectedPlan.id });
      toast.success("Payment Successful!");
      setStep(3); // Go to Done
    } catch {
      toast.error("Payment failed. Please try again.");
    } finally {
      setPlanLoading(false);
    }
  };

  const plans = [
    { id: "basic", name: "Basic", price: "$9.99/mo", features: ["1 child", "All activities", "Progress tracking"], color: "#becab9", bg: "#ffffff" },
    { id: "family", name: "Family", price: "$14.99/mo", features: ["Up to 4 children", "AI tips", "Priority support"], popular: true, color: "#4caf50", bg: "#f5fced" },
    { id: "annual", name: "Annual", price: "$99.99/yr", features: ["All features", "Save 44%", "PDF reports"], color: "#006e1c", bg: "#e9f0e1" },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="mb-8 max-w-md mx-auto">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-3">
            {STEPS.map((s, i) => (
              <span key={i} style={{ color: i <= step ? "#006e1c" : "#becab9" }}>{s}</span>
            ))}
          </div>
          <div className="progress-track">
            <motion.div
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              className="progress-fill"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Create Child */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="card">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: "#ffdf9e" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "#785900", fontVariationSettings: "'FILL' 1" }}>child_care</span>
                </div>
                <h2 className="text-2xl font-bold" style={{ color: "#171d14" }}>{t("onboarding.title")}</h2>
                <p className="text-sm mt-2" style={{ color: "#3f4a3c" }}>{t("onboarding.subtitle")}</p>
              </div>

              <form onSubmit={handleSubmit(onCreateChild)} className="space-y-4">
                <div>
                  <label className="label">{t("onboarding.childName")}</label>
                  <div className="input-wrap">
                    <span className="material-symbols-outlined">face</span>
                    <input {...register("name", { required: "Name is required" })} className="input" placeholder="e.g., Sarah" />
                  </div>
                  {errors.name && <p className="text-xs mt-1" style={{ color: "#ba1a1a", fontWeight: "bold" }}>{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t("onboarding.birthday") || "Birthday"}</label>
                    <div className="input-wrap">
                      <span className="material-symbols-outlined">calendar_today</span>
                      <input {...register("date_of_birth", { required: true })} type="date" className="input" />
                    </div>
                  </div>
                  <div>
                    <label className="label">{t("onboarding.nativeLanguage")}</label>
                    <div className="input-wrap">
                      <span className="material-symbols-outlined">language</span>
                      <select {...register("native_language")} className="input" style={{ appearance: "none", cursor: "pointer" }}>
                        <option value="English">English</option>
                        <option value="Arabic">Arabic</option>
                        <option value="French">French</option>
                        <option value="Spanish">Spanish</option>
                      </select>
                      <span className="material-symbols-outlined" style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>expand_more</span>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full mt-4" style={{ padding: "16px", fontSize: "16px" }} disabled={isSubmitting}>
                  {isSubmitting ? <Spinner size="sm" /> : (
                    <>
                      {t("common.next")}
                      <span className="material-symbols-outlined ml-2">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* Step 1: Plans */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "#171d14" }}>{t("plans.title")}</h2>
                <p className="text-sm mt-2" style={{ color: "#3f4a3c" }}>{t("plans.subtitle")}</p>
              </div>

              <div className="space-y-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="card cursor-pointer transition-all relative overflow-hidden"
                    onClick={() => onSelectPlan(plan.id)}
                    style={{
                      background: plan.bg,
                      border: `2px solid ${plan.color}`,
                      transform: plan.popular ? "scale(1.02)" : "scale(1)",
                      boxShadow: plan.popular ? "0 8px 24px rgba(76,175,80,0.15)" : "none",
                      padding: "24px"
                    }}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ background: "#4caf50", color: "#ffffff", borderBottomLeftRadius: "16px" }}>
                        Most Popular
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-xl" style={{ color: "#171d14" }}>{plan.name}</h3>
                      <span className="font-black text-xl" style={{ color: "#171d14", fontFamily: "Lexend, sans-serif" }}>{plan.price}</span>
                    </div>
                    <ul className="text-sm space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2" style={{ color: "#3f4a3c", fontWeight: 500 }}>
                          <span className="material-symbols-outlined" style={{ color: plan.popular ? "#006e1c" : "#4caf50", fontSize: "16px" }}>check_circle</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Payment (Demo) */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="card">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep(1)} className="material-symbols-outlined" style={{ color: "#6f7a6b" }}>arrow_back</button>
                <h2 className="text-xl font-bold" style={{ color: "#171d14" }}>Payment Details</h2>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-2xl mb-6 flex justify-between items-center" style={{ background: "#f5fced", border: "1.5px solid #e3ebdc" }}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-green-700">Selected Plan</p>
                  <p className="font-bold">{selectedPlan?.name} Subscription</p>
                </div>
                <p className="text-xl font-black">{selectedPlan?.price}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Card Number</label>
                  <div className="input-wrap">
                    <span className="material-symbols-outlined">credit_card</span>
                    <input className="input" placeholder="0000 0000 0000 0000" maxLength="19" id="card-num" />
                    <div className="absolute right-4 flex gap-1 opacity-50">
                      <img src="https://img.icons8.com/color/48/visa.png" alt="Visa" className="h-4" />
                      <img src="https://img.icons8.com/color/48/mastercard.png" alt="MC" className="h-4" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Expiry Date</label>
                    <div className="input-wrap text-sm">
                      <input className="input" placeholder="MM/YY" maxLength="5" id="card-exp" />
                    </div>
                  </div>
                  <div>
                    <label className="label">CVV</label>
                    <div className="input-wrap">
                      <span className="material-symbols-outlined">lock</span>
                      <input className="input" placeholder="123" maxLength="3" id="card-cvv" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">Cardholder Name</label>
                  <input className="input" placeholder="Full Name" id="card-name" />
                </div>

                <button 
                  onClick={onConfirmPayment}
                  disabled={planLoading}
                  className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2" 
                  style={{ padding: "16px", fontSize: "16px" }}
                >
                  {planLoading ? <Spinner size="sm" /> : (
                    <>
                      <span className="material-symbols-outlined">verified_user</span>
                      Activate Plan
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-tighter opacity-40 mt-2">
                  <span className="material-symbols-outlined text-xs">encrypted</span>
                  Secured by 256-bit SSL Encryption
                </div>

                <button 
                  onClick={() => {
                    document.getElementById("card-num").value = "4242 4242 4242 4242";
                    document.getElementById("card-exp").value = "12/28";
                    document.getElementById("card-cvv").value = "123";
                    document.getElementById("card-name").value = "Test User";
                  }}
                  className="w-full text-xs font-bold py-2 rounded-xl mt-4 opacity-60 hover:opacity-100 transition-opacity"
                  style={{ border: "1px dashed #becab9", color: "#6f7a6b" }}
                >
                  Use Demo Card
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card text-center font-kid" style={{ fontFamily: "Lexend, sans-serif", padding: "48px 32px" }}>
              <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6" style={{ background: "#ffdf9e", boxShadow: "0 8px 24px rgba(255,143,0,0.3)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "56px", color: "#785900", fontVariationSettings: "'FILL' 1" }}>
                  celebration
                </span>
              </div>
              <h2 className="text-3xl font-black mb-3" style={{ color: "#171d14" }}>All set!</h2>
              <p className="text-lg mb-8" style={{ color: "#3f4a3c" }}>
                The AI will now assess {child?.name}'s literacy level and create a personalized learning path.
              </p>
              <div className="space-y-4">
                <button className="kid-btn" onClick={() => navigate(`/learn/assessment/${child?.Child_ID}`)}>
                  Start Assessment
                  <span className="material-symbols-outlined ml-2 align-middle">edit_document</span>
                </button>
                <button className="btn btn-secondary w-full" style={{ padding: "16px", fontSize: "16px" }} onClick={() => navigate("/dashboard")}>
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
