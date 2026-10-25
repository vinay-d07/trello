import { createCommentSchema, idSchema, paginationQuerySchema } from '@taskflow/shared';
import { Router } from 'express';
import { z } from 'zod';
import { getUserId } from '../../middleware/auth';
import * as commentService from './comment.service';

export const commentRouter = Router({ mergeParams: true });

const params = z.object({ projectId: idSchema, taskId: idSchema });

commentRouter.get('/', async (req, res) => {
  const { projectId, taskId } = params.parse(req.params);
  const query = paginationQuerySchema.parse(req.query);
  res.json(await commentService.list(projectId, taskId, getUserId(req), query));
});

commentRouter.post('/', async (req, res) => {
  const { projectId, taskId } = params.parse(req.params);
  const input = createCommentSchema.parse(req.body);
  res.status(201).json(await commentService.create(projectId, taskId, getUserId(req), input));
});
