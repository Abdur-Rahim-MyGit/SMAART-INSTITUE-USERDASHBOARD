const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, phone, location } = req.body;
        const emailLower = email.toLowerCase();

        // Check if user already exists
        const existingUser = await User.findOne({ email: emailLower });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            phone,
            location
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user,
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const emailLower = email.toLowerCase();

        // Find user and include password
        const user = await User.findOne({ email: emailLower }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        // Remove password from response
        user.password = undefined;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user,
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/update
 * @access  Private
 */
exports.updateUser = async (req, res, next) => {
    try {
        const { name, phone, location, headline } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, phone, location, headline },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Forgot Password - Send OTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found with this email'
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Set OTP and expiry (10 minutes)
        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpire = Date.now() + 10 * 60 * 1000;

        await user.save({ validateBeforeSave: false });

        // Log OTP to terminal as requested
        console.log('');
        console.log('🔐 ========================================');
        console.log('🔑 PASSWORD RESET OTP REQUEST');
        console.log(`👤 User: ${email}`);
        console.log(`🔢 OTP: ${otp}`);
        console.log('🔐 ========================================');
        console.log('');

        res.json({
            success: true,
            message: 'OTP sent successfully. Check the server terminal.'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Reset Password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
    try {
        const { email, otp, password } = req.body;

        const user = await User.findOne({
            email: email.toLowerCase(),
            resetPasswordOtp: otp,
            resetPasswordOtpExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Set new password
        user.password = password;
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpire = undefined;

        await user.save();

        res.json({
            success: true,
            message: 'Password reset successful. You can now login.'
        });
    } catch (error) {
        next(error);
    }
};
