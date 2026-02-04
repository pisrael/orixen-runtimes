import { defineConfig } from 'vitest/config';

const isDebugging = process.env.DEBUG === 'true' || process.env.VITEST_DEBUG === 'true' || process.env.VSCODE_INSPECTOR_OPTIONS;

export default defineConfig({
  test: {
    root: '.',
    testTimeout: isDebugging ? 500_000 : 5_000,
    hookTimeout: isDebugging ? 500_000 : 10_000,
    exclude: [
      '**/node_modules/**',
      //'**/e2e/**'
    ],
  },
});
