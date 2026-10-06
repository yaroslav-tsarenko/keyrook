"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/providers/CartProvider";
import { Button } from "@/components/ui/Button";
import { Cover } from "@/components/product/Cover";

interface CartToastProps {
  toastId?: string | number;
  name: string;
  imageUrl?: string | null;
  quantity: number;
}

export function CartToast({ toastId, name, imageUrl, quantity }: CartToastProps) {
  const { openSheet } = useCart();
  const dismiss = () => {
    if (toastId !== undefined) toast.dismiss(toastId);
  };

  return (
    <div role="status" data-cart-toast="" className="relative flex w-[min(380px,calc(100vw-32px))] gap-3 border-l-2 border-brand bg-raised p-3 pr-11 text-ink shadow-lg">
      <div className="w-[48px] shrink-0">
        <Cover src={imageUrl} alt="" compact sizes="48px" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="eyebrow m-0">Added to cart{quantity > 1 ? ` · ${quantity}` : ""}</p>
        <p className="m-0 truncate text-ui-md font-[560] text-ink">{name}</p>
        <div className="mt-1.5 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onPress={() => {
              dismiss();
              openSheet();
            }}
          >
            View cart
          </Button>
          <Button as={Link} href="/checkout" size="sm" onClick={dismiss}>
            Checkout
          </Button>
        </div>
      </div>
      <button type="button" onClick={dismiss} aria-label="Close" className="absolute right-1 top-1 flex size-9 cursor-pointer items-center justify-center text-ink-muted hover-device:hover:text-ink">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
