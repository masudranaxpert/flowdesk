import nodemailer from 'nodemailer';

export async function sendVerificationEmail({ to, name, code }) {
  const user = process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const from = process.env.EMAIL_FROM || user;

  if (!user || !pass) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Email env missing. Verification code for ${to}: ${code}`);
      return { skipped: true };
    }
    throw new Error('Email service is not configured');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `BookmarkVault <${from}>`,
    to,
    subject: 'Verify your BookmarkVault email',
    text: `Hi ${name || 'there'}, your BookmarkVault verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2>Verify your BookmarkVault email</h2>
        <p>Hi ${name || 'there'}, use this code to finish signup:</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:20px 0">${code}</div>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });

  return { skipped: false };
}
