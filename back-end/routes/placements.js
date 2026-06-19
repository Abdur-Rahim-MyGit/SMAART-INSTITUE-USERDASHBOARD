const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');

const router = express.Router();

const getId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value._id) return value._id.toString();
  if (value.id) return value.id.toString();
  return value.toString?.() || null;
};

const compact = (values) => values.filter(Boolean).map((value) => value.toString());

const isObjectIdLike = (value) => {
  if (!value) return false;
  if (value instanceof mongoose.Types.ObjectId) return true;
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
};

const uniqueById = (jobs) => {
  const seen = new Set();
  return jobs.filter((job) => {
    const key = `${job.sourceCollection}:${job._id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const extractCompanyId = (job) => {
  const value = job.company || job.companyId || job.employerId || job.organisationId || job.organizationId;
  if (!value) return null;
  if (value._id && isObjectIdLike(value._id)) return value._id.toString();
  if (isObjectIdLike(value)) return value.toString();
  return null;
};

const extractRecruiterId = (job) => {
  const value = job.recruiter || job.recruiterId || job.recruiterID || job.postedByRecruiter || job.createdByRecruiter;
  if (!value) return null;
  if (value._id && isObjectIdLike(value._id)) return value._id.toString();
  if (isObjectIdLike(value)) return value.toString();
  return null;
};

const getCompanyFromRecruiter = (recruiter) => {
  if (!recruiter) return null;
  if (recruiter.company && typeof recruiter.company === 'object' && !isObjectIdLike(recruiter.company)) {
    return recruiter.company.companyName || recruiter.company.name || recruiter.company.title || null;
  }

  return recruiter.companyName
    || recruiter.company
    || recruiter.fullName
    || recruiter.name
    || recruiter.organisationName
    || recruiter.organizationName
    || recruiter.employerName
    || recruiter.recruiterCompany
    || null;
};

const getLogoFromRecruiter = (recruiter) => {
  if (!recruiter) return null;
  if (recruiter.company && typeof recruiter.company === 'object' && !isObjectIdLike(recruiter.company)) {
    return recruiter.company.logo
      || recruiter.company.logoUrl
      || recruiter.company.companyLogo
      || recruiter.company.companyLogoUrl
      || null;
  }

  return recruiter.companyLogo
    || recruiter.profileImage
    || recruiter.avatar
    || recruiter.logo
    || recruiter.logoUrl
    || recruiter.companyLogoUrl
    || recruiter.organisationLogo
    || recruiter.organizationLogo
    || null;
};

const getAboutCompanyFromRecruiter = (recruiter) => {
  if (!recruiter) return null;
  if (recruiter.company && typeof recruiter.company === 'object' && !isObjectIdLike(recruiter.company)) {
    return recruiter.company.aboutCompany
      || recruiter.company.about
      || recruiter.company.description
      || recruiter.company.companyDescription
      || null;
  }

  return recruiter.aboutCompany
    || recruiter.aboutcompany
    || recruiter.about_company
    || recruiter.companyAbout
    || recruiter.about
    || recruiter.description
    || recruiter.companyDescription
    || recruiter.profileSummary
    || null;
};

const getWebsiteFromRecruiter = (recruiter) => {
  if (!recruiter) return null;
  if (recruiter.company && typeof recruiter.company === 'object' && !isObjectIdLike(recruiter.company)) {
    return recruiter.company.website || recruiter.company.websiteUrl || recruiter.company.companyWebsite || null;
  }

  return recruiter.website || recruiter.websiteUrl || recruiter.companyWebsite || null;
};

const getCompanyText = (job) => {
  const inlineCompany = job.company;
  if (inlineCompany && typeof inlineCompany === 'object' && !isObjectIdLike(inlineCompany)) {
    return inlineCompany.companyName || inlineCompany.name || inlineCompany.title || null;
  }

  if (inlineCompany && !isObjectIdLike(inlineCompany)) return inlineCompany;

  return job.companyName
    || job.employer
    || job.employerName
    || job.organization
    || job.organizationName
    || job.organisation
    || job.organisationName
    || job.__company?.companyName
    || job.__company?.name
    || getCompanyFromRecruiter(job.__recruiter)
    || 'Company not listed';
};

const getCompanyLogo = (job) => {
  const inlineCompany = job.company;
  if (inlineCompany && typeof inlineCompany === 'object' && !isObjectIdLike(inlineCompany)) {
    return inlineCompany.logo || inlineCompany.logoUrl || inlineCompany.companyLogo || inlineCompany.companyLogoUrl || null;
  }

  return job.companyLogo
    || job.logo
    || job.logoUrl
    || job.companyLogoUrl
    || job.employerLogo
    || job.organisationLogo
    || job.organizationLogo
    || job.__company?.logo
    || job.__company?.logoUrl
    || job.__company?.companyLogo
    || job.__company?.companyLogoUrl
    || getLogoFromRecruiter(job.__recruiter)
    || null;
};

const findByIdsAcrossCollections = async (collectionNames, ids) => {
  const objectIds = [...new Set(ids.filter(Boolean))]
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (objectIds.length === 0) return new Map();

  const entries = await Promise.all(collectionNames.map(async (collectionName) => {
    try {
      const docs = await mongoose.connection.db
        .collection(collectionName)
        .find({ _id: { $in: objectIds } })
        .toArray();

      return docs.map((doc) => [doc._id.toString(), doc]);
    } catch (err) {
      if (err.codeName === 'NamespaceNotFound') return [];
      throw err;
    }
  }));

  return new Map(entries.flat());
};

const buildCollectionFilter = (student) => {
  const now = new Date();
  const collegeId = getId(student.college);
  const degreeId = getId(student.degree || student.degreeId);
  const department = student.department || student.academic?.specialisation || student.academic?.domain;
  const semester = student.semester;
  const batch = student.batch;

  const baseStatus = {
    $or: [
      { status: { $exists: false } },
      { status: { $in: ['active', 'Active', 'published', 'Published', 'open', 'Open', 'approved', 'Approved'] } },
      { isActive: true },
      { published: true },
      { isPublished: true },
    ],
  };

  const dateFilter = {
    $and: [
      {
        $or: [
          { deadline: { $exists: false } },
          { deadline: null },
          { deadline: { $gte: now } },
        ],
      },
      {
        $or: [
          { applicationDeadline: { $exists: false } },
          { applicationDeadline: null },
          { applicationDeadline: { $gte: now } },
        ],
      },
      {
        $or: [
          { lastDateToApply: { $exists: false } },
          { lastDateToApply: null },
          { lastDateToApply: { $gte: now } },
        ],
      },
    ],
  };

  const audienceFilters = [
    { targetType: { $exists: false } },
    { targetType: null },
    { targetType: { $in: ['all', 'All', 'students', 'Students'] } },
  ];

  if (collegeId && mongoose.Types.ObjectId.isValid(collegeId)) {
    const collegeObjectId = new mongoose.Types.ObjectId(collegeId);
    audienceFilters.push(
      { college: collegeObjectId },
      { collegeId: collegeObjectId },
      { targetCollege: collegeObjectId },
      { targetCollegeIds: collegeObjectId },
      { targetColleges: collegeObjectId },
      { eligibleColleges: collegeObjectId },
    );
  }

  if (degreeId && mongoose.Types.ObjectId.isValid(degreeId)) {
    const degreeObjectId = new mongoose.Types.ObjectId(degreeId);
    audienceFilters.push(
      { degree: degreeObjectId },
      { degreeId: degreeObjectId },
      { targetDegree: degreeObjectId },
      { targetDegreeIds: degreeObjectId },
      { targetDegrees: degreeObjectId },
      { eligibleDegrees: degreeObjectId },
    );
  }

  if (department) {
    audienceFilters.push(
      { department },
      { departments: department },
      { targetDepartment: department },
      { targetDepartments: department },
      { eligibleDepartments: department },
    );
  }

  if (semester) {
    audienceFilters.push(
      { semester },
      { semesters: semester },
      { eligibleSemesters: semester },
    );
  }

  if (batch) {
    audienceFilters.push(
      { batch },
      { batches: batch },
      { eligibleBatches: batch },
    );
  }

  return {
    $and: [
      baseStatus,
      dateFilter,
      { $or: audienceFilters },
    ],
  };
};

const normalizeJob = (job, sourceCollection) => {
  const title = job.title || job.jobTitle || job.role || job.position || job.designation || 'Untitled role';
  const company = getCompanyText(job);
  const location = job.location || job.jobLocation || job.city || job.workLocation || job.workMode || 'Location not listed';
  const type = job.type || job.jobType || job.employmentType || job.workType || 'Job';
  const deadline = job.deadline || job.applicationDeadline || job.lastDateToApply || job.applyBy || null;
  const createdAt = job.createdAt || job.postedAt || job.createdOn || job.updatedAt || null;
  const salary = job.salary || job.ctc || job.package || job.compensation || job.stipend || null;
  const applyUrl = job.applyUrl || job.applicationUrl || job.link || job.jobUrl || job.url || null;
  const companyLogo = getCompanyLogo(job);
  const companyAbout = job.aboutCompany
    || job.companyAbout
    || job.__company?.aboutCompany
    || job.__company?.about
    || job.__company?.description
    || getAboutCompanyFromRecruiter(job.__recruiter)
    || null;
  const companyWebsite = job.companyWebsite
    || job.website
    || job.__company?.website
    || job.__company?.websiteUrl
    || getWebsiteFromRecruiter(job.__recruiter)
    || null;
  const status = job.status || job.applicationStatus || 'active';

  return {
    ...job,
    __company: undefined,
    __recruiter: undefined,
    _id: job._id?.toString?.() || job._id,
    sourceCollection,
    displayTitle: title,
    displayCompany: company,
    displayLocation: location,
    displayType: type,
    displayDeadline: deadline,
    displayCreatedAt: createdAt,
    displaySalary: salary,
    displayApplyUrl: applyUrl,
    displayCompanyLogo: companyLogo,
    displayCompanyAbout: companyAbout,
    displayCompanyWebsite: companyWebsite,
    displayStatus: status,
  };
};

const enrichJobs = async (docs, sourceCollection) => {
  const companyMap = await findByIdsAcrossCollections(['companies'], docs.map(extractCompanyId));
  const recruiterMap = await findByIdsAcrossCollections(
    ['Recruiter', 'recruiters', 'recruiter'],
    docs.map(extractRecruiterId)
  );

  return docs.map((doc) => {
    const companyId = extractCompanyId(doc);
    const recruiterId = extractRecruiterId(doc);
    return normalizeJob(
      {
        ...doc,
        __company: companyId ? companyMap.get(companyId) : null,
        __recruiter: recruiterId ? recruiterMap.get(recruiterId) : null,
      },
      sourceCollection
    );
  });
};

router.get('/jobs', protect, async (req, res) => {
  try {
    if (req.user?.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only student accounts can view placement jobs',
      });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const filter = buildCollectionFilter(req.user);
    const collections = ['jobpostings', 'smaartjobpostings'];

    const results = await Promise.all(collections.map(async (collectionName) => {
      const docs = await mongoose.connection.db
        .collection(collectionName)
        .find(filter)
        .sort({ isPinned: -1, postedAt: -1, createdAt: -1, updatedAt: -1 })
        .limit(limit)
        .toArray();

      return enrichJobs(docs, collectionName);
    }));

    const data = uniqueById(results.flat())
      .sort((a, b) => new Date(b.displayCreatedAt || 0) - new Date(a.displayCreatedAt || 0))
      .slice(0, limit);

    res.json({
      success: true,
      count: data.length,
      data,
      sources: compact(collections),
    });
  } catch (err) {
    console.error('[Placements] jobs error:', err);
    res.status(500).json({ success: false, error: 'Failed to load placement jobs' });
  }
});

router.get('/jobs/:source/:id', protect, async (req, res) => {
  try {
    if (req.user?.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only student accounts can view placement jobs',
      });
    }

    const { source, id } = req.params;
    const allowedCollections = ['jobpostings', 'smaartjobpostings'];

    if (!allowedCollections.includes(source) || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid job reference' });
    }

    const doc = await mongoose.connection.db
      .collection(source)
      .findOne({ _id: new mongoose.Types.ObjectId(id) });

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const [job] = await enrichJobs([doc], source);
    res.json({ success: true, data: job });
  } catch (err) {
    console.error('[Placements] job detail error:', err);
    res.status(500).json({ success: false, error: 'Failed to load job details' });
  }
});

const { uploadSupportAttachments, uploadRegistration } = require('../middleware/upload');

// Accept resume file upload (single) alongside JSON fields
router.post('/jobs/:source/:id/apply', protect, uploadRegistration.single('resume'), async (req, res) => {
  try {
    if (req.user?.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only student accounts can apply for placement jobs',
      });
    }

    const { source, id } = req.params;
    const allowedCollections = ['jobpostings', 'smaartjobpostings'];

    if (!allowedCollections.includes(source) || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid job reference' });
    }

    const jobObjectId = new mongoose.Types.ObjectId(id);
    const doc = await mongoose.connection.db.collection(source).findOne({ _id: jobObjectId });

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const applicationCollection = mongoose.connection.db.collection('placementapplications');
    const existing = await applicationCollection.findOne({
      student: req.user._id,
      $or: [ { job: jobObjectId }, { jobPosting: jobObjectId } ],
      jobSource: source,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'You have already applied for this job',
      });
    }

    const [job] = await enrichJobs([doc], source);
    const {
      fullName,
      email,
      mobile,
      portfolioUrl,
      linkedInUrl,
      coverLetter,
    } = req.body || {};

    // If a resume file was uploaded, derive a resumeUrl from the stored file info
    let resumeUrl = null;
    if (req.file) {
      // For Cloudinary registration storage, multer-storage-cloudinary sets path/secure_url
      resumeUrl = req.file.path || req.file.secure_url || req.file.url || `/uploads/${req.file.filename}`;
      // If Cloudinary stored as 'raw' it may set 'secure_url' or 'path' — above covers common fields
    }

    const application = {
      student: req.user._id,
      studentName: (fullName || req.user.fullName || '').trim(),
      studentEmail: (email || req.user.email || '').trim().toLowerCase(),
      studentMobile: (mobile || req.user.mobile || '').trim(),
      college: req.user.college?._id || req.user.college || null,
      job: jobObjectId,
  jobPosting: jobObjectId, // populate legacy field used by unique index
      jobSource: source,
  postingOrigin: source === 'smaartjobpostings' ? 'SMAART' : (source === 'jobpostings' ? 'College' : 'External'),
      jobTitle: job.displayTitle,
      companyName: job.displayCompany,
      resumeUrl: resumeUrl?.trim() || null,
      portfolioUrl: portfolioUrl?.trim() || null,
      linkedInUrl: linkedInUrl?.trim() || null,
      coverLetter: coverLetter?.trim() || '',
      status: 'applied',
      appliedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!application.studentName || !application.studentEmail || !application.studentMobile) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and mobile number are required',
      });
    }

    const result = await applicationCollection.insertOne(application);
    res.status(201).json({
      success: true,
      data: {
        ...application,
        _id: result.insertedId,
      },
      message: 'Application submitted successfully',
    });
  } catch (err) {
    console.error('[Placements] apply error:', err);
    const errMsg = (err && err.message) ? err.message : 'Failed to submit application';
    const payload = { success: false, error: errMsg };
    if (process.env.NODE_ENV !== 'production') {
      payload.details = err.stack;
    }
    res.status(500).json(payload);
  }
});

// List placement applications for current user (or admins) filtered by job/jobSource
router.get('/applications', protect, async (req, res) => {
  try {
    const { job, jobSource } = req.query;
    const query = {};
    if (job && mongoose.Types.ObjectId.isValid(job)) query.job = new mongoose.Types.ObjectId(job);
    if (jobSource) query.jobSource = jobSource;

    // Non-admin users should only see their own applications
    if (req.user?.role !== 'admin') {
      query.student = req.user._id;
    }

    const applicationCollection = mongoose.connection.db.collection('placementapplications');
    const docs = await applicationCollection.find(query).sort({ createdAt: -1 }).limit(200).toArray();
    res.json({ success: true, data: docs });
  } catch (err) {
    console.error('[Placements] list applications error:', err);
    res.status(500).json({ success: false, error: 'Failed to list applications' });
  }
});

// Delete (withdraw) a placement application
router.delete('/applications/:applicationId', protect, async (req, res) => {
  try {
    const { applicationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ success: false, error: 'Invalid application id' });
    }

    const applicationCollection = mongoose.connection.db.collection('placementapplications');
    const existing = await applicationCollection.findOne({ _id: new mongoose.Types.ObjectId(applicationId) });
    if (!existing) return res.status(404).json({ success: false, error: 'Application not found' });

    // Only the student who applied or an admin can delete
    if (req.user?.role !== 'admin' && existing.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this application' });
    }

    await applicationCollection.deleteOne({ _id: new mongoose.Types.ObjectId(applicationId) });
    res.json({ success: true, message: 'Application withdrawn' });
  } catch (err) {
    console.error('[Placements] withdraw application error:', err);
    res.status(500).json({ success: false, error: 'Failed to withdraw application' });
  }
});

module.exports = router;
