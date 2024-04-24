// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { init } from '@sentry/nextjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

init({
  dsn: 'https://d811f383ea900362accb6a63e57d4302@o4507108758192128.ingest.us.sentry.io/4507108760223744',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  profilesSampleRate: 1.0,

  instrumenter: 'otel',

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  integrations: [
    // Add profiling integration to a list of integrations
    nodeProfilingIntegration(),
  ],

  enabled: process.env.NODE_ENV !== 'development',
});
