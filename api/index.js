import dbConnect from './_lib/mongodb.js';
import { User, Bookmark, Notebook, CodeSnippet, Question, Category, Routine, AiSetting, ChatHistory } from './_lib/models.js';
import { createToken, verifyPassword, hashPassword, createVerificationCode, hashValue, verifyToken } from './_lib/auth.js';
import { sendVerificationEmail } from './_lib/mailer.js';

async function requireUser(req, res) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const session = verifyToken(token);
  if (!session?.id) { res.status(401).json({ error: 'Login required' }); return null; }
  const user = await User.findById(session.id).select('_id name email');
  if (!user) { res.status(401).json({ error: 'Login required' }); return null; }
  return user;
}

function slugify(value) {
  return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'category';
}

const aiDefaults = {
  singleton: 'default', provider: 'gemini', geminiKey: '', geminiModel: 'gemma-3-27b-it',
  openRouterKey: '', openRouterModel: 'google/gemma-3-27b-it',
  openAiKey: '', openAiModel: 'gpt-4o-mini', multimodalEnabled: true, models: [],
};

const resourceMap = {
  bookmarks: Bookmark, notebooks: Notebook, codes: CodeSnippet,
  questions: Question, categories: Category, routines: Routine,
};

export default async function handler(req, res) {
  await dbConnect();
  const { method, query } = req;
  const url = new URL(req.url, 'http://localhost');
  const slug = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');

  try {
    if (slug === 'auth/login' && method === 'POST') {
      const email = String(req.body.email || '').trim().toLowerCase();
      const password = String(req.body.password || '');
      const user = await User.findOne({ email });
      if (!user || !verifyPassword(password, user.salt, user.passwordHash)) return res.status(401).json({ error: 'Invalid email or password' });
      if (user.emailVerified === false) return res.status(403).json({ error: 'Please verify your email before login', requiresVerification: true, email: user.email });
      return res.json({ token: createToken(user), user: { id: user._id, name: user.name, email: user.email } });
    }

    if (slug === 'auth/register' && method === 'POST') {
      const name = String(req.body.name || '').trim();
      const email = String(req.body.email || '').trim().toLowerCase();
      const password = String(req.body.password || '');
      if (!name || !email || password.length < 6) return res.status(400).json({ error: 'Name, email and 6+ character password required' });
      if (await User.exists({ email })) return res.status(409).json({ error: 'Email already registered' });
      const { salt, passwordHash } = hashPassword(password);
      const code = createVerificationCode();
      const user = await User.create({ name, email, salt, passwordHash, emailVerified: false, verificationCodeHash: hashValue(code), verificationExpires: new Date(Date.now() + 10 * 60 * 1000) });
      await sendVerificationEmail({ to: email, name, code });
      return res.status(201).json({ requiresVerification: true, email: user.email, message: 'Verification code sent' });
    }

    if (slug === 'auth/verify' && method === 'POST') {
      const email = String(req.body.email || '').trim().toLowerCase();
      const code = String(req.body.code || '').trim();
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: 'Account not found' });
      if (user.emailVerified) return res.json({ token: createToken(user), user: { id: user._id, name: user.name, email: user.email } });
      if (!user.verificationExpires || user.verificationExpires.getTime() < Date.now()) return res.status(400).json({ error: 'Verification code expired' });
      if (user.verificationCodeHash !== hashValue(code)) return res.status(400).json({ error: 'Invalid verification code' });
      user.emailVerified = true; user.verificationCodeHash = ''; user.verificationExpires = null;
      await user.save();
      return res.json({ token: createToken(user), user: { id: user._id, name: user.name, email: user.email } });
    }

    if (slug === 'auth/resend' && method === 'POST') {
      const email = String(req.body.email || '').trim().toLowerCase();
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: 'Account not found' });
      if (user.emailVerified) return res.json({ message: 'Email already verified' });
      const code = createVerificationCode();
      user.verificationCodeHash = hashValue(code); user.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendVerificationEmail({ to: user.email, name: user.name, code });
      return res.json({ message: 'Verification code sent' });
    }

    if (slug === 'auth/me' && method === 'GET') {
      const user = await requireUser(req, res);
      if (!user) return;
      return res.json({ user: { id: user._id, name: user.name, email: user.email } });
    }

    if (slug === 'chat-history') {
      const user = await requireUser(req, res);
      if (!user) return;
      if (method === 'GET') {
        const item = await ChatHistory.findOne({ userId: user._id });
        return res.json({ messages: item?.messages || [] });
      }
      if (method === 'PUT') {
        const messages = Array.isArray(req.body.messages) ? req.body.messages.slice(-30) : [];
        const item = await ChatHistory.findOneAndUpdate({ userId: user._id }, { userId: user._id, messages }, { upsert: true, new: true });
        return res.json({ messages: item.messages });
      }
      if (method === 'DELETE') {
        await ChatHistory.findOneAndDelete({ userId: user._id });
        return res.json({ message: 'History cleared' });
      }
    }

    if (slug === 'stats' && method === 'GET') {
      const user = await requireUser(req, res);
      if (!user) return;
      const filter = { userId: user._id };
      const [bookmarks, notebooks, codes, questions, solved] = await Promise.all([
        Bookmark.countDocuments(filter), Notebook.countDocuments(filter), CodeSnippet.countDocuments(filter),
        Question.countDocuments(filter), Question.countDocuments({ ...filter, isSolved: true }),
      ]);
      return res.json({ bookmarks, notebooks, codes, questions, solved });
    }

    if (slug === 'ai-settings') {
      const user = await requireUser(req, res);
      if (!user) return;
      const singleton = `user:${user._id}`;
      if (method === 'GET') {
        const item = await AiSetting.findOneAndUpdate({ userId: user._id, singleton }, { $setOnInsert: { ...aiDefaults, userId: user._id, singleton } }, { upsert: true, new: true });
        return res.json(item);
      }
      if (method === 'PUT') {
        const item = await AiSetting.findOneAndUpdate({ userId: user._id, singleton }, { ...aiDefaults, ...req.body, userId: user._id, singleton }, { upsert: true, new: true });
        return res.json(item);
      }
    }

    const parts = slug.split('/');
    const resource = parts[0];
    const id = parts[1] || null;

    if (resourceMap[resource]) {
      const Model = resourceMap[resource];

      if (method === 'DELETE' && !id && resource === 'routines') {
        const user = await requireUser(req, res);
        if (!user) return;
        await Routine.deleteMany(query.type && query.type !== 'all' ? { type: query.type, userId: user._id } : { userId: user._id });
        return res.json({ message: 'Reset complete' });
      }

      if (!id) {
        if (method === 'GET') {
          const user = await requireUser(req, res);
          if (!user) return;
          const filter = { userId: user._id };
          if (resource === 'bookmarks') {
            if (query.search) filter.$or = [{ title: { $regex: query.search, $options: 'i' } }, { url: { $regex: query.search, $options: 'i' } }, { tags: { $regex: query.search, $options: 'i' } }];
            if (query.category && query.category !== 'all') filter.category = query.category;
            if (query.favorite === 'true') filter.isFavorite = true;
          } else if (resource === 'notebooks') {
            if (query.search) filter.$or = [{ title: { $regex: query.search, $options: 'i' } }, { content: { $regex: query.search, $options: 'i' } }, { tags: { $regex: query.search, $options: 'i' } }];
            if (query.category && query.category !== 'all') filter.category = query.category;
          } else if (resource === 'codes') {
            if (query.search) filter.$or = [{ title: { $regex: query.search, $options: 'i' } }, { code: { $regex: query.search, $options: 'i' } }, { tags: { $regex: query.search, $options: 'i' } }];
            if (query.language && query.language !== 'all') filter.language = query.language;
            if (query.category && query.category !== 'all') filter.category = query.category;
            if (query.favorite === 'true') filter.isFavorite = true;
          } else if (resource === 'questions') {
            if (query.search) filter.$or = [{ title: { $regex: query.search, $options: 'i' } }, { tags: { $regex: query.search, $options: 'i' } }];
            if (query.difficulty && query.difficulty !== 'all') filter.difficulty = query.difficulty;
            if (query.platform && query.platform !== 'all') filter.platform = query.platform;
            if (query.category && query.category !== 'all') filter.category = query.category;
            if (query.solved === 'true') filter.isSolved = true;
            if (query.solved === 'false') filter.isSolved = false;
          } else if (resource === 'categories') {
            if (query.scope && query.scope !== 'all') filter.$or = [{ scope: 'all' }, { scope: query.scope }];
          } else if (resource === 'routines') {
            if (query.type && query.type !== 'all') filter.type = query.type;
          }
          const sort = resource === 'notebooks' ? { isPinned: -1, updatedAt: -1 }
            : resource === 'categories' ? { name: 1 }
            : resource === 'routines' ? { dayOfWeek: 1, date: 1, startTime: 1 }
            : { createdAt: -1 };
          const items = await Model.find(filter).sort(sort);
          return res.json(items);
        }

        if (method === 'POST') {
          const user = await requireUser(req, res);
          if (!user) return;
          if (resource === 'categories') {
            const name = String(req.body.name || '').trim();
            if (!name) return res.status(400).json({ error: 'Category name is required' });
            const baseSlug = slugify(name);
            let s = baseSlug; let suffix = 1;
            while (await Category.exists({ $or: [{ userId: user._id, slug: s }, { slug: s }] })) { suffix += 1; s = `${baseSlug}-${suffix}`; }
            const item = await Category.create({ name, slug: s, userId: user._id, scope: req.body.scope || 'all', color: req.body.color || 'primary' });
            return res.status(201).json(item);
          }
          const item = await Model.create({ ...req.body, userId: user._id });
          return res.status(201).json(item);
        }
      }

      if (id) {
        if (method === 'GET') {
          const item = await Model.findById(id);
          if (!item) return res.status(404).json({ error: 'Not found' });
          return res.json(item);
        }
        if (method === 'PUT') {
          const user = await requireUser(req, res);
          if (!user) return;
          const item = await Model.findOneAndUpdate({ _id: id, userId: user._id }, req.body, { new: true, runValidators: true });
          if (!item) return res.status(404).json({ error: 'Not found' });
          return res.json(item);
        }
        if (method === 'DELETE') {
          const user = await requireUser(req, res);
          if (!user) return;
          const item = await Model.findOneAndDelete({ _id: id, userId: user._id });
          if (!item) return res.status(404).json({ error: 'Not found' });
          return res.json({ message: 'Deleted' });
        }
      }
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
