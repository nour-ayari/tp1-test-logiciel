import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/test/**/*.test.{js,ts}'],
    exclude: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      all: false
    },
  },
});