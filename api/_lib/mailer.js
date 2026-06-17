export async function sendVerificationEmail({ to, name, code }) {
  const resendKey = process.env.RESEND_API_KEY;
  const brevoKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  if (!resendKey && !brevoKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Email API key missing. Verification code for ${to}: ${code}`);
      return { skipped: true };
    }
    throw new Error('Email service (Resend or Brevo) is not configured');
  }

  const subject = 'Verify your BookmarkVault email';
  const text = `Hi ${name || 'there'}, your BookmarkVault verification code is ${code}. It expires in 10 minutes.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <h2>Verify your BookmarkVault email</h2>
      <p>Hi ${name || 'there'}, use this code to finish signup:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:20px 0">${code}</div>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;

  if (resendKey) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `BookmarkVault <${emailFrom}>`,
        to,
        subject,
        text,
        html,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) {
      throw new Error(json.message || json.error?.message || 'Failed to send email via Resend');
    }
  } else if (brevoKey) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'BookmarkVault', email: emailFrom },
        to: [{ email: to, name: name || '' }],
        subject,
        textContent: text,
        htmlContent: html,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.code || json.message) {
      throw new Error(json.message || 'Failed to send email via Brevo');
    }
  }

  return { skipped: false };
}

export async function sendResetPasswordEmail({ to, name, code }) {
  const resendKey = process.env.RESEND_API_KEY;
  const brevoKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  if (!resendKey && !brevoKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Email API key missing. Reset code for ${to}: ${code}`);
      return { skipped: true };
    }
    throw new Error('Email service (Resend or Brevo) is not configured');
  }

  const subject = 'Reset your BookmarkVault password';
  const text = `Hi ${name || 'there'}, your BookmarkVault password reset code is ${code}. It expires in 10 minutes.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <h2>Reset your BookmarkVault password</h2>
      <p>Hi ${name || 'there'}, use this code to reset your password:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:20px 0">${code}</div>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;

  if (resendKey) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `BookmarkVault <${emailFrom}>`,
        to,
        subject,
        text,
        html,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) {
      throw new Error(json.message || json.error?.message || 'Failed to send email via Resend');
    }
  } else if (brevoKey) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'BookmarkVault', email: emailFrom },
        to: [{ email: to, name: name || '' }],
        subject,
        textContent: text,
        htmlContent: html,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.code || json.message) {
      throw new Error(json.message || 'Failed to send email via Brevo');
    }
  }

  return { skipped: false };
}
