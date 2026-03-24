import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../config/database';
import { env } from '../config/env';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate.middleware';
import * as R from '../utils/response';

const router = Router();

const registerSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1).max(255).optional(),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

function signTokens(userId: string, email: string) {
  const accessToken = jwt.sign(
    { sub: userId, email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions['expiresIn'] }
  );
  const refreshToken = jwt.sign(
    { sub: userId, email },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_TTL as jwt.SignOptions['expiresIn'] }
  );
  return { accessToken, refreshToken };
}

router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  const { email, password, fullName } = req.body as z.infer<typeof registerSchema>;

  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) return R.badRequest(res, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, full_name) VALUES ($1,$2,$3) RETURNING id, email, full_name, plan, created_at`,
    [email, passwordHash, fullName ?? null]
  );
  const user = rows[0];
  const tokens = signTokens(user.id, user.email);
  R.created(res, { user: { id: user.id, email: user.email, fullName: user.full_name, plan: user.plan }, ...tokens });
}));

router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;

  const { rows } = await db.query(
    `SELECT id, email, password_hash, full_name, plan FROM users WHERE email = $1`, [email]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return R.unauthorized(res, 'Invalid credentials');
  }
  const tokens = signTokens(user.id, user.email);
  R.ok(res, { user: { id: user.id, email: user.email, fullName: user.full_name, plan: user.plan }, ...tokens });
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body as { refreshToken: string };
  if (!refreshToken) return R.badRequest(res, 'refreshToken required');
  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string; email: string };
    const tokens = signTokens(payload.sub, payload.email);
    R.ok(res, tokens);
  } catch {
    R.unauthorized(res, 'Invalid refresh token');
  }
}));

export default router;
