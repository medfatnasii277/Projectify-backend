const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    index: true,
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password not required if Google OAuth
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't return password by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  googleId: {
    type: String,
    sparse: true,
    index: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      return ret;
    }
  },
  toObject: { virtuals: true },
});

// Indexes for better performance
UserSchema.index({ email: 1, googleId: 1 });
UserSchema.index({ createdAt: -1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate email verification token
UserSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-digit code
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return token;
};

// Generate password reset token
UserSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  
  return token;
};

// Static method to find user by email and password
UserSchema.statics.findByCredentials = async function(email, password) {
  console.log(`[findByCredentials] Looking for user with email: ${email}`);
  const user = await this.findOne({ email }).select('+password');
  
  if (!user) {
    console.log(`[findByCredentials] No user found with email: ${email}`);
    return null;
  }
  
  console.log(`[findByCredentials] User found: ${user.email}, has password: ${!!user.password}`);
  
  const isMatch = await user.comparePassword(password);
  console.log(`[findByCredentials] Password match result: ${isMatch}`);
  
  if (!isMatch) {
    console.log(`[findByCredentials] Password does not match for email: ${email}`);
    return null;
  }
  
  console.log(`[findByCredentials] Login successful for email: ${email}`);
  return user;
};

module.exports = mongoose.model('User', UserSchema);
