import dbConnect from './_lib/mongodb.js';
import { Bookmark, Notebook, CodeSnippet, Question } from './_lib/models.js';
import { requireUser } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await dbConnect();
    const user = await requireUser(req, res);
    if (!user) return;
    const filter = { userId: user._id };
    const [bookmarks, notebooks, codes, questions, solved] = await Promise.all([
      Bookmark.countDocuments(filter),
      Notebook.countDocuments(filter),
      CodeSnippet.countDocuments(filter),
      Question.countDocuments(filter),
      Question.countDocuments({ ...filter, isSolved: true }),
    ]);
    res.json({ bookmarks, notebooks, codes, questions, solved });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
