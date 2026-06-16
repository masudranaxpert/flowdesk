import dbConnect from '../_lib/mongodb.js';
import { User } from '../_lib/models.js';
import { createVerificationCode, hashValue } from '../_lib/auth.js';
import { sendVerificationEmail } from '../_lib/mailer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await dbConnect();
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'Account not found' });
  if (user.emailVerified) return res.json({ message: 'Email already verified' });
  const code = createVerificationCode();
  user.verificationCodeHash = hashValue(code);
  user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  await sendVerificationEmail({ to: user.email, name: user.name, code });
  return res.json({ message: 'Verification code sent' });
}
