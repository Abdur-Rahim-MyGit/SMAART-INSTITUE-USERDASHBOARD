const logger = require('./logger');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Exponential Backoff Retry Utility
 * 
 * @param {Function} fn - The asynchronous function to execute
 * @param {number} maxRetries - Maximum number of retries (default 3)
 * @param {number} baseDelay - Base delay in milliseconds (default 1000)
 * @returns {Promise<any>}
 */
async function withRetry(fn, maxRetries = 3, baseDelay = 1000) {
    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            return await fn();
        } catch (error) {
            attempt++;
            
            const isAxiosError = error.isAxiosError || !!error.response;
            const status = error.response ? error.response.status : null;
            
            // Abort immediately for client errors (400-499), EXCEPT 429 Rate Limit and 408 Request Timeout
            if (isAxiosError && status >= 400 && status < 500 && status !== 429 && status !== 408) {
                logger.warn(`⚠️ Aborting retry. Non-retryable client error (${status}) encountered.`);
                throw error;
            }
            
            if (attempt > maxRetries) {
                logger.error(`❌ Max retries (${maxRetries}) reached. Final failure.`);
                throw error;
            }
            
            // Exponential backoff: 1s, 2s, 4s...
            // Add a small random jitter to avoid thundering herd problem
            const jitter = Math.random() * 500;
            const delay = (baseDelay * Math.pow(2, attempt - 1)) + jitter;
            
            logger.warn(`⚠️ API call failed (${status || error.message}), retrying in ${Math.round(delay)}ms... (Attempt ${attempt}/${maxRetries})`);
            await sleep(delay);
        }
    }
}

module.exports = { withRetry };
