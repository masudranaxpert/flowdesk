import dbConnect from '../_lib/mongodb.js';
import { User } from '../_lib/models.js';
import { createToken, hashValue } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await dbConnect();
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || '').trim();
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'Account not found' });
  if (user.emailVerified) return res.json({ token: createToken(user), user: { id: user._id, name: user.name, email: user.email } });
  if (!user.verificationExpires || user.verificationExpires.getTime() < Date.now()) return res.status(400).json({ error: 'Verification code expired' });
  if (user.verificationCodeHash !== hashValue(code)) return res.status(400).json({ error: 'Invalid verification code' });
  user.emailVerified = true;
  user.verificationCodeHash = '';
  user.verificationExpires = null;
  await user.save();
  return res.json({ token: createToken(user), user: { id: user._id, name: user.name, email: user.email } });
}
