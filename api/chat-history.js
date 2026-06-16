import dbConnect from './_lib/mongodb.js';
import { ChatHistory } from './_lib/models.js';
import { requireUser } from './_lib/auth.js';

export default async function handler(req, res) {
  await dbConnect();
  const user = await requireUser(req, res);
  if (!user) return;

  switch (req.method) {
    case 'GET': {
      const item = await ChatHistory.findOne({ userId: user._id });
      return res.json({ messages: item?.messages || [] });
    }
    case 'PUT': {
      const messages = Array.isArray(req.body.messages) ? req.body.messages.slice(-30) : [];
      const item = await ChatHistory.findOneAndUpdate(
        { userId: user._id },
        { userId: user._id, messages },
        { upsert: true, new: true }
      );
      return res.json({ messages: item.messages });
    }
    case 'DELETE': {
      await ChatHistory.findOneAndDelete({ userId: user._id });
      return res.json({ message: 'History cleared' });
    }
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
