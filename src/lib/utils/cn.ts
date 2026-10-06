import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["step--1", "step-0", "step-1", "step-2", "step-3", "step-4", "step-5", "step-6", "display-xl", "ui-md", "ui-sm", "ui-xs"],
      spacing: ["gutter"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
