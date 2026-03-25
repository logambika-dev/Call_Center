import { Request, Response } from 'express';
import { callService } from '../services/call.service';
import type { EndCallDto } from '../types';
import * as R from '../utils/response';

export const callController = {
  async getActive(req: Request, res: Response): Promise<void> {
    const calls = await callService.getActive(req.user!.sub);
    R.ok(res, calls, { count: calls.length });
  },

  async getHistory(req: Request, res: Response): Promise<void> {
    const limit = Number(req.query.limit) || 50;
    const calls = await callService.getHistory(req.user!.sub, limit);
    R.ok(res, calls, { count: calls.length });
  },

  async getOne(req: Request, res: Response): Promise<void> {
    const call = await callService.getById(req.params.id, req.user!.sub);
    if (!call) { R.notFound(res, 'Call'); return; }
    R.ok(res, call);
  },

  async startOutbound(req: Request, res: Response): Promise<void> {
    const { agentId, toNumber } = req.body as { agentId: string; toNumber: string };
    try {
      const call = await callService.startOutbound(req.user!.sub, agentId, toNumber);
      R.created(res, call);
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message: string };
      if (e.statusCode === 404) { R.notFound(res, 'Agent'); return; }
      throw err;
    }
  },

  async endCall(req: Request, res: Response): Promise<void> {
    const call = await callService.endCall(req.params.id, req.user!.sub, req.body as EndCallDto);
    if (!call) { R.notFound(res, 'Call'); return; }
    R.ok(res, call);
  },
};
