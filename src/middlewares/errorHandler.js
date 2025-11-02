const logger = require('../utils/logger');
const ApiResponse = require('../utils/ApiResponse');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  // Log error
  logger.error(`Error: ${message}`, {
    statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Default to 500 if statusCode is not set
  statusCode = statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  message = message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

  // Send error response
  return ApiResponse.error(res, message, statusCode);
};

/**
 * Handle 404 errors
 */
const notFound = (req, res, next) => {
  const message = `Route not found: ${req.originalUrl}`;
  logger.warn(message);
  return ApiResponse.error(res, message, HTTP_STATUS.NOT_FOUND);
};

module.exports = {
  errorHandler,
  notFound,
};
