/**
 * Device Fingerprinting Middleware
 * Captures User-Agent and IP address to bind session to a specific device.
 */
const deviceFingerprint = (req, res, next) => {
    req.deviceInfo = {
        userAgent: req.headers?.['user-agent'] || 'unknown',
        ip: req.ip || (req.connection && req.connection.remoteAddress) || 'unknown'
    };
    next();
};

module.exports = deviceFingerprint;
