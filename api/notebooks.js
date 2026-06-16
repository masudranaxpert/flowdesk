import dbConnect from './_lib/mongodb.js';
import { Notebook } from './_lib/models.js';
import { requireUser } from './_lib/auth.js';

export default async function handler(req, res) {
  await dbConnect();
  const user = await requireUser(req, res);
  if (!user) return;
  const { method, query } = req;

  switch (method) {
    case 'GET': {
      const filter = { userId: user._id };
      if (query.search) filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { content: { $regex: query.search, $options: 'i' } },
        { tags: { $regex: query.search, $options: 'i' } },
      ];
      if (query.category && query.category !== 'all') filter.category = query.category;
      const items = await Notebook.find(filter).sort({ isPinned: -1, updatedAt: -1 });
      return res.json(items);
    }
    case 'POST': {
      const item = await Notebook.create({ ...req.body, userId: user._id });
      return res.status(201).json(item);
    }
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
