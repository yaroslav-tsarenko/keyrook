import { STORE_POLICY } from "@/config/store-policy";

export const SHIPPING = {
  statement: `Delivered by ${STORE_POLICY.delivery.method}`,
  cartNote: "No delivery charge. Keys are issued to your account after payment is confirmed.",
} as const;
