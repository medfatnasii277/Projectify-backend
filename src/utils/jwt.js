const jwt = require('jsonwebtoken');
const logger = require('./logger');

class JWTService {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload) {
    try {
      return jwt.sign(payload, this.secret, {
        expiresIn: this.expiresIn,
      });
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw error;
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload) {
    try {
      return jwt.sign(payload, this.refreshSecret, {
        expiresIn: this.refreshExpiresIn,
      });
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw error;
    }
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokens(payload) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      logger.error('Error verifying access token:', error);
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshSecret);
    } catch (error) {
      logger.error('Error verifying refresh token:', error);
      throw error;
    }
  }

  /**
   * Decode token without verification
   */
  decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = new JWTService();
