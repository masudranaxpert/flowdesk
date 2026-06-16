import dbConnect from '../_lib/mongodb.js';
import { User } from '../_lib/models.js';
import { createToken, verifyPassword } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await dbConnect();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = await User.findOne({ email });
  if (!user || !verifyPassword(password, user.salt, user.passwordHash)) return res.status(401).json({ error: 'Invalid email or password' });
  if (user.emailVerified === false) return res.status(403).json({ error: 'Please verify your email before login', requiresVerification: true, email: user.email });
  return res.json({ token: createToken(user), user: { id: user._id, name: user.name, email: user.email } });
}
