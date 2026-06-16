import dbConnect from './_lib/mongodb.js';
import { Routine } from './_lib/models.js';
import { requireUser } from './_lib/auth.js';

export default async function handler(req, res) {
  await dbConnect();
  const user = await requireUser(req, res);
  if (!user) return;
  const { method, query } = req;

  switch (method) {
    case 'GET': {
      const filter = { userId: user._id };
      if (query.type && query.type !== 'all') filter.type = query.type;
      const items = await Routine.find(filter).sort({ dayOfWeek: 1, date: 1, startTime: 1 });
      return res.json(items);
    }
    case 'POST': {
      const item = await Routine.create({ ...req.body, userId: user._id });
      return res.status(201).json(item);
    }
    case 'DELETE': {
      await Routine.deleteMany(query.type && query.type !== 'all' ? { type: query.type, userId: user._id } : { userId: user._id });
      return res.json({ message: 'Reset complete' });
    }
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
