import type { SkinSummary } from "@/lib/skins/cs2";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  variantId?: string;
  variantName?: string;
  maxQuantity: number;
  skin?: SkinSummary;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  total: number;
  itemCount: number;
}
