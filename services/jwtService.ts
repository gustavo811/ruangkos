import { AuthUser, JwtHeader, JwtPayload } from '../types';

/**
 * RuangKos JWT Service
 * 
 * Implements standard JSON Web Token (RFC 7519) format:
 *   header.payload.signature
 * 
 * - Header: {"alg":"HS256","typ":"JWT"}
 * - Payload: claims including sub, email, name, role, kosName, roomNumber, iat, exp, iss, aud
 * - Signature: HMAC-SHA256 of "header.payload"
 */

const DEFAULT_SECRET = 'ruangkos_jwt_secret_key_k21_2026';
const TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 Hari

// --- Pure TypeScript Base64 & Base64Url Encoder/Decoder ---
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function utf8ToBytes(str: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) bytes.push(charcode);
    else if (charcode < 0x800) {
      bytes.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      bytes.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }
  return new Uint8Array(bytes);
}

function bytesToUtf8(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const c = bytes[i++];
    if (c < 128) {
      out += String.fromCharCode(c);
    } else if (c > 191 && c < 224) {
      const c2 = bytes[i++];
      out += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
    } else if (c > 223 && c < 240) {
      const c2 = bytes[i++];
      const c3 = bytes[i++];
      out += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
    } else {
      const c2 = bytes[i++];
      const c3 = bytes[i++];
      const c4 = bytes[i++];
      let u = (((c & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) - 0x10000;
      out += String.fromCharCode(0xd800 + (u >> 10), 0xdc00 + (u & 0x3ff));
    }
  }
  return out;
}

export function base64Encode(bytes: Uint8Array): string {
  let result = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;

    result += BASE64_CHARS.charAt(b0 >> 2);
    result += BASE64_CHARS.charAt(((b0 & 3) << 4) | (b1 >> 4));
    result += i + 1 < len ? BASE64_CHARS.charAt(((b1 & 15) << 2) | (b2 >> 6)) : '=';
    result += i + 2 < len ? BASE64_CHARS.charAt(b2 & 63) : '=';
  }
  return result;
}

export function base64Decode(str: string): Uint8Array {
  const clean = str.replace(/[^A-Za-z0-9+/=]/g, '');
  const bytes: number[] = [];
  let i = 0;
  while (i < clean.length) {
    const enc1 = BASE64_CHARS.indexOf(clean.charAt(i++));
    const enc2 = BASE64_CHARS.indexOf(clean.charAt(i++));
    const enc3 = BASE64_CHARS.indexOf(clean.charAt(i++));
    const enc4 = BASE64_CHARS.indexOf(clean.charAt(i++));

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    bytes.push(chr1);
    if (enc3 !== 64 && enc3 !== -1 && clean.charAt(i - 2) !== '=') bytes.push(chr2);
    if (enc4 !== 64 && enc4 !== -1 && clean.charAt(i - 1) !== '=') bytes.push(chr3);
  }
  return new Uint8Array(bytes);
}

export function base64UrlEncode(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? utf8ToBytes(input) : input;
  return base64Encode(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function base64UrlDecode(input: string): string {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return bytesToUtf8(base64Decode(base64));
}

// --- Pure TypeScript SHA-256 & HMAC-SHA256 ---
function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256(data: Uint8Array): Uint8Array {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = data[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  for (i = 0; i < data[lengthProperty]; i++) {
    words[i >> 2] |= data[i] << ((3 - (i % 4)) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  const w: number[] = [];
  for (i = 0; i < words[lengthProperty]; i += 16) {
    const oldHash = [...hash];

    for (j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[j + i] | 0;
      } else {
        const gamma0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const gamma1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (((w[j - 16] + gamma0) | 0) + ((w[j - 7] + gamma1) | 0)) | 0;
      }

      const s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (((((hash[7] + s1) | 0) + ch) | 0) + ((k[j] + w[j]) | 0)) | 0;
      const s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = ((s0 + maj) | 0);

      hash = [
        (temp1 + temp2) | 0,
        hash[0],
        hash[1],
        hash[2],
        (hash[3] + temp1) | 0,
        hash[4],
        hash[5],
        hash[6],
      ];
    }

    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  const outBytes = new Uint8Array(32);
  for (i = 0; i < 8; i++) {
    outBytes[i * 4] = (hash[i] >>> 24) & 0xff;
    outBytes[i * 4 + 1] = (hash[i] >>> 16) & 0xff;
    outBytes[i * 4 + 2] = (hash[i] >>> 8) & 0xff;
    outBytes[i * 4 + 3] = hash[i] & 0xff;
  }
  return outBytes;
}

function hmacSha256(keyBytes: Uint8Array, messageBytes: Uint8Array): Uint8Array {
  const blockSize = 64;
  let key = keyBytes;
  if (key.length > blockSize) {
    key = sha256(key);
  }
  if (key.length < blockSize) {
    const padded = new Uint8Array(blockSize);
    padded.set(key);
    key = padded;
  }

  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = key[i] ^ 0x5c;
    iKeyPad[i] = key[i] ^ 0x36;
  }

  const inner = new Uint8Array(iKeyPad.length + messageBytes.length);
  inner.set(iKeyPad);
  inner.set(messageBytes, iKeyPad.length);
  const innerHash = sha256(inner);

  const outer = new Uint8Array(oKeyPad.length + innerHash.length);
  outer.set(oKeyPad);
  outer.set(innerHash, oKeyPad.length);
  return sha256(outer);
}

// --- JWT Operations ---

/**
 * Generate a JWT token for a given authenticated user.
 */
export function generateUserJwt(user: AuthUser, expiresInSeconds = TOKEN_EXPIRY_SECONDS, secret = DEFAULT_SECRET): string {
  const now = Math.floor(Date.now() / 1000);

  const header: JwtHeader = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    roomNumber: user.roomNumber,
    kosName: user.kosName,
    iat: now,
    exp: now + expiresInSeconds,
    iss: 'ruangkos-auth-service',
    aud: 'ruangkos-mobile-client',
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signatureBytes = hmacSha256(utf8ToBytes(secret), utf8ToBytes(dataToSign));
  const encodedSignature = base64UrlEncode(signatureBytes);

  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Decode JWT without verifying signature (useful for inspecting claims on client).
 */
export function decodeJwt(token: string): { header: JwtHeader; payload: JwtPayload; signature: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const header = JSON.parse(base64UrlDecode(parts[0])) as JwtHeader;
    const payload = JSON.parse(base64UrlDecode(parts[1])) as JwtPayload;

    return {
      header,
      payload,
      signature: parts[2],
    };
  } catch (err) {
    return null;
  }
}

/**
 * Verify JWT signature and expiration.
 */
export function verifyJwt(
  token: string,
  secret = DEFAULT_SECRET
): { valid: boolean; payload?: JwtPayload; error?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Format token tidak valid (harus 3 bagian: Header.Payload.Signature)' };
    }

    const dataToSign = `${parts[0]}.${parts[1]}`;
    const expectedSigBytes = hmacSha256(utf8ToBytes(secret), utf8ToBytes(dataToSign));
    const expectedSig = base64UrlEncode(expectedSigBytes);

    if (parts[2] !== expectedSig) {
      return { valid: false, error: 'Tanda tangan kriptografis token tidak cocok / dipalsukan' };
    }

    const payload = JSON.parse(base64UrlDecode(parts[1])) as JwtPayload;
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token telah kedaluwarsa (Expired). Silakan masuk kembali.' };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: 'Gagal memverifikasi token' };
  }
}

/**
 * Check if token is expired.
 */
export function isJwtExpired(token: string): boolean {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.payload.exp) return true;
  return decoded.payload.exp < Math.floor(Date.now() / 1000);
}

/**
 * Format Bearer authorization header string
 */
export function createBearerAuthHeader(token: string): string {
  return `Bearer ${token}`;
}
