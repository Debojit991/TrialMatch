const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
const UPLOADS_DIR = isVercel ? '/tmp' : path.join(__dirname, '../../uploads');

// Ensure uploads directory exists (wrapped in try-catch for read-only environments like Vercel)
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (err) {
  console.warn(`Warning: Could not create uploads directory at ${UPLOADS_DIR}:`, err.message);
}

// Generate a secure signed URL for accessing uploaded documents
function generateSignedUrl(filename, reqHost) {
  const secret = process.env.URL_SIGNING_SECRET || 'trialmatch-secure-secret-key-2026';
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour expiration
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${filename}:${expiresAt}`);
  const signature = hmac.digest('hex');

  const baseUrl = reqHost ? `http://${reqHost}` : 'http://localhost:5000';
  return `${baseUrl}/api/documents/file/${filename}?expires=${expiresAt}&signature=${signature}`;
}

// Verify signed URL signature
function verifySignedUrl(filename, expires, signature) {
  if (!expires || !signature) return false;
  if (Date.now() > parseInt(expires, 10)) return false;

  const secret = process.env.URL_SIGNING_SECRET || 'trialmatch-secure-secret-key-2026';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${filename}:${expires}`);
  const expectedSignature = hmac.digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

module.exports = {
  UPLOADS_DIR,
  generateSignedUrl,
  verifySignedUrl,
};
