const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
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

// Reconstruct the flat "registration" shape the frontend expects from a merged
// student document (embedded `registration` sub-object + reconciled top-level
// fields). Returns null when there's no student.
const buildFlatRegistration = (studentDoc) => {
  if (!studentDoc) return null;
  const doc = studentDoc.toObject ? studentDoc.toObject() : studentDoc;
  const sub = doc.registration || {};
  return {
    ...sub,
    userId: doc.userId,
    email: doc.email,
    fullName: doc.fullName,
    mobileNumber: doc.mobile,
    profilePhoto: doc.profileImage,
    dob: doc.dateOfBirth,
    gender: doc.gender,
    cgpa: doc.cgpa,
    batch: doc.batch,
    studentId: doc.studentId,
    rollNumber: doc.rollNumber,
    admissionDate: doc.admissionDate,
    address: doc.address,
    status: doc.profileStatus,
  };
};

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
  // Registration data is embedded on the merged student document.
  const studentDoc = await Student.findOne({
    $or: [
      { _id: account._id },
      { email: account.email }
    ]
  }).select('registration fullName email mobile settings').lean();
  const registration = studentDoc ? (studentDoc.registration || null) : null;

  return {
    registration,
    profile: {
      displayName: account.fullName || studentDoc?.fullName || '',
      email: account.email || studentDoc?.email || '',
      phone: account.mobile || studentDoc?.mobile || '',
      bio: account.settings?.profile?.bio || registration?.bio || ''
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

    // Student details are stored ONLY in the students collection (not users).
    const emailQuery = { email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') } };

    // Resolve a college id if an institution name is provided.
    let collegeId = null;
    if (parsedPersonalDetails?.institution) {
      const college = await College.findOne({
        collegeName: { $regex: new RegExp(`^${escapeRegex(parsedPersonalDetails.institution.trim())}$`, 'i') }
      });
      if (college) collegeId = college._id;
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
        specialization: Array.isArray(he.specialization) ? (he.specialization[0] || '') : (he.specialization || ''),
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
      department: typeof parsedPersonalDetails?.department === 'object'
        ? (parsedPersonalDetails.department.fullName || parsedPersonalDetails.department.name || '')
        : (parsedPersonalDetails?.department || ''),
      cgpa: parsedPersonalDetails?.cgpa || '',
      yearOfStudy: parsedPersonalDetails?.yearOfStudy || '',
      yearOfPassing: parsedPersonalDetails?.yearOfPassing || '',
      alternateMobile: parsedPersonalDetails?.alternateMobile || '',
      bio: parsedPersonalDetails?.bio || '',
      batch: parsedPersonalDetails?.batch || '',

      // Address
      address: {
        street: parsedPersonalDetails?.address?.street || '',
        city: parsedPersonalDetails?.address?.city || '',
        state: parsedPersonalDetails?.address?.state || '',
        country: parsedPersonalDetails?.address?.country || '',
        district: parsedPersonalDetails?.address?.district || '',
        pincode: parsedPersonalDetails?.address?.pincode || '',
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

    const resolvedPhoto = registrationPayload.profilePhoto || parsedPersonalDetails?.profilePhoto;

    // Registrations were merged into students. Write the reconciled top-level
    // fields and the embedded `registration` sub-object onto the student
    // (creating a `pending` self-registered student if one doesn't exist yet).
    // Select +password so the "don't overwrite an existing password" check below
    // is accurate (password has select:false).
    let student = await Student.findOne(emailQuery).select('+password');
    if (!student) {
      student = new Student({
        fullName,
        email: normalizedEmail,
        mobile: mobileNumber,
        status: 'pending',
        profileStatus: 'pending',
        mustChangePassword: password ? false : true,
      });
    }
    if (collegeId) student.college = collegeId;

    // Split the payload: reconciled top-level fields vs. the intake sub-object.
    const {
      email: _e, fullName: _f, mobileNumber: _m, password: _p,
      profilePhoto: _pp, dob: _dob, gender: _gender, cgpa: _cgpa, batch: _batch,
      address: _address, ...registrationSubdoc
    } = registrationPayload;

    if (mobileNumber) student.mobile = mobileNumber;
    if (_dob) student.dateOfBirth = _dob;
    if (['male', 'female', 'other'].includes(_gender)) student.gender = _gender;
    if (resolvedPhoto) student.profileImage = resolvedPhoto;
    student.cgpa = _cgpa || (mappedHigherEducation && mappedHigherEducation[0]?.cgpaPercentage) || student.cgpa || '';
    if (_batch) student.batch = _batch;
    if (_address && Object.keys(_address).length) {
      const currentAddress = (student.address && student.address.toObject) ? student.address.toObject() : (student.address || {});
      student.address = { ...currentAddress, ..._address };
    }
    if (mappedHigherEducation && mappedHigherEducation.length > 0) {
      const he = mappedHigherEducation[0];
      student.academic = {
        ...(student.academic && student.academic.toObject ? student.academic.toObject() : student.academic),
        degreeLevel: he.qualificationLevel || '',
        domain: he.degree || '',
        degreeGroup: he.degreeFullName || '',
        specialisation: Array.isArray(he.specialization) ? (he.specialization[0] || '') : (he.specialization || '')
      };
    }

    student.registration = registrationSubdoc;
    student.isRegistered = true;
    if (password && !student.password) student.password = password;
    await student.save();

    res.status(201).json({
      message: 'Registration details saved successfully',
      registration: {
        id: student._id,
        email: student.email,
        fullName: student.fullName,
        status: student.profileStatus,
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

    // Student details are stored ONLY in the students collection (not users).
    const emailQuery = { email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') } };
    let student = await Student.findOne(emailQuery);

    // Ensure a student exists and work against an in-memory copy of its embedded
    // `registration` sub-object.
    if (!student) {
      student = new Student({
        fullName: data.fullName || 'User',
        email: normalizedEmail,
        mobile: data.mobileNumber || '',
        status: 'pending',
        profileStatus: 'pending',
        mustChangePassword: true,
      });
      await student.save();
    }

    const registration = (student.registration && student.registration.toObject)
      ? student.registration.toObject()
      : (student.registration ? { ...student.registration } : {});

    // Seed reconciled top-level fields so section handlers can read them.
    registration.email = normalizedEmail;
    registration.fullName = registration.fullName || data.fullName || student.fullName || 'User';
    registration.mobileNumber = registration.mobileNumber || student.mobile || '';
    registration.dob = registration.dob || student.dateOfBirth;
    registration.gender = registration.gender || student.gender;
    registration.cgpa = registration.cgpa || student.cgpa;
    registration.batch = registration.batch || student.batch;
    registration.profilePhoto = registration.profilePhoto || student.profileImage;
    if (!registration.address) {
      registration.address = (student.address && student.address.toObject) ? student.address.toObject() : (student.address || undefined);
    }

    // Update the specific section
    const sectionMapping = {
      'profilePhoto': async () => {
        registration.profilePhoto = data.profilePhoto || registration.profilePhoto;
        // Sync to the student for immediate feedback
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
        registration.department = typeof data.department === 'object'
          ? (data.department.fullName || data.department.name || '')
          : (data.department || registration.department);
        registration.cgpa = data.cgpa || registration.cgpa;
        registration.yearOfStudy = data.yearOfStudy || registration.yearOfStudy;
        registration.yearOfPassing = data.yearOfPassing || registration.yearOfPassing;
        registration.educationLevel = data.educationLevel || registration.educationLevel;
        registration.batch = data.batch || registration.batch;
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
            district: data.address.district || registration.address?.district || '',
            pincode: data.address.pincode || registration.address?.pincode || '',
          };
        }

        // Sync critical fields to the student (student data never goes to users)
        if (student) {
          if (data.fullName) student.fullName = data.fullName;
          if (data.mobileNumber) student.mobile = data.mobileNumber;
          if (data.bio) student.bio = data.bio;
          if (data.dob) student.dateOfBirth = data.dob;
          if (data.gender) student.gender = data.gender.toLowerCase();
          if (data.profilePhoto) student.profileImage = data.profilePhoto;
          if (data.cgpa !== undefined) {
            student.cgpa = data.cgpa;
          }
          if (data.batch) {
            student.batch = data.batch;
          }
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
          district: data.district || registration.address?.district || '',
          pincode: data.pincode || registration.address?.pincode || '',
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
        const mappedData = Array.isArray(data) ? data.map(he => ({
          ...he,
          specialization: Array.isArray(he.specialization) ? (he.specialization[0] || '') : (he.specialization || '')
        })) : data;
        registration.higherEducation = mappedData;

        if (student && Array.isArray(mappedData) && mappedData.length > 0) {
          const he = mappedData[0];
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

    // Persist: reconciled fields to the student top level, the rest into the
    // embedded `registration` sub-object.
    if (registration.mobileNumber) student.mobile = registration.mobileNumber;
    if (registration.dob) student.dateOfBirth = registration.dob;
    if (['male', 'female', 'other'].includes(String(registration.gender || '').toLowerCase())) {
      student.gender = String(registration.gender).toLowerCase();
    }
    if (registration.profilePhoto) student.profileImage = registration.profilePhoto;
    if (registration.cgpa !== undefined && registration.cgpa !== '') student.cgpa = registration.cgpa;
    if (registration.batch) student.batch = registration.batch;
    if (registration.timezone) student.timezone = registration.timezone;
    if (registration.dateFormat) student.dateFormat = registration.dateFormat;
    if (registration.notificationPrefs) student.notificationPrefs = registration.notificationPrefs;
    if (registration.address && Object.keys(registration.address).length) {
      const currentAddress = (student.address && student.address.toObject) ? student.address.toObject() : (student.address || {});
      student.address = { ...currentAddress, ...registration.address };
    }

    const reconciledKeys = ['userId', 'email', 'fullName', 'mobileNumber', 'password', 'profilePhoto', 'dob', 'gender', 'cgpa', 'batch', 'address', 'timezone', 'dateFormat', 'notificationPrefs', 'updatedAt', 'createdAt', 'status'];
    const subdoc = { ...registration };
    reconciledKeys.forEach(k => delete subdoc[k]);
    const currentSub = (student.registration && student.registration.toObject) ? student.registration.toObject() : (student.registration || {});
    student.registration = { ...currentSub, ...subdoc };
    // NOTE: do NOT set isRegistered here — a progressive section save is not a
    // completed registration. isRegistered is set on the final register-details
    // submit, and is what routes the user past the ComprehensiveSignup form.
    await student.save();

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

    // Find user by email — first try the User collection, then fall back directly
    // to the Student collection (admin-onboarded students have no User doc).
    const emailQuery = { email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') } };
    let user = null;
    let resolvedFromStudent = false;

    // 1. Try User collection
    user = await User.findOne(emailQuery).select('+password');

    // 2. If not found, try Student via userId link
    if (!user) {
      console.log('User not found in users, trying student link:', normalizedEmail);
      const linkedStudent = await Student.findOne(emailQuery).select('userId');
      if (linkedStudent?.userId) {
        user = await User.findById(linkedStudent.userId).select('+password');
      }
    }

    // 3. If still not found, try Student collection directly
    //    (admin-created students live only in the students collection)
    if (!user) {
      console.log('Falling back to direct Student collection lookup:', normalizedEmail);
      const studentDoc = await Student.findOne(emailQuery).select('+password');
      if (studentDoc) {
        user = studentDoc;
        resolvedFromStudent = true;
      }
    }

    if (!user) {
      console.log('User not found in any collection:', normalizedEmail);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('User found:', { email: normalizedEmail, resolvedFromStudent, hasPassword: !!user.password });

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

    // Registration data is embedded on the student document.
    // If we already resolved from Student, reuse that doc; otherwise look it up.
    const linkedStudentDoc = resolvedFromStudent
      ? user
      : await Student.findOne({
        $or: [{ _id: user._id }, { email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') } }]
      }).select('registration gender profileImage isRegistered').lean();

    const registration = linkedStudentDoc ? (linkedStudentDoc.registration || null) : null;
    const hasRegistration = !!(linkedStudentDoc && linkedStudentDoc.isRegistered);

    // Robust gender lookup
    let finalGender = user.gender || linkedStudentDoc?.gender;
    console.log(`[Users/Login] Final resolved gender: ${finalGender}`);

    // Return success with user data
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        gender: finalGender,
        mobileNumber: user.mobile,
        role: user.role || 'student',
        registrationCompleted: user.registrationCompleted || false,
        hasRegistration: hasRegistration,
        profilePhoto: linkedStudentDoc?.profileImage || user.profileImage || null,
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

    // SECURITY (audit CRITICAL): this endpoint spreads full Mongo documents into
    // the response. Strip credential/session/secret fields so the bcrypt password
    // hash and live session ids are never disclosed (this route is reachable
    // during the pre-auth registration flow).
    const stripSensitive = (o) => {
      if (!o || typeof o !== 'object') return o;
      const c = { ...o };
      for (const k of [
        'password', 'currentSessionId', 'sessionExpiresAt',
        'resetPasswordToken', 'resetPasswordExpires', 'resetToken', 'resetTokenExpiry',
        'otp', 'otpExpiry', 'otpExpires', 'loginOtp', 'twoFactorSecret', 'mfaSecret',
        '__v'
      ]) delete c[k];
      return c;
    };

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
          ...stripSensitive(regByEmail.toObject()),
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

    // Registration data is embedded on the merged student document.
    const registrationHost = (userSource === 'Student')
      ? user
      : await Student.findOne({ email: normalizedEmail });
    const registration = buildFlatRegistration(registrationHost);

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
    let academic = studentForDetails?.academic || {};
    if (studentForDetails && populatedDegree) {
      const dept = populatedDegree;
      academic = {
        degreeLevel: academic?.degreeLevel || dept.level || '',
        domain: academic?.domain || dept.domain || '',
        degreeGroup: academic?.degreeGroup || dept.fullName || dept.abbreviation || '',
        specialisation: academic?.specialisation || dept.specialization || '',
        cgpa: academic?.cgpa || ''
      };
    } else {
      academic = {
        degreeLevel: academic?.degreeLevel || '',
        domain: academic?.domain || '',
        degreeGroup: academic?.degreeGroup || '',
        specialisation: academic?.specialisation || '',
        cgpa: academic?.cgpa || ''
      };
    }

    const studentBatch = studentForDetails?.batch || '';
    const studentDept = studentForDetails?.department || null;

    if (registration) {
      return res.json({
        ...stripSensitive(registration.toObject()),
        ...registration,
        fullName: registration.fullName || user.fullName,
        gender: registration.gender || user.gender,
        batch: registration.batch || studentBatch || '',
        badges: aggregatedBadges,
        college: user?.college || fallbackCollege || null,
        degree: populatedDegree,
        academic,
        department: studentDept,
        lastLogin: user?.lastLogin || null,
        previousLogin: user?.previousLogin || null
      });
    }

    // Return user data without registration — include all available fields
    const userObj = stripSensitive(user.toObject ? user.toObject() : user);
    if (fallbackCollege && !userObj.college) {
      userObj.college = fallbackCollege;
    }
    res.json({
      ...userObj,
      studentId: userObj.studentId || studentForDetails?.studentId || '',
      rollNumber: userObj.rollNumber || studentForDetails?.rollNumber || '',
      admissionDate: userObj.admissionDate || studentForDetails?.admissionDate || '',
      degree: populatedDegree,
      academic,
      department: studentDept,
      batch: userObj.batch || studentBatch || '',
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

    // fullName / phone are top-level fields on the merged student — keep the
    // canonical student document in sync when the settings profile changes.
    const studentUpdates = {};
    if (settings.profile.displayName) studentUpdates.fullName = settings.profile.displayName;
    if (typeof settings.profile.phone === 'string') studentUpdates.mobile = settings.profile.phone;
    if (Object.keys(studentUpdates).length > 0) {
      await Student.updateOne(
        { $or: [{ _id: req.user._id }, { email: req.user.email }] },
        { $set: studentUpdates }
      );
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

// (Removed dev-only /_dev/backfill route: the registrations collection was
// merged into students, so there is nothing to backfill from.)

module.exports = router;


