import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import {
  SentryPropagator,
  SentrySpanProcessor,
} from '@sentry/opentelemetry-node';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'mitamatch-operations',
  }),
  // Sentry config
  spanProcessors: [new SentrySpanProcessor()],
  textMapPropagator: new SentryPropagator(),
});

sdk.start();
