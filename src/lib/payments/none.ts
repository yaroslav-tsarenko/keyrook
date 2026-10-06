import { PaymentUnavailableError, PaymentWebhookError, type PaymentProvider } from "./types";

export const noneProvider: PaymentProvider = {
  id: "none",
  available: false,
  async createPayment() {
    throw new PaymentUnavailableError("none");
  },
  async parseWebhook() {
    throw new PaymentWebhookError("PROVIDER_NOT_CONFIGURED", 404);
  },
  async fetchStatus() {
    throw new PaymentUnavailableError("none");
  },
};
