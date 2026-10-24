import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/shared/i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      {
        source: "/:locale(vi|en)",
        destination: "/:locale/content",
        permanent: false,
      },
      // Settings opens on its first tab. The old admin addresses lead to their tabs.
      {
        source: "/:locale(vi|en)/settings",
        destination: "/:locale/settings/members",
        permanent: false,
      },
      {
        source: "/:locale(vi|en)/admin",
        destination: "/:locale/settings/members",
        permanent: true,
      },
      {
        source: "/:locale(vi|en)/admin/workflow",
        destination: "/:locale/settings/workflow",
        permanent: true,
      },
      {
        source: "/:locale(vi|en)/agents",
        destination: "/:locale/settings/agents",
        permanent: true,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
