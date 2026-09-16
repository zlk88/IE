import crypto from 'crypto';

const SECRET = process.env.AUTH_SECRET || 'default-secret-change-me';
const COOKIE_NAME = 'ie_auth_token';
const EXPIRES_SECONDS = 60 * 60 * 24; // 24 小时

// 生成签名 token
export function generateToken() {
  const payload = JSON.stringify({
    role: 'admin',
    exp: Date.now() + EXPIRES_SECONDS * 1000,
  });
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex');
  return Buffer.from(payload).toString('base64url') + '.' + signature;
}

// 校验 token
export function verifyToken(token) {
  if (!token) return false;
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return false;
    const payload = Buffer.from(payloadB64, 'base64url').toString();
    const expected = crypto
      .createHmac('sha256', SECRET)
      .update(payload)
      .digest('hex');
    if (signature !== expected) return false;
    const data = JSON.parse(payload);
    if (!data.exp || data.exp < Date.now()) return false;
    return data.role === 'admin';
  } catch {
    return false;
  }
}

export function getCookieName() {
  return COOKIE_NAME;
}

export function getExpiresSeconds() {
  return EXPIRES_SECONDS;
}

// 从请求里检查登录状态（给 API Route 用）
export function isAuthed(request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;
  return verifyToken(match[1]);
}
