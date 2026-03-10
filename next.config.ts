import createMdx from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";
import { withContentCollections } from "@content-collections/next";

/** @types {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    scrollRestoration: true,
  },
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    remotePatterns: [
      {
        protocol: "https" as const,
        hostname: "cdn.discordapp.com",
        port: "",
        pathname: "/**",
        search: "",
      },
    ],
  },
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Document-Policy",
            value: "js-profiling",
          },
        ],
      },
    ];
  },
  serverExternalPackages: [
    "@opentelemetry/auto-instrumentations-node",
    "@opentelemetry/sdk-node",
    "@sentry/profiling-node",
    "@vercel/otel",
    "import-in-the-middle",
    "require-in-the-middle",
  ],
};

/** @type {import('remark-gfm').Options} */
const remarkGFMOptions: import("remark-gfm").Options = {};

const withMdx = createMdx({
  options: {
    remarkPlugins: [["remark-gfm", remarkGFMOptions]],
    rehypePlugins: ["rehype-slug"],
  },
});

export default withSentryConfig(withContentCollections(withMdx(nextConfig)), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "mitama",

  project: "mitamatch-operations",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
