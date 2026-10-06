"use client";

import { DialLoader } from "@/components/ui/Dial";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function LoadingSpinner({ size = "md", label }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <DialLoader size={size === "sm" ? 16 : 24} label={label ?? "Loading"} showLabel={Boolean(label)} />
    </div>
  );
}
