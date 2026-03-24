import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { createAgentSchema, updateAgentSchema } from '../validators/agent.validator';
import { agentService } from '../services/agent.service';
import { templateService } from '../services/template.service';
import * as R from '../utils/response';

const router = Router();
router.use(requireAuth);

/** GET /api/v1/agents — list all agents */
router.get('/', asyncHandler(async (req, res) => {
  const agents = await agentService.list(req.user!.sub);
  R.ok(res, agents, { count: agents.length });
}));

/** POST /api/v1/agents — create agent */
router.post('/', validate(createAgentSchema), asyncHandler(async (req, res) => {
  const agent = await agentService.create(req.user!.sub, req.body);
  R.created(res, agent);
}));

/** GET /api/v1/agents/:id — get single agent */
router.get('/:id', asyncHandler(async (req, res) => {
  const agent = await agentService.get(req.params.id, req.user!.sub);
  if (!agent) return R.notFound(res, 'Agent');
  R.ok(res, agent);
}));

/** PATCH /api/v1/agents/:id — partial update */
router.patch('/:id', validate(updateAgentSchema), asyncHandler(async (req, res) => {
  const agent = await agentService.update(req.params.id, req.user!.sub, req.body);
  if (!agent) return R.notFound(res, 'Agent');
  R.ok(res, agent);
}));

/** DELETE /api/v1/agents/:id — soft-delete (archive) */
router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await agentService.archive(req.params.id, req.user!.sub);
  if (!deleted) return R.notFound(res, 'Agent');
  R.noContent(res);
}));

/** POST /api/v1/agents/from-template/:templateId — create from template */
router.post('/from-template/:templateId', asyncHandler(async (req, res) => {
  const template = await templateService.getById(req.params.templateId);
  if (!template) return R.notFound(res, 'Template');

  const agent = await agentService.create(req.user!.sub, {
    name:         req.body.name ?? template.name,
    mode:         'template',
    systemPrompt: template.systemPrompt,
    firstMessage: template.firstMessage,
    language:     template.language,
    llmModel:     template.llmModel as never,
    templateId:   template.id,
  });
  R.created(res, agent);
}));

export default router;
