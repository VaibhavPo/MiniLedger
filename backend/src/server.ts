import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { initDatabase } from './config/db';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer(): Promise<void> {
  const app = createApp();

  // Try to connect to PostgreSQL and initialize tables
  try {
    await initDatabase();
  } catch (error: any) {
    console.warn('\n-----------------------------------------------------------');
    console.warn('[PostgreSQL Warning] Could not connect to PostgreSQL database.');
    console.warn('Reason:', error.message || error);
    console.warn('Please ensure PostgreSQL is running and check credentials in backend/.env:');
    console.warn('  DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME');
    console.warn('The server will still run for HTTP requests, but database queries will fail until PostgreSQL is available.');
    console.warn('-----------------------------------------------------------\n');
  }

  app.listen(PORT, function onListen() {
    console.log(`\n===========================================================`);
    console.log(` MiniLedger Backend Server is running!`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Date & Time: ${new Date().toISOString()}`);
    console.log(`===========================================================\n`);
  });
}

// Start application
startServer();
