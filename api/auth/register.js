import dbConnect from '../_lib/mongodb.js';
import { User } from '../_lib/models.js';
import { createVerificationCode, hashPassword, hashValue } from '../_lib/auth.js';
import { sendVerificationEmail } from '../_lib/mailer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await dbConnect();
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!name || !email || password.length < 6) return res.status(400).json({ error: 'Name, email and 6+ character password required' });
  if (await User.exists({ email })) return res.status(409).json({ error: 'Email already registered' });
  const { salt, passwordHash } = hashPassword(password);
  const code = createVerificationCode();
  const user = await User.create({
    name,
    email,
    salt,
    passwordHash,
    emailVerified: false,
    verificationCodeHash: hashValue(code),
    verificationExpires: new Date(Date.now() + 10 * 60 * 1000),
  });
  await sendVerificationEmail({ to: email, name, code });
  return res.status(201).json({ requiresVerification: true, email: user.email, message: 'Verification code sent' });
}
