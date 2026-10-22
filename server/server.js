import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { createApp } from './app.js';

let server;

async function start() {
  try {
    await connectDatabase();
    console.log('Connected to MongoDB');
    server = createApp().listen(env.PORT, () => {
      console.log(`LH Studio API listening on port ${env.PORT} (${env.NODE_ENV})`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  try {
    if (server) await new Promise((resolve) => server.close(resolve));
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
