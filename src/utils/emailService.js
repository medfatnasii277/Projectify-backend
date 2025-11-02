const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Send email verification code
   */
  async sendVerificationEmail(email, name, code) {
    try {
      const mailOptions = {
        from: `"Projectify" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify Your Email - Projectify',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .code { background: #667eea; color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; letter-spacing: 8px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Projectify! 🎉</h1>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                <p>Thank you for registering with Projectify! To complete your registration, please verify your email address using the code below:</p>
                <div class="code">${code}</div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't create an account with Projectify, please ignore this email.</p>
                <p>Best regards,<br>The Projectify Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Projectify. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error(`Error sending verification email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, name, resetToken) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: `"Projectify" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset Your Password - Projectify',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Password Reset Request 🔐</h1>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                <p>We received a request to reset your password for your Projectify account. Click the button below to create a new password:</p>
                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </div>
                <p style="margin-top: 20px;">Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
                <div class="warning">
                  <strong>⚠️ Important:</strong> This link will expire in 30 minutes. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                </div>
                <p>Best regards,<br>The Projectify Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Projectify. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error(`Error sending password reset email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Send welcome email (after verification)
   */
  async sendWelcomeEmail(email, name) {
    try {
      const mailOptions = {
        from: `"Projectify" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to Projectify! 🚀',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
              .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Projectify! 🎉</h1>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                <p>Your email has been verified successfully! You're all set to start managing your projects with Projectify.</p>
                <h3>Here's what you can do:</h3>
                <div class="feature">
                  <strong>📄 Upload PDFs</strong><br>
                  Upload your project documents and let AI extract the structure automatically.
                </div>
                <div class="feature">
                  <strong>✅ Manage Tasks</strong><br>
                  Create, update, and track tasks and subtasks with ease.
                </div>
                <div class="feature">
                  <strong>💬 Collaborate</strong><br>
                  Add comments and keep your team in sync.
                </div>
                <div style="text-align: center;">
                  <a href="${process.env.FRONTEND_URL}" class="button">Get Started</a>
                </div>
                <p>If you have any questions, feel free to reach out to our support team.</p>
                <p>Happy project managing!<br>The Projectify Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Projectify. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error(`Error sending welcome email to ${email}:`, error);
      // Don't throw error for welcome email - it's not critical
      return false;
    }
  }
}

module.exports = new EmailService();
