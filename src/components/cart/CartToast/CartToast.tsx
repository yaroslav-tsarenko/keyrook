"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/providers/CartProvider";
import { Button } from "@/components/ui/Button";
import { ProductCover } from "@/components/product/ProductCover";

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
    <div role="status" className="relative flex w-[min(380px,calc(100vw-32px))] gap-3 rounded-control bg-raised p-4 pr-11 text-ink shadow-[inset_2px_0_0_var(--color-accent),var(--shadow-lg)]">
      <div className="w-[72px] shrink-0 overflow-hidden rounded-tray">
        <ProductCover src={imageUrl} alt="" compact sizes="72px" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="eyebrow m-0">Added to cart{quantity > 1 ? ` · ${quantity}` : ""}</p>
        <p className="m-0 truncate text-ui-md font-semibold text-ink">{name}</p>
        <div className="mt-2 flex items-center gap-4">
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
      <button type="button" onClick={dismiss} aria-label="Close" className="absolute right-1.5 top-1.5 flex size-9 cursor-pointer items-center justify-center rounded-control text-ink-muted hover-device:hover:text-ink">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
