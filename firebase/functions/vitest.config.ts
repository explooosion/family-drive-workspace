import { defineConfig } from "vitest/config.js";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["lib/**", "node_modules/**"],
  },
});
