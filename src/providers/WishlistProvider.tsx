"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";

interface WishlistContextType {
  isSaved: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  pending: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setIds(new Set());
      return;
    }
    let cancelled = false;
    fetch("/api/wishlist")
      .then((r) => (r.ok ? r.json() : []))
      .then((items: { productId: string }[]) => {
        if (!cancelled && Array.isArray(items)) setIds(new Set(items.map((i) => i.productId)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggle = useCallback(
    async (productId: string) => {
      if (!user) {
        toast("Sign in to save items", {
          action: { label: "Sign in", onClick: () => router.push("/auth/login") },
        });
        return;
      }
      setBusy((b) => new Set(b).add(productId));
      try {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (!res.ok) throw new Error("wishlist");
        const data = (await res.json()) as { action: "added" | "removed" };
        setIds((prev) => {
          const next = new Set(prev);
          if (data.action === "added") next.add(productId);
          else next.delete(productId);
          return next;
        });
      } catch {
        toast.error("We couldn't update your saved items. Try again.");
      } finally {
        setBusy((b) => {
          const next = new Set(b);
          next.delete(productId);
          return next;
        });
      }
    },
    [user, router],
  );

  const value: WishlistContextType = {
    isSaved: (id) => ids.has(id),
    toggle,
    pending: (id) => busy.has(id),
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
}
