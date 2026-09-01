import { NextFunction, Request, RequestHandler, Response } from 'express';

export class ValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const validateCreateJob: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const { jobType, payload, scheduledAt, priority, maxRetries } = req.body as Record<
    string,
    unknown
  >;
  if (typeof jobType !== 'string' || jobType.trim().length === 0) {
    return next(new ValidationError('jobType must be a non-empty string'));
  }
  if (!isPlainObject(payload)) {
    return next(new ValidationError('payload must be a JSON object'));
  }
  if (
    scheduledAt !== undefined &&
    (typeof scheduledAt !== 'string' || Number.isNaN(Date.parse(scheduledAt)))
  ) {
    return next(new ValidationError('scheduledAt must be a valid ISO date string'));
  }
  if (
    priority !== undefined &&
    (typeof priority !== 'number' || !Number.isInteger(priority) || priority < 0 || priority > 100)
  ) {
    return next(new ValidationError('priority must be an integer between 0 and 100'));
  }
  if (
    maxRetries !== undefined &&
    (typeof maxRetries !== 'number' ||
      !Number.isInteger(maxRetries) ||
      maxRetries < 0 ||
      maxRetries > 100)
  ) {
    return next(new ValidationError('maxRetries must be an integer between 0 and 100'));
  }
  next();
};

export const validateJobId: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (typeof req.params.id !== 'string' || req.params.id.trim().length === 0) {
    return next(new ValidationError('id must be a non-empty string'));
  }
  next();
};

export const validatePagination: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
  if (!Number.isInteger(page) || page < 1) {
    return next(new ValidationError('page must be a positive integer'));
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return next(new ValidationError('limit must be an integer between 1 and 100'));
  }
  next();
};
