import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import * as R from '../utils/response';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const { email, password, fullName } = req.body as {
      email: string; password: string; fullName?: string;
    };
    try {
      const { user, tokens } = await authService.register(email, password, fullName);
      R.created(res, { user, ...tokens });
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message: string };
      if (e.statusCode === 400) { R.badRequest(res, e.message); return; }
      throw err;
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body as { email: string; password: string };
    try {
      const { user, tokens } = await authService.login(email, password);
      R.ok(res, { user, ...tokens });
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message: string };
      if (e.statusCode === 401) { R.unauthorized(res, e.message); return; }
      throw err;
    }
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body as { refreshToken: string };
    try {
      const tokens = authService.refreshTokens(refreshToken);
      R.ok(res, tokens);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message: string };
      if (e.statusCode === 401) { R.unauthorized(res, e.message); return; }
      throw err;
    }
  },
};
