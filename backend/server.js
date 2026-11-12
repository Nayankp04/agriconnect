const app = require('./app');
const connectDB = require('./config/database');
const { verifySmtpConnection } = require('./utils/emailService');

const PORT = process.env.PORT || 8080;

async function startServer() {
  // 1. Start HTTP server first so API endpoints and frontend are immediately responsive
  const server = app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🌾 AgriConnect Backend Server running in ${process.env.NODE_ENV || 'development'} mode on PORT ${PORT}`);
    console.log(`📡 Healthcheck: http://localhost:${PORT}/api/health`);
    console.log(`==================================================`);
  });

  // 2. Connect to Database in background without blocking server startup
  connectDB().catch((err) => {
    console.warn(`[Database Connection] Notice: ${err.message}`);
  });

  // 3. Verify SMTP Email Service on startup
  verifySmtpConnection().catch((err) => {
    console.warn(`[SMTP Startup Check] Notice: ${err.message}`);
  });

  return server;
}

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});
