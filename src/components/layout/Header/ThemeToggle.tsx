"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { Segmented } from "@/components/ui/Choice";
import { cn } from "@/lib/utils/cn";

export function ThemeToggle({ variant = "icon", className }: { variant?: "icon" | "row"; className?: string }) {
  const { theme, toggleTheme, setTheme } = useTheme();
  const label = theme === "light" ? "Switch to dark" : "Switch to Daylight";

  if (variant === "row") {
    return (
      <div className={cn("flex min-h-14 items-center justify-between gap-4", className)}>
        <span className="text-step-0 text-ink">Theme</span>
        <Segmented
          label="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: "dark", label: "Dark" },
            { value: "light", label: "Daylight" },
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
      className={cn("flex size-10 cursor-pointer items-center justify-center rounded-control text-ink-muted transition-colors duration-[140ms] hover-device:hover:bg-raised hover-device:hover:text-ink", className)}
    >
      {theme === "light" ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
    </button>
  );
}
