const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Registration = require('../models/Registration');
const User = require('../models/User');
const LoginOtp = require('../models/LoginOtp');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');
const { notifyWelcome } = require('../services/notificationService');

// SECURITY: Import rate limiters
const { loginLimiter, otpLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');

const router = express.Router();

// === Authentication Flow Constants ===
const OTP_MAX_ATTEMPTS = 5;
const ACCOUNT_LOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const OTP_RESEND_COOLDOWN = 60 * 1000; // 1 minute in milliseconds

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// === Password Policy Validation Helper ===
const validatePasswordPolicy = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('Minimum 8 characters required');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter required');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter required');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('At least one number required');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('At least one special character required (!@#$%^&*(),.?":{}|<>)');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// === Helper to check if account is locked ===
const checkAccountLock = (user) => {
  if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
    const remainingMs = user.accountLockedUntil - new Date();
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    return {
      isLocked: true,
      remainingMinutes,
      lockedUntil: user.accountLockedUntil
    };
  }
  return { isLocked: false };
};

// === SECURITY FIX #6: Real Signup OTP Flow ===

// Send OTP for signup email verification
router.post('/send-signup-otp', passwordResetLimiter, async (req, res) => {
  try {
    const { email, fullName } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ error: 'Email and full name are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Check if email already registered across all user collections
    const Student = require('../models/Student');
    const existingStudent = await Student.findOne({ email: normalizedEmail });
    const existingUser = await User.findOne({ email: normalizedEmail });
    const existingReg = await Registration.findOne({ email: normalizedEmail });

    if (existingStudent || existingUser || existingReg) {
      return res.status(400).json({ error: 'An account with this email already exists. Please login instead.' });
    }

    // Clean up any previous signup OTPs for this email
    await LoginOtp.deleteMany({ email: normalizedEmail, flowType: 'account-verify' });

    // Generate OTP and temp token
    const otp = generateOTP();
    const tempToken = crypto.randomBytes(32).toString('hex');

    // Save OTP record
    const otpRecord = new LoginOtp({
      email: normalizedEmail,
      otp,
      tempToken,
      userData: { email: normalizedEmail, fullName: fullName.trim() },
      flowType: 'account-verify',
      maxAttempts: 5,
    });
    await otpRecord.save();

    // Send OTP email
    await sendOTPEmail(normalizedEmail, otp, fullName.trim());
    console.log(`📧 Signup OTP sent to ${normalizedEmail}`);

    res.json({
      success: true,
      message: 'OTP sent to your email',
      tempToken,
    });
  } catch (err) {
    console.error('[Send Signup OTP] Error:', err.message);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

// Verify signup OTP
router.post('/verify-signup-otp', otpLimiter, async (req, res) => {
  try {
    const { tempToken, otp } = req.body;

    if (!tempToken || !otp) {
      return res.status(400).json({ error: 'Token and OTP are required' });
    }

    const otpRecord = await LoginOtp.findOne({
      tempToken,
      flowType: 'account-verify',
      isUsed: false,
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'OTP has expired or is invalid. Please request a new one.' });
    }

    // Check max attempts
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await LoginOtp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: 'Maximum attempts exceeded. Please request a new OTP.' });
    }

    // Verify OTP
    const isValid = await otpRecord.verifyOtp(otp);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = otpRecord.maxAttempts - otpRecord.attempts;
      return res.status(400).json({
        error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      });
    }

    // Mark as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    res.json({
      success: true,
      message: 'Email verified successfully',
      email: otpRecord.userData.email,
      fullName: otpRecord.userData.fullName,
    });
  } catch (err) {
    console.error('[Verify Signup OTP] Error:', err.message);
    res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
  }
});

// Resend signup OTP
router.post('/resend-signup-otp', passwordResetLimiter, async (req, res) => {
  try {
    const { tempToken } = req.body;

    if (!tempToken) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Find existing OTP record
    const existingOtp = await LoginOtp.findOne({
      tempToken,
      flowType: 'account-verify',
    });

    if (!existingOtp) {
      return res.status(400).json({ error: 'Session expired. Please start over.' });
    }

    const { email, fullName } = existingOtp.userData;

    // Delete old record
    await LoginOtp.deleteOne({ _id: existingOtp._id });

    // Generate new OTP with same temp token
    const otp = generateOTP();
    const newTempToken = crypto.randomBytes(32).toString('hex');

    const otpRecord = new LoginOtp({
      email,
      otp,
      tempToken: newTempToken,
      userData: { email, fullName },
      flowType: 'account-verify',
      maxAttempts: 5,
    });
    await otpRecord.save();

    await sendOTPEmail(email, otp, fullName);
    console.log(`📧 Signup OTP resent to ${email}`);

    res.json({
      success: true,
      message: 'New OTP sent to your email',
      tempToken: newTempToken,
    });
  } catch (err) {
    console.error('[Resend Signup OTP] Error:', err.message);
    res.status(500).json({ error: 'Failed to resend OTP. Please try again.' });
  }
});

// Register - SECURITY FIX #15: Added input validation
router.post('/register',
  [
    body('fullName').notEmpty().withMessage('Full name is required').trim().escape(),
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('mobileNumber').optional().matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit mobile number'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('institution').optional().trim().escape(),
  ],
  async (req, res) => {
  try {
    // SECURITY FIX #15: Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { fullName, email, mobileNumber, password, institution } = req.body;

    // SECURITY FIX #8: Validate password policy on registration
    const policyCheck = validatePasswordPolicy(password);
    if (!policyCheck.isValid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        requirements: policyCheck.errors
      });
    }

    // Check if user exists
    let registration = await Registration.findOne({ email });
    if (registration) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new registration
    registration = new Registration({
      fullName,
      email,
      mobileNumber,
      password,
      institution,
    });

    await registration.save();

    // Send welcome notification
    try {
      await notifyWelcome(registration._id, fullName);
      console.log(`🔔 Welcome notification sent to ${fullName}`);
    } catch (notifyError) {
      console.error("⚠️ Error sending welcome notification:", notifyError);
    }

    // Create JWT token - SECURITY: Enforce environment secret and reduce expiry
    const token = jwt.sign(
      { userId: registration._id, email: registration.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set HttpOnly Cookie - SECURITY FIX #7: Added sameSite
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: registration._id,
        fullName: registration.fullName,
        email: registration.email,
        institution: registration.institution,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login - PROTECTED with rate limiting
router.post('/login',
  loginLimiter,
  [
    // Relaxed validation to allow Student IDs (alphanumeric)
    body('email').notEmpty().withMessage('Email or ID is required'),
    body('password').notEmpty().withMessage('Password is required').isString().trim(),
  ],
  async (req, res) => {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
      const { email, password, collegeCode, institution } = req.body;
      const Student = require('../models/Student');
      const Teacher = require('../models/Teacher');
      const User = require('../models/User');
      const College = require('../models/College');

      console.log('Login attempt:', { identifier: email, collegeCode, institution });

      let user = null;
      let userType = null;
      let userModel = null;
      let collegeId = null;
      let collegeInfo = null;

      // Determine if input is email or ID
      const isEmail = String(email).match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      const identifier = email.trim(); // Can be email or ID
      // NOTE: normalizedEmail is primarily used for email-based lookups.
      // For ID based logins, we'll derive the actual email from the resolved user record.
      const normalizedEmail = isEmail ? identifier.toLowerCase() : identifier;

      // If collegeCode is provided, first find the college
      const institutionToCheck = collegeCode || institution;
      if (institutionToCheck) {
        collegeInfo = await College.findOne({
          $or: [
            { collegeCode: institutionToCheck },
            { collegeName: institutionToCheck }
          ]
        });
        if (collegeInfo) {
          collegeId = collegeInfo._id;
        }
      }

      // 1. Try to find user in Student collection
      let studentQuery;
      if (isEmail) {
        studentQuery = { email: identifier.toLowerCase() };
      } else {
        studentQuery = { studentId: identifier }; // Case sensitive ID search? or uppercase? Usually IDs are uppercase. Let's try flexible.
        // Actually, IDs like "STU00001".
        // Let's use flexible query:
        studentQuery = {
          $or: [
            { studentId: identifier },
            { studentId: identifier.toUpperCase() },
            { userId: identifier } // In case they use the generic userId
          ]
        };
      }

      if (collegeId) {
        studentQuery.college = collegeId;
      }

      // Execute Student Search
      user = await Student.findOne(studentQuery).select('+password');

      if (user) {
        userType = 'student';
        userModel = 'Student';
      }

      // 2. If not found, try Teacher (usually email only, but maybe teacherId?)
      if (!user) {
        let teacherQuery = isEmail ? { email: identifier.toLowerCase() } : { teacherId: identifier };
        if (collegeId) teacherQuery.college = collegeId;

        user = await Teacher.findOne(teacherQuery).select('+password');

        if (user) {
          userType = 'teacher';
          userModel = 'Teacher';
        }
      }

      // 3. If not found, try generic User (Admin, etc)
      if (!user) {
        let userQuery = isEmail ? { email: identifier.toLowerCase() } : { userId: identifier };
        user = await User.findOne(userQuery).select('+password');

        if (user) {
          userType = 'user';
          userModel = 'User';
        }
      }

      // If still not found, try Registration collection (legacy) - with institution filter
      if (!user) {
        if (institutionToCheck) {
          // Check if institution matches the college name or code
          user = await Registration.findOne({
            email: normalizedEmail,
            $or: [
              { institution: institutionToCheck },
              { institution: collegeInfo?.collegeName }
            ]
          });
        } else {
          user = await Registration.findOne({ email: normalizedEmail });
        }
        if (user) {
          userType = 'registration';
          userModel = 'Registration';
        }
      }

      console.log('User found after cross-checking:', {
        id: user?._id,
        email: user?.email,
        userType,
        hasGender: !!user?.gender
      });

      // If user not found in any collection
      if (!user) {
        // Check if user exists in a different college (for better error message)
        if (collegeId) {
          const userInOtherCollege = await Student.findOne({ email: normalizedEmail });
          if (userInOtherCollege) {
            return res.status(400).json({ error: 'Invalid credentials for the selected college. This account belongs to a different institution.' });
          }
        }
        return res.status(400).json({ error: 'Invalid credentials or user not found in selected institution' });
      }

      // === SECURITY FIX #1: Check account status before allowing login ===
      if (user.status && !['active'].includes(user.status)) {
        const statusMessages = {
          pending: 'Your account is pending approval. Please contact your administrator.',
          inactive: 'Your account has been deactivated. Please contact your administrator.',
          suspended: 'Your account has been suspended. Please contact your administrator.',
          graduated: 'Your account has been archived. Please contact your administrator.'
        };
        return res.status(403).json({
          error: statusMessages[user.status] || `Account status '${user.status}' does not allow login. Please contact your administrator.`
        });
      }

      // === SECURITY FIX #12: Check account lock BEFORE password verification ===
      if (userType === 'student') {
        const lockStatus = checkAccountLock(user);
        if (lockStatus.isLocked) {
          console.log(`[Auth/Login] Account locked for ${normalizedEmail} until ${lockStatus.lockedUntil}`);
          return res.status(403).json({
            error: `Account temporarily locked due to too many failed attempts. Try again in ${lockStatus.remainingMinutes} minutes.`,
            lockedUntil: lockStatus.lockedUntil,
            isLocked: true
          });
        }
      }

      // Check password
      // === SECURITY FIX #2: Require password even for first-time login students ===
      const isFirstTimeLogin = userType === 'student' && user.mustChangePassword;

      if (isFirstTimeLogin) {
        // First-time students must still verify their default password
        if (!password) {
          return res.status(400).json({ error: 'Password is required. Please enter your default password.' });
        }
        if (user.password) {
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return res.status(400).json({ error: 'Invalid default password. Please contact your administrator.' });
          }
        }
      } else {
        if (!user.password) {
          return res.status(400).json({ error: 'Password not set for this account' });
        }

        if (!password) {
          return res.status(400).json({ error: 'Password is required' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }
      }

      // Derive the actual email address for OTP and communication purposes
      const loginEmail = (user.email || (isEmail ? normalizedEmail : null))?.toLowerCase();

      // If we still don't have an email, we cannot send OTP – surface a clear error
      if (!loginEmail) {
        return res.status(400).json({
          error: 'No email is associated with this account. Please contact your administrator.'
        });
      }

      // Check if student must change password on first login
      // BUT only if they don't already have a registration record (returning user)
      if (userType === 'student' && user.mustChangePassword) {
        // First check if student already exists in Registration collection
        const existingRegistration = await Registration.findOne({
          email: { $regex: new RegExp(`^${escapeRegex(loginEmail)}$`, 'i') }
        });

        if (existingRegistration) {
          // Student already registered - skip password change, update flags, proceed normally
          console.log(`[Auth/Login] Student ${normalizedEmail} already has registration record - skipping password change`);

          // Update student record to mark as not first login and registered
          const Student = require('../models/Student');
          await Student.findByIdAndUpdate(user._id, {
            mustChangePassword: false,
            isFirstLogin: false,
            isRegistered: true
          });
          user.mustChangePassword = false;
          user.isFirstLogin = false;
          user.isRegistered = true;
          // Continue to normal login flow (OTP for returning users)
        } else {
          // === MODIFIED: First-time login now requires OTP verification first ===
          console.log(`[Auth/Login] First-time login for ${normalizedEmail} - sending OTP before password change`);

          // Generate OTP and send
          const otp = generateOTP();
          console.log(`[OTP] Generated OTP for ${loginEmail}: '${otp}'`);
          const tempToken = crypto.randomBytes(32).toString('hex');

          // Delete any existing OTP for this email
          await LoginOtp.deleteMany({ email: loginEmail });

          // Store OTP with first-login flow type
          const loginOtp = new LoginOtp({
            email: loginEmail,
            otp: otp, // Will be hashed by pre-save hook
            tempToken: tempToken,
            flowType: 'first-login', // NEW: Indicates OTP for first-time login
            userData: {
              userId: user._id,
              userType: userType,
              fullName: user.fullName,
              mustChangePassword: true,
              isRegistered: false,
              isAssessmentCompleted: false,
              college: user.college
            },
          });
          await loginOtp.save();

          // Update last OTP sent time
          await Student.findByIdAndUpdate(user._id, {
            lastOtpSentAt: new Date(),
            otpAttempts: 0 // Reset attempts for new OTP
          });

          // Send OTP email
          const emailResult = await sendOTPEmail(loginEmail, otp, user.fullName);
          if (!emailResult.success) {
            console.error('Failed to send OTP email:', emailResult.error);
          }

          return res.json({
            message: 'OTP sent to your email for verification',
            requireOtp: true,
            flowType: 'first-login',
            tempToken: tempToken,
            email: loginEmail,
            fullName: user.fullName
          });
        }
      }

      // Create JWT token - SECURITY: Enforce environment secret and reduce expiry
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          userType: userType,
          role: user.role || userType
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Prepare user response based on type
      // Robust gender lookup
      let finalGender = user.gender;
      console.log(`[Auth/Login] User type: ${userType}, Initial gender: ${finalGender} for ${normalizedEmail}`);

      if (!finalGender) {
        console.log(`[Auth/Login] Gender missing for ${normalizedEmail}. Attempting Registration lookup...`);
        const regRecord = await Registration.findOne({
          $or: [
            { userId: user._id },
            { email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') } }
          ]
        });
        finalGender = regRecord?.gender;
        console.log(`[Auth/Login] Registration record for ${normalizedEmail}:`, regRecord ? { gender: regRecord.gender } : 'NOT FOUND');
      }

      console.log(`[Auth/Login] Final resolved gender for ${normalizedEmail}: ${finalGender}`);

      const userResponse = {
        _id: user._id, // Standardize for backend compatibility
        id: user._id, // Standardize for frontend compatibility
        fullName: user.fullName,
        email: user.email,
        gender: finalGender,
        role: userType === 'student' ? 'student' : (userType === 'teacher' ? 'teacher' : (userType === 'registration' ? 'student' : user.role)),
        userType: userType
      };

      // Check if user has completed registration (exists in both students and registration collections)
      let hasRegistration = false;
      if (userType === 'student') {
        // Check if this student also has a registration record for the same institution
        const studentEmail = user.email.toLowerCase();

        // First, just find by email (case-insensitive)
        const registrationRecord = await Registration.findOne({
          email: { $regex: new RegExp(`^${studentEmail}$`, 'i') }
        });

        if (registrationRecord) {
          // Check if institution matches (handle both string and JSON formats)
          if (collegeInfo) {
            const regInstitution = registrationRecord.institution || '';

            // Try to parse as JSON if it looks like JSON
            let institutionName = regInstitution;
            try {
              if (regInstitution.startsWith('{')) {
                const parsed = JSON.parse(regInstitution);
                institutionName = parsed.name || regInstitution;
              }
            } catch (e) {
              // Not JSON, use as-is
            }

            // Check if institution matches
            hasRegistration = (
              institutionName === collegeInfo.collegeName ||
              institutionName === collegeInfo.collegeCode ||
              regInstitution === collegeInfo.collegeName ||
              regInstitution === collegeInfo.collegeCode
            );
          } else {
            // No college filter, just having registration is enough
            hasRegistration = true;
          }
        }

        console.log(`Student login - Email: ${studentEmail}, College: ${collegeInfo?.collegeName || 'N/A'}, Registration found: ${hasRegistration}`);

        userResponse.fullName = user.fullName;
        userResponse.studentId = user.studentId;
        userResponse.mobileNumber = user.mobile; // Student model uses 'mobile' field
        userResponse.college = user.college;
        userResponse.profileImage = user.profileImage; // Include profile picture
        userResponse.hasRegistration = hasRegistration;
      } else if (userType === 'teacher') {
        userResponse.fullName = user.fullName;
        userResponse.teacherId = user.teacherId;
        userResponse.college = user.college;
        userResponse.hasRegistration = true; // Teachers don't need registration flow
      } else if (userType === 'user') {
        userResponse.fullName = user.fullName;
        userResponse.hasRegistration = true; // Users don't need registration flow
      } else if (userType === 'registration') {
        userResponse.fullName = user.fullName;
        userResponse.studentId = user.studentId;
        userResponse.mobileNumber = user.mobileNumber;
        userResponse.institution = user.institution;
        userResponse.gender = userResponse.gender || user.gender; // Use the one we found earlier
        userResponse.hasRegistration = true; // Already in registration collection
      }

      console.log(`[Auth/Login] User response prepared:`, {
        email: userResponse.email,
        userType: userResponse.userType,
        hasRegistration: userResponse.hasRegistration,
        willRequireOtp: true // OTP required for ALL users
      });

      // === OTP verification required for ALL users (both new and returning) ===
      console.log(`[Auth/Login] Sending OTP to ${loginEmail} for login verification`);

      // Generate OTP and send email
      const otp = generateOTP();
      console.log(`[OTP] Generated OTP for ${loginEmail}: '${otp}'`);
      const tempToken = crypto.randomBytes(32).toString('hex');

      // Delete any existing OTP for this email
      await LoginOtp.deleteMany({ email: loginEmail });

      // Save OTP to database
      const loginOtp = new LoginOtp({
        email: loginEmail,
        otp: otp, // Will be hashed by pre-save hook
        tempToken: tempToken,
        userData: {
          token,
          user: userResponse,
        },
      });
      await loginOtp.save();

      // Send OTP email
      const emailResult = await sendOTPEmail(loginEmail, otp, userResponse.fullName);

      if (!emailResult.success) {
        console.error('Failed to send OTP email:', emailResult.error);
        // Continue anyway - user can request resend
      }

      return res.json({
        message: 'OTP sent to your email',
        requireOtp: true,
        tempToken: tempToken,
        email: loginEmail,
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: err.message });
    }
  });

// Verify Login OTP - PROTECTED with rate limiting
router.post('/verify-login-otp', otpLimiter, async (req, res) => {
  try {
    const { tempToken, otp } = req.body;
    const Student = require('../models/Student');

    if (!tempToken || !otp) {
      return res.status(400).json({ error: 'Token and OTP are required' });
    }

    // Find the OTP record (must not be already used)
    const loginOtp = await LoginOtp.findOne({ tempToken, isUsed: false });

    if (!loginOtp) {
      return res.status(400).json({ error: 'OTP expired or invalid. Please login again.' });
    }

    // Check max attempts
    const maxAttempts = loginOtp.maxAttempts || OTP_MAX_ATTEMPTS;
    if (loginOtp.attempts >= maxAttempts) {
      // Lock the student account
      if (loginOtp.userData?.userId) {
        await Student.findByIdAndUpdate(loginOtp.userData.userId, {
          accountLockedUntil: new Date(Date.now() + ACCOUNT_LOCK_DURATION),
          otpAttempts: 0
        });
        console.log(`[Auth/OTP] Account locked for ${loginOtp.email} due to max attempts`);
      }
      await LoginOtp.deleteOne({ _id: loginOtp._id });
      return res.status(403).json({
        error: 'Too many failed attempts. Account locked for 15 minutes.',
        isLocked: true
      });
    }

    // Verify OTP
    const isValid = await loginOtp.verifyOtp(otp);

    if (!isValid) {
      loginOtp.attempts += 1;
      await loginOtp.save();

      // Also track attempts on student record
      if (loginOtp.userData?.userId) {
        await Student.findByIdAndUpdate(loginOtp.userData.userId, {
          $inc: { otpAttempts: 1 }
        });
      }

      return res.status(400).json({
        error: 'Invalid OTP',
        attemptsRemaining: maxAttempts - loginOtp.attempts
      });
    }

    // OTP is valid - Proceed to checking session or flow type
    // We do NOT mark as used yet, because if a session conflict exists (409), 
    // we need the OTP to remain valid for the "force logout" retry.
    // The OTP will be marked as used later (lines 600+).

    const { userData, flowType } = loginOtp;
    console.log(`[Auth/OTP] OTP verified for ${loginOtp.email}, flowType: ${flowType}`);

    // === Handle different flow types ===
    if (flowType === 'first-login') {
      // First-time login - need to change password before proceeding
      // Generate new temp token for password change
      const passwordTempToken = crypto.randomBytes(32).toString('hex');

      // Create new OTP record for password change phase
      const passwordOtp = new LoginOtp({
        email: loginOtp.email,
        otp: crypto.randomBytes(3).toString('hex'), // Placeholder
        tempToken: passwordTempToken,
        flowType: 'password-change',
        isUsed: false,
        userData: {
          ...userData,
          otpVerified: true
        }
      });
      await passwordOtp.save();

      // Delete old OTP record
      await LoginOtp.deleteOne({ _id: loginOtp._id });

      return res.json({
        message: 'OTP verified! Please change your password.',
        requirePasswordChange: true,
        tempToken: passwordTempToken,
        email: loginOtp.email,
        fullName: userData.fullName
      });
    }

    // Regular login flow - issue JWT token
    // const { token, user } = userData; // OLD WAY - Token is regenerated with session ID

    const { user } = userData;
    const { forceLogout } = req.body;

    // === SECURITY: SINGLE SESSION ENFORCEMENT ===
    // Fetch fresh user record to check currentSessionId
    let userModelName = 'User';
    if (user.userType === 'student') userModelName = 'Student';
    else if (user.userType === 'teacher') userModelName = 'Teacher';
    else if (user.userType === 'registration') userModelName = 'Registration';

    const UserModel = require(`../models/${userModelName}`);
    const freshUser = await UserModel.findById(user._id);

    // === SINGLE SESSION ENFORCEMENT ===
    // Check if user is already logged in on another device
    
    // Only check if there's an ACTUAL session ID (not null, not undefined, not empty string)
    const hasActiveSession = freshUser?.currentSessionId && 
                             typeof freshUser.currentSessionId === 'string' && 
                             freshUser.currentSessionId.trim() !== '';
    
    console.log(`[Auth] Session check for ${user._id}:`, {
      currentSessionId: freshUser?.currentSessionId || null,
      hasActiveSession,
      forceLogout: !!forceLogout
    });
    
    if (hasActiveSession && !forceLogout) {
      return res.status(409).json({
        error: 'You are already logged in on another device.',
        requiresForceLogout: true,
        message: 'You are already logged in on another device. Do you want to logout from the other device and login here?'
      });
    }

    if (hasActiveSession && forceLogout) {
      console.log(`[Auth] Force logging out previous session for user ${user._id}`);
    }

    // Valid Login or Force Logout - NOW mark as used
    loginOtp.isUsed = true;
    await loginOtp.save();

    // Reset student OTP attempts
    if (loginOtp.userData?.userId) {
      await Student.findByIdAndUpdate(loginOtp.userData.userId, {
        otpAttempts: 0,
        accountLockedUntil: null
      });
    }

    // Generate NEW Session ID
    const sessionId = require('crypto').randomUUID();

    // Update user with new session ID and lastLogin timestamp
    // First, get the current lastLogin to store as previousLogin
    const currentUser = await UserModel.findById(user._id);
    await UserModel.findByIdAndUpdate(user._id, {
      currentSessionId: sessionId,
      previousLogin: currentUser?.lastLogin || null,
      lastLogin: new Date()
    });

    // Re-issue JWT token with sessionId included
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        userType: user.userType,
        role: user.role || user.userType,
        sessionId: sessionId // CRITICAL: Bind token to this specific session
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Ensure user object has consistent IDs even if stored data is stale
    if (user && user._id && !user.id) user.id = user._id;
    if (user && user.id && !user._id) user._id = user.id;

    // Determine next step based on user state
    let nextStep = '/dashboard';
    if (!user.isRegistered && !user.hasRegistration) {
      nextStep = '/complete-registration';
    }

    // Delete OTP record
    await LoginOtp.deleteOne({ _id: loginOtp._id });

    // Set HttpOnly Cookie - SECURITY FIX #7: Added sameSite
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      message: 'Login successful',
      token,
      user,
      sessionId, // Include sessionId for frontend tracking
      nextStep
    });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Resend Login OTP
router.post('/resend-login-otp', async (req, res) => {
  try {
    const { tempToken } = req.body;

    if (!tempToken) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Find the existing OTP record
    const loginOtp = await LoginOtp.findOne({ tempToken });

    if (!loginOtp) {
      return res.status(400).json({ error: 'Session expired. Please login again.' });
    }

    // Generate new OTP
    const otp = generateOTP();
    console.log(`[OTP] Resent OTP for ${loginOtp.email}: '${otp}'`);
    const newTempToken = crypto.randomBytes(32).toString('hex');

    // Update the record with new OTP and token
    loginOtp.otp = otp;
    loginOtp.tempToken = newTempToken;
    loginOtp.attempts = 0;
    loginOtp.createdAt = new Date(); // Reset expiration
    await loginOtp.save();

    // Send new OTP email
    const emailResult = await sendOTPEmail(loginOtp.email, otp, loginOtp.userData?.user?.fullName);

    if (!emailResult.success) {
      return res.status(500).json({ error: 'Failed to send OTP email. Please try again.' });
    }

    res.json({
      message: 'New OTP sent to your email',
      tempToken: newTempToken,
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Forgot Password - Request Reset - PROTECTED with rate limiting
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email, collegeCode } = req.body; // SECURITY FIX: Accept collegeCode for context validation
    const Student = require('../models/Student');
    const College = require('../models/College');

    console.log('[Forgot Password] Request received:', { email, collegeCode }); // DEBUG

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // SECURITY FIX: Validate college context if provided
    let collegeId = null;
    if (collegeCode) {
      const college = await College.findOne({
        $or: [
          { collegeCode: collegeCode },
          { collegeName: collegeCode }
        ],
        status: 'active'
      });
      console.log('[Forgot Password] College lookup result:', college ? college.collegeName : 'NOT FOUND'); // DEBUG
      if (college) {
        collegeId = college._id;
      }
    } else {
      console.log('[Forgot Password] No collegeCode provided - using fallback mode'); // DEBUG
    }

    // Find user - if collegeCode provided, STRICTLY search within that college only
    let user = null;
    if (collegeId) {
      // STRICT MODE: Only allow password reset if user belongs to the selected college
      user = await Student.findOne({ email: normalizedEmail, college: collegeId });
      // If not found in this college, DO NOT fall back to other collections
      // This prevents cross-college password resets
      if (!user) {
        console.log(`[Forgot Password] Email ${normalizedEmail} not found in college ${collegeCode} - silently rejecting`);
        return res.json({
          message: 'If an account exists with this email at this institution, you will receive a password reset code.',
          success: true,
          wrongCollege: true // Flag for frontend to show helpful message
        });
      }
    } else {
      // Backwards compatibility: No college specified, search all collections
      user = await Student.findOne({ email: normalizedEmail });
      if (!user) {
        user = await Registration.findOne({ email: normalizedEmail });
      }
      if (!user) {
        user = await User.findOne({ email: normalizedEmail });
      }
    }

    // Don't reveal if user exists or not for security
    if (!user) {
      return res.json({
        message: 'If an account exists with this email, you will receive a password reset code.',
        success: true
      });
    }

    // Generate OTP for password reset
    const otp = generateOTP();
    console.log(`[OTP] Password reset OTP for ${normalizedEmail}: '${otp}'`);
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Delete any existing reset OTP for this email
    await LoginOtp.deleteMany({ email: normalizedEmail, type: 'password-reset' });

    // Save reset OTP
    const resetOtp = new LoginOtp({
      email: normalizedEmail,
      otp: otp,
      tempToken: resetToken,
      type: 'password-reset',
      userData: {
        userId: user._id,
        userModel: user.constructor.modelName
      }
    });
    await resetOtp.save();

    // Send reset OTP email
    const emailResult = await sendOTPEmail(normalizedEmail, otp, user.fullName, 'Password Reset');

    res.json({
      message: 'If an account exists with this email, you will receive a password reset code.',
      success: true,
      resetToken: resetToken // For the frontend to use
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Verify Reset OTP and Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, otp, newPassword } = req.body;
    const Student = require('../models/Student');

    if (!resetToken || !otp || !newPassword) {
      return res.status(400).json({ error: 'Reset token, OTP, and new password are required' });
    }

    // Validate password policy
    const policyCheck = validatePasswordPolicy(newPassword);
    if (!policyCheck.isValid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        requirements: policyCheck.errors
      });
    }

    // Find the reset OTP record
    const resetOtp = await LoginOtp.findOne({ tempToken: resetToken });

    if (!resetOtp) {
      return res.status(400).json({ error: 'Reset link expired or invalid. Please request a new one.' });
    }

    // Check max attempts
    if (resetOtp.attempts >= 5) {
      await LoginOtp.deleteOne({ _id: resetOtp._id });
      return res.status(400).json({ error: 'Too many attempts. Please request a new reset link.' });
    }

    // Verify OTP
    const isValid = await resetOtp.verifyOtp(otp);

    if (!isValid) {
      resetOtp.attempts += 1;
      await resetOtp.save();
      return res.status(400).json({
        error: 'Invalid OTP',
        attemptsRemaining: 5 - resetOtp.attempts
      });
    }

    // OTP is valid - update password
    const { userId, userModel } = resetOtp.userData;

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password AND passwordChangedAt (for session invalidation)
    const passwordUpdate = {
      password: hashedPassword,
      passwordChangedAt: new Date() // SECURITY FIX: Invalidates old JWT tokens
    };

    if (userModel === 'Student') {
      await Student.findByIdAndUpdate(userId, passwordUpdate);
    } else if (userModel === 'Registration') {
      await Registration.findByIdAndUpdate(userId, passwordUpdate);
    } else if (userModel === 'User') {
      await User.findByIdAndUpdate(userId, passwordUpdate);
    }

    // Delete all existing OTPs for this user (security cleanup)
    await LoginOtp.deleteMany({ email: resetOtp.email });

    // Delete the reset OTP record
    await LoginOtp.deleteOne({ _id: resetOtp._id });

    res.json({
      message: 'Password reset successful. You can now login with your new password.',
      success: true
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: err.message });
  }
});

// First Login - Change Password
router.post('/first-login-change-password', async (req, res) => {
  try {
    const { tempToken, newPassword, confirmPassword } = req.body;

    if (!tempToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Validate password policy
    const policyCheck = validatePasswordPolicy(newPassword);
    if (!policyCheck.isValid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        requirements: policyCheck.errors
      });
    }

    // Find the temp token record
    const loginOtp = await LoginOtp.findOne({ tempToken });

    if (!loginOtp) {
      return res.status(400).json({ error: 'Session expired. Please login again.' });
    }

    // Check for valid flow types (password-change or legacy mustChangePassword)
    if (!loginOtp.userData?.mustChangePassword && loginOtp.flowType !== 'password-change') {
      return res.status(400).json({ error: 'Invalid request. Please login again.' });
    }

    const Student = require('../models/Student');

    // Find the student
    const student = await Student.findById(loginOtp.userData.userId).select('+password');

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if student already exists in Registration collection
    // If they do, they shouldn't be changing password - redirect to dashboard
    const existingRegistration = await Registration.findOne({
      email: { $regex: new RegExp(`^${escapeRegex(student.email)}$`, 'i') }
    });

    if (existingRegistration) {
      console.log(`[Auth] Student ${student.email} already registered - denying password change, redirecting to dashboard`);

      // Generate session ID for single-session enforcement
      const sessionId = require('crypto').randomUUID();

      // Update student record to mark as not first login
      await Student.findByIdAndUpdate(student._id, {
        mustChangePassword: false,
        isFirstLogin: false,
        currentSessionId: sessionId,
        lastLogin: new Date()
      });

      // Delete the temp token
      await LoginOtp.deleteOne({ _id: loginOtp._id });

      // Create JWT token and redirect to dashboard
      const token = jwt.sign(
        {
          userId: student._id,
          email: student.email,
          userType: 'student',
          role: 'student',
          sessionId: sessionId
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Set HttpOnly Cookie - SECURITY FIX #7: Added sameSite
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      return res.json({
        message: 'You are already registered. Redirecting to dashboard.',
        alreadyRegistered: true,
        redirectToDashboard: true,
        token,
        user: {
          id: student._id,
          fullName: student.fullName,
          email: student.email,
          role: 'student',
          userType: 'student',
          hasRegistration: true
        }
      });
    }

    // Check that new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, student.password);
    if (isSamePassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    // Update student password and first login flags
    // Generate session ID for single-session enforcement
    const sessionId = require('crypto').randomUUID();

    student.password = newPassword; // Will be hashed by pre-save hook
    student.mustChangePassword = false;
    student.isFirstLogin = false;
    student.passwordChangedAt = new Date();
    student.lastLogin = new Date();
    student.currentSessionId = sessionId;
    await student.save();

    // Delete the temp token
    await LoginOtp.deleteOne({ _id: loginOtp._id });

    // Create JWT token with session ID
    const token = jwt.sign(
      {
        userId: student._id,
        email: student.email,
        userType: 'student',
        role: 'student',
        sessionId: sessionId
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Get registration record for complete user data
    const registration = await Registration.findOne({
      email: { $regex: new RegExp(`^${student.email}$`, 'i') }
    });

    const userResponse = {
      id: student._id,
      fullName: student.fullName,
      email: student.email,
      gender: student.gender,
      role: 'student',
      userType: 'student',
      studentId: student.studentId,
      mobileNumber: student.mobile,
      college: student.college,
      profileImage: student.profileImage,
      hasRegistration: !!registration,
      isFirstLogin: true, // Flag to show assessments
      passwordJustChanged: true
    };

    console.log(`[Auth] Student ${student.email} successfully changed password on first login`);

    // Set HttpOnly Cookie - SECURITY FIX #7: Added sameSite
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      message: 'Password changed successfully! Welcome to SMAART Minds.',
      token,
      user: userResponse
    });
  } catch (err) {
    console.error('First login password change error:', err);
    res.status(500).json({ error: err.message });
  }
});

// SECURITY FIX #10: Token renewal - issue a fresh JWT if current is still valid
router.post('/renew-token', protect, async (req, res) => {
  try {
    const user = req.user;

    // Issue a fresh token with the same claims, preserving sessionId
    const payload = {
      userId: user._id,
      email: user.email,
    };
    if (user.role) payload.role = user.role;
    if (user.userType) payload.userType = user.userType;
    // CRITICAL: Preserve sessionId for single-session enforcement
    if (user.currentSessionId) payload.sessionId = user.currentSessionId;

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Set refreshed HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, token });
  } catch (err) {
    console.error('[Token Renewal] Error:', err.message);
    res.status(500).json({ error: 'Failed to renew token' });
  }
});

// SECURITY FIX #16: Logout now invalidates server-side session
router.post('/logout', protect, async (req, res) => {
  try {
    // Clear the server-side session to invalidate the JWT
    if (req.user && req.user._id) {
      const Student = require('../models/Student');
      const Teacher = require('../models/Teacher');
      const Registration = require('../models/Registration');
      const userType = req.user.userType || req.user.role || 'user';

      let UserModel = User;
      if (userType === 'student') UserModel = Student;
      else if (userType === 'teacher') UserModel = Teacher;
      else if (userType === 'registration') UserModel = Registration;

      const result = await UserModel.findByIdAndUpdate(req.user._id, { currentSessionId: null });
      console.log(`[Auth] Cleared session for ${userType} user ${req.user._id}:`, result ? 'Success' : 'User not found');
    }
  } catch (err) {
    console.error('Error clearing session on logout:', err);
    // Continue with cookie clearing even if session clear fails
  }

  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    sameSite: 'strict',
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// Check Session (for frontend to validate cookie)
router.get('/me', protect, async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

// === UTILITY: Clear stale session by email (for debugging) ===
router.post('/clear-session', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const Student = require('../models/Student');
    const Teacher = require('../models/Teacher');

    // Try to clear session in all user models
    const results = await Promise.all([
      Registration.findOneAndUpdate({ email }, { currentSessionId: null }),
      Student.findOneAndUpdate({ email }, { currentSessionId: null }),
      Teacher.findOneAndUpdate({ email }, { currentSessionId: null }),
      User.findOneAndUpdate({ email }, { currentSessionId: null })
    ]);

    const cleared = results.filter(r => r !== null).length;
    console.log(`[Auth] Cleared session for email ${email} in ${cleared} model(s)`);

    res.json({ 
      success: true, 
      message: `Session cleared for ${email}`,
      modelsCleared: cleared
    });
  } catch (error) {
    console.error('Error clearing session:', error);
    res.status(500).json({ error: 'Failed to clear session' });
  }
});

module.exports = router;
