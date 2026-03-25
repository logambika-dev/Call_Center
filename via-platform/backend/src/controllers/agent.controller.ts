import { Request, Response } from 'express';
import { agentService } from '../services/agent.service';
import { templateService } from '../services/template.service';
import type { CreateAgentDto, UpdateAgentDto } from '../types';
import * as R from '../utils/response';

export const agentController = {
  async list(req: Request, res: Response): Promise<void> {
    const agents = await agentService.list(req.user!.sub);
    R.ok(res, agents, { count: agents.length });
  },

  async getOne(req: Request, res: Response): Promise<void> {
    const agent = await agentService.get(req.params.id, req.user!.sub);
    if (!agent) { R.notFound(res, 'Agent'); return; }
    R.ok(res, agent);
  },

  async create(req: Request, res: Response): Promise<void> {
    const agent = await agentService.create(req.user!.sub, req.body as CreateAgentDto);
    R.created(res, agent);
  },

  async update(req: Request, res: Response): Promise<void> {
    const agent = await agentService.update(req.params.id, req.user!.sub, req.body as UpdateAgentDto);
    if (!agent) { R.notFound(res, 'Agent'); return; }
    R.ok(res, agent);
  },

  async archive(req: Request, res: Response): Promise<void> {
    const deleted = await agentService.archive(req.params.id, req.user!.sub);
    if (!deleted) { R.notFound(res, 'Agent'); return; }
    R.noContent(res);
  },

  async createFromTemplate(req: Request, res: Response): Promise<void> {
    const template = await templateService.getById(req.params.templateId);
    if (!template) { R.notFound(res, 'Template'); return; }

    const agent = await agentService.create(req.user!.sub, {
      name:         (req.body as { name?: string }).name ?? template.name,
      mode:         'template',
      systemPrompt: template.systemPrompt,
      firstMessage: template.firstMessage,
      language:     template.language,
      llmModel:     template.llmModel as CreateAgentDto['llmModel'],
      templateId:   template.id,
    });
    R.created(res, agent);
  },
};
