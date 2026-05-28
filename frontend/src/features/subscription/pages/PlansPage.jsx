import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/shared/services/api";
import { toast } from "@/shared/stores/uiStore";
import { useT } from "@/shared/stores/langStore";
import Spinner from "@/shared/components/ui/Spinner";

export default function PlansPage() {
  const [loading, setLoading] = useState(null);
  const navigate = useNavigate();
  const t = useT();

  const handleSubscribe = async (planId) => {
    setLoading(planId);
    try {
      await api.post("/api/subscription/subscribe", { plan_type: planId });
      toast.success("Subscription activated!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to activate subscription");
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      id: "basic", name: "Basic", price: 9.99, period: t("plans.monthly"), color: "#becab9", bg: "#ffffff",
      features: ["1 child profile", "All 5 activity types", "Progress tracking", "Email support"],
    },
    {
      id: "family", name: "Family", price: 14.99, period: t("plans.monthly"), color: "#4caf50", bg: "#f5fced",
      popular: true,
      features: ["Up to 4 children", "All 5 activity types", "Advanced charts", "AI recommendations", "Priority support"],
    },
    {
      id: "annual", name: "Annual", price: 99.99, period: t("plans.annual"), color: "#006e1c", bg: "#e9f0e1",
      features: ["Up to 4 children", "All features included", "PDF progress reports", "Save 44% vs monthly", "Dedicated support"],
      savings: "Save $79.89/yr",
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      <div className="text-center mb-8">
        <h1 className="section-title">{t("plans.title")}</h1>
        <p className="section-subtitle">{t("plans.subtitle")}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="card relative flex flex-col"
            style={{
              background: plan.bg,
              border: `2px solid ${plan.color}`,
              transform: plan.popular ? "scale(1.02)" : "scale(1)",
              boxShadow: plan.popular ? "0 16px 48px rgba(76,175,80,0.15)" : "0 8px 24px rgba(0,0,0,0.04)",
            }}
          >
            {plan.popular && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-full"
                style={{ background: "#006e1c", color: "#ffffff", whiteSpace: "nowrap" }}
              >
                {t("plans.mostPopular")}
              </span>
            )}
            {plan.savings && (
              <span
                className="absolute -top-3 right-4 px-2 py-1 text-xs font-bold uppercase rounded-full"
                style={{ background: "#ffdf9e", color: "#785900" }}
              >
                {plan.savings}
              </span>
            )}
            
            <div className="mb-6 pt-2">
              <h2 className="text-xl font-bold mb-1" style={{ color: "#171d14" }}>{plan.name}</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black" style={{ color: "#171d14", fontFamily: "Lexend, sans-serif" }}>
                  ${plan.price}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#3f4a3c" }}>/{plan.period}</span>
              </div>
            </div>

            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#6f7a6b" }}>
                {t("plans.features")}
              </p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm" style={{ color: "#171d14", fontWeight: 500 }}>
                    <span className="material-symbols-outlined" style={{ color: plan.popular ? "#006e1c" : "#4caf50", fontSize: "20px" }}>check_circle</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={!!loading}
              className={`btn w-full ${plan.popular ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "16px", fontSize: "16px", marginTop: "auto" }}
            >
              {loading === plan.id ? <Spinner size="sm" /> : `${t("plans.getStarted")} ${plan.name}`}
            </button>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-xs mt-8 max-w-md mx-auto" style={{ color: "#6f7a6b" }}>
        ⚠️ Payment gateway integration coming soon. Currently activates immediately for demo purposes.
      </p>
    </div>
  );
}
