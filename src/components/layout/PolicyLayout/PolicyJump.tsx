"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";

export function PolicyJump({ label, value, options }: { label: string; value: string; options: { value: string; label: string }[] }) {
  const router = useRouter();
  return (
    <Select
      label={label}
      value={value}
      options={options}
      onChange={(event) => router.push(event.target.value)}
    />
  );
}
