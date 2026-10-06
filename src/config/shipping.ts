import { STORE_POLICY } from "@/config/store-policy";

export const SHIPPING = {
  statement: `Delivered by ${STORE_POLICY.delivery.method}`,
  cartNote: "No delivery charge — items arrive as a Steam trade offer",
} as const;
