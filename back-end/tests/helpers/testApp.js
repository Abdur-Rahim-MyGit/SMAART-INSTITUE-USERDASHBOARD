const express = require('express');
const cookieParser = require('cookie-parser');
const sanitizeMongo = require('../../middleware/sanitizeMongo');
const deviceFingerprint = require('../../middleware/deviceFingerprint');
const { errorHandler } = require('../../middleware/errorHandler');

/**
 * Creates and configures an Express app with standard middlewares for testing.
 * @param {Function} routeSetup - Optional callback (app) => { app.use('/route', routeRouter) }
 * @returns {express.Application}
 */
const createTestApp = (routeSetup) => {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(sanitizeMongo);
    app.use(deviceFingerprint);

    if (typeof routeSetup === 'function') {
        routeSetup(app);
    }

    app.use(errorHandler);

    return app;
};

module.exports = {
    createTestApp,
};
