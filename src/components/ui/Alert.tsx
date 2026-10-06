import type { ReactNode } from "react";
import { BadgeCheck, Info, OctagonAlert, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const TONE = {
  danger: { box: "bg-danger-tint border-danger", text: "text-danger", Icon: OctagonAlert, role: "alert" as const },
  warning: { box: "bg-warning-tint border-warning", text: "text-warning", Icon: TriangleAlert, role: "status" as const },
  success: { box: "bg-success-tint border-success", text: "text-success", Icon: BadgeCheck, role: "status" as const },
  info: { box: "bg-info-tint border-info", text: "text-info", Icon: Info, role: "status" as const },
};

export interface AlertProps {
  tone?: keyof typeof TONE;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
  id?: string;
  tabIndex?: number;
}

export function Alert({ tone = "danger", title, children, action, className, id, tabIndex }: AlertProps) {
  const t = TONE[tone];
  const Icon = t.Icon;
  return (
    <div id={id} tabIndex={tabIndex} role={t.role} className={cn("flex flex-wrap items-start gap-x-3 gap-y-3 border px-4 py-3.5 text-ui-md text-ink", t.box, className)}>
      <Icon size={16} aria-hidden="true" className={cn("mt-1", t.text)} />
      <div className="min-w-0 flex-1">
        {title ? <p className="m-0 font-[560] text-ink">{title}</p> : null}
        {children ? <div className={cn("text-ui-md text-ink", title && "mt-1")}>{children}</div> : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  );
}
