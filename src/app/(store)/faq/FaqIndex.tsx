"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClasses } from "@/components/ui/button-classes";
import { cn } from "@/lib/utils/cn";
import { Lamp } from "@/components/ui/Lamp";

export function FaqIndex({ label, groups }: { label: string; groups: { id: string; title: string }[] }) {
  const [active, setActive] = useState(groups[0]?.id);

  useEffect(() => {
    const targets = groups.map((g) => document.getElementById(g.id)).filter((el): el is HTMLElement => Boolean(el));
    if (!targets.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let current = targets[0];
      if (atBottom) current = targets[targets.length - 1];
      else for (const t of targets) if (t.getBoundingClientRect().top <= line) current = t;
      setActive(current.id);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [groups]);

  return (
    <nav aria-label={label}>
      <ul className="m-0 flex list-none gap-6 overflow-x-auto border-b border-line p-0 no-scrollbar lg:flex-col lg:gap-0 lg:overflow-visible lg:border-b-0">
        {groups.map((group) => {
          const isActive = group.id === active;
          return (
            <li key={group.id} className="shrink-0">
              <a
                href={`#${group.id}`}
                aria-current={isActive ? "true" : undefined}
                onClick={() => setActive(group.id)}
                className={cn(
                  "relative flex min-h-11 items-center gap-3 whitespace-nowrap text-ui-md transition-colors duration-[120ms] lg:py-2",
                  isActive ? "font-[560] text-ink" : "text-ink-muted hover-device:hover:text-ink",
                )}
              >
                <Lamp on={isActive} />
                {group.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function OutlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={buttonClasses({ variant: "outline" })}>
      {children}
    </Link>
  );
}
