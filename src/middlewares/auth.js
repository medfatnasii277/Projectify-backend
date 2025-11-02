const jwtService = require('../utils/jwt');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS } = require('../utils/constants');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * Protect routes - require authentication
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      'Not authorized to access this route. Please login.'
    );
  }

  try {
    // Verify token
    const decoded = jwtService.verifyAccessToken(token);

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'User not found. Please login again.'
      );
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'Your account has been deactivated. Please contact support.'
      );
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid token. Please login again.');
    }
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Token expired. Please login again.');
    }
    throw error;
  }
});

/**
 * Check if email is verified
 */
const requireEmailVerification = asyncHandler(async (req, res, next) => {
  if (!req.user.isEmailVerified) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'Please verify your email to access this resource.'
    );
  }
  next();
});

/**
 * Authorize specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        `User role '${req.user.role}' is not authorized to access this route`
      );
    }
    next();
  };
};

/**
 * Optional auth - attach user if token exists but don't require it
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwtService.verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      logger.warn('Optional auth token invalid:', error.message);
    }
  }

  next();
});

module.exports = {
  protect,
  requireEmailVerification,
  authorize,
  optionalAuth,
};
