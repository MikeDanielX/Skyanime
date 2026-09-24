import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Env mínimo para que core/env.ts pase la validación en tests unitarios
    // que no tocan DB real.
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://hub:hub@localhost:5432/personal_hub?schema=public",
      AUTH_SECRET: "test-secret-largo-suficiente-1234",
    },
  },
});
