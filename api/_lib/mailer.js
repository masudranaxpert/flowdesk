function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function sendEmail({ to, subject, text, html }) {
  const apiKey = globalThis.APP_ENV?.RESEND_API_KEY || process.env.RESEND_API_KEY;
  const from = globalThis.APP_ENV?.EMAIL_FROM || process.env.EMAIL_FROM || 'FlowDesk <onboarding@resend.dev>';

  if (!apiKey) {
    console.warn(`Email skipped for ${to}: ${text}`);
    return { skipped: true };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      html,
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result?.message ||
      result?.error ||
      `Email sending failed: ${response.status}`
    );
  }

  return { skipped: false, id: result.id };
}

export async function sendVerificationEmail({ to, name, code }) {
  const safeName = escapeHtml(name || 'there');
  const safeCode = escapeHtml(code);

  return sendEmail({
    to,
    subject: 'Verify your FlowDesk email',
    text: `Hi ${name || 'there'}, your FlowDesk verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2>Verify your FlowDesk email</h2>
        <p>Hi ${safeName}, use this code to finish signup:</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:20px 0">
          ${safeCode}
        </div>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });
}

export async function sendResetPasswordEmail({ to, name, code }) {
  const safeName = escapeHtml(name || 'there');
  const safeCode = escapeHtml(code);

  return sendEmail({
    to,
    subject: 'Reset your FlowDesk password',
    text: `Hi ${name || 'there'}, your FlowDesk password reset code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2>Reset your FlowDesk password</h2>
        <p>Hi ${safeName}, use this code to reset your password:</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:20px 0">
          ${safeCode}
        </div>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });
}
