import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { userRepository } from '../repositories/user.repository';
import type { User } from '../types';

export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
}

export interface AuthResult {
  user:  User;
  tokens: TokenPair;
}

function signTokens(userId: string, email: string): TokenPair {
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

export const authService = {
  async register(email: string, password: string, fullName?: string): Promise<AuthResult> {
    const exists = await userRepository.emailExists(email);
    if (exists) throw Object.assign(new Error('Email already registered'), { statusCode: 400 });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userRepository.create(email, passwordHash, fullName);
    return { user, tokens: signTokens(user.id, user.email) };
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const record = await userRepository.findByEmail(email);
    if (!record || !(await bcrypt.compare(password, record.passwordHash))) {
      throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }
    const { passwordHash: _, ...user } = record;
    return { user, tokens: signTokens(user.id, user.email) };
  },

  refreshTokens(refreshToken: string): TokenPair {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string; email: string };
      return signTokens(payload.sub, payload.email);
    } catch {
      throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
    }
  },
};
