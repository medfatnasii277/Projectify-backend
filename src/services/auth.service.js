const User = require('../models/User');
const jwtService = require('../utils/jwt');
const emailService = require('../utils/emailService');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');
const logger = require('../utils/logger');
const crypto = require('crypto');

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    const { name, email, password } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email already in use');
    }

    // Generate email verification code (6-digit)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash the verification code for storage
    const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');
    const verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      emailVerificationToken: hashedCode,
      emailVerificationExpires: verificationTokenExpiry,
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, name, verificationCode);
      logger.info(`Verification email sent to ${email}`);
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      // Don't throw error here - user is created, we can resend later
    }

    // Generate tokens
    const tokens = jwtService.generateTokens({ id: user._id });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(email, password) {
    logger.info(`Login attempt for email: ${email}`);
    
    // Find user and include password for comparison
    const user = await User.findByCredentials(email, password);

    if (!user) {
      logger.warn(`Login failed for email: ${email} - Invalid credentials`);
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid email or password');
    }

    logger.info(`User found: ${user.email}, isEmailVerified: ${user.isEmailVerified}, isActive: ${user.isActive}`);

    // Check if account is active
    if (!user.isActive) {
      logger.warn(`Login failed for email: ${email} - Account deactivated`);
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'Your account has been deactivated. Please contact support.'
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    logger.info(`Login successful for email: ${email}`);

    // Generate tokens
    const tokens = jwtService.generateTokens({ id: user._id });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
      },
      tokens,
    };
  }

  /**
   * Verify email with code
   */
  async verifyEmail(email, verificationCode) {
    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    if (user.isEmailVerified) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email already verified');
    }

    // Check if verification token exists
    if (!user.emailVerificationToken || !user.emailVerificationExpires) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No verification code found. Please request a new one.');
    }

    // Check if verification code has expired
    if (user.emailVerificationExpires < new Date()) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Verification code has expired. Please request a new one.'
      );
    }

    // Hash the provided code to compare with stored hash
    const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');

    // Check if verification code matches
    if (user.emailVerificationToken !== hashedCode) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid verification code');
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.name);
      logger.info(`Welcome email sent to ${user.email}`);
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
    }

    return {
      message: 'Email verified successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email) {
    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    if (user.isEmailVerified) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email already verified');
    }

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash the verification code for storage
    const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');
    const verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailVerificationToken = hashedCode;
    user.emailVerificationExpires = verificationTokenExpiry;
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(email, user.name, verificationCode);
    logger.info(`Verification email resent to ${email}`);

    return {
      message: 'Verification email sent successfully',
    };
  }

  /**
   * Send password reset email
   */
  async forgotPassword(email) {
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal that user doesn't exist for security
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const { resetToken, hashedToken } = user.generatePasswordResetToken();

    // Save hashed token to database
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(email, user.name, resetUrl);
      logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
      // Clear reset token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpiry = undefined;
      await user.save();

      logger.error('Failed to send password reset email:', error);
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to send password reset email. Please try again.'
      );
    }

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetToken, newPassword) {
    // Hash the token to compare with database
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Password reset token is invalid or has expired'
      );
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    logger.info(`Password reset successful for user ${user.email}`);

    // Generate new tokens
    const tokens = jwtService.generateTokens({ id: user._id });

    return {
      message: 'Password reset successful',
      tokens,
    };
  }

  /**
   * Change password (for logged-in users)
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user ${user.email}`);

    return {
      message: 'Password changed successfully',
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    // Verify refresh token
    const decoded = jwtService.verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Account is deactivated');
    }

    // Generate new tokens
    const tokens = jwtService.generateTokens({ id: user._id });

    return {
      tokens,
    };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    const { name, profilePicture } = updateData;

    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    // Update fields
    if (name) user.name = name;
    if (profilePicture) user.profilePicture = profilePicture;

    await user.save();

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    };
  }
}

module.exports = new AuthService();
