import { Response } from 'express';

export function ok<T>(res: Response, data: T, meta?: Record<string, unknown>): void {
  res.status(200).json({ success: true, data, ...(meta && { meta }) });
}

export function created<T>(res: Response, data: T): void {
  res.status(201).json({ success: true, data });
}

export function noContent(res: Response): void {
  res.status(204).send();
}

export function badRequest(res: Response, message: string, details?: unknown): void {
  res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message, details } });
}

export function unauthorized(res: Response, message = 'Unauthorized'): void {
  res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message } });
}

export function notFound(res: Response, resource = 'Resource'): void {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `${resource} not found` } });
}

export function unprocessable(res: Response, details: unknown): void {
  res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details } });
}

export function serverError(res: Response, message = 'Internal server error'): void {
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } });
}
