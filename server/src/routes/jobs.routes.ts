import { Router, Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { jobsRepository } from '../repositories/jobs.repository.js';
import { executionLogsRepository } from '../repositories/execution-logs.repository.js';
import { ExecutionLogsService } from '../services/execution-logs.service.js';
import { deadLetterService } from '../services/dead-letter.service.js';
import {
  InvalidStateTransitionError,
  JobNotFoundError,
  JobsService,
} from '../services/jobs.service.js';
import {
  validateCreateJob,
  validateJobId,
  validatePagination,
} from '../middleware/jobs.validation.js';
import { publicDemoJobGuard } from '../middleware/public-demo.js';
import { injectCurrentContext } from '../observability/tracing.js';

const router = Router();
const service = new JobsService(jobsRepository);
const executionLogsService = new ExecutionLogsService(jobsRepository, executionLogsRepository);

router.get('/dlq', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({ data: await deadLetterService.list() });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/:id/retry',
  validateJobId,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json(await deadLetterService.replay(req.params.id));
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        res.status(404).json({ error: 'Not Found', message: error.message });
        return;
      }
      if (error instanceof InvalidStateTransitionError) {
        res.status(409).json({ error: 'Invalid State Transition', message: error.message });
        return;
      }
      next(error);
    }
  }
);

router.post(
  '/',
  publicDemoJobGuard,
  validateCreateJob,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as Record<string, unknown>;
      const job = await service.createJob({
        jobType: body.jobType as string,
        payload: body.payload as Prisma.InputJsonValue,
        scheduledAt:
          body.scheduledAt === undefined ? undefined : new Date(body.scheduledAt as string),
        priority: body.priority as number | undefined,
        maxRetries: body.maxRetries as number | undefined,
        idempotencyKey: req.header('Idempotency-Key') ?? undefined,
        requestId: res.locals.requestId,
        ...injectCurrentContext(),
      });
      res.status(201).json(job);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:id/cancel',
  validateJobId,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const job = await service.cancelJob(req.params.id);
      res.status(200).json(job);
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        res.status(404).json({ error: 'Not Found', message: error.message });
        return;
      }
      if (error instanceof InvalidStateTransitionError) {
        res.status(409).json({ error: 'Invalid State Transition', message: error.message });
        return;
      }
      next(error);
    }
  }
);

router.get(
  '/:id/executions',
  validateJobId,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(await executionLogsService.jobExists(req.params.id))) {
        res.status(404).json({ error: 'Not Found', message: 'Job not found' });
        return;
      }
      res.status(200).json({ data: await executionLogsService.listForJob(req.params.id) });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id', validateJobId, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await service.findJobById(req.params.id);
    if (job === null) {
      res.status(404).json({ error: 'Not Found', message: 'Job not found' });
      return;
    }
    res.status(200).json(job);
  } catch (error) {
    next(error);
  }
});

router.get('/', validatePagination, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
    const result = await service.listJobs(page, limit);
    res.status(200).json({
      data: result.jobs,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
