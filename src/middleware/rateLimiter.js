const rateLimit = require('express-rate-limit');

const strict = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10,
  message: { message: 'Too many requests, slow down.' }
});

const moderate = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: 'Too many requests, slow down.' }
});

module.exports = { strict, moderate };
