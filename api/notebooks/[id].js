import dbConnect from '../_lib/mongodb.js';
import { Notebook } from '../_lib/models.js';
import { requireUser } from '../_lib/auth.js';

export default async function handler(req, res) {
  await dbConnect();
  const { method, query } = req;
  const { id } = query;
  const user = method === 'GET' ? null : await requireUser(req, res);
  if (method !== 'GET' && !user) return;

  switch (method) {
    case 'GET': {
      const item = await Notebook.findById(id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      return res.json(item);
    }
    case 'PUT': {
      const item = await Notebook.findOneAndUpdate({ _id: id, userId: user._id }, req.body, { new: true });
      if (!item) return res.status(404).json({ error: 'Not found' });
      return res.json(item);
    }
    case 'DELETE': {
      const item = await Notebook.findOneAndDelete({ _id: id, userId: user._id });
      if (!item) return res.status(404).json({ error: 'Not found' });
      return res.json({ message: 'Deleted' });
    }
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
