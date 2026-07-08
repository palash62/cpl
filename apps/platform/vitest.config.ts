import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "tests/unit/**/*.test.ts",
      "src/modules/fraud/__tests__/**/*.test.ts",
      "src/modules/autoresponder/__tests__/**/*.test.ts",
      "src/modules/page-builder/**/*.test.ts",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
