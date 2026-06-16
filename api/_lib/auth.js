import crypto from 'crypto';
import { User } from './models.js';

const SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || process.env.MONGODB_URI || 'bookmark-vault-dev-secret';

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(value) {
  return crypto.createHmac('sha256', SECRET).update(value).digest('base64url');
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const passwordHash = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return { salt, passwordHash };
}

export function createVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashValue(value) {
  return crypto.createHash('sha256').update(`${SECRET}:${value}`).digest('hex');
}

export function verifyPassword(password, salt, passwordHash) {
  return crypto.timingSafeEqual(
    Buffer.from(hashPassword(password, salt).passwordHash, 'hex'),
    Buffer.from(passwordHash, 'hex')
  );
}

export function createToken(user) {
  const payload = base64url(JSON.stringify({ id: String(user._id), email: user.email, name: user.name, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 }));
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  if (sign(payload) !== signature) return null;
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (!data.exp || Date.now() > data.exp) return null;
  return data;
}

export async function requireUser(req, res) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const session = verifyToken(token);
  if (!session?.id) {
    res.status(401).json({ error: 'Login required' });
    return null;
  }
  const user = await User.findById(session.id).select('_id name email').lean();
  if (!user) {
    res.status(401).json({ error: 'Login required' });
    return null;
  }
  return user;
}
