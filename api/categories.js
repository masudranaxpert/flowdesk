import dbConnect from './_lib/mongodb.js';
import { Category } from './_lib/models.js';
import { requireUser } from './_lib/auth.js';

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'category';
}

export default async function handler(req, res) {
  await dbConnect();
  const user = await requireUser(req, res);
  if (!user) return;
  const { method, query } = req;

  switch (method) {
    case 'GET': {
      const filter = { userId: user._id };
      if (query.scope && query.scope !== 'all') filter.$or = [{ scope: 'all' }, { scope: query.scope }];
      const items = await Category.find(filter).sort({ name: 1 });
      return res.json(items);
    }
    case 'POST': {
      const name = String(req.body.name || '').trim();
      if (!name) return res.status(400).json({ error: 'Category name is required' });
      const baseSlug = slugify(name);
      let slug = baseSlug;
      let suffix = 1;
      while (await Category.exists({ $or: [{ userId: user._id, slug }, { slug }] })) {
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
      }
      const item = await Category.create({
        name,
        slug,
        userId: user._id,
        scope: req.body.scope || 'all',
        color: req.body.color || 'primary',
      });
      return res.status(201).json(item);
    }
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
