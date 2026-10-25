import {
  createTaskSchema,
  idSchema,
  listTasksQuerySchema,
  updateTaskSchema,
} from '@taskflow/shared';
import { Router } from 'express';
import { z } from 'zod';
import { getUserId } from '../../middleware/auth';
import { commentRouter } from '../comments/comment.routes';
import * as taskService from './task.service';

// mergeParams exposes :projectId from the parent router.
export const taskRouter = Router({ mergeParams: true });

const projectParams = z.object({ projectId: idSchema });
const taskParams = projectParams.extend({ taskId: idSchema });

taskRouter.get('/', async (req, res) => {
  const { projectId } = projectParams.parse(req.params);
  const query = listTasksQuerySchema.parse(req.query);
  res.json(await taskService.list(projectId, getUserId(req), query));
});

taskRouter.post('/', async (req, res) => {
  const { projectId } = projectParams.parse(req.params);
  const input = createTaskSchema.parse(req.body);
  res.status(201).json(await taskService.create(projectId, getUserId(req), input));
});

taskRouter.patch('/:taskId', async (req, res) => {
  const { projectId, taskId } = taskParams.parse(req.params);
  const input = updateTaskSchema.parse(req.body);
  res.json(await taskService.update(projectId, taskId, getUserId(req), input));
});

taskRouter.delete('/:taskId', async (req, res) => {
  const { projectId, taskId } = taskParams.parse(req.params);
  await taskService.remove(projectId, taskId, getUserId(req));
  res.status(204).end();
});

taskRouter.use('/:taskId/comments', commentRouter);
