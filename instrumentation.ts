import { SEMRESATTRS_SERVICE_NAMESPACE } from '@opentelemetry/semantic-conventions';
import { registerOTel } from '@vercel/otel';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getProcessor } = await import('./instrumentation.node');
    registerOTel({
      serviceName: 'mitamatch-operations',
      attributes: {
        [SEMRESATTRS_SERVICE_NAMESPACE]: 'mitama',
      },
      spanProcessors: [getProcessor()],
    });
  }
}
