import { defineConfig, devices } from '@playwright/test';

const PORT = 4317;

// Locally we use the system Google Chrome (the bundled Chromium download is
// flaky here); CI installs and uses the pinned Chromium.
const localChannel = process.env.CI ? {} : { channel: 'chrome' as const };

export default defineConfig({
  testDir: './tests/e2e',
  // One shared baseline per screenshot (no OS/project suffix) so the same image
  // is used on macOS Chrome and Linux Chromium; diffs are absorbed by tolerance.
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: process.env.CI ? 'github' : 'list',
  expect: {
    toHaveScreenshot: {
      // One shared baseline is compared on macOS Chrome (local) and Linux
      // Chromium (CI). The resting chart is text-free SVG, so the only
      // cross-platform difference is edge anti-aliasing — absorbed here.
      threshold: 0.25,
      maxDiffPixelRatio: 0.08,
    },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], ...localChannel },
    },
  ],
  webServer: {
    command: `pnpm vite --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
