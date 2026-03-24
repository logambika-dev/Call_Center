import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { templateService } from '../services/template.service';
import * as R from '../utils/response';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { category } = req.query as { category?: string };
  const templates = await templateService.list(category);
  R.ok(res, templates, { count: templates.length });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const template = await templateService.getById(req.params.id);
  if (!template) return R.notFound(res, 'Template');
  R.ok(res, template);
}));

export default router;
