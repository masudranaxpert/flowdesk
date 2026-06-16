import dbConnect from '../_lib/mongodb.js';
import { requireUser } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  await dbConnect();
  const user = await requireUser(req, res);
  if (!user) return;
  return res.json({ user: { id: user._id, name: user.name, email: user.email } });
}
