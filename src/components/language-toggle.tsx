"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

// Compact EN / اردو switch.
export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center rounded-full border bg-background p-0.5" title="Language / زبان">
      <Languages className="mx-1.5 h-4 w-4 text-muted-foreground" />
      <button
        type="button"
        onClick={() => setLang("en")}
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
          lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("ur")}
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
          lang === "ur" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
        )}
      >
        اردو
      </button>
    </div>
  );
}
