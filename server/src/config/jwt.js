const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cricketverse_default_fallback_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
};

module.exports = {
  signToken,
  verifyToken,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
