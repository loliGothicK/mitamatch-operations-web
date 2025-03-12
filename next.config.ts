import createMdx from '@next/mdx';
import { withSentryConfig } from '@sentry/nextjs';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeImageSize from './plugin/rehype-image-size.mjs';

/** @types {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/**',
        search: '',
      },
    ],
  },
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
  serverExternalPackages: [
    '@opentelemetry/auto-instrumentations-node',
    '@opentelemetry/sdk-node',
    '@sentry/profiling-node',
  ],
};

const withMdx = createMdx({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeImageSize, rehypeSlug],
  },
});

export default withSentryConfig(withMdx(nextConfig), {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Hides source maps from generated client bundles
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors.
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
