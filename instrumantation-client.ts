// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever users load a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import {
  browserProfilingIntegration,
  browserTracingIntegration,
  feedbackIntegration,
  init,
  replayIntegration,
} from "@sentry/nextjs";

init({
  dsn: "https://d811f383ea900362accb6a63e57d4302@o4507108758192128.ingest.us.sentry.io/4507108760223744",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  replaysSessionSampleRate: 0.1,

  tracePropagationTargets: [
    /^https:\/\/mitama\.io\/.*/,
    /^https:\/\/mitamatch-operations-web.vercel.app\/.*/,
  ],

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    feedbackIntegration({
      colorScheme: "system",
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

  enabled: process.env.NODE_ENV !== "development",
});
