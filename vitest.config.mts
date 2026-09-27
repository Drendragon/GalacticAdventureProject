import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./test/setup.ts"],
    fileParallelism: false,
    exclude: [...configDefaults.exclude, "test/mailhog.integration.test.ts"],
  },
});
