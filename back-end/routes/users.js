const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Registration = require('../models/Registration');
const User = require('../models/User');
const Student = require('../models/Student');
const College = require('../models/College');
const CollegeDegree = require('../models/CollegeDegree');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const { createDefaultUserSettings } = require('../models/schemas/userSettings');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);


const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const cloneDefaultUserSettings = () => createDefaultUserSettings();

const normalizeUserSettings = (settings = {}, profileOverrides = {}) => {
  const defaults = cloneDefaultUserSettings();

  return {
    profile: {
      ...defaults.profile,
      ...(settings.profile || {}),
      ...profileOverrides,
      email: profileOverrides.email || settings?.profile?.email || defaults.profile.email
    },
    notifications: {
      ...defaults.notifications,
      ...(settings.notifications || {})
    },
    privacy: {
      ...defaults.privacy,
      ...(settings.privacy || {})
    },
    appearance: {
      ...defaults.appearance,
      ...(settings.appearance || {})
    },
    language: {
      ...defaults.language,
      ...(settings.language || {})
    }
  };
};

const resolveSettingsProfile = async (account) => {
  const registration = await Registration.findOne({
    $or: [
      { userId: account._id },
      { email: account.email }
    ]
  }).lean();

  return {
    registration,
    profile: {
      displayName: account.fullName || registration?.fullName || '',
      email: account.email || registration?.email || '',
      phone: account.mobile || registration?.mobileNumber || '',
      bio: account.settings?.profile?.bio || ''
    }
  };
};

// Create/Update Registration Details with file uploads
router.post('/register-details', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'tenthMarksheet', maxCount: 1 },
  { name: 'twelfthMarksheet', maxCount: 1 },
  { name: 'higherEducationCertificate', maxCount: 1 },
  { name: 'workExpCertificate_0', maxCount: 1 }, { name: 'workExpCertificate_1', maxCount: 1 }, { name: 'workExpCertificate_2', maxCount: 1 },
  { name: 'workExpCertificate_3', maxCount: 1 }, { name: 'workExpCertificate_4', maxCount: 1 }, { name: 'workExpCertificate_5', maxCount: 1 },
  { name: 'techCertificate_0', maxCount: 1 }, { name: 'techCertificate_1', maxCount: 1 }, { name: 'techCertificate_2', maxCount: 1 },
  { name: 'techCertificate_3', maxCount: 1 }, { name: 'techCertificate_4', maxCount: 1 }, { name: 'techCertificate_5', maxCount: 1 }
]), async (req, res) => {
  try {
    const { email, fullName, mobileNumber, password, personalDetails, academicDetails, ...registrationData } = req.body;

    // Normalize email
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Validate required fields (password is optional since it's set during first login)
    if (!normalizedEmail || !fullName || !mobileNumber) {
      return res.status(400).json({ error: 'Missing required fields: email, fullName, mobileNumber' });
    }

    // Helper to parse JSON safely
    const parseJSON = (data, fallback = {}) => {
      try {
        if (typeof data === 'string') return data.trim() ? JSON.parse(data) : fallback;
        return data || fallback;
      } catch (err) {
        console.error('JSON parse error:', err);
        return fallback;
      }
    };

    // Parse all section data from FormData
    const parsedTenthDetails = parseJSON(registrationData.tenthDetails);
    const parsedTwelfthDetails = parseJSON(registrationData.twelfthDetails);
    const parsedHigherEducation = parseJSON(registrationData.higherEducation);
    const parsedExtracurricular = parseJSON(registrationData.extracurricular, []);
    const parsedJobPreferences = parseJSON(registrationData.jobPreferences);
    const parsedSectorPreferences = parseJSON(registrationData.sectorPreferences);
    const parsedCareerGoals = parseJSON(registrationData.careerGoals);
    const parsedWorkExperience = parseJSON(registrationData.workExperience, []);
    const parsedProjects = parseJSON(registrationData.projects, []);
    const parsedCertificates = parseJSON(registrationData.certificates, []);

    // Parse Personal & Academic Details
    const parsedPersonalDetails = parseJSON(personalDetails);
    const parsedAcademicDetails = parseJSON(academicDetails);

    // Handle File Uploads Mapping
    const files = req.files || {};

    if (files['tenthMarksheet']) parsedTenthDetails.marksheet = files['tenthMarksheet'][0].filename;
    if (files['twelfthMarksheet']) parsedTwelfthDetails.marksheet = files['twelfthMarksheet'][0].filename;
    if (files['higherEducationCertificate']) parsedHigherEducation.certificate = files['higherEducationCertificate'][0].filename;

    // Map Work Experience Certificates (Array)
    if (Array.isArray(parsedWorkExperience)) {
      parsedWorkExperience.forEach((work, index) => {
        const fileKey = `workExpCertificate_${index}`;
        if (files[fileKey]) {
          work.certificate = files[fileKey][0].filename;
        }
      });
    }

    // Map Technical Certificates (Array)
    if (Array.isArray(parsedCertificates)) {
      parsedCertificates.forEach((cert, index) => {
        const fileKey = `techCertificate_${index}`;
        if (files[fileKey]) {
          cert.certificateFile = files[fileKey][0].filename;
        }
      });
    }

    // Check if user already exists
    const emailQuery = { email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') } };
    let user = await User.findOne(emailQuery);

    if (!user) {
      // Create new user
      user = new User({
        fullName,
        email: normalizedEmail,
        mobile: mobileNumber, // User model uses 'mobile' field
        password, // Will be hashed by pre-save hook
      });
      await user.save();
    } else {
      // SECURITY: this endpoint is unauthenticated, so it must NOT be able to
      // overwrite the password of an account that already has one — that would
      // let anyone reset any victim's password by posting their email (account
      // takeover). Only allow setting an initial password for an account that
      // does not yet have one (first-time registration before first login).
      if (password && !user.password) {
        user.password = password;
        await user.save();
      }
    }

    // Link college to user and student if institution name is provided in personalDetails
    if (parsedPersonalDetails?.institution) {
      const college = await College.findOne({
        collegeName: { $regex: new RegExp(`^${escapeRegex(parsedPersonalDetails.institution.trim())}$`, 'i') }
      });
      if (college) {
        user.college = college._id;
        await user.save();

        const student = await Student.findOne(emailQuery);
        if (student) {
          student.college = college._id;
          await student.save();
        }
      }
    }

    // Prepare registration data with all 11 sections

    // Higher Education (Allow array or single object, convert to array)
    let higherEdArray = [];
    if (Array.isArray(parsedHigherEducation)) {
      higherEdArray = parsedHigherEducation;
    } else if (parsedHigherEducation && typeof parsedHigherEducation === 'object' && Object.keys(parsedHigherEducation).length > 0) {
      higherEdArray = [parsedHigherEducation];
    }

    // Map Higher Education with file handling
    const mappedHigherEducation = higherEdArray.map((he, index) => {
      let certFile = he.certificate;
      if (index === 0 && files['higherEducationCertificate']) {
        certFile = files['higherEducationCertificate'][0].filename;
      }
      return {
        id: he.id,
        qualificationLevel: he.qualificationLevel || '',
        degree: he.degree || '',
        degreeFullName: he.degreeFullName || '',
        specialization: he.specialization || '',
        institutionName: he.institutionName || '',
        university: he.university || '',
        location: he.location || '',
        yearOfPassing: he.yearOfPassing || '',
        cgpaPercentage: he.cgpaPercentage || '',
        degreeStatus: he.degreeStatus || '',
        certificate: certFile || '',
      };
    });

    // Map Job Preferences
    const mappedJobPreferences = Array.isArray(parsedJobPreferences) ? parsedJobPreferences.map(job => ({
      id: job.id,
      preferredRole: job.preferredRole || '',
      jobType: job.jobType || '',
      preferredLocation: job.preferredLocation || job.preferredLocation1 || '', // Handle varied field names if any
      willingToRelocate: job.willingToRelocate || '',
      expectedSalary: job.expectedSalary || '',
    })) : [];
    const registrationPayload = {
      userId: user._id,
      email: normalizedEmail,
      fullName,
      mobileNumber,
      password,
      profilePhoto: parsedPersonalDetails?.profilePhoto || (files['profilePhoto'] ? files['profilePhoto'][0].filename : ''),
      educationLevel: parsedPersonalDetails?.educationLevel || '',

      // Personal Details
      nickname: parsedPersonalDetails?.nickname || '',
      dob: parsedPersonalDetails?.dob || null,
      gender: parsedPersonalDetails?.gender || '',
      institution: parsedPersonalDetails?.institution || '',
      department: parsedPersonalDetails?.department || '',
      yearOfStudy: parsedPersonalDetails?.yearOfStudy || '',
      yearOfPassing: parsedPersonalDetails?.yearOfPassing || '',
      alternateMobile: parsedPersonalDetails?.alternateMobile || '',
      bio: parsedPersonalDetails?.bio || '',

      // Address
      address: {
        street: parsedPersonalDetails?.address?.street || '',
        city: parsedPersonalDetails?.address?.city || '',
        state: parsedPersonalDetails?.address?.state || '',
        country: parsedPersonalDetails?.address?.country || '',
      },

      // 10th Standard Details
      tenthDetails: {
        schoolName: parsedTenthDetails?.schoolName || '',
        board: parsedTenthDetails?.board || '',
        yearOfPassing: parsedTenthDetails?.yearOfPassing || '',
        percentage: parsedTenthDetails?.percentage || '',
        marksheet: parsedTenthDetails?.marksheet || '',
      },

      // 12th Standard Details
      twelfthDetails: {
        schoolName: parsedTwelfthDetails?.schoolName || '',
        stream: parsedTwelfthDetails?.stream || '',
        board: parsedTwelfthDetails?.board || '',
        yearOfPassing: parsedTwelfthDetails?.yearOfPassing || '',
        percentage: parsedTwelfthDetails?.percentage || '',
        marksheet: parsedTwelfthDetails?.marksheet || '',
      },

      // Higher Education
      higherEducation: mappedHigherEducation,

      // Extra-Curricular Activities
      extracurricular: Array.isArray(parsedExtracurricular) ? parsedExtracurricular : [],

      // Job Preferences
      jobPreferences: mappedJobPreferences,

      // Sector Preferences
      sectorPreferences: {
        preferredSectors: Array.isArray(parsedSectorPreferences?.preferredSectors) ? parsedSectorPreferences.preferredSectors : [],
        secondarySectors: Array.isArray(parsedSectorPreferences?.secondarySectors) ? parsedSectorPreferences.secondarySectors : [],
      },

      // Career Goals
      careerGoals: {
        shortTerm: parsedCareerGoals?.shortTerm || '',
        mediumTerm: parsedCareerGoals?.mediumTerm || '',
        longTerm: parsedCareerGoals?.longTerm || '',
      },

      // Work Experience
      workExperience: Array.isArray(parsedWorkExperience) ? parsedWorkExperience : [],

      // Projects
      projects: Array.isArray(parsedProjects) ? parsedProjects : [],

      // Technical Certificates
      certificates: Array.isArray(parsedCertificates) ? parsedCertificates.map(c => ({
        id: c.id,
        title: c.title,
        issuingOrg: c.issuingOrg || c.issuer || '',
        issuer: c.issuer || c.issuingOrg || '',
        certificateFile: c.certificateFile || '',
        yearOfCompletion: c.yearOfCompletion || '',
        link: c.link || c.verificationUrl || '',
      })) : [],

      submissionDate: new Date(),
    };

    // Create or update registration
    let registration = await Registration.findOne({ userId: user._id });

    if (registration) {
      // Update existing registration
      Object.assign(registration, registrationPayload);
      await registration.save();
    } else {
      // Create new registration
      registration = new Registration(registrationPayload);
      await registration.save();
    }

    // Mark registration as completed
    user.registrationCompleted = true;

    // Sync profilePhoto to User and Student models
    const resolvedPhoto = registrationPayload.profilePhoto || parsedPersonalDetails?.profilePhoto;
    if (resolvedPhoto) {
      user.profileImage = resolvedPhoto;
    }
    await user.save();

    // Sync academic details and profileImage to Student document
    try {
      const student = await Student.findOne(emailQuery);
      if (student) {
        if (resolvedPhoto) {
          student.profileImage = resolvedPhoto;
        }
        if (mappedHigherEducation && mappedHigherEducation.length > 0) {
          const he = mappedHigherEducation[0];
          student.academic = {
            degreeLevel: he.qualificationLevel || '',
            domain: he.degree || '',
            degreeGroup: he.degreeFullName || '',
            specialisation: he.specialization || ''
          };
        }
        await student.save();
      }
    } catch (err) {
      console.warn('Student academic/profileImage sync in register-details failed:', err.message);
    }

    res.status(201).json({
      message: 'Registration details saved successfully',
      registration: {
        id: registration._id,
        email: registration.email,
        fullName: registration.fullName,
        status: registration.status,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message, details: err.stack });
  }
});

// Save individual registration section (for progressive saving)
router.patch('/register-section', async (req, res) => {
  try {
    const { email, section, data } = req.body;

    if (!email || !section || !data) {
      return res.status(400).json({ error: 'Missing required fields: email, section, data' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find or create user (and also find student)
    const emailQuery = { email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') } };
    let user = await User.findOne(emailQuery);
    let student = await Student.findOne(emailQuery);

    if (!user && !student) {
      // Create a minimal user record if neither exists
      user = new User({
        fullName: data.fullName || 'User',
        email: normalizedEmail,
        mobile: data.mobileNumber || '',
      });
      await user.save();
    }

    // Find or create registration (using both userId and email to prevent duplicates)
    let registration = await Registration.findOne({
      $or: [
        { userId: user?._id },
        { userId: student?._id },
        { email: normalizedEmail }
      ]
    }).sort({ updatedAt: -1 });

    if (!registration) {
      registration = new Registration({
        userId: user?._id || student?._id,
        email: normalizedEmail,
        fullName: data.fullName || user?.fullName || student?.fullName || 'User',
        mobileNumber: data.mobileNumber || user?.mobile || student?.mobile || '',
      });
    } else {
      // Ensure registration is linked to current user/student ID if missing
      if (!registration.userId) {
        registration.userId = user?._id || student?._id;
      }
    }

    // Update the specific section
    const sectionMapping = {
      'profilePhoto': async () => {
        registration.profilePhoto = data.profilePhoto || registration.profilePhoto;
        // Sync to User and Student models for immediate feedback
        if (user) {
          user.profileImage = registration.profilePhoto;
          await user.save();
        }
        if (student) {
          student.profileImage = registration.profilePhoto;
          await student.save();
        }
      },
      'personalDetails': async () => {
        registration.fullName = data.fullName || registration.fullName;
        registration.nickname = data.nickname || registration.nickname;
        registration.dob = data.dob || registration.dob;
        registration.gender = data.gender || registration.gender;
        registration.mobileNumber = data.mobileNumber || registration.mobileNumber;
        registration.institution = data.institution || registration.institution;
        registration.department = data.department || registration.department;
        registration.yearOfStudy = data.yearOfStudy || registration.yearOfStudy;
        registration.yearOfPassing = data.yearOfPassing || registration.yearOfPassing;
        registration.educationLevel = data.educationLevel || registration.educationLevel;
        registration.bio = data.bio || registration.bio;
        registration.timezone = data.timezone || registration.timezone;
        registration.dateFormat = data.dateFormat || registration.dateFormat;
        registration.notificationPrefs = data.notificationPrefs || registration.notificationPrefs;

        if (data.profilePhoto) {
          registration.profilePhoto = data.profilePhoto;
        }

        if (data.address) {
          registration.address = {
            street: data.address.street || registration.address?.street || '',
            city: data.address.city || registration.address?.city || '',
            state: data.address.state || registration.address?.state || '',
            country: data.address.country || registration.address?.country || '',
          };
        }

        // Sync critical fields to User and Student models
        if (user) {
          if (data.fullName) user.fullName = data.fullName;
          if (data.mobileNumber) user.mobile = data.mobileNumber;
          if (data.bio) user.bio = data.bio;
          if (data.timezone) user.timezone = data.timezone;
          if (data.dateFormat) user.dateFormat = data.dateFormat;
          if (data.profilePhoto) user.profileImage = data.profilePhoto;
          if (data.institution) {
            const college = await College.findOne({
              collegeName: { $regex: new RegExp(`^${escapeRegex(data.institution.trim())}$`, 'i') }
            });
            if (college) {
              user.college = college._id;
            }
          }
          await user.save();
        }
        if (student) {
          if (data.fullName) student.fullName = data.fullName;
          if (data.mobileNumber) student.mobile = data.mobileNumber;
          if (data.bio) student.bio = data.bio;
          if (data.dob) student.dateOfBirth = data.dob;
          if (data.gender) student.gender = data.gender.toLowerCase();
          if (data.profilePhoto) student.profileImage = data.profilePhoto;
          if (data.institution) {
            const college = await College.findOne({
              collegeName: { $regex: new RegExp(`^${escapeRegex(data.institution.trim())}$`, 'i') }
            });
            if (college) {
              student.college = college._id;
            }
          }
          await student.save();
        }
      },
      'address': async () => {
        registration.address = {
          street: data.street || registration.address?.street || '',
          city: data.city || registration.address?.city || '',
          state: data.state || registration.address?.state || '',
          country: data.country || registration.address?.country || '',
        };
      },
      'tenthDetails': async () => {
        registration.tenthDetails = {
          ...registration.tenthDetails,
          ...data
        };
      },
      'twelfthDetails': async () => {
        registration.twelfthDetails = {
          ...registration.twelfthDetails,
          ...data
        };
      },
      'higherEducation': async () => {
        // For array of higher education entries
        registration.higherEducation = data;

        if (student && Array.isArray(data) && data.length > 0) {
          const he = data[0];
          student.academic = {
            degreeLevel: he.qualificationLevel || he.level || '',
            domain: he.degree || he.domain || '',
            degreeGroup: he.degreeFullName || he.degreeGroup || '',
            specialisation: he.specialization || he.specialisation || ''
          };
          await student.save();
        }
      },
      'extracurricular': async () => {
        registration.extracurricular = Array.isArray(data) ? data : [];
      },
      'jobPreferences': async () => {
        registration.jobPreferences = data;
      },
      'sectorPreferences': async () => {
        registration.sectorPreferences = {
          preferredSectors: data.preferredSectors || [],
          secondarySectors: data.secondarySectors || [],
        };
      },
      'careerGoals': async () => {
        registration.careerGoals = {
          shortTerm: data.shortTerm || '',
          mediumTerm: data.mediumTerm || '',
          longTerm: data.longTerm || '',
        };
        // Also save personalDevelopmentGoals if present (bundled from frontend)
        if (data.personalDevelopmentGoals) {
          registration.personalDevelopmentGoals = {
            shortTerm: data.personalDevelopmentGoals.shortTerm || '',
            mediumTerm: data.personalDevelopmentGoals.mediumTerm || '',
            longTerm: data.personalDevelopmentGoals.longTerm || '',
          };
        }
      },
      'personalDevelopmentGoals': async () => {
        registration.personalDevelopmentGoals = {
          shortTerm: data.shortTerm || '',
          mediumTerm: data.mediumTerm || '',
          longTerm: data.longTerm || '',
        };
      },
      'workExperience': async () => {
        registration.workExperience = Array.isArray(data) ? data : [];
      },
      'projects': async () => {
        registration.projects = Array.isArray(data) ? data : [];
      },
      'certificates': async () => {
        registration.certificates = Array.isArray(data) ? data : [];
      },
    };

    if (sectionMapping[section]) {
      await sectionMapping[section]();
    } else {
      return res.status(400).json({ error: `Unknown section: ${section}` });
    }

    registration.updatedAt = new Date();
    await registration.save();

    console.log(`[register-section] Saved section '${section}' for ${normalizedEmail}`);

    res.json({
      success: true,
      message: `Section '${section}' saved successfully`,
      section,
      email: normalizedEmail,
    });
  } catch (err) {
    console.error('[register-section] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// SECURITY (audit HIGH): removed unauthenticated debug endpoints
// GET /_debug/state/:email and GET /_debug_dump/:email — they exposed any
// user's record (password-hash preview, live currentSessionId, full docs) to
// anonymous callers by email. Diagnostics must go through an authenticated,
// admin-gated path instead.

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Normalize email
    const normalizedEmail = (email || '').trim().toLowerCase();

    console.log('Login attempt:', { email: normalizedEmail, passwordProvided: !!password });

    // Validate input
    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email (case-insensitive)
    const emailQuery = { email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') } };
    let user = await User.findOne(emailQuery);
    if (!user) {
      console.log('User not found by email, trying registration link:', normalizedEmail);
      const reg = await Registration.findOne({ email: normalizedEmail });
      if (reg?.userId) {
        user = await User.findById(reg.userId);
      }
      if (!user) {
        console.log('User still not found after registration lookup:', normalizedEmail);
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    }

    console.log('User found:', { email: normalizedEmail, registrationCompleted: user.registrationCompleted, hasPassword: !!user.password });

    // Check if password exists
    if (!user.password) {
      console.log('User has no password set');
      return res.status(401).json({ error: 'Password not set. Please complete registration.' });
    }

    // Compare passwords using bcrypt
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (bcryptErr) {
      console.error('Bcrypt comparison error:', bcryptErr);
      return res.status(500).json({ error: 'Password verification failed' });
    }

    if (!isPasswordValid) {
      console.log('Password mismatch for user:', normalizedEmail);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('Password valid for user:', normalizedEmail);

    // Get registration details to check if user has completed comprehensive registration
    const registration = await Registration.findOne({ userId: user._id });
    const hasRegistration = !!registration;

    // Robust gender lookup
    let finalGender = user.gender;
    console.log(`[Users/Login] Initial gender for ${normalizedEmail}: ${finalGender}`);

    if (!finalGender && registration) {
      finalGender = registration.gender;
      console.log(`[Users/Login] Found gender in linked Registration for ${normalizedEmail}: ${finalGender}`);
    }
    if (!finalGender) {
      const regRecord = await Registration.findOne({
        email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') }
      });
      finalGender = regRecord?.gender;
      console.log(`[Users/Login] Found gender by email lookup for ${normalizedEmail}: ${finalGender}`);
    }

    console.log(`[Users/Login] Final resolved gender: ${finalGender}`);

    // Return success with user data
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        gender: finalGender,
        mobileNumber: user.mobile, // User model uses 'mobile' field
        role: user.role,
        registrationCompleted: user.registrationCompleted,
        hasRegistration: hasRegistration, // Flag to check if comprehensive registration exists
        profilePhoto: registration?.profilePhoto || null, // Profile photo from registration
      },
      registration: registration || null,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get Registration Details
router.get('/register-details/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const Student = require('../models/Student');
    const normalizedEmail = email.toLowerCase().trim();

    // First try to find in User collection
    let user = await User.findOne({ email: normalizedEmail }).populate('college', 'logo collegeName subscriptionPlan');
    let userSource = 'User';
    let fallbackCollege = null;

    // Even if User is found, if college is missing, check Student collection
    if (!user || !user.college) {
      const student = await Student.findOne({ email: normalizedEmail }).populate('college', 'logo collegeName subscriptionPlan').populate('degree');
      if (student) {
        if (user) {
          fallbackCollege = student.college;
        } else {
          user = student;
          userSource = 'Student';
        }
      }
    }

    // If still not found, check Registration collection by email
    if (!user) {
      const regByEmail = await Registration.findOne({ email: normalizedEmail });
      if (regByEmail) {
        return res.json({
          ...regByEmail.toObject(),
          fullName: regByEmail.fullName,
          gender: regByEmail.gender
        });
      }
    }

    // If no user found anywhere, return generic response
    if (!user) {
      return res.json({
        fullName: null,
        email: normalizedEmail,
        gender: null
      });
    }

    // Try to find registration by userId or email
    const registration = await Registration.findOne({
      $or: [
        { userId: user._id },
        { email: normalizedEmail }
      ]
    }).sort({ updatedAt: -1 });

    // Aggregated badges
    let aggregatedBadges = [];
    if (user && user.badges) aggregatedBadges = [...user.badges];

    // If we found User, also check Student for more badges
    if (userSource === 'User') {
      const student = await Student.findOne({ email: normalizedEmail });
      if (student && student.badges) {
        student.badges.forEach(b => {
          if (!aggregatedBadges.some(ab => ab.badgeId === b.badgeId)) {
            aggregatedBadges.push(b);
          }
        });
      }
    } else if (userSource === 'Student') {
      // If we found Student, also check User for more badges
      const otherUser = await User.findOne({ email: normalizedEmail });
      if (otherUser && otherUser.badges) {
        otherUser.badges.forEach(b => {
          if (!aggregatedBadges.some(ab => ab.badgeId === b.badgeId)) {
            aggregatedBadges.push(b);
          }
        });
      }
    }

    // Fetch student to get degree and academic details if not already fetched as user
    let studentForDetails = null;
    if (userSource === 'Student') {
      studentForDetails = user;
    } else {
      studentForDetails = await Student.findOne({ email: normalizedEmail }).populate('degree');
    }
    const populatedDegree = studentForDetails?.degree || null;
    const academic = studentForDetails?.academic || null;

    if (registration) {
      return res.json({
        ...registration.toObject(),
        fullName: registration.fullName || user.fullName,
        gender: registration.gender || user.gender,
        badges: aggregatedBadges,
        college: user?.college || fallbackCollege || null,
        degree: populatedDegree,
        academic,
        lastLogin: user?.lastLogin || null,
        previousLogin: user?.previousLogin || null
      });
    }

    // Return user data without registration — include all available fields
    const userObj = user.toObject ? user.toObject() : user;
    if (fallbackCollege && !userObj.college) {
      userObj.college = fallbackCollege;
    }
    res.json({
      ...userObj,
      degree: populatedDegree,
      academic,
      badges: aggregatedBadges,
      otherDetails: {}
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user settings
router.get('/settings', protect, async (req, res) => {
  try {
    const { profile } = await resolveSettingsProfile(req.user);
    const settings = normalizeUserSettings(req.user.settings, profile);

    return res.json({
      success: true,
      data: settings
    });
  } catch (err) {
    console.error('[users/settings][GET] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to load user settings'
    });
  }
});

// Save current user settings
router.put('/settings', protect, async (req, res) => {
  try {
    const incomingSettings = req.body || {};
    const existingProfile = await resolveSettingsProfile(req.user);
    const mergedIncomingSettings = {
      ...(req.user.settings || {}),
      ...incomingSettings,
      profile: {
        ...(req.user.settings?.profile || {}),
        ...(incomingSettings.profile || {})
      },
      notifications: {
        ...(req.user.settings?.notifications || {}),
        ...(incomingSettings.notifications || {})
      },
      privacy: {
        ...(req.user.settings?.privacy || {}),
        ...(incomingSettings.privacy || {})
      },
      appearance: {
        ...(req.user.settings?.appearance || {}),
        ...(incomingSettings.appearance || {})
      },
      language: {
        ...(req.user.settings?.language || {}),
        ...(incomingSettings.language || {})
      }
    };

    const settings = normalizeUserSettings(mergedIncomingSettings, {
      displayName: incomingSettings?.profile?.displayName || existingProfile.profile.displayName,
      email: req.user.email || existingProfile.profile.email,
      phone: incomingSettings?.profile?.phone || existingProfile.profile.phone,
      bio: incomingSettings?.profile?.bio || existingProfile.profile.bio
    });

    req.user.settings = settings;

    if (settings.profile.displayName && req.user.fullName !== settings.profile.displayName) {
      req.user.fullName = settings.profile.displayName;
    }

    if (typeof settings.profile.phone === 'string' && req.user.mobile !== settings.profile.phone) {
      req.user.mobile = settings.profile.phone;
    }

    await req.user.save();

    if (existingProfile.registration) {
      const registrationUpdates = {};

      if (existingProfile.registration.fullName !== settings.profile.displayName) {
        registrationUpdates.fullName = settings.profile.displayName;
      }

      if (existingProfile.registration.mobileNumber !== settings.profile.phone) {
        registrationUpdates.mobileNumber = settings.profile.phone;
      }

      if (Object.keys(registrationUpdates).length > 0) {
        await Registration.updateOne(
          { _id: existingProfile.registration._id },
          { $set: registrationUpdates }
        );
      }
    }

    return res.json({
      success: true,
      message: 'Settings saved successfully',
      data: settings
    });
  } catch (err) {
    console.error('[users/settings][PUT] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to save user settings'
    });
  }
});
// Create User (for signup without password)
router.post('/create', async (req, res) => {
  try {
    const { firstName, lastName, email, mobileNumber } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user without password
    user = new User({
      firstName,
      lastName,
      email,
      mobileNumber,
      password: null, // No password for now
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify Badge by unique _id (Public)
router.get('/verify-badge/:badgeId', async (req, res) => {
  try {
    const { badgeId } = req.params;

    const UserBadge = require('../models/UserBadge');
    const MasterBadge = require('../models/Badge');

    if (!mongoose.Types.ObjectId.isValid(badgeId)) {
      // Fallback: Verify generic badge template if it's a string like 'BADGE-CRQ-2026-001'
      const genericBadge = await MasterBadge.findOne({ badgeId: badgeId.toUpperCase() });
      
      if (genericBadge) {
          return res.json({
            success: true,
            badge: {
              id: genericBadge.badgeId,
              badgeId: genericBadge.badgeId,
              title: genericBadge.title,
              description: genericBadge.description,
              tier: genericBadge.tier,
              xp: genericBadge.xp,
              earnedDate: new Date(), // Generic current date since it's not a specific assignment
              category: genericBadge.category
            },
            owner: {
              fullName: 'Verified SMAART Learner'
            },
            issuedBy: 'SMAART Institute'
          });
      }
      return res.status(400).json({ error: 'Invalid Badge ID format or Badge not found' });
    }
    // Fetch userBadge without populating userId initially to preserve the ID if it's a Student
    let userBadge = await UserBadge.findById(badgeId).populate('badgeId');

    let badge = null;
    let ownerName = '';

    if (userBadge) {
      // New system (standalone UserBadge collection)
      const MasterBadge = require('../models/Badge');

      badge = {
        _id: userBadge._id,
        badgeId: userBadge.badgeId?.badgeId,
        title: userBadge.badgeId?.title,
        description: userBadge.badgeId?.description,
        tier: userBadge.badgeId?.tier,
        xp: userBadge.badgeId?.xp,
        earnedDate: userBadge.earnedAt || userBadge.earnedDate,
        category: userBadge.badgeId?.category
      };

      // Try to get owner name from Student or User collections
      const userId = userBadge.userId;
      if (userId) {
        const student = await Student.findById(userId);
        if (student) {
          ownerName = student.fullName;
        } else {
          const userDoc = await User.findById(userId);
          ownerName = userDoc ? userDoc.fullName : 'SMAART Learner';
        }
      } else {
        ownerName = 'SMAART Learner';
      }
    } else {
      // Legacy system (embedded badges)
      let user = await User.findOne({ "badges._id": badgeId });
      if (user) {
        badge = user.badges.id(badgeId);
        ownerName = user.fullName;
      } else {
        user = await Student.findOne({ "badges._id": badgeId });
        if (user) {
          badge = user.badges.id(badgeId);
          ownerName = user.fullName;
        }
      }
    }

    if (!badge) {
      return res.status(404).json({ error: 'Badge not found or invalid' });
    }

    res.json({
      success: true,
      badge: {
        id: badge._id,
        badgeId: badge.badgeId,
        title: badge.title,
        description: badge.description,
        tier: badge.tier,
        xp: badge.xp,
        earnedDate: badge.earnedAt || badge.earnedDate,
        category: badge.category
      },
      owner: {
        fullName: ownerName
      },
      issuedBy: 'SMAART Institute'
    });
  } catch (err) {
    console.error('[verify-badge] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Dev-only: Backfill Users from Registrations so old registrations can log in.
// Registered ONCE at module level (previously this was mistakenly defined inside
// the /register-details handler, stacking a new route on every signup request).
router.post('/_dev/backfill', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Backfill disabled in production' });
    }

    const emailInput = (req.body?.email || req.query?.email || '').trim().toLowerCase();

    const regFilter = emailInput
      ? { email: { $regex: new RegExp(`^${escapeRegex(emailInput)}$`, 'i') } }
      : {};

    const registrations = await Registration.find(regFilter);
    if (registrations.length === 0) {
      return res.json({ processed: 0, created: 0, updated: 0, message: 'No registrations found for filter' });
    }

    let created = 0;
    let updated = 0;
    const results = [];

    for (const reg of registrations) {
      const normalizedEmail = (reg.email || '').trim().toLowerCase();
      const emailQuery = { email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') } };

      let user = null;
      if (reg.userId) {
        user = await User.findById(reg.userId);
      }
      if (!user) {
        user = await User.findOne(emailQuery);
      }

      if (!user) {
        // Create new user from registration
        user = new User({
          fullName: reg.fullName || 'User',
          email: normalizedEmail,
          mobileNumber: reg.mobileNumber || '',
          password: reg.password || undefined, // will hash if provided
          registrationCompleted: true,
        });
        await user.save();
        created += 1;
        results.push({ email: user.email, action: 'created' });
      } else {
        // Ensure flags are set and email normalized
        let changed = false;
        if (!user.registrationCompleted) { user.registrationCompleted = true; changed = true; }
        if (user.email !== normalizedEmail) { user.email = normalizedEmail; changed = true; }
        if (!user.password && reg.password) { user.password = reg.password; changed = true; }
        if (changed) { await user.save(); updated += 1; results.push({ email: user.email, action: 'updated' }); }
      }

      // Link registration to user if missing
      if (!reg.userId || String(reg.userId) !== String(user._id)) {
        reg.userId = user._id;
        await reg.save();
      }
    }

    return res.json({ processed: registrations.length, created, updated, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;


