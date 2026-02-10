import { test as base, expect } from "@playwright/test";

// Define custom worker fixtures
interface CustomWorkerFixtures {
  workerCheck: void;
}

export const test = base.extend<{}, CustomWorkerFixtures>({
  workerCheck: [
    async ({ }, use, testInfo) => {
      const EXPECTED_WORKERS = 8;
      if (testInfo.config.workers != EXPECTED_WORKERS) {
        throw new Error(`
Configuration Error: E2E tests should run in parallel for performance.
    **THERE ARE NO RACE CONDITIONS IN E2E TESTS.**
    **THERE IS NO CROSS TEST STATE.**
    **IF YOUR TESTS ARE FAILING DUE TO PARALLELISM, FIX THE TESTS.**
Found workers: ${testInfo.config.workers}
Expected: ${EXPECTED_WORKERS}

Please use 'npm run test:e2e' which sets '--workers=${EXPECTED_WORKERS}'
            `);
      }
      await use();
    },
    { auto: true, scope: "worker" },
  ],
});

export { expect };
