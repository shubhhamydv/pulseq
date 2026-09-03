import { context, propagation, Span, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
} from '@opentelemetry/semantic-conventions';
import { randomUUID } from 'node:crypto';

const serviceName = process.env.OTEL_SERVICE_NAME ?? process.env.SERVICE_NAME ?? 'pulseq-api';
const enabled = process.env.OTEL_ENABLED !== 'false';
const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318';

export const tracer = trace.getTracer(serviceName, process.env.npm_package_version ?? '0.0.1');

let sdk: NodeSDK | undefined;
if (enabled) {
  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? '0.0.1',
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.NODE_ENV ?? 'development',
    }),
    traceExporter: new OTLPTraceExporter({ url: `${endpoint.replace(/\/$/, '')}/v1/traces` }),
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new IORedisInstrumentation(),
    ],
  });
  void sdk.start();
}

export const shutdownTracing = async (): Promise<void> => {
  if (sdk) await sdk.shutdown();
};

export const recordException = (span: Span, error: unknown): void => {
  span.recordException(error instanceof Error ? error : new Error(String(error)));
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error instanceof Error ? error.message : String(error),
  });
};

export const traceJobContext = (
  traceparent?: string,
  tracestate?: string
): { traceparent: string; tracestate?: string; requestId: string } => ({
  traceparent: traceparent ?? '',
  ...(tracestate ? { tracestate } : {}),
  requestId: randomUUID(),
});

export const injectCurrentContext = (): { traceparent?: string; tracestate?: string } => {
  const carrier: Record<string, string> = {};
  propagation.inject(context.active(), carrier);
  return carrier;
};

export const withSpan = async <T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: (span: Span) => Promise<T>,
  kind = SpanKind.INTERNAL
): Promise<T> => {
  const span = tracer.startSpan(name, { kind, attributes });
  try {
    return await context.with(trace.setSpan(context.active(), span), () => fn(span));
  } catch (error) {
    recordException(span, error);
    throw error;
  } finally {
    span.end();
  }
};
