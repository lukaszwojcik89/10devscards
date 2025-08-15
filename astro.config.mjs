// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  site: "https://10devscards.com",
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom"],
            "auth-forms": [
              "/src/components/auth/LoginForm.tsx",
              "/src/components/auth/RegisterForm.tsx",
              "/src/components/auth/ResetPasswordForm.tsx",
              "/src/components/auth/UpdatePasswordForm.tsx",
            ],
            "dashboard-core": ["/src/hooks/useDashboard.ts", "/src/hooks/useQuickActions.ts"],
            "ui-components": [
              "/src/components/ui/button.tsx",
              "/src/components/ui/card.tsx",
              "/src/components/ui/skeleton.tsx",
              "/src/components/ui/toast.tsx",
              "/src/components/ui/avatar.tsx",
              "/src/components/ui/alert.tsx",
            ],
          },
        },
      },
      cssCodeSplit: true,
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
    ssr: {
      noExternal: ["@radix-ui/*"],
    },
  },
  adapter: node({
    mode: "standalone",
  }),
  experimental: {
    session: true,
  },
  compressHTML: true,
  build: {
    inlineStylesheets: "auto",
  },
});
