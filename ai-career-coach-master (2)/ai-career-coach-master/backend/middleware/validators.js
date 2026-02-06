const { body, validationResult } = require('express-validator');

/**
 * Validation middleware
 */
exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * User registration validation
 */
exports.registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),

    body('phone')
        .optional()
        .trim()
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/).withMessage('Invalid phone number')
];

/**
 * Login validation
 */
exports.loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
];

/**
 * Profile update validation
 */
exports.profileValidation = [
    body('skills.*.name')
        .optional()
        .trim()
        .notEmpty().withMessage('Skill name is required'),

    body('skills.*.level')
        .optional()
        .isInt({ min: 1, max: 10 }).withMessage('Skill level must be between 1-10'),

    body('careerGoals.targetRoles')
        .optional()
        .isArray().withMessage('Target roles must be an array'),

    body('constraints.salaryExpectation.min')
        .optional()
        .isNumeric().withMessage('Minimum salary must be a number'),

    body('constraints.salaryExpectation.max')
        .optional()
        .isNumeric().withMessage('Maximum salary must be a number')
        .custom((value, { req }) => {
            if (req.body.constraints?.salaryExpectation?.min && value < req.body.constraints.salaryExpectation.min) {
                throw new Error('Maximum salary must be greater than minimum');
            }
            return true;
        })
];
