import { describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import {
  setupTestDb, createTestApp, authAs, Role, User, Otp, RefreshToken,
} from './setup.js';
import { AuthService } from '../src/modules/auth/service.js';

describe('Auth Module', () => {
  beforeEach(async () => {
    await setupTestDb();
  });

  // POST /auth/register accepts a client-supplied `roleName` (including 'Fleet Manager').
  // Leaving it anonymous would let anybody mint themselves an admin account, so the route
  // is now behind requireAuth + requireRole(['Fleet Manager']).
  //
  // NOTE: the auth router is rate limited to 10 requests / 15 min per IP, so this block
  // deliberately keeps its HTTP calls to a handful.
  describe('POST /api/auth/register (privilege escalation guard)', () => {
    test('should reject an anonymous registration with 401', async () => {
      const app = createTestApp();

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Mallory',
          email: 'mallory@example.com',
          password: 'password123',
          roleName: 'Fleet Manager',
        });

      expect(res.status).toBe(401);
      // and crucially: no account was created
      const created = await User.findOne({ where: { email: 'mallory@example.com' } });
      expect(created).toBeNull();
    });

    test('should reject a registration by a non Fleet Manager with 403', async () => {
      const app = createTestApp();
      const { token } = await authAs('Driver');

      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Escalated',
          email: 'escalated@example.com',
          password: 'password123',
          roleName: 'Fleet Manager',
        });

      expect(res.status).toBe(403);
      const created = await User.findOne({ where: { email: 'escalated@example.com' } });
      expect(created).toBeNull();
    });

    test('should allow a Fleet Manager to register a new user', async () => {
      const app = createTestApp();
      const { token } = await authAs('Fleet Manager');

      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Analyst',
          email: 'analyst@example.com',
          password: 'password123',
          roleName: 'Financial Analyst',
        });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe('analyst@example.com');
      expect(res.body.role.name).toBe('Financial Analyst');
      expect(res.body.password).toBeUndefined();

      const created = await User.findOne({ where: { email: 'analyst@example.com' } });
      expect(created).not.toBeNull();
    });
  });

  describe('register', () => {
    test('should register a new user successfully', async () => {
      const user = await AuthService.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        roleName: 'Fleet Manager',
      });

      expect(user).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.role.name).toBe('Fleet Manager');
      expect(user.password).toBeUndefined();
    });

    test('should throw error for duplicate email', async () => {
      await AuthService.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        roleName: 'Fleet Manager',
      });

      await expect(
        AuthService.register({
          name: 'Jane Doe',
          email: 'john@example.com',
          password: 'password456',
          roleName: 'Driver',
        })
      ).rejects.toThrow('Email address is already in use');
    });

    test('should throw error for invalid role', async () => {
      await expect(
        AuthService.register({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          roleName: 'NonExistentRole',
        })
      ).rejects.toThrow('Invalid role specified');
    });
  });

  describe('login', () => {
    test('should send OTP and return temp token', async () => {
      await AuthService.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        roleName: 'Fleet Manager',
      });

      const result = await AuthService.login({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(result.message).toBe('OTP sent successfully to your email');
      expect(result.tempToken).toBeDefined();
      expect(typeof result.tempToken).toBe('string');
    });

    test('should throw error for wrong password', async () => {
      await AuthService.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        roleName: 'Fleet Manager',
      });

      await expect(
        AuthService.login({ email: 'john@example.com', password: 'wrongpass' })
      ).rejects.toThrow('Invalid email or password');
    });

    test('should throw error for non-existent user', async () => {
      await expect(
        AuthService.login({ email: 'nobody@example.com', password: 'pass123' })
      ).rejects.toThrow('Invalid email or password');
    });

    test('should lock account after 5 failed attempts', async () => {
      await AuthService.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        roleName: 'Fleet Manager',
      });

      for (let i = 0; i < 5; i++) {
        try {
          await AuthService.login({ email: 'john@example.com', password: 'wrong' });
        } catch (_) {}
      }

      await expect(
        AuthService.login({ email: 'john@example.com', password: 'wrong' })
      ).rejects.toThrow(/locked/i);
    });
  });

  describe('verifyOtp', () => {
    test('should verify OTP and return access + refresh tokens', async () => {
      await AuthService.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        roleName: 'Fleet Manager',
      });

      const loginResult = await AuthService.login({
        email: 'john@example.com',
        password: 'password123',
      });

      const user = await User.findOne({ where: { email: 'john@example.com' } });
      const otp = await Otp.findOne({
        where: { userId: user.id, isUsed: false },
        order: [['createdAt', 'DESC']],
      });

      const result = await AuthService.verifyOtp({
        tempToken: loginResult.tempToken,
        code: otp.code,
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('john@example.com');
      expect(result.user.role.name).toBe('Fleet Manager');
    });

    test('should throw error for wrong OTP code', async () => {
      await AuthService.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        roleName: 'Fleet Manager',
      });

      const loginResult = await AuthService.login({
        email: 'john@example.com',
        password: 'password123',
      });

      await expect(
        AuthService.verifyOtp({ tempToken: loginResult.tempToken, code: '000000' })
      ).rejects.toThrow('Invalid OTP code');
    });

    test('should throw error for invalid temp token', async () => {
      await expect(
        AuthService.verifyOtp({ tempToken: 'invalid-token', code: '123456' })
      ).rejects.toThrow('Invalid or expired temporary token');
    });

    test('should not allow reuse of already-used OTP', async () => {
      await AuthService.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        roleName: 'Fleet Manager',
      });

      const loginResult = await AuthService.login({
        email: 'john@example.com',
        password: 'password123',
      });

      const user = await User.findOne({ where: { email: 'john@example.com' } });
      const otp = await Otp.findOne({
        where: { userId: user.id, isUsed: false },
        order: [['createdAt', 'DESC']],
      });

      await AuthService.verifyOtp({ tempToken: loginResult.tempToken, code: otp.code });

      await expect(
        AuthService.verifyOtp({ tempToken: loginResult.tempToken, code: otp.code })
      ).rejects.toThrow('Invalid OTP code');
    });
  });

  describe('refresh', () => {
    test('should issue new access token from valid refresh token', async () => {
      await AuthService.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        roleName: 'Fleet Manager',
      });

      const loginResult = await AuthService.login({
        email: 'john@example.com',
        password: 'password123',
      });

      const user = await User.findOne({ where: { email: 'john@example.com' } });
      const otp = await Otp.findOne({
        where: { userId: user.id, isUsed: false },
        order: [['createdAt', 'DESC']],
      });

      const verified = await AuthService.verifyOtp({
        tempToken: loginResult.tempToken,
        code: otp.code,
      });

      const refreshResult = await AuthService.refresh({
        refreshToken: verified.refreshToken,
      });

      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.user.email).toBe('john@example.com');
    });

    test('should throw error for revoked/invalid refresh token', async () => {
      await expect(
        AuthService.refresh({ refreshToken: 'nonexistent-token' })
      ).rejects.toThrow('Refresh token is invalid or expired');
    });
  });

  describe('logout', () => {
    test('should revoke the refresh token', async () => {
      await AuthService.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        roleName: 'Fleet Manager',
      });

      const loginResult = await AuthService.login({
        email: 'john@example.com',
        password: 'password123',
      });

      const user = await User.findOne({ where: { email: 'john@example.com' } });
      const otp = await Otp.findOne({
        where: { userId: user.id, isUsed: false },
        order: [['createdAt', 'DESC']],
      });

      const verified = await AuthService.verifyOtp({
        tempToken: loginResult.tempToken,
        code: otp.code,
      });

      const logoutResult = await AuthService.logout({
        refreshToken: verified.refreshToken,
      });

      expect(logoutResult.message).toBe('Logged out successfully');

      const tokenRecord = await RefreshToken.findOne({
        where: { token: verified.refreshToken },
      });
      expect(tokenRecord.isRevoked).toBe(true);
    });
  });
});
