import dbConnect from '../_lib/mongodb.js';
import { Category } from '../_lib/models.js';
import { requireUser } from '../_lib/auth.js';

export default async function handler(req, res) {
  await dbConnect();
  const user = await requireUser(req, res);
  if (!user) return;
  const { method, query } = req;
  const { id } = query;

  switch (method) {
    case 'PUT': {
      const item = await Category.findOneAndUpdate({ _id: id, userId: user._id }, req.body, { new: true, runValidators: true });
      if (!item) return res.status(404).json({ error: 'Not found' });
      return res.json(item);
    }
    case 'DELETE': {
      const item = await Category.findOneAndDelete({ _id: id, userId: user._id });
      if (!item) return res.status(404).json({ error: 'Not found' });
      return res.json({ message: 'Deleted' });
    }
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
