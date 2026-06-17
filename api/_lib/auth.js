const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSecret() {
  return String(
    globalThis.APP_ENV?.AUTH_SECRET ||
    globalThis.APP_ENV?.JWT_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.JWT_SECRET ||
    'bookmark-vault-dev-secret'
  ).trim().replace(/^["']|["']$/g, '');
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

function hexToBytes(hex) {
  if (!hex || hex.length % 2 !== 0) {
    return new Uint8Array();
  }

  const result = new Uint8Array(hex.length / 2);

  for (let i = 0; i < result.length; i += 1) {
    result[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return result;
}

function bytesToBase64Url(bytes) {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/g, '');
}

function base64UrlToBytes(value) {
  const base64 = value
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function stringToBase64Url(value) {
  return bytesToBase64Url(encoder.encode(value));
}

function base64UrlToString(value) {
  return decoder.decode(base64UrlToBytes(value));
}

function randomHex(byteLength = 16) {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function importHmacKey() {
  return globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign', 'verify']
  );
}

async function sign(value) {
  const key = await importHmacKey();

  const signature = await globalThis.crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(value)
  );

  return bytesToBase64Url(new Uint8Array(signature));
}

async function derivePassword(password, salt) {
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await globalThis.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 120000,
      hash: 'SHA-512',
    },
    keyMaterial,
    512
  );

  return bytesToHex(new Uint8Array(derivedBits));
}

function constantTimeEqual(left, right) {
  const a = hexToBytes(left);
  const b = hexToBytes(right);

  if (a.length !== b.length) return false;

  let difference = 0;

  for (let i = 0; i < a.length; i += 1) {
    difference |= a[i] ^ b[i];
  }

  return difference === 0;
}

export async function hashPassword(
  password,
  salt = randomHex(16)
) {
  const passwordHash = await derivePassword(password, salt);
  return { salt, passwordHash };
}

export function createVerificationCode() {
  const values = new Uint32Array(1);
  globalThis.crypto.getRandomValues(values);
  return String(100000 + (values[0] % 900000));
}

export async function hashValue(value) {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    encoder.encode(`${getSecret()}:${value}`)
  );

  return bytesToHex(new Uint8Array(digest));
}

export async function verifyPassword(
  password,
  salt,
  passwordHash
) {
  const calculatedHash = await derivePassword(password, salt);
  return constantTimeEqual(calculatedHash, passwordHash);
}

export async function createToken(user) {
  const payload = stringToBase64Url(
    JSON.stringify({
      id: String(user.id || user._id),
      email: user.email,
      name: user.name,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    })
  );

  return `${payload}.${await sign(payload)}`;
}

export async function verifyToken(token) {
  try {
    if (!token || !token.includes('.')) return null;

    const [payload, suppliedSignature] = token.split('.');

    if (!payload || !suppliedSignature) return null;

    const expectedSignature = await sign(payload);

    if (expectedSignature !== suppliedSignature) return null;

    const data = JSON.parse(base64UrlToString(payload));

    if (!data.exp || Date.now() > data.exp) return null;

    return data;
  } catch {
    return null;
  }
}
