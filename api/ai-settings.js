import dbConnect from './_lib/mongodb.js';
import { AiSetting } from './_lib/models.js';
import { requireUser } from './_lib/auth.js';

const defaults = {
  singleton: 'default',
  provider: 'gemini',
  geminiKey: '',
  geminiModel: 'gemma-3-27b-it',
  openRouterKey: '',
  openRouterModel: 'google/gemma-3-27b-it',
  openAiKey: '',
  openAiModel: 'gpt-4o-mini',
  multimodalEnabled: true,
  models: [],
};

export default async function handler(req, res) {
  await dbConnect();
  const user = await requireUser(req, res);
  if (!user) return;
  const singleton = `user:${user._id}`;

  switch (req.method) {
    case 'GET': {
      const item = await AiSetting.findOneAndUpdate(
        { userId: user._id, singleton },
        { $setOnInsert: { ...defaults, userId: user._id, singleton } },
        { upsert: true, new: true }
      );
      return res.json(item);
    }
    case 'PUT': {
      const item = await AiSetting.findOneAndUpdate(
        { userId: user._id, singleton },
        { ...defaults, ...req.body, userId: user._id, singleton },
        { upsert: true, new: true }
      );
      return res.json(item);
    }
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
