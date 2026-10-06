import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function TextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex min-h-10 items-center gap-1.5 text-ui-md font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline", className)}>
      {children}
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}

export function SectionHead({
  id,
  eyebrow,
  title,
  lead,
  link,
  className,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  link?: { href: string; label: ReactNode };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-10 gap-y-4", className)}>
      <div className="min-w-0 max-w-[62ch]">
        {eyebrow ? <p className="eyebrow m-0 mb-3">{eyebrow}</p> : null}
        <h2 id={id} className="m-0 text-step-4 font-[650] leading-[1.04] text-ink">
          {title}
        </h2>
        {lead ? <p className="m-0 mt-3 text-step-0 leading-[1.55] text-ink-muted">{lead}</p> : null}
      </div>
      {link ? <TextLink href={link.href}>{link.label}</TextLink> : null}
    </div>
  );
}
