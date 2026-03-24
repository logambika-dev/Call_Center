import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { unprocessable } from '../utils/response';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = (result.error as ZodError).flatten().fieldErrors;
      unprocessable(res, errors);
      return;
    }
    req[source] = result.data;
    next();
  };
}
