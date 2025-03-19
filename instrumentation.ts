import { registerOTel } from '@vercel/otel';
import { captureRequestError } from '@sentry/nextjs';

export const onRequestError = captureRequestError;

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.node');
  } else {
    registerOTel({
      serviceName: 'mitamatch-operations',
    });
  }
}
