import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    include: ['test/tests/**/e2e/**/*.test.ts'],
    testTimeout: 20 * 60 * 1000,
    hookTimeout: 20 * 60 * 1000,
    teardownTimeout: 20 * 60 * 1000,
    sequence: { concurrent: false },
  },
});
