import { Metadata, credentials } from '@grpc/grpc-js';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
  type SpanProcessor,
} from '@opentelemetry/sdk-trace-base';

export function getProcessor(): SpanProcessor {
  if (process.env.HONEYCOMB_API_KEY) {
    const metadata = new Metadata();
    metadata.set('x-honeycomb-team', process.env.HONEYCOMB_API_KEY);

    const exporter = new OTLPTraceExporter({
      url: 'grpc://api.honeycomb.io:443/',
      credentials: credentials.createSsl(),
      metadata,
    });

    // Values from https://github.com/honeycombio/intro-to-o11y-nodejs/blob/main/src/tracing.js
    return new BatchSpanProcessor(exporter, {
      maxQueueSize: 16000,
      maxExportBatchSize: 1000,
      scheduledDelayMillis: 500,
    });
  }

  console.info('Using console exporter');
  return new SimpleSpanProcessor(new ConsoleSpanExporter());
}
