"use client";

import { Toaster } from "sonner";
import { BadgeCheck, Info, OctagonAlert, TriangleAlert, X } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

export function ToastProvider() {
  const { theme } = useTheme();
  const mobile = useMediaQuery("(max-width: 639px)");

  return (
    <Toaster
      theme={theme}
      position={mobile ? "top-center" : "bottom-right"}
      offset={24}
      mobileOffset={{ top: 64, left: 16, right: 16 }}
      closeButton
      duration={5000}
      gap={12}
      icons={{
        success: <BadgeCheck size={16} className="text-success" aria-hidden="true" />,
        info: <Info size={16} className="text-info" aria-hidden="true" />,
        warning: <TriangleAlert size={16} className="text-warning" aria-hidden="true" />,
        error: <OctagonAlert size={16} className="text-danger" aria-hidden="true" />,
        close: <X size={14} aria-hidden="true" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group relative flex w-[min(380px,calc(100vw-32px))] items-start gap-3 border-l-2 border-line-hover bg-raised p-4 pr-11 font-sans text-ui-sm text-ink shadow-lg data-[type=success]:border-success data-[type=error]:border-danger data-[type=warning]:border-warning data-[type=info]:border-info",
          title: "font-[560] text-ink",
          description: "meta mt-0.5 text-ink-muted",
          icon: "mt-0.5 shrink-0",
          closeButton:
            "!absolute !left-auto !right-1.5 !top-1.5 !flex !size-9 !items-center !justify-center !border-0 !bg-transparent !text-ink-muted !transform-none hover:!text-ink",
          actionButton:
            "ml-auto shrink-0 cursor-pointer self-center text-ui-sm font-[560] text-ink underline decoration-1 underline-offset-4",
          cancelButton: "ml-auto shrink-0 cursor-pointer self-center text-ui-sm text-ink-muted underline underline-offset-4",
        },
      }}
    />
  );
}
