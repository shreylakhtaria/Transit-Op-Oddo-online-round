import { z } from 'zod';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

const paginationSchema = z.object({
  page: z.coerce
    .number({ invalid_type_error: 'Page must be a number' })
    .int('Page must be an integer')
    .min(1, 'Page must be greater than or equal to 1')
    .default(DEFAULT_PAGE),
  limit: z.coerce
    .number({ invalid_type_error: 'Limit must be a number' })
    .int('Limit must be an integer')
    .min(1, 'Limit must be between 1 and 100')
    .max(MAX_LIMIT, 'Limit must be between 1 and 100')
    .default(DEFAULT_LIMIT)
});

/**
 * Parses the opt-in pagination query parameters.
 *
 * Returns `null` when neither `page` nor `limit` was supplied, which tells the services
 * to keep returning the legacy bare array (existing consumers depend on that shape).
 * When either one is supplied, the missing counterpart falls back to its default.
 *
 * Throws a ZodError — surfaced as a 400 by the controllers — for invalid values.
 */
export const parsePagination = (query = {}) => {
  const { page, limit } = query;

  if (page === undefined && limit === undefined) {
    return null;
  }

  const parsed = paginationSchema.parse({
    ...(page === undefined ? {} : { page }),
    ...(limit === undefined ? {} : { limit })
  });

  return {
    page: parsed.page,
    limit: parsed.limit,
    offset: (parsed.page - 1) * parsed.limit
  };
};

/**
 * Runs a list query for `model`, applying the pagination window when one was requested.
 *
 * - `pagination === null` -> plain `findAll`, returning the bare array (unchanged behaviour).
 * - otherwise -> `findAndCountAll`, returning the `{ data, total, page, limit }` envelope.
 */
export const paginate = async (model, options, pagination = null) => {
  if (!pagination) {
    return await model.findAll(options);
  }

  const { rows, count } = await model.findAndCountAll({
    ...options,
    limit: pagination.limit,
    offset: pagination.offset
  });

  return {
    data: rows,
    total: count,
    page: pagination.page,
    limit: pagination.limit
  };
};
