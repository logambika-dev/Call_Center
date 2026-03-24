import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { serverError } from '../utils/response';

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  serverError(res);
}
