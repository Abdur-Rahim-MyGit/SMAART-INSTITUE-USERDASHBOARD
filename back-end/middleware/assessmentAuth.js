const jwt = require('jsonwebtoken');

/**
 * Signs a dedicated JWT for an assessment session.
 * Short-lived and bound to a specific resultId.
 */
const signAssessmentToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '2h' // Sufficient for most assessments
  });
};

/**
 * Middleware to verify the assessment session token.
 * Ensures the request is coming from an active, authorized assessment window.
 */
const verifyAssessmentToken = (req, res, next) => {
  const token = req.headers['x-assessment-token'];

  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'Assessment session token missing. Please restart the test correctly.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach assessment data to request
    req.assessmentSession = decoded;

    // Security Check: Verify that the resultId in the request matches the token's resultId
    const bodyResultId = req.body.resultId || req.params.resultId;
    if (bodyResultId && bodyResultId !== decoded.resultId) {
      return res.status(403).json({
        success: false,
        message: 'Security Breach: Token mismatch. This session is locked to a different attempt.'
      });
    }

    // Security Check: Verify that the userId in the token matches the authenticated user
    // Uses safe String() conversion to handle both Mongoose docs (_id) and POJOs (id)
    if (req.user) {
      const reqUserId = String(req.user._id || req.user.id || '');
      const tokenUserId = String(decoded.userId || '');
      if (reqUserId && tokenUserId && reqUserId !== tokenUserId) {
        return res.status(403).json({
          success: false,
          message: 'Security Breach: Token does not belong to the current user.'
        });
      }
    }

    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Assessment session expired or invalid. Please refresh the page to resume.',
      error: err.message
    });
  }
};

module.exports = {
  signAssessmentToken,
  verifyAssessmentToken
};
