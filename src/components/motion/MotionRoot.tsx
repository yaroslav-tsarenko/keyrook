"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { REDUCED_MOTION_QUERY } from "@/lib/hooks/useMediaQuery";
import { onIdle } from "@/lib/motion/env";
import { cssEase, MOTION_DURATION } from "@/lib/motion/tokens";
import { flyToCart, type CartAddDetail } from "@/lib/motion/cart-flight";

export function MotionRoot() {
  const pathname = usePathname();
  const firstRoute = useRef(true);

  useLayoutEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;
    document.getElementById("main")?.animate([{ opacity: 0.55 }, { opacity: 1 }], { duration: MOTION_DURATION.ui, easing: cssEase("std") });
  }, [pathname]);

  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    let disposed = false;
    let destroy: (() => void) | undefined;
    let cancelIdle: (() => void) | undefined;

    const start = () => {
      if (media.matches) return;
      cancelIdle = onIdle(() => {
        import("@/lib/motion/engine").then(({ mountMotion }) => {
          if (!disposed) destroy = mountMotion(document);
        });
      });
    };

    const stop = () => {
      cancelIdle?.();
      destroy?.();
      destroy = undefined;
    };

    const onChange = () => {
      stop();
      start();
    };

    start();
    media.addEventListener("change", onChange);
    return () => {
      disposed = true;
      media.removeEventListener("change", onChange);
      stop();
    };
  }, [pathname]);

  useEffect(() => {
    const onAdd = (event: Event) => flyToCart((event as CustomEvent<CartAddDetail>).detail);
    window.addEventListener("keyrook:cart-add", onAdd);
    return () => window.removeEventListener("keyrook:cart-add", onAdd);
  }, []);

  return null;
}
