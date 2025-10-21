const crypto = require('crypto');

const ITERATIONS = 150000;
const KEYLEN = 64;
const DIGEST = 'sha512';

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derivedKey = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password, hashedValue) {
  if (!hashedValue) {
    return false;
  }

  const [salt, storedKey] = hashedValue.split(':');
  if (!salt || !storedKey) {
    return false;
  }

  const derivedKey = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');

  return crypto.timingSafeEqual(Buffer.from(storedKey, 'hex'), Buffer.from(derivedKey, 'hex'));
}

module.exports = {
  hashPassword,
  verifyPassword,
};
