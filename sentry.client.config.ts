// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import {
  browserProfilingIntegration,
  browserTracingIntegration,
  feedbackIntegration,
  init,
  replayIntegration,
} from '@sentry/nextjs';

init({
  dsn: 'https://d811f383ea900362accb6a63e57d4302@o4507108758192128.ingest.us.sentry.io/4507108760223744',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 1.0,

  instrumenter: 'otel',

  tracePropagationTargets: ['localhost', /^https:\/\/mitama\.io\/.*/],

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    feedbackIntegration({
      colorScheme: 'system',
      isNameRequired: true,
    }),
    browserTracingIntegration(),
    browserProfilingIntegration(),
    replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
