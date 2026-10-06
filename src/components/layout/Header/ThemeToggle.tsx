"use client";

import { SunMoon } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { Segmented } from "@/components/ui/Choice";
import { cn } from "@/lib/utils/cn";

export function ThemeToggle({ variant = "icon", className }: { variant?: "icon" | "row"; className?: string }) {
  const { theme, toggleTheme, setTheme } = useTheme();
  const label = theme === "light" ? "Switch to Strongroom" : "Switch to Counter Hall";

  if (variant === "row") {
    return (
      <div className={cn("flex min-h-14 flex-wrap items-center justify-between gap-3", className)}>
        <span className="text-step-0 text-ink">Theme</span>
        <Segmented
          label="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: "dark", label: "Strongroom" },
            { value: "light", label: "Counter Hall" },
          ]}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn("flex size-8 cursor-pointer items-center justify-center text-ink-muted transition-colors duration-[120ms] hover-device:hover:bg-raised hover-device:hover:text-ink", className)}
    >
      <SunMoon size={18} aria-hidden="true" />
    </button>
  );
}
