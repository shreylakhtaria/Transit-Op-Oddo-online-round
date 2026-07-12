import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { User, Role, RefreshToken, Otp } from '../../models/index.js';
import { sendEmail } from '../../config/mailer.js';

export class AuthService {
  static async register({ name, email, password, roleName }) {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('Email address is already in use');
    }

    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) {
      throw new Error('Invalid role specified');
    }

    const user = await User.create({
      name,
      email,
      password, // Hashed automatically by the model's beforeSave hook
      roleId: role.id
    });

    const userJSON = user.toJSON();
    userJSON.role = { name: role.name };
    return userJSON;
  }

  static async login({ email, password }) {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role', attributes: ['name'] }]
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // Generate 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    // Save the OTP in database
    await Otp.create({
      userId: user.id,
      code,
      expiresAt
    });

    // Send email via Nodemailer
    await sendEmail({
      to: user.email,
      subject: 'TransitOps Login Verification Code',
      text: `Hello ${user.name},\n\nYour One-Time Password (OTP) for TransitOps login is: ${code}\n\nThis code is valid for 5 minutes.\n\nIf you did not request this login, please ignore this email.\n\nBest regards,\nTransitOps Team`
    });

    // Generate short-lived tempToken valid for 5 minutes
    const tempToken = jwt.sign(
      { id: user.id, email: user.email, purpose: 'login_otp' },
      env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    return {
      message: 'OTP sent successfully to your email',
      tempToken
    };
  }

  static async verifyOtp({ tempToken, code }) {
    let decoded;
    try {
      decoded = jwt.verify(tempToken, env.JWT_SECRET);
    } catch (err) {
      throw new Error('Invalid or expired temporary token');
    }

    if (decoded.purpose !== 'login_otp') {
      throw new Error('Invalid token purpose');
    }

    const userId = decoded.id;

    // Find the latest unused OTP record for the user
    const otpRecord = await Otp.findOne({
      where: {
        userId,
        code,
        isUsed: false
      },
      order: [['createdAt', 'DESC']]
    });

    if (!otpRecord) {
      throw new Error('Invalid OTP code');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new Error('OTP has expired');
    }

    // Mark the OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Fetch the user with Role
    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: 'role', attributes: ['name'] }]
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate short-lived Access Token (e.g. 15m)
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role.name },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    // Generate long-lived Refresh Token (7 days random hex)
    const refreshTokenString = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Revoke old refresh tokens for this user
    await RefreshToken.update(
      { isRevoked: true },
      { where: { userId: user.id, isRevoked: false } }
    );

    // Save new Refresh Token
    await RefreshToken.create({
      userId: user.id,
      token: refreshTokenString,
      expiresAt
    });

    return {
      accessToken,
      refreshToken: refreshTokenString,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: { name: user.role.name }
      }
    };
  }

  static async refresh({ refreshToken }) {
    const tokenRecord = await RefreshToken.findOne({
      where: {
        token: refreshToken,
        isRevoked: false
      }
    });

    if (!tokenRecord || new Date() > tokenRecord.expiresAt) {
      throw new Error('Refresh token is invalid or expired');
    }

    const user = await User.findByPk(tokenRecord.userId, {
      include: [{ model: Role, as: 'role', attributes: ['name'] }]
    });

    if (!user) {
      throw new Error('User associated with token not found');
    }

    // Generate new Access Token
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role.name },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: { name: user.role.name }
      }
    };
  }

  static async logout({ refreshToken }) {
    await RefreshToken.update(
      { isRevoked: true },
      { where: { token: refreshToken } }
    );
    return { message: 'Logged out successfully' };
  }
}
