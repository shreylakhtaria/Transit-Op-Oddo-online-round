import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { setupTestDb, Role, User } from './setup.js';
import { requireAuth } from '../src/middlewares/authMiddleware.js';
import { requireRole } from '../src/middlewares/roleMiddleware.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'supersecretjwtkey12345';

describe('Auth Middleware', () => {
  let testUser, testRole;

  beforeEach(async () => {
    await setupTestDb();
    testRole = await Role.findOne({ where: { name: 'Fleet Manager' } });
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      roleId: testRole.id,
    });
  });

  describe('requireAuth', () => {
    test('should set req.user and call next for valid token', async () => {
      const token = jwt.sign(
        { id: testUser.id, email: testUser.email, role: testRole.name },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const req = { headers: { authorization: `Bearer ${token}` } };
      let nextCalled = false;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = () => { nextCalled = true; };

      await requireAuth(req, res, next);

      expect(nextCalled).toBe(true);
      expect(req.user).toBeDefined();
      expect(req.user.email).toBe('test@example.com');
    });

    test('should return 401 when no token provided', async () => {
      const req = { headers: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('missing') })
      );
    });

    test('should return 401 for expired/invalid token', async () => {
      const req = { headers: { authorization: 'Bearer invalid.token.here' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 401 when user not found', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const token = jwt.sign(
        { id: fakeId, email: 'ghost@test.com', role: 'Driver' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireRole', () => {
    test('should call next when user has allowed role', () => {
      const req = { user: { role: { name: 'Fleet Manager' } } };
      let nextCalled = false;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = () => { nextCalled = true; };

      const middleware = requireRole(['Fleet Manager', 'Safety Officer']);
      middleware(req, res, next);

      expect(nextCalled).toBe(true);
    });

    test('should return 403 when user role is not allowed', () => {
      const req = { user: { role: { name: 'Driver' } } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      const middleware = requireRole(['Fleet Manager']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should return 401 when no user on request', () => {
      const req = {};
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      const middleware = requireRole(['Fleet Manager']);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
