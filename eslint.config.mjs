import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Prevent importing browser-only code in server-side files
  {
    files: ["app/api/**/*.{ts,tsx}", "app/**/route.{ts,tsx}", "app/**/page.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/supabase-browser", "@/lib/supabase-browser", "../supabase-browser", "./supabase-browser"],
              message: "Cannot import supabase-browser in server-side code. Use supabase-server instead.",
            },
            {
              group: ["@/lib/supabaseClient", "@/lib/supabaseClient", "../supabaseClient", "./supabaseClient"],
              message: "supabaseClient.ts is deprecated. Use supabase-browser or supabase-server instead.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        {
          name: "window",
          message: "Cannot use 'window' in server-side code. This file may be executed during SSR/SSG.",
        },
        {
          name: "document",
          message: "Cannot use 'document' in server-side code. This file may be executed during SSR/SSG.",
        },
        {
          name: "location",
          message: "Cannot use 'location' in server-side code. This file may be executed during SSR/SSG.",
        },
        {
          name: "navigator",
          message: "Cannot use 'navigator' in server-side code. This file may be executed during SSR/SSG.",
        },
      ],
    },
  },
  // Allow browser APIs in client components (files with 'use client')
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["@/lib/supabaseClient", "@/lib/supabaseClient", "../supabaseClient", "./supabaseClient"],
              message: "supabaseClient.ts is deprecated. Use supabase-browser instead.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
