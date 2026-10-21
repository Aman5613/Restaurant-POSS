import mongoose from 'mongoose';
import argon2 from 'argon2';
import { ROLES } from '@pos/shared';

const userSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
    outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, sparse: true },
    phone: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      default: ROLES.CAPTAIN,
    },
    passwordHash: { type: String },
    pinHash: { type: String },
    customPermissions: [{ type: String }],
    maxDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ tenantId: 1, phone: 1 }, { unique: true });

userSchema.methods.isLocked = function () {
  return Boolean(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.recordFailedAttempt = async function () {
  this.failedLoginAttempts += 1;
  // Lock after 5 consecutive failed attempts for 5 minutes
  if (this.failedLoginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 5 * 60 * 1000);
  }
  await this.save();
};

userSchema.methods.resetFailedAttempts = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

userSchema.methods.verifyPassword = async function (plainPassword) {
  if (!this.passwordHash) return false;
  return argon2.verify(this.passwordHash, plainPassword);
};

userSchema.methods.verifyPin = async function (plainPin) {
  if (!this.pinHash) return false;
  return argon2.verify(this.pinHash, plainPin);
};

export const User = mongoose.model('User', userSchema);
