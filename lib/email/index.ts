/**
 * Email sender via Resend.
 * Silently no-ops if RESEND_API_KEY is not configured —
 * so email is opt-in with zero code changes required.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM ?? "AppBuilder <no-reply@appbuilder.dev>";
const APP_URL = process.env.NEXTAUTH_URL ?? "https://your-app.vercel.app";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "AppBuilder";

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return; // silently skip — email not configured

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
  } catch {
    // Non-fatal — never throw, just skip
  }
}

function emailWrapper(body: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:40px">
        <tr><td>
          <div style="font-size:24px;font-weight:700;color:#1d4ed8;margin-bottom:24px">⚡ ${APP_NAME}</div>
          ${body}
          <div style="border-top:1px solid #f3f4f6;margin-top:32px;padding-top:16px;font-size:12px;color:#9ca3af">
            You received this because you have an account at ${APP_URL}
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendGenerationComplete(
  to: string,
  prompt: string,
  generationId: string
) {
  const viewUrl = `${APP_URL}/generations/${generationId}`;
  const shortPrompt = prompt.length > 80 ? prompt.slice(0, 80) + "…" : prompt;

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">Your app is ready! 🎉</h2>
    <p style="color:#4b5563;margin:0 0 16px;line-height:1.6">
      We finished generating your app. Here&rsquo;s what you asked for:
    </p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:24px;font-size:14px;color:#374151;line-height:1.6">
      &ldquo;${shortPrompt}&rdquo;
    </div>
    <a href="${viewUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px">
      View &amp; Download Your App →
    </a>
  `);

  await sendEmail(to, `Your app is ready — ${APP_NAME}`, html);
}

export async function sendGenerationFailed(to: string, prompt: string) {
  const shortPrompt = prompt.length > 80 ? prompt.slice(0, 80) + "…" : prompt;
  const retryUrl = `${APP_URL}/generate?prompt=${encodeURIComponent(prompt)}`;

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">Generation didn&rsquo;t complete</h2>
    <p style="color:#4b5563;margin:0 0 16px;line-height:1.6">
      Something went wrong generating your app. Don&rsquo;t worry —
      <strong>your credits have been automatically refunded.</strong>
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:24px;font-size:14px;color:#374151;line-height:1.6">
      &ldquo;${shortPrompt}&rdquo;
    </div>
    <a href="${retryUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px">
      Try Again →
    </a>
  `);

  await sendEmail(to, `Generation failed — credits refunded — ${APP_NAME}`, html);
}

export async function sendWelcome(to: string, name?: string | null) {
  const creditsUrl = `${APP_URL}/credits`;
  const greeting = name ? `Hi ${name}` : "Welcome";

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">${greeting} to ${APP_NAME}! 👋</h2>
    <p style="color:#4b5563;margin:0 0 16px;line-height:1.6">
      You&rsquo;re all set. To start building apps with AI, grab a credit package:
    </p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;width:100%">
      <tr>
        <td style="padding:8px;background:#f0f9ff;border-radius:8px;text-align:center;margin-right:8px">
          <div style="font-weight:700;font-size:18px;color:#1d4ed8">$10</div>
          <div style="font-size:12px;color:#64748b">100 credits (~20 apps)</div>
        </td>
        <td style="width:8px"></td>
        <td style="padding:8px;background:#eff6ff;border:2px solid #2563eb;border-radius:8px;text-align:center">
          <div style="font-weight:700;font-size:18px;color:#1d4ed8">$25</div>
          <div style="font-size:12px;color:#64748b">300 credits (~60 apps)</div>
          <div style="font-size:11px;color:#2563eb;font-weight:600">Most Popular</div>
        </td>
        <td style="width:8px"></td>
        <td style="padding:8px;background:#f0f9ff;border-radius:8px;text-align:center">
          <div style="font-weight:700;font-size:18px;color:#1d4ed8">$50</div>
          <div style="font-size:12px;color:#64748b">700 credits (~140 apps)</div>
        </td>
      </tr>
    </table>
    <a href="${creditsUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px">
      Buy Credits &amp; Start Building →
    </a>
  `);

  await sendEmail(to, `Welcome to ${APP_NAME} — let's build something`, html);
}
