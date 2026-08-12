import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { AppError } from '../src/utils/errors.js';
import { validateRequest } from '../src/middleware/validateRequest.js';
import { z } from 'zod';

test('GET /api/v1/health returns 200 and expected body', async () => {
  const app = createApp();

  const response = await request(app).get('/api/v1/health').expect(200);

  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.service, 'distributed-job-scheduler');
  assert.ok(response.body.timestamp);
});

test('application errors are converted to consistent JSON responses', async () => {
  const app = createApp({
    beforeNotFound: (expressApp) => {
      expressApp.get('/test-app-error', (_req, _res, next) => {
        next(new AppError('Expected failure', 400, { code: 'EXPECTED_FAILURE' }));
      });
    },
  });

  const response = await request(app).get('/test-app-error').expect(400);

  assert.equal(response.body.error, 'Expected failure');
  assert.equal(response.body.status, 'error');
  assert.deepEqual(response.body.details, { code: 'EXPECTED_FAILURE' });
});

test('unexpected errors are handled safely without leaking internals', async () => {
  const app = createApp({
    beforeNotFound: (expressApp) => {
      expressApp.get('/test-unexpected-error', () => {
        throw new Error('Internal database details');
      });
    },
  });

  const response = await request(app).get('/test-unexpected-error').expect(500);

  assert.equal(response.body.status, 'error');
  assert.equal(response.body.error, 'Internal Server Error');
  assert.equal(response.body.details, undefined);
});

test('request validation middleware rejects invalid payloads', async () => {
  const app = createApp({
    beforeNotFound: (expressApp) => {
      const schema = {
        body: z.object({
          name: z.string().min(2),
        }),
      };

      expressApp.post('/test-validation', validateRequest(schema), (_req, res) => {
        res.status(200).json({ ok: true });
      });
    },
  });

  const response = await request(app).post('/test-validation').send({ name: 'a' }).expect(400);

  assert.equal(response.body.status, 'error');
  assert.equal(response.body.error, 'Validation failed');
  assert.ok(response.body.details);
});
