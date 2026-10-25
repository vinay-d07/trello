import { addMemberSchema, createProjectSchema, idSchema } from '@taskflow/shared';
import { Router } from 'express';
import { z } from 'zod';
import { getUserId } from '../../middleware/auth';
import { taskRouter } from '../tasks/task.routes';
import * as projectService from './project.service';

export const projectRouter = Router();

const projectParams = z.object({ projectId: idSchema });

projectRouter.get('/', async (req, res) => {
  res.json({ items: await projectService.listForUser(getUserId(req)) });
});

projectRouter.post('/', async (req, res) => {
  const input = createProjectSchema.parse(req.body);
  res.status(201).json(await projectService.create(getUserId(req), input));
});

projectRouter.get('/:projectId', async (req, res) => {
  const { projectId } = projectParams.parse(req.params);
  res.json(await projectService.getById(projectId, getUserId(req)));
});

projectRouter.post('/:projectId/members', async (req, res) => {
  const { projectId } = projectParams.parse(req.params);
  const input = addMemberSchema.parse(req.body);
  res.status(201).json(await projectService.addMember(projectId, getUserId(req), input));
});

projectRouter.use('/:projectId/tasks', taskRouter);
