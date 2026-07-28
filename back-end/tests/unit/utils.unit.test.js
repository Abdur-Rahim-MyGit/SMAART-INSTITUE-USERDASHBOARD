/**
 * Unit tests for pure utility functions (no DB, no network).
 *
 * Covered:
 *   utils/escapeRegex.js       -> escapeRegex
 *   utils/questionShuffler.js  -> shuffleArrayDeterministic, selectQuestionsForUser
 *   utils/retry.js             -> withRetry
 *   utils/response.js          -> successResponse, errorResponse, paginatedResponse
 *
 * utils/idGenerator.js is intentionally NOT covered here: nextSequentialCode
 * requires a live mongoose connection (Counter collection), so it belongs in
 * integration tests.
 */

// questionShuffler requires config/stage_distributions at module load, which
// reads CSV files from disk via stageConfigLoader. Mock it so this suite stays
// hermetic. Only STAGE_DISTRIBUTIONS.T1 is touched at load time; the functions
// under test (shuffleArrayDeterministic, selectQuestionsForUser) never use it.
jest.mock('../../config/stage_distributions', () => ({
    STAGE_DISTRIBUTIONS: { T1: { totalQuestions: 36, quotients: {} } },
}));

// retry.js requires utils/logger, which creates a winston logger with file
// transports (and a logs/ directory) at import time. Mock it out.
jest.mock('../../utils/logger', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

const escapeRegex = require('../../utils/escapeRegex');
const { shuffleArrayDeterministic, selectQuestionsForUser } = require('../../utils/questionShuffler');
const { withRetry } = require('../../utils/retry');
const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');

describe('escapeRegex', () => {
    it('escapes every regex metacharacter so the result only matches literally', () => {
        expect(escapeRegex('a.b*c')).toBe('a\\.b\\*c');
        expect(escapeRegex('.*+?^${}()|[]\\')).toBe(
            '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\'
        );
        // Plain text passes through untouched.
        expect(escapeRegex('hello 123')).toBe('hello 123');
        // Behavioural check: escaped output used in a RegExp is a literal match.
        expect(new RegExp('^' + escapeRegex('a.b') + '$').test('a.b')).toBe(true);
        expect(new RegExp('^' + escapeRegex('a.b') + '$').test('axb')).toBe(false);
    });

    it('coerces null, undefined and non-string input safely', () => {
        expect(escapeRegex(null)).toBe('');
        expect(escapeRegex(undefined)).toBe('');
        expect(escapeRegex(42)).toBe('42');
    });

    it('truncates input to maxLen (default 80) before escaping', () => {
        expect(escapeRegex('abcdef', 3)).toBe('abc');
        expect(escapeRegex('a'.repeat(200))).toHaveLength(80);
        // Slice happens before escaping, so escaping may grow the result.
        expect(escapeRegex('...', 2)).toBe('\\.\\.');
    });
});

describe('shuffleArrayDeterministic', () => {
    const source = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    it('produces the same permutation for the same seed and does not mutate the input', () => {
        const first = shuffleArrayDeterministic(source, 'user-123');
        const second = shuffleArrayDeterministic(source, 'user-123');

        expect(first).toEqual(second);
        // It is a permutation: same elements, same length.
        expect([...first].sort((a, b) => a - b)).toEqual(source);
        // The original array is untouched.
        expect(source).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        // A different seed yields a different order (verified for these seeds).
        const other = shuffleArrayDeterministic(source, 'another-seed');
        expect(other).not.toEqual(first);
    });

    it('returns [] for empty or missing arrays', () => {
        expect(shuffleArrayDeterministic([], 'seed')).toEqual([]);
        expect(shuffleArrayDeterministic(null, 'seed')).toEqual([]);
        expect(shuffleArrayDeterministic(undefined, 'seed')).toEqual([]);
    });
});

describe('selectQuestionsForUser', () => {
    const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    it('returns the first `limit` items of the deterministic shuffle for that user', () => {
        const selected = selectQuestionsForUser(pool, 'user-123', 4);
        expect(selected).toHaveLength(4);
        expect(selected).toEqual(shuffleArrayDeterministic(pool, 'user-123').slice(0, 4));
        // Default limit is 36; a smaller pool is returned whole.
        expect(selectQuestionsForUser(pool, 'user-123')).toHaveLength(10);
    });
});

describe('withRetry', () => {
    let randomSpy;

    beforeEach(() => {
        // Kill the jitter (Math.random() * 500) so retry delays stay at 1-2ms.
        randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
    });

    afterEach(() => {
        randomSpy.mockRestore();
    });

    it('resolves with the function result on first success without retrying', async () => {
        const fn = jest.fn().mockResolvedValue('ok');
        await expect(withRetry(fn, 3, 1)).resolves.toBe('ok');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries transient errors (including HTTP 429) until success', async () => {
        const rateLimited = Object.assign(new Error('Too Many Requests'), {
            isAxiosError: true,
            response: { status: 429 },
        });
        const fn = jest
            .fn()
            .mockRejectedValueOnce(new Error('transient'))
            .mockRejectedValueOnce(rateLimited)
            .mockResolvedValue('recovered');

        await expect(withRetry(fn, 3, 1)).resolves.toBe('recovered');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('aborts immediately on a non-retryable 4xx client error', async () => {
        const notFound = Object.assign(new Error('Not Found'), {
            isAxiosError: true,
            response: { status: 404 },
        });
        const fn = jest.fn().mockRejectedValue(notFound);

        await expect(withRetry(fn, 3, 1)).rejects.toThrow('Not Found');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('throws the last error once maxRetries is exhausted', async () => {
        const fn = jest.fn().mockRejectedValue(new Error('always fails'));
        // maxRetries = 1 -> initial attempt + 1 retry = 2 calls total.
        await expect(withRetry(fn, 1, 1)).rejects.toThrow('always fails');
        expect(fn).toHaveBeenCalledTimes(2);
    });
});

describe('response helpers', () => {
    const mockRes = () => ({
        statusCode: null,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    });

    it('successResponse and errorResponse set status, flags and optional fields correctly', () => {
        let res = mockRes();
        successResponse(res, { id: 1 }, 'Created', 201);
        expect(res.statusCode).toBe(201);
        expect(res.body).toMatchObject({ success: true, message: 'Created', data: { id: 1 } });
        expect(typeof res.body.timestamp).toBe('string');

        // Defaults: 200 / 'Success', and `data` is omitted when null.
        res = mockRes();
        successResponse(res);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Success');
        expect(res.body).not.toHaveProperty('data');

        res = mockRes();
        errorResponse(res, 'Bad input', 400, [{ field: 'email' }]);
        expect(res.statusCode).toBe(400);
        expect(res.body).toMatchObject({
            success: false,
            message: 'Bad input',
            errors: [{ field: 'email' }],
        });

        // Defaults: 500 / generic message, `errors` omitted when null.
        res = mockRes();
        errorResponse(res);
        expect(res.statusCode).toBe(500);
        expect(res.body.message).toBe('An error occurred');
        expect(res.body).not.toHaveProperty('errors');
    });

    it('paginatedResponse computes totalPages, hasNext and hasPrev', () => {
        let res = mockRes();
        paginatedResponse(res, [1, 2, 3], 2, 3, 10);
        expect(res.statusCode).toBe(200);
        expect(res.body.pagination).toEqual({
            page: 2,
            limit: 3,
            total: 10,
            totalPages: 4, // ceil(10 / 3)
            hasNext: true, // 2 * 3 < 10
            hasPrev: true, // page > 1
        });

        // Exact final page: no next, no prev.
        res = mockRes();
        paginatedResponse(res, [], 1, 5, 5);
        expect(res.body.pagination.hasNext).toBe(false);
        expect(res.body.pagination.hasPrev).toBe(false);
    });
});
