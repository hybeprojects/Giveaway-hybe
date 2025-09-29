import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use the 'node' environment for testing serverless functions
    environment: 'node',
    // Isolate the tests from the root config
    isolate: true,
  },
});