export const faqDatabase = [
  // 1. General & Info
  {
    id: "what_is_brightbook",
    category: "general",
    keywords: {
      en: ["what is", "about", "brightbook", "define", "explain"],
      ar: ["ما هو", "تعريف", "برايت", "بوك", "نبذة"]
    },
    question: {
      en: "What is BrightBook?",
      ar: "ما هو برايت بوك؟"
    },
    answer: {
      en: "BrightBook is an AI-powered interactive learning platform designed specifically to support children with dyslexia. We create personalized learning paths, interactive phonics games, and detailed progress tracking to build your child's reading confidence.",
      ar: "برايت بوك هي منصة تعليمية تفاعلية مدعومة بالذكاء الاصطناعي، مصممة خصيصاً لدعم الأطفال الذين يعانون من عسر القراءة (الديسليكسيا). نحن نقدم مسارات تعلم مخصصة، ألعاب صوتية تفاعلية، ومتابعة دقيقة للتقدم لبناء ثقة طفلك في القراءة."
    }
  },
  {
    id: "dyslexia_signs",
    category: "general",
    keywords: {
      en: ["signs", "symptoms", "dyslexia", "how to know", "struggle"],
      ar: ["أعراض", "علامات", "عسر القراءة", "صعوبة القراءة", "كيف أعرف"]
    },
    question: {
      en: "What are the common signs of dyslexia in kids?",
      ar: "ما هي العلامات الشائعة لعسر القراءة عند الأطفال؟"
    },
    answer: {
      en: "Common signs include difficulty learning letter names or sounds, slow or inaccurate reading, trouble spelling, mixing up left and right, and struggle with learning nursery rhymes. Our initial assessment can help identify these areas.",
      ar: "تشمل العلامات الشائعة صعوبة في تعلم أسماء الحروف أو أصواتها، القراءة البطيئة أو غير الدقيقة، صعوبة الإملاء، الخلط بين اليمين واليسار، وصعوبة حفظ الأناشيد. يمكن لتقييمنا الأولي المساعدة في تحديد هذه الجوانب."
    }
  },
  {
    id: "how_does_ai_work",
    category: "general",
    keywords: {
      en: ["ai", "artificial intelligence", "personalization", "how it works", "algorithm"],
      ar: ["ذكاء اصطناعي", "كيف يعمل", "تخصيص", "خوارزمية", "الذكاء"]
    },
    question: {
      en: "How does BrightBook's AI personalization work?",
      ar: "كيف يعمل التخصيص بالذكاء الاصطناعي في برايت بوك؟"
    },
    answer: {
      en: "Our system analyzes your child's responses, accuracy, and response times in both the initial assessment and daily activities. The AI model then dynamically selects the next best games and exercises to target their specific weak areas while reinforcing their strengths.",
      ar: "يقوم نظامنا بتحليل إجابات طفلك، ودقته، وأوقات استجابته في كل من التقييم الأولي والأنشطة اليومية. ثم يختار نموذج الذاء الاصطناعي ديناميكياً أفضل الألعاب والتمارين التالية لاستهداف نقاط الضعف لديه مع تعزيز نقاط القوة."
    }
  },

  // 2. Assessments
  {
    id: "assessment_duration",
    category: "assessment",
    keywords: {
      en: ["how long", "assessment take", "test duration", "time limit"],
      ar: ["كم يستغرق", "مدة التقييم", "وقت الاختبار", "كم دقيقة"]
    },
    question: {
      en: "How long does the assessment take?",
      ar: "كم من الوقت يستغرق التقييم؟"
    },
    answer: {
      en: "The initial dyslexia assessment typically takes between 10 to 15 minutes. It consists of friendly phonics questions, word building, and letter matching games. We recommend a quiet environment for your child.",
      ar: "يستغرق التقييم الأولي لعسر القراءة عادةً ما بين 10 إلى 15 دقيقة. ويتكون من أسئلة صوتية ودية، وتركيب الكلمات، وألعاب مطابقة الحروف. ننصح بإجرائه في بيئة هادئة للطفل."
    }
  },
  {
    id: "assessment_retake",
    category: "assessment",
    keywords: {
      en: ["retake", "redo", "again", "repeat assessment", "test again"],
      ar: ["إعادة التقييم", "إعادة الاختبار", "مرة أخرى", "اختبار مجدداً"]
    },
    question: {
      en: "Can my child retake the assessment?",
      ar: "هل يمكن لطفلي إعادة إجراء التقييم؟"
    },
    answer: {
      en: "Yes! If you feel your child was distracted or they have progressed significantly, you can trigger a new assessment from the Parent Settings page under the child's profile management.",
      ar: "نعم! إذا كنت تشعر أن طفلك كان مشتت الذهن أو أنه تقدم بشكل ملحوظ، يمكنك بدء تقييم جديد من صفحة إعدادات الآباء تحت قسم إدارة ملف الطفل."
    }
  },

  // 3. Activities & Progress
  {
    id: "recommended_daily_time",
    category: "activities",
    keywords: {
      en: ["daily time", "how much play", "recommended hours", "per day"],
      ar: ["الوقت اليومي", "كم يلعب", "كم ساعة يوميا", "كم دقيقة في اليوم"]
    },
    question: {
      en: "How much screen time is recommended daily?",
      ar: "ما هو الوقت اليومي الموصى به لاستخدام المنصة؟"
    },
    answer: {
      en: "We recommend 15 to 20 minutes of daily play on BrightBook. Consistency is key! Short, engaging sessions help prevent screen fatigue while reinforcing learning effectively.",
      ar: "نوصي بقضاء 15 إلى 20 دقيقة يومياً من اللعب والتعلم على برايت بوك. الاستمرارية هي المفتاح! تساعد الجلسات القصيرة والممتعة في تجنب إرهاق العين مع تعزيز التعلم بفعالية."
    }
  },
  {
    id: "tracking_progress",
    category: "activities",
    keywords: {
      en: ["track", "progress", "parent report", "how to see", "dashboard"],
      ar: ["متابعة", "تقدم", "تقرير الآباء", "لوحة التحكم", "كيف أرى"]
    },
    question: {
      en: "How do I track my child's progress?",
      ar: "كيف يمكنني متابعة تقدم طفلي؟"
    },
    answer: {
      en: "You can track progress in real-time through the Parent Dashboard. It displays metrics like current literacy level, streak days, activities completed, weekly accuracy scores, and custom AI learning recommendations. You can also export PDF reports.",
      ar: "يمكنك متابعة التقدم لحظة بلحظة من خلال لوحة تحكم الآباء. فهي تعرض مقاييس مثل مستوى القراءة الحالي، وأيام الاستمرارية، والأنشطة المكتملة، ونقاط الدقة الأسبوعية، وتوصيات التعلم الذكية. يمكنك أيضاً تصدير تقارير PDF."
    }
  },

  // 4. Account & Subscription
  {
    id: "subscription_pricing",
    category: "account",
    keywords: {
      en: ["price", "cost", "free", "pricing", "plans", "premium"],
      ar: ["سعر", "تكلفة", "مجاني", "اشتراك", "خطة", "بكم"]
    },
    question: {
      en: "Is BrightBook free, or are there premium plans?",
      ar: "هل برايت بوك مجاني أم أن هناك خطط مدفوعة؟"
    },
    answer: {
      en: "BrightBook offers a Free Trial which includes the initial assessment and basic phonics games. To unlock all AI-driven personalized paths, premium stories, and detailed tracking, we offer monthly and yearly subscription plans.",
      ar: "يقدم برايت بوك تجربة مجانية تشمل التقييم الأولي وألعاب الصوتيات الأساسية. لفتح جميع مسارات التعلم المخصصة بالذكاء الاصطناعي، والقصص المميزة، والمتابعة التفصيلية، نقدم خطط اشتراك شهرية وسنوية."
    }
  },
  {
    id: "reset_password",
    category: "account",
    keywords: {
      en: ["password", "reset", "forgot", "change password", "login issue"],
      ar: ["كلمة المرور", "إعادة تعيين", "نسيت", "تغيير كلمة السر", "دخول"]
    },
    question: {
      en: "How do I reset my password?",
      ar: "كيف يمكنني إعادة تعيين كلمة المرور الخاصة بي؟"
    },
    answer: {
      en: "To reset your password, log out and click 'Forgot Password' on the login screen. We will send a secure link to your email to set a new password. You can also change it in the Settings panel when logged in.",
      ar: "لإعادة تعيين كلمة المرور، قم بتسجيل الخروج واضغط على 'نسيت كلمة المرور' في شاشة تسجيل الدخول. سنرسل رابطاً آمناً إلى بريدك الإلكتروني لإعداد كلمة مرور جديدة. يمكنك أيضاً تغييرها من لوحة الإعدادات أثناء تسجيل الدخول."
    }
  },

  // 5. Support & Feedback
  {
    id: "contact_support",
    category: "support",
    keywords: {
      en: ["contact", "support", "ticket", "help", "email", "complaint"],
      ar: ["اتصال", "الدعم", "تذكرة", "مساعدة", "ايميل", "شكوى"]
    },
    question: {
      en: "How do I contact customer support?",
      ar: "كيف يمكنني الاتصال بالدعم الفني؟"
    },
    answer: {
      en: "You can submit a support ticket directly through the 'Support' section in the Parent Dashboard, or email our support team at support@brightbook.ai. We typically respond within 24 hours.",
      ar: "يمكنك تقديم تذكرة دعم مباشرة من خلال قسم 'الدعم' في لوحة تحكم الآباء، أو عبر البريد الإلكتروني لفريق الدعم على support@brightbook.ai. نرد عادةً في غضون 24 ساعة."
    }
  }
];

export function findMatchingFaq(query, lang = "en") {
  if (!query || typeof query !== "string") return null;
  const cleanQuery = query.toLowerCase().trim();

  // Simple keyword scanning
  let bestMatch = null;
  let maxKeywordsMatched = 0;

  for (const faq of faqDatabase) {
    const list = faq.keywords[lang] || [];
    let matchedCount = 0;

    for (const kw of list) {
      if (cleanQuery.includes(kw.toLowerCase())) {
        matchedCount++;
      }
    }

    if (matchedCount > maxKeywordsMatched) {
      maxKeywordsMatched = matchedCount;
      bestMatch = faq;
    }
  }

  // Require at least one match to return
  return maxKeywordsMatched > 0 ? bestMatch : null;
}
