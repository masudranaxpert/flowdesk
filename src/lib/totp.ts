function base32Decode(encoded: string): ArrayBuffer {
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = encoded.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = new Uint8Array(Math.floor((cleaned.length * 5) / 8));
  for (let i = 0; i < cleaned.length; i++) {
    const charIndex = ALPHABET.indexOf(cleaned[i]);
    if (charIndex === -1) continue;
    value = (value << 5) | charIndex;
    bits += 5;
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return output.slice(0, index).buffer;
}

function intToArrayBuffer(num: number): ArrayBuffer {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  const high = Math.floor(num / 0x100000000);
  const low = num >>> 0;
  view.setUint32(0, high, false);
  view.setUint32(4, low, false);
  return buf;
}

export async function generateTOTP(secret: string, digits = 6, period = 30): Promise<string> {
  const keyData = base32Decode(secret.replace(/\s/g, ''));
  const counter = Math.floor(Date.now() / 1000 / period);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: { name: 'SHA-1' } },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, intToArrayBuffer(counter));
  const arr = new Uint8Array(sig);
  const offset = arr[arr.length - 1] & 0x0f;
  const code =
    ((arr[offset] & 0x7f) << 24) |
    ((arr[offset + 1] & 0xff) << 16) |
    ((arr[offset + 2] & 0xff) << 8) |
    (arr[offset + 3] & 0xff);
  return String(code % Math.pow(10, digits)).padStart(digits, '0');
}

export function totpProgress(period = 30): number {
  return ((period - (Math.floor(Date.now() / 1000) % period)) / period) * 100;
}

export function totpSecondsLeft(period = 30): number {
  return period - (Math.floor(Date.now() / 1000) % period);
}
