const morgan = require('morgan');
const logger = require('../utils/logger');

// Create custom token for morgan
morgan.token('message', (req, res) => res.locals.errorMessage || '');

// Custom format for morgan
const getFormat = () => {
  return process.env.NODE_ENV === 'production'
    ? ':remote-addr - :method :url :status :response-time ms - :message'
    : ':method :url :status :response-time ms - :message';
};

// Morgan middleware with winston logger
const requestLogger = morgan(getFormat(), {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    },
  },
  skip: (req, res) => res.statusCode < 400,
});

const errorLogger = morgan(getFormat(), {
  stream: {
    write: (message) => {
      logger.error(message.trim());
    },
  },
  skip: (req, res) => res.statusCode < 400,
});

module.exports = { requestLogger, errorLogger };
