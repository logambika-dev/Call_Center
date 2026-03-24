import { Response } from 'express';

interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

interface ApiError {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

export function ok<T>(res: Response, data: T, meta?: Record<string, unknown>): void {
  const body: ApiSuccess<T> = { success: true, data };
  if (meta) body.meta = meta;
  res.status(200).json(body);
}

export function created<T>(res: Response, data: T): void {
  res.status(201).json({ success: true, data } satisfies ApiSuccess<T>);
}

export function noContent(res: Response): void {
  res.status(204).send();
}

export function badRequest(res: Response, message: string, details?: unknown): void {
  res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message, details } } satisfies ApiError);
}

export function unauthorized(res: Response, message = 'Unauthorized'): void {
  res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message } } satisfies ApiError);
}

export function forbidden(res: Response, message = 'Forbidden'): void {
  res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message } } satisfies ApiError);
}

export function notFound(res: Response, resource = 'Resource'): void {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `${resource} not found` } } satisfies ApiError);
}

export function unprocessable(res: Response, details: unknown): void {
  res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details } } satisfies ApiError);
}

export function serverError(res: Response, message = 'Internal server error'): void {
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } } satisfies ApiError);
}
