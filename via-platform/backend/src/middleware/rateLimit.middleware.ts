import rateLimit from 'express-rate-limit';

const msg = (code: string, message: string) => ({
  success: false, error: { code, message },
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  standardHeaders: true, legacyHeaders: false,
  message: msg('RATE_LIMITED', 'Too many requests'),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: msg('RATE_LIMITED', 'Too many auth attempts'),
});

export const callLimiter = rateLimit({
  windowMs: 60 * 1000, max: 30,
  standardHeaders: true, legacyHeaders: false,
  message: msg('RATE_LIMITED', 'Call rate limit exceeded'),
});
