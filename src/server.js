require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const serverConfig = require('./config/server');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { requestLogger, errorLogger } = require('./middlewares/logger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors(serverConfig.cors));

// Request logging
app.use(requestLogger);
app.use(errorLogger);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use(`${serverConfig.apiPrefix}/auth`, authRoutes);
app.use(`${serverConfig.apiPrefix}/projects`, projectRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = serverConfig.port;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${serverConfig.env} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = app;
