"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Cart, CartItem } from "@/types/cart";
import { CartToast } from "@/components/cart/CartToast/CartToast";
import { useCurrency } from "@/providers/CurrencyProvider";
import { computeTotals, itemQuantityCap, orderQuantityRoom, type Totals } from "@/lib/pricing";
import { flightRemaining } from "@/lib/motion/cart-flight";

interface CartContextType {
  cart: Cart;
  displayTotals: Totals;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  itemCount: number;
  cartBounce: number;
  lastAdded: CartItem | null;
  isHydrated: boolean;
  isSheetOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
}

const CART_STORAGE_KEY = "e-commerce-cart";

const CartContext = createContext<CartContextType | undefined>(undefined);

function itemCap(item: Pick<CartItem, "maxQuantity">): number {
  return Math.max(1, itemQuantityCap(item.maxQuantity));
}

function normalise(items: CartItem[]): CartItem[] {
  let room = orderQuantityRoom(0);
  const result: CartItem[] = [];
  for (const item of items) {
    if (room <= 0) break;
    const quantity = Math.min(Math.max(1, Math.floor(item.quantity || 1)), itemCap(item), room);
    room -= quantity;
    result.push({ ...item, quantity });
  }
  return result;
}

function calculateTotals(items: CartItem[]): Cart {
  const totals = computeTotals(items.map((item) => ({ price: item.price, quantity: item.quantity })));
  return {
    items,
    subtotal: totals.subtotal,
    taxAmount: totals.vat,
    shippingCost: totals.shipping,
    total: totals.total,
    itemCount: totals.itemCount,
  };
}

function persist(items: CartItem[]) {
  try {
    if (items.length === 0) localStorage.removeItem(CART_STORAGE_KEY);
    else localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function CartProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("cart");
  const { convert } = useCurrency();
  const [cart, setCart] = useState<Cart>(() => calculateTotals([]));
  const [cartBounce, setCartBounce] = useState(0);
  const [lastAdded, setLastAdded] = useState<CartItem | null>(null);
  const [isHydrated, setHydrated] = useState(false);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const openSheet = useCallback(() => setSheetOpen(true), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const itemsRef = useRef<CartItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const items = normalise(JSON.parse(stored) as CartItem[]);
        itemsRef.current = items;
        setCart(calculateTotals(items));
      }
    } catch {
      try {
        localStorage.removeItem(CART_STORAGE_KEY);
      } catch {}
    }
    setHydrated(true);
  }, []);

  const commit = useCallback((items: CartItem[]) => {
    itemsRef.current = items;
    persist(items);
    setCart(calculateTotals(items));
  }, []);

  const addItem = useCallback(
    (newItem: Omit<CartItem, "id">) => {
      const id = `${newItem.productId}-${newItem.variantId || "default"}`;
      const prev = itemsRef.current;
      const existing = prev.find((item) => item.id === id);
      const currentCount = prev.reduce((sum, item) => sum + item.quantity, 0);
      const othersCount = currentCount - (existing?.quantity ?? 0);
      const orderRoom = orderQuantityRoom(othersCount);
      const perItem = itemCap(newItem);
      const cap = Math.min(perItem, orderRoom);
      const wanted = (existing?.quantity ?? 0) + newItem.quantity;
      const quantity = Math.min(wanted, cap);
      const limitNotice = quantity < wanted ? (orderRoom < perItem ? "orderLimit" : "itemLimit") : null;
      if (quantity > (existing?.quantity ?? 0)) {
        const updatedItems = existing
          ? prev.map((item) => (item.id === id ? { ...item, quantity, maxQuantity: newItem.maxQuantity } : item))
          : [...prev, { ...newItem, id, quantity }];
        commit(updatedItems);
        const added: CartItem = { ...newItem, id, quantity: quantity - (existing?.quantity ?? 0) };
        setCartBounce((b) => b + 1);
        setLastAdded(added);
        const showToast = () =>
          toast.custom(
            (toastId) => <CartToast toastId={toastId} name={added.name} imageUrl={added.imageUrl} quantity={added.quantity} />,
            { duration: 5000, className: "!w-auto !border-0 !bg-transparent !p-0 !shadow-none" },
          );
        const wait = flightRemaining();
        if (wait > 0) window.setTimeout(showToast, wait);
        else showToast();
      }
      if (limitNotice === "itemLimit") toast(t("limitPerItem", { max: perItem }));
      if (limitNotice === "orderLimit") toast(t("limitPerOrder", { max: orderQuantityRoom(0) }));
    },
    [t, commit],
  );

  const removeItem = useCallback(
    (productId: string, variantId?: string) => {
      commit(itemsRef.current.filter((item) => !(item.productId === productId && item.variantId === variantId)));
      toast.success(t("removed"));
    },
    [t, commit],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number, variantId?: string) => {
      const prev = itemsRef.current;
      const target = prev.find((item) => item.productId === productId && item.variantId === variantId);
      if (!target) return;
      const currentCount = prev.reduce((sum, item) => sum + item.quantity, 0);
      const next = Math.max(1, Math.min(Math.floor(quantity), cartItemCap(target, currentCount)));
      if (next === target.quantity) return;
      commit(prev.map((item) => (item === target ? { ...item, quantity: next } : item)));
    },
    [commit],
  );

  const clearCart = useCallback(() => {
    commit([]);
  }, [commit]);

  const displayTotals = useMemo(
    () => computeTotals(cart.items.map((item) => ({ price: item.price, quantity: item.quantity })), { convert }),
    [cart.items, convert],
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        displayTotals,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount: cart.itemCount,
        cartBounce,
        lastAdded,
        isHydrated,
        isSheetOpen,
        openSheet,
        closeSheet,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export function cartItemCap(item: Pick<CartItem, "maxQuantity" | "quantity">, itemCount: number): number {
  return Math.max(1, Math.min(itemCap(item), orderQuantityRoom(itemCount - item.quantity)));
}
