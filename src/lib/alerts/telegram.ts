import { env } from "@/lib/env";

export type AlertLevel = "info" | "warn" | "critical";

const PREFIX: Record<AlertLevel, string> = {
  info: "[info]",
  warn: "[warn]",
  critical: "[CRITICAL]",
};

export async function sendAlert(message: string, level: AlertLevel = "warn"): Promise<void> {
  const token = env.ALERT_TELEGRAM_BOT_TOKEN;
  const chatId = env.ALERT_TELEGRAM_CHAT_ID;
  const text = `${PREFIX[level]} ${message}`;

  if (!token || !chatId) {
    console.warn(`[alert:${level}] ${message}`);
    return;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
  } catch (err) {
    console.error(`[alert] failed to deliver Telegram alert: ${String(err)}`);
    console.warn(`[alert:${level}] ${message}`);
  }
}
