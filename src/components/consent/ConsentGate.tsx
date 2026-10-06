"use client";

import type { ReactNode } from "react";
import { useConsent, type OptionalConsent } from "@/lib/consent";

export function ConsentGate({ category, children }: { category: OptionalConsent; children: ReactNode }) {
  const { consent } = useConsent();
  if (!consent?.[category]) return null;
  return <>{children}</>;
}
