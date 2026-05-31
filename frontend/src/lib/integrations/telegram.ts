const SEVERITY_THRESHOLD = Number(process.env.TELEGRAM_SEVERITY_THRESHOLD ?? 8);

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim());
}

export function highSeverityThreshold(): number {
  return Number.isFinite(SEVERITY_THRESHOLD) ? SEVERITY_THRESHOLD : 8;
}

export function shouldNotifyHighSeverity(severity: number): boolean {
  return severity >= highSeverityThreshold();
}

export interface HighSeverityAlertPayload {
  patientName?: string;
  logDate: string;
  name: string;
  severity: number;
  notes?: string | null;
  missedDosesSameDay?: number;
}

export function formatHighSeverityMessage(payload: HighSeverityAlertPayload): string {
  const who = payload.patientName ?? "Mom";
  const lines = [
    `🚨 High symptom alert — ${who}`,
    ``,
    `${payload.name} · severity ${payload.severity}/10`,
    `Date: ${payload.logDate}`,
  ];

  if (payload.notes?.trim()) {
    lines.push(`Notes: ${payload.notes.trim()}`);
  }

  if (payload.missedDosesSameDay != null && payload.missedDosesSameDay > 0) {
    lines.push(
      `Same day: ${payload.missedDosesSameDay} missed medication log(s) — check Patterns in the dashboard.`
    );
  }

  lines.push(``, `Caregiver's Second Set of Eyes`);
  return lines.join("\n");
}

export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    throw new Error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set");
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram API error (${res.status}): ${body.slice(0, 200)}`);
  }
}

export async function notifyHighSeveritySymptom(
  payload: HighSeverityAlertPayload
): Promise<{ sent: boolean; error?: string }> {
  if (!shouldNotifyHighSeverity(payload.severity)) {
    return { sent: false };
  }

  if (!isTelegramConfigured()) {
    return { sent: false, error: "Telegram not configured" };
  }

  try {
    await sendTelegramMessage(formatHighSeverityMessage(payload));
    return { sent: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Telegram send failed";
    console.error("[telegram]", message);
    return { sent: false, error: message };
  }
}
