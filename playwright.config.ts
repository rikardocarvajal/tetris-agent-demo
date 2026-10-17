import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { 
    baseURL: "http://127.0.0.1:4173", 
    screenshot: "on", 
    trace: "retain-on-failure" 
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "cd /workspace && npm run build && npx vite preview --port 4173 --host 0.0.0.0 &>/dev/null &",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 120_000,
    cwd: "/workspace",
  },
});
