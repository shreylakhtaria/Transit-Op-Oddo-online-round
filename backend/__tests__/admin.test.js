import { describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import {
  setupTestDb, createTestApp, authAs, createTestUser,
  Role, User,
} from './setup.js';
import { AdminService } from '../src/modules/admin/service.js';

// Every field the users API is allowed to return. Anything else (notably `password`)
// leaking in would fail these assertions.
const USER_KEYS = ['createdAt', 'email', 'id', 'name', 'role'];

describe('Admin Module (Users & Roles)', () => {
  let app;

  beforeEach(async () => {
    await setupTestDb();
    app = createTestApp();
  });

  describe('GET /api/roles', () => {
    test('should return 401 for an anonymous request', async () => {
      const res = await request(app).get('/api/roles');

      expect(res.status).toBe(401);
    });

    test('should be readable by any authenticated role', async () => {
      const { token } = await authAs('Driver');

      const res = await request(app).get('/api/roles').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.map((role) => role.name).sort()).toEqual([
        'Driver', 'Financial Analyst', 'Fleet Manager', 'Safety Officer',
      ]);
      res.body.forEach((role) => {
        expect(Object.keys(role).sort()).toEqual(['id', 'name', 'userCount']);
      });
    });

    test('should report the number of users holding each role', async () => {
      const { token } = await authAs('Fleet Manager'); // Fleet Manager #1
      await createTestUser('Fleet Manager');           // Fleet Manager #2
      await createTestUser('Driver');                  // Driver #1

      const res = await request(app).get('/api/roles').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const countByName = Object.fromEntries(res.body.map((role) => [role.name, role.userCount]));
      expect(countByName['Fleet Manager']).toBe(2);
      expect(countByName['Driver']).toBe(1);
      expect(countByName['Safety Officer']).toBe(0);
      expect(countByName['Financial Analyst']).toBe(0);
    });
  });

  describe('GET /api/users', () => {
    test('should return 401 for an anonymous request', async () => {
      const res = await request(app).get('/api/users');

      expect(res.status).toBe(401);
    });

    test('should return 403 for an authenticated non Fleet Manager', async () => {
      const { token } = await authAs('Financial Analyst');

      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    test('should list users for a Fleet Manager', async () => {
      const { token, user } = await authAs('Fleet Manager');
      await createTestUser('Driver');

      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);

      const me = res.body.find((u) => u.id === user.id);
      expect(me.name).toBe(user.name);
      expect(me.email).toBe(user.email);
      expect(me.role).toEqual({ id: expect.any(Number), name: 'Fleet Manager' });
      expect(me.createdAt).toBeDefined();
    });

    test('should never expose the password hash', async () => {
      const { token } = await authAs('Fleet Manager');
      await createTestUser('Driver');

      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      res.body.forEach((user) => {
        expect(Object.keys(user).sort()).toEqual(USER_KEYS);
        expect(user.password).toBeUndefined();
      });
      // No bcrypt hash ($2a$ / $2b$ / $2y$) anywhere in the payload.
      expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/);
    });
  });

  describe('PATCH /api/users/:id/role', () => {
    test('should return 401 for an anonymous request', async () => {
      const target = await createTestUser('Driver');

      const res = await request(app)
        .patch(`/api/users/${target.id}/role`)
        .send({ roleName: 'Fleet Manager' });

      expect(res.status).toBe(401);
    });

    test('should return 403 for an authenticated non Fleet Manager', async () => {
      const { token } = await authAs('Safety Officer');
      const target = await createTestUser('Driver');

      const res = await request(app)
        .patch(`/api/users/${target.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roleName: 'Fleet Manager' });

      expect(res.status).toBe(403);

      // The role must be untouched.
      const reloaded = await User.findByPk(target.id, { include: [{ model: Role, as: 'role' }] });
      expect(reloaded.role.name).toBe('Driver');
    });

    test('should update the role and return the user in the GET /users shape', async () => {
      const { token } = await authAs('Fleet Manager');
      const target = await createTestUser('Driver');

      const res = await request(app)
        .patch(`/api/users/${target.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roleName: 'Safety Officer' });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(target.id);
      expect(res.body.role.name).toBe('Safety Officer');
      expect(Object.keys(res.body).sort()).toEqual(USER_KEYS);
      expect(res.body.password).toBeUndefined();

      const reloaded = await User.findByPk(target.id, { include: [{ model: Role, as: 'role' }] });
      expect(reloaded.role.name).toBe('Safety Officer');
    });

    test('should return 404 for an unknown user', async () => {
      const { token } = await authAs('Fleet Manager');

      const res = await request(app)
        .patch('/api/users/00000000-0000-0000-0000-000000000000/role')
        .set('Authorization', `Bearer ${token}`)
        .send({ roleName: 'Driver' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    test('should return 400 for an unknown role', async () => {
      const { token } = await authAs('Fleet Manager');
      const target = await createTestUser('Driver');

      const res = await request(app)
        .patch(`/api/users/${target.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roleName: 'Supreme Overlord' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid role');
    });

    test('should not re-hash the password when only the role changes', async () => {
      const { token } = await authAs('Fleet Manager');
      const target = await createTestUser('Driver');
      const originalHash = target.password;

      await request(app)
        .patch(`/api/users/${target.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roleName: 'Financial Analyst' });

      const reloaded = await User.findByPk(target.id);
      expect(reloaded.password).toBe(originalHash);
    });
  });

  describe('AdminService', () => {
    test('getUserById should throw a 404-tagged error for an unknown user', async () => {
      await expect(
        AdminService.getUserById('00000000-0000-0000-0000-000000000000')
      ).rejects.toMatchObject({ message: 'User not found', status: 404 });
    });

    test('getAllRoles should report zero users when none are assigned', async () => {
      const roles = await AdminService.getAllRoles();

      expect(roles.length).toBe(4);
      roles.forEach((role) => expect(role.userCount).toBe(0));
    });
  });
});
