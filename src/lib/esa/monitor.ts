import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { sendAlert } from "@/lib/alerts/telegram";
import { esaClient, ordersAreLive } from "./client";

export interface MonitorResult {
  live: boolean;
  balance: number | null;
  lowBalance: boolean;
  refundPending: number;
  stuckPaid: number;
  stuckInFlight: number;
  alerts: number;
}

const STUCK_PAID_MS = 10 * 60 * 1000;
const STUCK_IN_FLIGHT_MS = 6 * 60 * 60 * 1000;

export async function monitorKeyOrders(): Promise<MonitorResult> {
  let alerts = 0;
  let balance: number | null = null;
  let lowBalance = false;
  try {
    balance = await esaClient.getBalance();
    lowBalance = ordersAreLive() && balance < env.KINGUIN_LOW_BALANCE_THRESHOLD;
    if (lowBalance) {
      alerts++;
      await sendAlert(`Key supplier balance is low: <b>€${balance.toFixed(2)}</b> (threshold €${env.KINGUIN_LOW_BALANCE_THRESHOLD}). Top up to keep issuing keys.`, "critical");
    }
  } catch (err) {
    alerts++;
    await sendAlert(`Key supplier balance check failed: ${String(err)}`, "warn");
  }

  const now = Date.now();
  const refundPending = await prisma.keyOrder.count({ where: { status: "refund_pending" } });
  const stuckPaid = await prisma.keyOrder.count({ where: { status: "paid", updatedAt: { lt: new Date(now - STUCK_PAID_MS) } } });
  const stuckInFlight = await prisma.keyOrder.count({ where: { status: { in: ["submitted", "processing"] }, submittedAt: { lt: new Date(now - STUCK_IN_FLIGHT_MS) } } });
  if (refundPending > 0) {
    alerts++;
    await sendAlert(`<b>${refundPending}</b> key order(s) are waiting for a manual refund or retry (refund_pending).`, "warn");
  }
  if (stuckPaid > 0) {
    alerts++;
    await sendAlert(`<b>${stuckPaid}</b> paid key order(s) have not reached the supplier for over ${STUCK_PAID_MS / 60000} minutes.`, "warn");
  }
  if (stuckInFlight > 0) {
    alerts++;
    await sendAlert(`<b>${stuckInFlight}</b> key order(s) have been waiting for keys for over ${STUCK_IN_FLIGHT_MS / 3600000} hours.`, "warn");
  }
  return { live: ordersAreLive(), balance, lowBalance, refundPending, stuckPaid, stuckInFlight, alerts };
}
