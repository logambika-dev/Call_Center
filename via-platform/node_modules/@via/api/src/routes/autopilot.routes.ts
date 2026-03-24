import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { autopilotGenerateSchema } from '../validators/agent.validator';
import { autopilotService } from '../services/autopilot.service';
import * as R from '../utils/response';

const router = Router();
router.use(requireAuth);

/**
 * POST /api/v1/autopilot/generate
 * Server-Sent Events stream of Claude generation tokens.
 * Final event: `complete` with full AutopilotResult JSON.
 */
router.post('/generate', validate(autopilotGenerateSchema), asyncHandler(async (req, res) => {
  await autopilotService.generateStream(req.user!.sub, req.body, res);
}));

/**
 * POST /api/v1/autopilot/refine
 * Non-streaming. Takes existing systemPrompt + feedback, returns refined version.
 */
router.post('/refine', asyncHandler(async (req, res) => {
  const { systemPrompt, feedback } = req.body as { systemPrompt: string; feedback: string };
  if (!systemPrompt || !feedback) {
    return R.badRequest(res, 'systemPrompt and feedback are required');
  }
  const result = await autopilotService.refine(systemPrompt, feedback);
  R.ok(res, result);
}));

export default router;
