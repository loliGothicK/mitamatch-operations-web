import createMdx from '@next/mdx';
import { withSentryConfig } from '@sentry/nextjs';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeImageSize from './plugin/rehype-image-size.mjs';

/** @types {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  // biome-ignore lint/suspicious/useAwait: <explanation>
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Document-Policy',
            value: 'js-profiling',
          },
        ],
      },
    ];
  },
  experimental: {
    // biome-ignore lint/style/useNamingConvention: <explanation>
    missingSuspenseWithCSRBailout: false,
    serverComponentsExternalPackages: [
      '@opentelemetry/auto-instrumentations-node',
      '@opentelemetry/sdk-node',
      '@sentry/profiling-node',
    ],
    instrumentationHook: true,
  },
};

const withMdx = createMdx({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeImageSize, rehypeSlug],
  },
});

export default withSentryConfig(
  withMdx(nextConfig),
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    // biome-ignore lint/style/useNamingConvention: <explanation>
    transpileClientSDK: true,

    // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  },
);
