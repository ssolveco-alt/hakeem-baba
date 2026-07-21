"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { translations, type Lang } from "./translations";

const STORAGE_KEY = "hakeemcare.lang";

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const LanguageCtx = createContext<Ctx>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
  dir: "ltr",
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Load the saved preference on mount (client-only, avoids hydration mismatch).
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved === "en" || saved === "ur") setLangState(saved);
  }, []);

  // Keep <html lang/dir> and the Urdu font class in sync.
  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === "ur" ? "rtl" : "ltr";
    el.classList.toggle("font-urdu", lang === "ur");
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string) => translations[lang][key] ?? translations.en[key] ?? key,
    [lang]
  );

  return (
    <LanguageCtx.Provider value={{ lang, setLang, t, dir: lang === "ur" ? "rtl" : "ltr" }}>
      {children}
    </LanguageCtx.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageCtx);
}

// Convenience: const t = useT();  -> t("nav.patients")
export function useT() {
  return useContext(LanguageCtx).t;
}
