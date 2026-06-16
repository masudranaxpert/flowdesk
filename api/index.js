import dbConnect from './_lib/mongodb.js';
import { User, Bookmark, Notebook, CodeSnippet, Question, Category, Routine, AiSetting, ChatHistory } from './_lib/models.js';
import { createToken, verifyPassword, hashPassword, createVerificationCode, hashValue, verifyToken } from './_lib/auth.js';
import { sendVerificationEmail, sendResetPasswordEmail } from './_lib/mailer.js';

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
      
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        if (existingUser.emailVerified) return res.status(409).json({ error: 'Email already registered' });
        const { salt, passwordHash } = hashPassword(password);
        const code = createVerificationCode();
        existingUser.name = name;
        existingUser.salt = salt;
        existingUser.passwordHash = passwordHash;
        existingUser.verificationCodeHash = hashValue(code);
        existingUser.verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
        await existingUser.save();
        await sendVerificationEmail({ to: email, name, code });
        return res.status(201).json({ requiresVerification: true, email: existingUser.email, message: 'Verification code sent' });
      }

      const { salt, passwordHash } = hashPassword(password);
      const code = createVerificationCode();
      const user = await User.create({ name, email, salt, passwordHash, emailVerified: false, verificationCodeHash: hashValue(code), verificationExpires: new Date(Date.now() + 10 * 60 * 1000) });
      await sendVerificationEmail({ to: email, name, code });
      return res.status(201).json({ requiresVerification: true, email: user.email, message: 'Verification code sent' });
    }

    if (slug === 'auth/forgot-password' && method === 'POST') {
      const email = String(req.body.email || '').trim().toLowerCase();
      const user = await User.findOne({ email });
      if (!user) {
        return res.json({ message: 'If the email is registered, a password reset code has been sent.' });
      }
      if (user.emailVerified === false) {
        return res.status(400).json({ error: 'This email is not verified yet. Please register or verify first.' });
      }
      const code = createVerificationCode();
      user.resetCodeHash = hashValue(code);
      user.resetExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendResetPasswordEmail({ to: user.email, name: user.name, code });
      return res.json({ message: 'Password reset code sent to your email.' });
    }

    if (slug === 'auth/reset-password' && method === 'POST') {
      const email = String(req.body.email || '').trim().toLowerCase();
      const code = String(req.body.code || '').trim();
      const newPassword = String(req.body.newPassword || '');
      if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: 'Account not found' });
      if (!user.resetExpires || user.resetExpires.getTime() < Date.now()) {
        return res.status(400).json({ error: 'Reset code expired' });
      }
      if (user.resetCodeHash !== hashValue(code)) {
        return res.status(400).json({ error: 'Invalid reset code' });
      }
      const { salt, passwordHash } = hashPassword(newPassword);
      user.salt = salt;
      user.passwordHash = passwordHash;
      user.resetCodeHash = '';
      user.resetExpires = null;
      await user.save();
      return res.json({ message: 'Password has been reset successfully' });
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

    if (slug === 'auth/profile' && method === 'PUT') {
      const user = await requireUser(req, res);
      if (!user) return;
      const name = String(req.body.name || '').trim();
      if (!name) return res.status(400).json({ error: 'Name is required' });
      const dbUser = await User.findById(user._id);
      if (!dbUser) return res.status(404).json({ error: 'User not found' });
      dbUser.name = name;
      await dbUser.save();
      return res.json({ message: 'Profile updated successfully', user: { id: dbUser._id, name: dbUser.name, email: dbUser.email } });
    }

    if (slug === 'auth/change-password' && method === 'PUT') {
      const user = await requireUser(req, res);
      if (!user) return;
      const currentPassword = String(req.body.currentPassword || '');
      const newPassword = String(req.body.newPassword || '');
      if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
      const dbUser = await User.findById(user._id);
      if (!dbUser) return res.status(404).json({ error: 'User not found' });
      if (!verifyPassword(currentPassword, dbUser.salt, dbUser.passwordHash)) {
        return res.status(400).json({ error: 'Incorrect current password' });
      }
      const { salt, passwordHash } = hashPassword(newPassword);
      dbUser.salt = salt;
      dbUser.passwordHash = passwordHash;
      await dbUser.save();
      return res.json({ message: 'Password changed successfully' });
    }

    if (slug === 'auth/profile' && method === 'DELETE') {
      const user = await requireUser(req, res);
      if (!user) return;
      const userId = user._id;
      await Promise.all([
        Bookmark.deleteMany({ userId }),
        Notebook.deleteMany({ userId }),
        CodeSnippet.deleteMany({ userId }),
        Question.deleteMany({ userId }),
        Category.deleteMany({ userId }),
        Routine.deleteMany({ userId }),
        AiSetting.deleteMany({ userId }),
        ChatHistory.deleteMany({ userId }),
        User.deleteOne({ _id: userId })
      ]);
      return res.json({ message: 'Account deleted permanently' });
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

    if (slug === 'search' && method === 'GET') {
      const user = await requireUser(req, res);
      if (!user) return;
      const q = String(query.q || '').trim();
      if (!q) return res.json([]);
      const escapedQ = q.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = { $regex: escapedQ, $options: 'i' };
      const filter = { userId: user._id };
      const [bookmarks, notebooks, codes, questions] = await Promise.all([
        Bookmark.find({ ...filter, $or: [{ title: regex }, { url: regex }, { tags: regex }] }).limit(5),
        Notebook.find({ ...filter, $or: [{ title: regex }, { content: regex }, { tags: regex }] }).limit(5),
        CodeSnippet.find({ ...filter, $or: [{ title: regex }, { code: regex }, { tags: regex }] }).limit(5),
        Question.find({ ...filter, $or: [{ title: regex }, { tags: regex }] }).limit(5),
      ]);
      const results = [
        ...bookmarks.map((item) => ({ id: item._id, type: 'Bookmark', title: item.title, subtitle: item.url, to: '/bookmarks' })),
        ...notebooks.map((item) => ({ id: item._id, type: 'Note', title: item.title, subtitle: item.category, to: '/notebooks' })),
        ...codes.map((item) => ({ id: item._id, type: 'Code', title: item.title, subtitle: item.language, to: '/codes' })),
        ...questions.map((item) => ({ id: item._id, type: 'Q&A', title: item.title, subtitle: item.platform, to: '/questions' })),
      ];
      return res.json(results);
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
          let searchFilter = null;
          if (query.search) {
            const escapedQ = String(query.search).trim().replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
            searchFilter = { $regex: escapedQ, $options: 'i' };
          }
          if (resource === 'bookmarks') {
            if (searchFilter) filter.$or = [{ title: searchFilter }, { url: searchFilter }, { tags: searchFilter }];
            if (query.category && query.category !== 'all') filter.category = query.category;
            if (query.favorite === 'true') filter.isFavorite = true;
          } else if (resource === 'notebooks') {
            if (searchFilter) filter.$or = [{ title: searchFilter }, { content: searchFilter }, { tags: searchFilter }];
            if (query.category && query.category !== 'all') filter.category = query.category;
          } else if (resource === 'codes') {
            if (searchFilter) filter.$or = [{ title: searchFilter }, { code: searchFilter }, { tags: searchFilter }];
            if (query.language && query.language !== 'all') filter.language = query.language;
            if (query.category && query.category !== 'all') filter.category = query.category;
            if (query.favorite === 'true') filter.isFavorite = true;
          } else if (resource === 'questions') {
            if (searchFilter) filter.$or = [{ title: searchFilter }, { tags: searchFilter }];
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

          if (query.page || query.limit) {
            const page = Number(query.page || 1);
            const limit = Number(query.limit || 10);
            const skip = (page - 1) * limit;

            const [items, total] = await Promise.all([
              Model.find(filter).sort(sort).skip(skip).limit(limit),
              Model.countDocuments(filter),
            ]);
            return res.json({ items, total });
          }

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
