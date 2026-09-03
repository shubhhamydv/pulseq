import type { NextFunction, Request, Response } from 'express';

const PUBLIC_JOB_TYPES = new Set(
  (
    process.env.DEMO_ALLOWED_JOB_TYPES ??
    'EMAIL_NOTIFICATION,REPORT_GENERATION,WEBHOOK,IMAGE_PROCESSING'
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);

const windowMs = Number(process.env.DEMO_RATE_WINDOW_MS ?? 60_000);
const maxRequests = Number(process.env.DEMO_RATE_LIMIT ?? 10);
const maxRetries = Number(process.env.DEMO_MAX_RETRIES ?? 5);
const maxPayloadBytes = Number(process.env.DEMO_MAX_PAYLOAD_BYTES ?? 10_240);
const buckets = new Map<string, { startedAt: number; count: number }>();

const isDemoMode = (): boolean => process.env.DEMO_MODE === 'true';

const clientKey = (req: Request): string => {
  const forwarded = req.header('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || req.ip || 'unknown-client';
};

const reject = (res: Response, status: number, message: string): void => {
  res
    .status(status)
    .json({ error: status === 429 ? 'Rate Limit Exceeded' : 'Demo Validation Error', message });
};

export const publicDemoJobGuard = (req: Request, res: Response, next: NextFunction): void => {
  if (!isDemoMode()) {
    next();
    return;
  }

  const now = Date.now();
  const key = clientKey(req);
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.startedAt >= windowMs) {
    buckets.set(key, { startedAt: now, count: 1 });
  } else {
    bucket.count += 1;
    if (bucket.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((windowMs - (now - bucket.startedAt)) / 1000));
      reject(res, 429, 'Demo job submission rate exceeded. Please try again shortly.');
      return;
    }
  }

  const body = req.body as Record<string, unknown>;
  const jobType = typeof body.jobType === 'string' ? body.jobType.trim() : '';
  if (!PUBLIC_JOB_TYPES.has(jobType)) {
    reject(res, 400, `Job type '${jobType || 'unknown'}' is not enabled in public demo mode.`);
    return;
  }

  const payload = body.payload;
  const payloadBytes = Buffer.byteLength(JSON.stringify(payload ?? null), 'utf8');
  if (payloadBytes > maxPayloadBytes) {
    reject(res, 413, `Demo payload exceeds the ${maxPayloadBytes}-byte limit.`);
    return;
  }

  const requestedRetries = body.maxRetries === undefined ? 3 : Number(body.maxRetries);
  if (
    !Number.isInteger(requestedRetries) ||
    requestedRetries < 0 ||
    requestedRetries > maxRetries
  ) {
    reject(res, 400, `Demo maxRetries must be an integer from 0 to ${maxRetries}.`);
    return;
  }

  body.maxRetries = requestedRetries;
  body.payload = {
    ...(payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {}),
    __pulseqDemo: true,
  };
  next();
};

export const publicDemoEnabled = isDemoMode;
