import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import heroImg from "@/assets/landing_hero_bg.png";
import { useT, useLang, useSetLang } from "@/shared/stores/langStore";

export default function LandingPage() {
  const navigate = useNavigate();
  const t = useT();
  const lang = useLang();
  const setLang = useSetLang();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Monitor scroll for sticky navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: "psychology",
      title: t("landing.features.aiTitle"),
      desc: t("landing.features.aiDesc"),
      color: "#e8f5e9",
      iconColor: "#2e7d32",
      border: "#c8e6c9"
    },
    {
      icon: "auto_stories",
      title: t("landing.features.storiesTitle"),
      desc: t("landing.features.storiesDesc"),
      color: "#fff8e1",
      iconColor: "#f57f17",
      border: "#ffe082"
    },
    {
      icon: "trending_up",
      title: t("landing.features.trackingTitle"),
      desc: t("landing.features.trackingDesc"),
      color: "#e3f2fd",
      iconColor: "#1565c0",
      border: "#bbdefb"
    }
  ];

  const steps = [
    {
      num: "01",
      title: t("landing.step1Title"),
      desc: t("landing.step1Desc"),
      icon: "assessment",
      color: "#e8f5e9",
      textColor: "#2e7d32"
    },
    {
      num: "02",
      title: t("landing.step2Title"),
      desc: t("landing.step2Desc"),
      icon: "dashboard_customize",
      color: "#e3f2fd",
      textColor: "#1565c0"
    },
    {
      num: "03",
      title: t("landing.step3Title"),
      desc: t("landing.step3Desc"),
      icon: "sports_esports",
      color: "#fff8e1",
      textColor: "#f57f17"
    },
    {
      num: "04",
      title: t("landing.step4Title"),
      desc: t("landing.step4Desc"),
      icon: "insights",
      color: "#f3e5f5",
      textColor: "#6a1b9a"
    }
  ];

  const testimonials = [
    {
      quote: t("landing.t1Quote"),
      name: t("landing.t1Name"),
      role: t("landing.t1Role"),
      avatarText: "SM",
      avatarBg: "bg-emerald-50 text-emerald-700 border-emerald-100"
    },
    {
      quote: t("landing.t2Quote"),
      name: t("landing.t2Name"),
      role: t("landing.t2Role"),
      avatarText: "AK",
      avatarBg: "bg-blue-50 text-blue-700 border-blue-100"
    },
    {
      quote: t("landing.t3Quote"),
      name: t("landing.t3Name"),
      role: t("landing.t3Role"),
      avatarText: "PL",
      avatarBg: "bg-purple-50 text-purple-700 border-purple-100"
    }
  ];

  const faqs = [
    { q: t("landing.faq1Q"), a: t("landing.faq1A") },
    { q: t("landing.faq2Q"), a: t("landing.faq2A") },
    { q: t("landing.faq3Q"), a: t("landing.faq3A") },
    { q: t("landing.faq4Q"), a: t("landing.faq4A") },
    { q: t("landing.faq5Q"), a: t("landing.faq5A") },
    { q: t("landing.faq6Q"), a: t("landing.faq6A") }
  ];

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const isRtl = lang === "ar";

  return (
    <div 
      className="min-h-screen bg-[#fafcf8] font-kid text-[#171d14] selection:bg-[#c8dfc0] selection:text-[#006e1c] overflow-x-hidden" 
      style={{ fontFamily: "Lexend, sans-serif" }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* 1. STICKY NAVBAR */}
      <nav 
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "py-3 bg-white/80 backdrop-blur-lg shadow-sm border-b border-[#eff6e7]" 
            : "py-5 bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-11 h-11 bg-[#006e1c] rounded-2xl flex items-center justify-center shadow-lg shadow-green-900/10">
              <span className="material-symbols-outlined text-white text-2xl font-bold">menu_book</span>
            </div>
            <span className="text-2xl font-black tracking-tight text-[#171d14]">BrightBook</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all border border-[#becab9] hover:bg-[#eff6e7] bg-white text-[#006e1c]"
            >
              <span className="material-symbols-outlined text-base">language</span>
              <span className="hidden sm:inline">{lang === "en" ? "عربي" : "English"}</span>
              <span className="sm:hidden font-mono">{lang === "en" ? "AR" : "EN"}</span>
            </button>

            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 font-bold text-[#3f4a3c] hover:text-[#006e1c] transition-colors"
            >
              {t("landing.login")}
            </button>
            <button
              onClick={() => navigate("/login")}
              className="bg-[#006e1c] text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-green-700/20 hover:bg-[#005215] hover:scale-105 active:scale-95 transition-all"
            >
              {t("landing.joinNow")}
            </button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <header className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center min-h-[90vh]">
        {/* Decorative Background Gradients */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-green-200/40 rounded-full filter blur-3xl -z-10" />
        <div className="absolute bottom-10 right-0 w-96 h-96 bg-yellow-100/50 rounded-full filter blur-3xl -z-10" />

        <div className="lg:col-span-7 space-y-8 text-center lg:text-left rtl:lg:text-right">
          <div className="inline-flex items-center gap-2 px-4.5 py-2 bg-[#eff6e7] text-[#006e1c] rounded-full text-sm font-bold border border-[#c8dfc0]/50 shadow-sm animate-pulse">
            <span className="material-symbols-outlined text-sm font-bold">stars</span>
            <span>{t("landing.heroBadge")}</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#171d14] leading-[1.08] tracking-tight">
            {t("landing.heroTitle")}{" "}
            <span className="text-[#006e1c] relative inline-block">
              {t("landing.heroTitleHighlight")}
              <span className="absolute bottom-1.5 left-0 w-full h-3 bg-[#ffdf9e]/60 -z-10 rounded-full" />
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#3f4a3c] leading-relaxed max-w-xl mx-auto lg:mx-0">
            {t("landing.heroSub")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
            <button
              onClick={() => navigate("/login")}
              className="kid-btn text-xl py-4.5 px-10 shadow-xl shadow-green-700/20 hover:scale-105 active:scale-98 transition-all"
            >
              {t("landing.getStarted")}
            </button>
            
            <div className="flex items-center gap-3 justify-center">
              <div className="flex -space-x-2.5 rtl:space-x-reverse">
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-emerald-50 text-lg">👦</div>
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-amber-50 text-lg">👧</div>
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-blue-50 text-lg">👶</div>
              </div>
              <div className="text-left rtl:text-right">
                <p className="font-extrabold text-[#171d14] text-sm leading-none">{t("landing.happyKids")}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex text-[#ffb300]">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className="material-symbols-outlined text-[15px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-[#6f7a6b]">{t("landing.happyKidsLabel")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Image Container */}
        <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-[480px] aspect-square rounded-[3rem] p-4 bg-white shadow-2xl shadow-green-950/5 border-4 border-white relative overflow-hidden"
          >
            <img
              src={heroImg}
              alt="BrightBook magical world"
              className="w-full h-full object-cover rounded-[2.2rem] hover:scale-105 transition-transform duration-700"
            />
            {/* Floating Live Badge Removed */}
          </motion.div>
        </div>
      </header>

      {/* 3. SOCIAL PROOF STATS STRIP */}
      <section className="bg-white border-y border-[#eff6e7] py-10 shadow-inner">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-[#eff6e7] rtl:divide-x-reverse">
          <div>
            <p className="text-3xl sm:text-4xl font-black text-[#006e1c]">{t("landing.happyKids")}</p>
            <p className="text-sm font-bold text-[#6f7a6b] mt-1">{t("landing.happyKidsLabel")}</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-[#006e1c]">{t("landing.rating")}</p>
            <p className="text-sm font-bold text-[#6f7a6b] mt-1">{t("landing.ratingLabel")}</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-[#006e1c]">{t("landing.countries")}</p>
            <p className="text-sm font-bold text-[#6f7a6b] mt-1">{t("landing.countriesLabel")}</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-[#006e1c]">{t("landing.aiAccuracy")}</p>
            <p className="text-sm font-bold text-[#6f7a6b] mt-1">{t("landing.aiAccuracyLabel")}</p>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION (Built Different) */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-black text-[#171d14]">{t("landing.sectionTitle")}</h2>
            <p className="text-[#3f4a3c] max-w-2xl mx-auto text-lg leading-relaxed">
              {t("landing.sectionSub")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -8 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-[#006e1c]/10 transition-all border border-[#eff6e7]"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm border"
                  style={{ background: f.color, color: f.iconColor, borderColor: f.border }}
                >
                  <span className="material-symbols-outlined text-3xl font-bold">
                    {f.icon}
                  </span>
                </div>
                <h3 className="text-2xl font-black mb-3 text-[#171d14]">{f.title}</h3>
                <p className="text-[#3f4a3c] leading-relaxed text-base">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS (Journey Steps) */}
      <section className="py-24 px-6 bg-[#f5f9f0] border-y border-[#eff6e7] relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-black text-[#171d14]">{t("landing.howItWorksTitle")}</h2>
            <p className="text-[#3f4a3c] max-w-2xl mx-auto text-lg leading-relaxed">
              {t("landing.howItWorksSub")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((s, i) => (
              <div key={i} className="relative group">
                {/* Visual Connector Lines for Desktop */}
                {i < 3 && (
                  <div className={`hidden lg:block absolute top-12 left-[80%] w-2/5 h-0.5 border-t-2 border-dashed border-[#becab9] -z-10 group-hover:border-[#006e1c] transition-colors`} />
                )}

                <div className="bg-white p-8 rounded-[2.2rem] shadow-sm hover:shadow-lg transition-all border border-[#eff6e7] h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                        style={{ background: s.color, color: s.textColor }}
                      >
                        <span className="material-symbols-outlined text-2xl font-bold">{s.icon}</span>
                      </div>
                      <span className="text-3xl font-black text-[#becab9] group-hover:text-[#006e1c] transition-colors font-mono">{s.num}</span>
                    </div>
                    <h3 className="text-xl font-extrabold mb-3 text-[#171d14]">{s.title}</h3>
                    <p className="text-sm text-[#3f4a3c] leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS CAROUSEL */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-black text-[#171d14]">{t("landing.testimonialsTitle")}</h2>
          <p className="text-[#3f4a3c] text-lg">{t("landing.testimonialsSub")}</p>
        </div>

        <div className="relative min-h-[280px] bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl shadow-green-950/5 border border-[#eff6e7] flex flex-col justify-between overflow-hidden">
          {/* Quote mark decoration */}
          <span className="absolute top-4 left-6 text-9xl font-serif text-[#006e1c]/5 pointer-events-none select-none">“</span>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTestimonial}
              initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 z-10"
            >
              <div className="flex text-[#ffb300]">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="material-symbols-outlined text-xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              
              <p className="text-xl sm:text-2xl font-extrabold text-[#171d14] leading-relaxed italic">
                "{testimonials[activeTestimonial].quote}"
              </p>

              <div className="flex items-center gap-4 pt-4 border-t border-[#eff6e7]">
                <div className={`w-12 h-12 rounded-full border flex items-center justify-center font-extrabold text-base select-none ${testimonials[activeTestimonial].avatarBg}`}>
                  {testimonials[activeTestimonial].avatarText}
                </div>
                <div>
                  <h4 className="font-bold text-[#171d14]">{testimonials[activeTestimonial].name}</h4>
                  <p className="text-xs text-[#6f7a6b] font-medium">{testimonials[activeTestimonial].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel dots */}
          <div className="flex justify-center gap-2 mt-8 z-10">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  activeTestimonial === index ? "w-8 bg-[#006e1c]" : "w-2.5 bg-[#becab9] hover:bg-[#a6b8a0]"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <section className="py-24 px-6 bg-[#fcfdfc] border-t border-[#eff6e7]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-black text-[#171d14]">{t("landing.faqTitle")}</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index} 
                  className="bg-white rounded-3xl border border-[#eff6e7] overflow-hidden transition-all duration-300 hover:shadow-md"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-6 text-left rtl:text-right flex items-center justify-between gap-4 font-extrabold text-lg sm:text-xl text-[#171d14]"
                  >
                    <span>{faq.q}</span>
                    <span 
                      className={`material-symbols-outlined transition-transform duration-300 text-[#006e1c] ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-6 pb-6 pt-1 text-[#3f4a3c] text-base leading-relaxed border-t border-[#f5f9f2]/50">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. CTA SECTION */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="bg-[#17305a] rounded-[3.5rem] text-white py-16 px-8 sm:px-16 text-center relative overflow-hidden shadow-2xl">
          {/* Magical background light blobs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-green-500/25 rounded-full filter blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/20 rounded-full filter blur-3xl -ml-20 -mb-20 pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
              {t("landing.ctaTitle")}
            </h2>
            <p className="text-blue-100 text-lg sm:text-xl font-medium leading-relaxed max-w-xl mx-auto">
              {t("landing.ctaSub")}
            </p>
            <div>
              <button
                onClick={() => navigate("/login")}
                className="bg-white text-[#17305a] px-10 py-5 rounded-full font-black text-lg sm:text-xl hover:scale-105 active:scale-97 transition-all shadow-xl hover:bg-blue-50/90"
              >
                {t("landing.startFreeTrial")}
              </button>
              <p className="text-sm text-blue-200/90 mt-4 font-medium">{t("landing.noCard")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="py-16 border-t border-[#eff6e7] bg-[#f9faf7]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pb-12 border-b border-[#eff6e7]">
            <div className="space-y-3 text-center md:text-left rtl:md:text-right">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <div className="w-9 h-9 bg-[#006e1c] rounded-xl flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-white text-lg font-bold">menu_book</span>
                </div>
                <span className="text-xl font-black tracking-tight text-[#171d14]">BrightBook</span>
              </div>
              <p className="text-sm font-bold text-[#6f7a6b]">{t("landing.footerTagline")}</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10 text-sm font-extrabold text-[#3f4a3c]">
              <a href="#" className="hover:text-[#006e1c] transition-colors">{t("landing.footerAbout")}</a>
              <a href="#" className="hover:text-[#006e1c] transition-colors">{t("landing.footerSupport")}</a>
              <a href="#" className="hover:text-[#006e1c] transition-colors">{t("landing.footerTerms")}</a>
              <a href="#" className="hover:text-[#006e1c] transition-colors">{t("landing.footerPrivacy")}</a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 text-xs font-bold text-[#6f7a6b]">
            <p>{t("landing.copyright")}</p>
            <div className="flex gap-4">
              {/* Simple Placeholder Social Icons using Material Symbols */}
              <a href="#" className="w-8 h-8 rounded-full bg-white border border-[#eff6e7] flex items-center justify-center text-gray-500 hover:text-[#006e1c] hover:border-[#006e1c]/25 transition-colors">
                <span className="material-symbols-outlined text-base">share</span>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white border border-[#eff6e7] flex items-center justify-center text-gray-500 hover:text-[#006e1c] hover:border-[#006e1c]/25 transition-colors">
                <span className="material-symbols-outlined text-base">public</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
