import { create } from "zustand";
import { persist } from "zustand/middleware";
import { translations } from "../i18n/translations";
import { createContext, useContext } from "react";

export const ChildLanguageContext = createContext(null);

export const useLangStore = create(
  persist(
    (set, get) => ({
      lang: "en",

      setLang: (lang) => {
        set({ lang });
        document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = lang;
      },

      // t("auth.login") -> "Log In" or "تسجيل الدخول"
      t: (key, vars = {}, fallback = null) => {
        const { lang } = get();
        const parts = key.split(".");
        
        // 1. Try current language
        let obj = translations[lang];
        if (obj) {
          for (const part of parts) {
            obj = obj?.[part];
            if (obj === undefined) break;
          }
        }

        // 2. Fallback to English if not found and current is not English
        if (obj === undefined && lang !== "en") {
          obj = translations["en"];
          for (const part of parts) {
            obj = obj?.[part];
            if (obj === undefined) break;
          }
        }

        if (typeof obj === "string") {
          let res = obj;
          Object.entries(vars).forEach(([k, v]) => {
            res = res.replace(`{${k}}`, v);
          });
          return res;
        }
        
        // 3. Use provided fallback or return the key itself
        return fallback || key;
      },
    }),
    {
      name: "brightbook-lang",
      onRehydrateStorage: () => (state) => {
        if (state?.lang) {
          document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr";
          document.documentElement.lang = state.lang;
        }
      },
    }
  )
);

// Convenience hooks
export const useLang = () => {
  const childLang = useContext(ChildLanguageContext);
  const globalLang = useLangStore((s) => s.lang);
  return childLang || globalLang;
};

export const useSetLang = () => useLangStore((s) => s.setLang);

export const useT = () => {
  const storeT = useLangStore((s) => s.t);
  const childLang = useContext(ChildLanguageContext);

  if (childLang) {
    return (key, vars = {}, fallback = null) => {
      const parts = key.split(".");
      
      // 1. Try child language
      let obj = translations[childLang];
      if (obj) {
        for (const part of parts) {
          obj = obj?.[part];
          if (obj === undefined) break;
        }
      }

      // 2. Fallback to English
      if (obj === undefined && childLang !== "en") {
        obj = translations["en"];
        for (const part of parts) {
          obj = obj?.[part];
          if (obj === undefined) break;
        }
      }

      if (typeof obj === "string") {
        let res = obj;
        Object.entries(vars).forEach(([k, v]) => {
          res = res.replace(`{${k}}`, v);
        });
        return res;
      }
      
      return fallback || key;
    };
  }

  return storeT;
};
