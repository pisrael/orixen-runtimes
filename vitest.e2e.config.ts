import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    include: ['test/tests/**/e2e/**/*.test.ts'],
    testTimeout: 30 * 60 * 1000,
    hookTimeout: 30 * 60 * 1000,
    teardownTimeout: 30 * 60 * 1000,
    sequence: { concurrent: false },
  },
});
