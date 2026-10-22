import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./tests/globalSetup.js'],
    pool: 'forks',
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
    env: {
      NODE_ENV: 'test',
      // Real connection string is injected by globalSetup (in-memory replica set).
      MONGO_URI: 'mongodb://placeholder',
      JWT_ACCESS_SECRET: 'test-access-secret-0123456789-abcdefghijklmnop',
      JWT_REFRESH_SECRET: 'test-refresh-secret-0123456789-abcdefghijklmnop',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      CLIENT_URL: 'http://localhost:5173',
      COOKIE_SECURE: 'false',
      COOKIE_SAMESITE: 'lax',
      BOOTSTRAP_TOKEN: 'test-bootstrap-token-123456',
      RATE_LIMIT_REGISTER_MAX: '10000',
      RATE_LIMIT_REFRESH_MAX: '10000',
      RATE_LIMIT_API_MAX: '100000',
      RATE_LIMIT_FINANCE_WRITE_MAX: '100000',
    },
  },
});
