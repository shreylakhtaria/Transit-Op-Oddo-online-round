import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import {
  setupTestDb, createTestApp, authAs, createTestVehicle, createTestDriver, createTestTrip,
  MaintenanceLog, Expense,
} from './setup.js';
import {
  parsePagination, paginate, DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT,
} from '../src/utils/pagination.js';

// The five list endpoints that opted into pagination. Each is seeded with exactly
// SEEDED_ROWS records below.
const LIST_ENDPOINTS = [
  '/api/vehicles',
  '/api/drivers',
  '/api/trips',
  '/api/maintenance',
  '/api/expenses',
];

const SEEDED_ROWS = 3;

describe('Pagination', () => {
  describe('parsePagination helper', () => {
    test('should return null when neither page nor limit is supplied', () => {
      expect(parsePagination({})).toBeNull();
      expect(parsePagination({ status: 'Available' })).toBeNull();
      expect(parsePagination()).toBeNull();
    });

    test('should default the missing counterpart when only one is supplied', () => {
      expect(parsePagination({ page: '2' })).toEqual({ page: 2, limit: DEFAULT_LIMIT, offset: DEFAULT_LIMIT });
      expect(parsePagination({ limit: '5' })).toEqual({ page: DEFAULT_PAGE, limit: 5, offset: 0 });
    });

    test('should coerce string query params and compute the offset', () => {
      expect(parsePagination({ page: '3', limit: '20' })).toEqual({ page: 3, limit: 20, offset: 40 });
    });

    test('should accept the boundary values', () => {
      expect(parsePagination({ page: '1', limit: '1' })).toEqual({ page: 1, limit: 1, offset: 0 });
      expect(parsePagination({ limit: String(MAX_LIMIT) })).toEqual({ page: 1, limit: MAX_LIMIT, offset: 0 });
    });

    test.each([
      ['page below 1', { page: '0' }],
      ['negative page', { page: '-1' }],
      ['non-numeric page', { page: 'abc' }],
      ['non-integer page', { page: '1.5' }],
      ['limit below 1', { limit: '0' }],
      ['limit above the maximum', { limit: String(MAX_LIMIT + 1) }],
      ['non-numeric limit', { limit: 'abc' }],
    ])('should throw a ZodError for %s', (_label, query) => {
      expect(() => parsePagination(query)).toThrow(
        expect.objectContaining({ name: 'ZodError' })
      );
    });
  });

  describe('paginate helper', () => {
    beforeEach(async () => {
      await setupTestDb();
    });

    test('should fall back to findAll (bare array) when pagination is null', async () => {
      const model = {
        findAll: jest.fn().mockResolvedValue(['a', 'b']),
        findAndCountAll: jest.fn(),
      };

      const result = await paginate(model, { where: {} }, null);

      expect(result).toEqual(['a', 'b']);
      expect(model.findAll).toHaveBeenCalledWith({ where: {} });
      expect(model.findAndCountAll).not.toHaveBeenCalled();
    });

    test('should use findAndCountAll and build the envelope when paginating', async () => {
      const model = {
        findAll: jest.fn(),
        findAndCountAll: jest.fn().mockResolvedValue({ rows: ['a'], count: 7 }),
      };

      const result = await paginate(model, { where: {} }, { page: 2, limit: 3, offset: 3 });

      expect(model.findAndCountAll).toHaveBeenCalledWith({ where: {}, limit: 3, offset: 3 });
      expect(model.findAll).not.toHaveBeenCalled();
      expect(result).toEqual({ data: ['a'], total: 7, page: 2, limit: 3 });
    });
  });

  describe('list endpoints', () => {
    let app;
    let token;

    beforeEach(async () => {
      await setupTestDb();
      app = createTestApp();
      ({ token } = await authAs('Fleet Manager'));

      const vehicles = [];
      for (let i = 0; i < SEEDED_ROWS; i += 1) {
        vehicles.push(await createTestVehicle({ registrationNumber: `MH-PAGE-${i}` }));
      }

      const drivers = [];
      for (let i = 0; i < SEEDED_ROWS; i += 1) {
        drivers.push(await createTestDriver({ licenseNumber: `DL-PAGE-${i}` }));
      }

      for (let i = 0; i < SEEDED_ROWS; i += 1) {
        await createTestTrip(vehicles[i].id, drivers[i].id);

        await MaintenanceLog.create({
          vehicleId: vehicles[i].id,
          description: `Service ${i}`,
          cost: 100 + i,
          startDate: '2026-07-12',
          status: 'Active',
        });

        await Expense.create({
          vehicleId: vehicles[i].id,
          description: `Expense ${i}`,
          amount: 10 + i,
          category: 'Other',
          date: '2026-07-12',
        });
      }
    });

    // --- Backwards compatibility: no page/limit -> bare array, exactly as before ---

    test.each(LIST_ENDPOINTS)(
      'GET %s should return a bare array when neither page nor limit is supplied',
      async (endpoint) => {
        const res = await request(app).get(endpoint).set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(SEEDED_ROWS);
        expect(res.body.data).toBeUndefined();
        expect(res.body.total).toBeUndefined();
      }
    );

    test.each(LIST_ENDPOINTS)(
      'GET %s should still return a bare array when only unrelated filters are supplied',
      async (endpoint) => {
        const res = await request(app)
          .get(endpoint)
          .query({ status: 'Nope' })
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      }
    );

    // --- Opt-in: page and/or limit -> envelope ---

    test.each(LIST_ENDPOINTS)(
      'GET %s should return the envelope when page and limit are supplied',
      async (endpoint) => {
        const res = await request(app)
          .get(endpoint)
          .query({ page: 1, limit: 2 })
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(false);
        expect(Object.keys(res.body).sort()).toEqual(['data', 'limit', 'page', 'total']);
        expect(res.body.data.length).toBe(2);
        expect(res.body.total).toBe(SEEDED_ROWS);
        expect(res.body.page).toBe(1);
        expect(res.body.limit).toBe(2);
      }
    );

    test.each(LIST_ENDPOINTS)(
      'GET %s should return the remainder on the last page',
      async (endpoint) => {
        const res = await request(app)
          .get(endpoint)
          .query({ page: 2, limit: 2 })
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.total).toBe(SEEDED_ROWS);
        expect(res.body.page).toBe(2);
      }
    );

    test.each(LIST_ENDPOINTS)(
      'GET %s should default limit to 10 when only page is supplied',
      async (endpoint) => {
        const res = await request(app)
          .get(endpoint)
          .query({ page: 1 })
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.page).toBe(DEFAULT_PAGE);
        expect(res.body.limit).toBe(DEFAULT_LIMIT);
        expect(res.body.total).toBe(SEEDED_ROWS);
        expect(res.body.data.length).toBe(SEEDED_ROWS);
      }
    );

    test.each(LIST_ENDPOINTS)(
      'GET %s should default page to 1 when only limit is supplied',
      async (endpoint) => {
        const res = await request(app)
          .get(endpoint)
          .query({ limit: 2 })
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.page).toBe(DEFAULT_PAGE);
        expect(res.body.limit).toBe(2);
        expect(res.body.data.length).toBe(2);
      }
    );

    test.each(LIST_ENDPOINTS)(
      'GET %s should return an empty page past the end without lying about the total',
      async (endpoint) => {
        const res = await request(app)
          .get(endpoint)
          .query({ page: 99, limit: 10 })
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
        expect(res.body.total).toBe(SEEDED_ROWS);
      }
    );

    // --- Validation ---

    test.each(LIST_ENDPOINTS)('GET %s should return 400 for page=0', async (endpoint) => {
      const res = await request(app)
        .get(endpoint)
        .query({ page: 0 })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test.each(LIST_ENDPOINTS)('GET %s should return 400 for limit=0', async (endpoint) => {
      const res = await request(app)
        .get(endpoint)
        .query({ limit: 0 })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    test.each(LIST_ENDPOINTS)('GET %s should return 400 for limit above 100', async (endpoint) => {
      const res = await request(app)
        .get(endpoint)
        .query({ limit: MAX_LIMIT + 1 })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    test.each(LIST_ENDPOINTS)('GET %s should return 400 for a non-numeric page', async (endpoint) => {
      const res = await request(app)
        .get(endpoint)
        .query({ page: 'abc' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    // --- Auth is still enforced on the paginated endpoints ---

    test.each(LIST_ENDPOINTS)('GET %s should return 401 for an anonymous request', async (endpoint) => {
      const res = await request(app).get(endpoint).query({ page: 1, limit: 2 });

      expect(res.status).toBe(401);
    });

    // --- Filters compose with pagination ---

    test('GET /api/vehicles should apply filters and pagination together', async () => {
      await createTestVehicle({ registrationNumber: 'MH-RETIRED-1', status: 'Retired' });
      await createTestVehicle({ registrationNumber: 'MH-RETIRED-2', status: 'Retired' });

      const res = await request(app)
        .get('/api/vehicles')
        .query({ status: 'Retired', page: 1, limit: 1 })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('Retired');
    });
  });
});
