const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const { FinalCareerPathwayModel, SkillProgressModel } = require('../models/careerAgentModels');

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

/**
 * The college that OWNS the posting. jobpostings.college is a single ObjectId.
 * smaartjobpostings.college is an ARRAY of *targeted* colleges — that is audience,
 * not authorship — so an array is deliberately ignored here.
 */
const extractOwningCollegeId = (job) => {
  const value = job.college;
  if (!value || Array.isArray(value)) return null;
  if (value._id && isObjectIdLike(value._id)) return value._id.toString();
  if (isObjectIdLike(value)) return value.toString();
  return null;
};

/**
 * Job-fair postings are written into `jobpostings` whichever kind of fair they
 * came from, so the collection alone cannot tell SMAART roles from college ones.
 * The fair's `label` is the discriminator ("smaart job fair" vs college fairs).
 */
const extractJobFairId = (job) => {
  const value = job.jobFairId || job.jobFair || job.fairId;
  if (!value || Array.isArray(value)) return null;
  if (value._id && isObjectIdLike(value._id)) return value._id.toString();
  if (isObjectIdLike(value)) return value.toString();
  return null;
};

const getCollegeName = (college) => {
  if (!college) return null;
  return college.collegeName
    || college.institution_name
    || college.name
    || college.title
    || null;
};

const getRecruiterName = (recruiter) => {
  if (!recruiter) return null;
  return recruiter.fullName
    || recruiter.name
    || recruiter.recruiterName
    || recruiter.contactName
    || null;
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
  const compName = getCompanyText(job);
  const compIndustry = job.__company?.industry || job.industry || 'Technology';
  const compCountry = job.__company?.country || job.country || 'India';
  const fallbackCompanyAbout = (compName && compName !== 'Company not listed')
    ? `${compName} is a leading organization in the ${compIndustry} sector (${compCountry}), actively conducting placement drives to recruit fresh talent.`
    : null;

  const companyAbout = job.aboutCompany
    || job.companyAbout
    || job.about
    || job.companyDescription
    || job.__company?.aboutCompany
    || job.__company?.about
    || job.__company?.description
    || getAboutCompanyFromRecruiter(job.__recruiter)
    || fallbackCompanyAbout;
  const companyWebsite = job.companyWebsite
    || job.website
    || job.__company?.website
    || job.__company?.websiteUrl
    || getWebsiteFromRecruiter(job.__recruiter)
    || null;
  const status = job.status || job.applicationStatus || 'active';

  // Which channel this posting reached the student through. The collection alone
  // is not sufficient: a role created inside a SMAART job fair is stored in
  // `jobpostings` but is still a SMAART posting, so the fair's label wins.
  const jobFairLabel = job.__jobFair?.label || '';
  const isSmaartJobFair = /smaart/i.test(jobFairLabel);
  const isSmaart = sourceCollection === 'smaartjobpostings' || isSmaartJobFair;

  // Who actually published it. A recruiter reference wins over the college:
  // `college` on a jobposting is the owning/HOST college, which for a role a
  // recruiter created inside a job fair is not the publisher. Crediting the host
  // college there reads as "SRM posted this" when Google's recruiter did.
  const recruiterName = getRecruiterName(job.__recruiter);
  const collegeName = getCollegeName(job.__college);
  const postedByType = recruiterName ? 'recruiter' : 'college';
  const postedBy = recruiterName || collegeName;

  return {
    ...job,
    __company: undefined,
    __recruiter: undefined,
    __college: undefined,
    __jobFair: undefined,
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
    displayPostedBy: postedBy,
    displayPostedByType: postedByType,
    // The college hosting/owning the posting. Distinct from the publisher above.
    displayHostCollege: collegeName,
    // Channel badge: 'smaart' | 'college'. Authoritative — use this, not sourceCollection.
    displaySource: isSmaart ? 'smaart' : 'college',
    displayJobFairTitle: job.__jobFair?.title || null,
  };
};

const enrichJobs = async (docs, sourceCollection) => {
  const [companyMap, recruiterMap, collegeMap, jobFairMap] = await Promise.all([
    findByIdsAcrossCollections(['companies'], docs.map(extractCompanyId)),
    findByIdsAcrossCollections(
      ['Recruiter', 'recruiters', 'recruiter'],
      docs.map(extractRecruiterId)
    ),
    findByIdsAcrossCollections(
      ['colleges', 'College', 'college'],
      docs.map(extractOwningCollegeId)
    ),
    findByIdsAcrossCollections(
      ['jobfairs', 'JobFair', 'jobfair'],
      docs.map(extractJobFairId)
    ),
  ]);

  return docs.map((doc) => {
    const companyId = extractCompanyId(doc);
    const recruiterId = extractRecruiterId(doc);
    const collegeId = extractOwningCollegeId(doc);
    const jobFairId = extractJobFairId(doc);
    return normalizeJob(
      {
        ...doc,
        __company: companyId ? companyMap.get(companyId) : null,
        __recruiter: recruiterId ? recruiterMap.get(recruiterId) : null,
        __college: collegeId ? collegeMap.get(collegeId) : null,
        __jobFair: jobFairId ? jobFairMap.get(jobFairId) : null,
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

    // Postings that belong to a job fair are surfaced inside that fair (see the
    // /job-fairs route), not in the general feed — otherwise they appear twice.
    // Applied at the route rather than inside buildCollectionFilter, because the
    // job-fairs route reuses that filter and must keep these postings.
    const filter = {
      $and: [
        buildCollectionFilter(req.user),
        { $or: [{ jobFairId: { $exists: false } }, { jobFairId: null }] },
      ],
    };
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

    let userSkills = [];
    let careerRoles = [];
    try {
      if (req.user) {
        const pathway = await FinalCareerPathwayModel.findOne({ userId: req.user._id, is_locked: true });
        if (pathway) {
          careerRoles = [pathway.primary_role, pathway.secondary_role, pathway.tertiary_role].filter(Boolean);
        }
        if (req.user.email) {
          const skills = await SkillProgressModel.find({ email: req.user.email, status: { $in: ['In Progress', 'Completed'] } });
          userSkills = skills.map(s => s.skillName);
        }
      }
    } catch (e) {
      console.warn("Could not fetch user skills/pathway for placements:", e);
    }

    // ── Skill Gap Computation ──────────────────────────────────────────
    // For each job that has structuredSkills, compare against the student's
    // known skills (from SkillProgress) and surface which must-have skills
    // are missing or below the required level. The student can still apply.
    const levelTextToNumber = (l) => {
      if (typeof l === 'number') return l;
      if (!l) return 0;
      const m = { beginner: 1, intermediate: 2, advanced: 3, expert: 4, master: 5 };
      return m[String(l).toLowerCase()] || 0;
    };

    const studentSkillMap = new Map(
      userSkills.map(name => [name.toLowerCase().trim(), 3]) // assume completed = level 3
    );

    // Fetch the actual Student document which holds verified skills
    if (req.user && req.user.email) {
      try {
        const studentDoc = await mongoose.connection.db.collection('students').findOne({ email: req.user.email });
        if (studentDoc) {
          const rawUserSkills = studentDoc.skills || studentDoc.verifiedSkills || [];
          rawUserSkills.forEach(s => {
            const name = (s.skill_name || s.name || '').toLowerCase().trim();
            if (name) studentSkillMap.set(name, s.verifiedLevel || levelTextToNumber(s.level) || 3);
          });
        }
      } catch (err) {
        console.warn("Could not fetch student doc for verified skills:", err);
      }
    }

    const dataWithGaps = data.map(job => {
      const required = (job.structuredSkills && job.structuredSkills.length > 0) 
        ? job.structuredSkills 
        : (job.eligibility?.skills || job.skills || []).map(s => ({ skill_name: s, requiredLevel: 3, isEssential: true }));
      
      if (!required.length) return { ...job, missedMustHaves: [], matchGapWarning: false };

      const missed = [];
      required.forEach(req => {
        if (!req.isEssential) return;
        const reqLevel = req.requiredLevel || 1;
        const name = (req.skill_name || '').toLowerCase().trim();
        const studentLevel = studentSkillMap.get(name) || 0;
        if (studentLevel < reqLevel) {
          missed.push({
            name: req.skill_name || req.skill_id || 'Unknown Skill',
            requiredLevel: reqLevel,
            studentLevel: studentLevel
          });
        }
      });

      return {
        ...job,
        missedMustHaves: missed,
        matchGapWarning: missed.length > 0,
      };
    });
    // ──────────────────────────────────────────────────────────────────

    res.json({
      success: true,
      count: dataWithGaps.length,
      data: dataWithGaps,
      sources: compact(collections),
      userSkills,
      careerRoles
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

    // ── Skill Gap Computation for Single Job ───────────────────────
    let userSkills = [];
    try {
      if (req.user && req.user.email) {
        const skills = await SkillProgressModel.find({ email: req.user.email, status: { $in: ['In Progress', 'Completed'] } });
        userSkills = skills.map(s => s.skillName);
      }
    } catch (e) {
      console.warn("Could not fetch user skills for placement detail:", e);
    }

    const levelTextToNumber = (l) => {
      if (typeof l === 'number') return l;
      if (!l) return 0;
      const m = { beginner: 1, intermediate: 2, advanced: 3, expert: 4, master: 5 };
      return m[String(l).toLowerCase()] || 0;
    };

    const studentSkillMap = new Map(
      userSkills.map(name => [name.toLowerCase().trim(), 3])
    );
    
    // Fetch the actual Student document which holds verified skills
    if (req.user && req.user.email) {
      try {
        const studentDoc = await mongoose.connection.db.collection('students').findOne({ email: req.user.email });
        if (studentDoc) {
          const rawUserSkills = studentDoc.skills || studentDoc.verifiedSkills || [];
          rawUserSkills.forEach(s => {
            const name = (s.skill_name || s.name || '').toLowerCase().trim();
            if (name) studentSkillMap.set(name, s.verifiedLevel || levelTextToNumber(s.level) || 3);
          });
        }
      } catch (err) {
        console.warn("Could not fetch student doc for verified skills:", err);
      }
    }

    const required = (job.structuredSkills && job.structuredSkills.length > 0) 
      ? job.structuredSkills 
      : (job.eligibility?.skills || job.skills || []).map(s => ({ skill_name: s, requiredLevel: 3, isEssential: true }));
    const missed = [];
    if (required.length) {
      required.forEach(reqSkill => {
        if (!reqSkill.isEssential) return;
        const reqLevel = reqSkill.requiredLevel || 1;
        const name = (reqSkill.skill_name || '').toLowerCase().trim();
        const studentLevel = studentSkillMap.get(name) || 0;
        if (studentLevel < reqLevel) {
          missed.push({
            name: reqSkill.skill_name || reqSkill.skill_id || 'Unknown Skill',
            requiredLevel: reqLevel,
            studentLevel: studentLevel
          });
        }
      });
    }

    job.missedMustHaves = missed;
    job.matchGapWarning = missed.length > 0;
    // ───────────────────────────────────────────────────────────────

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
      activeBacklog,
      resumeUrl: bodyResumeUrl
    } = req.body || {};

    // If a resume file was uploaded, derive a resumeUrl from the stored file info
    let resumeUrl = bodyResumeUrl || null;
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
      activeBacklog: activeBacklog !== undefined && activeBacklog !== '' && activeBacklog !== null ? Number(activeBacklog) : null,
      status: 'applied',
      appliedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!application.studentName || !application.studentEmail || !application.studentMobile || application.activeBacklog === null || application.activeBacklog === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, mobile number, and active backlogs count are required',
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
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG /applications] incoming query params:', { job, jobSource });
      console.log('[DEBUG /applications] req.user:', { id: req.user?._id, role: req.user?.role });
    }
    const query = {};
    if (job && mongoose.Types.ObjectId.isValid(job)) query.job = new mongoose.Types.ObjectId(job);
    if (jobSource) query.jobSource = jobSource;

    // Non-admin users should only see their own applications
    if (req.user?.role !== 'admin') {
      // Ensure query.student is cast to ObjectId if it's not already
      query.student = new mongoose.Types.ObjectId(req.user._id);
    }

    if (process.env.NODE_ENV === 'development') console.log('[DEBUG /applications] final query:', query);
    const applicationCollection = mongoose.connection.db.collection('placementapplications');
    const docs = await applicationCollection.find(query).sort({ createdAt: -1 }).limit(200).toArray();
    if (process.env.NODE_ENV === 'development') console.log('[DEBUG /applications] found docs count:', docs.length);

    // Attach the referenced posting so the client does not have to fetch each one
    // individually. Postings do get deleted while applications live on, so anything
    // that no longer resolves falls back to the company record for branding and is
    // flagged with jobRemoved rather than silently rendering as a blank card.
    const bySource = new Map();
    docs.forEach((app) => {
      const src = app.jobSource || 'jobpostings';
      const jobId = getId(app.job);
      if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) return;
      if (!bySource.has(src)) bySource.set(src, new Set());
      bySource.get(src).add(jobId);
    });

    const jobsBySource = new Map();
    await Promise.all([...bySource.entries()].map(async ([src, ids]) => {
      try {
        const found = await mongoose.connection.db
          .collection(src)
          .find({ _id: { $in: [...ids].map((id) => new mongoose.Types.ObjectId(id)) } })
          .toArray();
        const enriched = await enrichJobs(found, src);
        jobsBySource.set(src, new Map(enriched.map((j) => [String(j._id), j])));
      } catch (err) {
        if (err.codeName !== 'NamespaceNotFound') throw err;
        jobsBySource.set(src, new Map());
      }
    }));

    // Company logos keyed by lowercased name, for applications whose posting is gone.
    const orphanNames = [...new Set(docs
      .filter((app) => {
        const src = app.jobSource || 'jobpostings';
        return !jobsBySource.get(src)?.get(getId(app.job));
      })
      .map((app) => (app.companyName || '').trim().toLowerCase())
      .filter(Boolean))];

    const logoByCompany = new Map();
    if (orphanNames.length > 0) {
      const companies = await mongoose.connection.db.collection('companies').find({}).toArray();
      companies.forEach((c) => {
        const key = (c.name || c.companyName || '').trim().toLowerCase();
        if (key && orphanNames.includes(key)) {
          logoByCompany.set(key, c.logo || c.logoUrl || c.companyLogo || null);
        }
      });
    }

    const data = docs.map((app) => {
      const src = app.jobSource || 'jobpostings';
      const resolved = jobsBySource.get(src)?.get(getId(app.job)) || null;
      if (resolved) return { ...app, job: resolved, jobRemoved: false };
      const key = (app.companyName || '').trim().toLowerCase();
      return {
        ...app,
        jobRemoved: true,
        displayCompanyLogo: logoByCompany.get(key) || null,
        displaySource: src === 'smaartjobpostings' ? 'smaart' : 'college',
      };
    });

    res.json({ success: true, data });
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

// Get user's saved jobs list
router.get('/saved-jobs', protect, async (req, res) => {
  try {
    const UserModel = req.user.constructor;
    const user = await UserModel.findById(req.user._id).select('savedJobs');
    res.json({ success: true, data: user?.savedJobs || [] });
  } catch (error) {
    console.error('[Placements] get saved jobs error:', error);
    res.status(500).json({ success: false, error: 'Failed to get saved jobs' });
  }
});

// Toggle save/unsave a job
router.post('/saved-jobs', protect, async (req, res) => {
  try {
    const { jobId, source } = req.body;
    if (!jobId || !source) return res.status(400).json({ success: false, error: 'jobId and source required' });

    const UserModel = req.user.constructor;
    
    // Check if it's already saved
    const user = await UserModel.findById(req.user._id).select('savedJobs');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    const existingIndex = (user.savedJobs || []).findIndex(sj => 
      sj.jobId && sj.jobId.toString() === jobId.toString() && sj.source === source
    );
    
    let isSaved = false;
    if (existingIndex >= 0) {
      // Remove it
      await UserModel.updateOne(
        { _id: req.user._id },
        { $pull: { savedJobs: { jobId: new mongoose.Types.ObjectId(jobId), source: source } } }
      );
    } else {
      // Add it
      await UserModel.updateOne(
        { _id: req.user._id },
        { $push: { savedJobs: { jobId: new mongoose.Types.ObjectId(jobId), source: source } } }
      );
      isSaved = true;
    }
    
    // Fetch updated to return to client
    const updatedUser = await UserModel.findById(req.user._id).select('savedJobs');
    res.json({ success: true, isSaved, data: updatedUser.savedJobs || [] });
  } catch (error) {
    console.error('[Placements] toggle saved job error:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle saved job' });
  }
});

// Get companies (SMAART Partners + College Partners)
router.get('/companies', protect, async (req, res) => {
  try {
    const userCollegeId = req.user.college?._id || req.user.college;
    const db = mongoose.connection.db;

    // 1. Fetch College Partners
    let collegePartners = [];
    if (userCollegeId && mongoose.Types.ObjectId.isValid(userCollegeId)) {
      collegePartners = await db.collection('companies')
        .find({ college: new mongoose.Types.ObjectId(userCollegeId) })
        .toArray();
    }

    // 2. Fetch SMAART Partners (recruiters without a specific college)
    const smaartPartners = await db.collection('recruiters')
      .find({ role: 'recruiter', status: { $ne: 'inactive' }, $or: [{ college: null }, { college: { $exists: false } }] })
      .toArray();

    // Map them to a common format
    const formattedCollegePartners = collegePartners.map(p => ({
      _id: p._id.toString(),
      name: p.name || p.companyName,
      logo: p.logo || p.companyLogo || p.logoUrl,
      website: p.website,
      description: p.description || p.aboutCompany,
      partnerType: 'college',
      collegeId: p.college
    }));

    const formattedSmaartPartners = smaartPartners.map(p => ({
      _id: p._id.toString(),
      name: p.qualification || p.fullName || p.companyName || 'SMAART Partner',
      logo: p.profileImage || p.logo,
      website: p.website,
      description: p.aboutCompany || p.bio,
      partnerType: 'smaart'
    }));

    const allPartners = [...formattedSmaartPartners, ...formattedCollegePartners];

    res.json({
      success: true,
      count: allPartners.length,
      data: allPartners
    });
  } catch (error) {
    console.error('[Placements] get companies error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch companies' });
  }
});

// Get all job fairs for the student's college
/**
 * Postings that belong to the given fairs, normalised exactly like the Jobs tab
 * and scoped by the same audience rules — being able to see a fair does not
 * entitle a student to postings they are not targeted for.
 * Returns a Map keyed by stringified fair id.
 */
const loadJobsForFairs = async (student, fairIds) => {
  const jobsByFair = new Map();
  if (!fairIds.length) return jobsByFair;

  const audienceFilter = buildCollectionFilter(student);

  await Promise.all(['jobpostings', 'smaartjobpostings'].map(async (collectionName) => {
    try {
      const docs = await mongoose.connection.db
        .collection(collectionName)
        .find({ $and: [audienceFilter, { jobFairId: { $in: fairIds } }] })
        .sort({ createdAt: -1 })
        .toArray();

      const enriched = await enrichJobs(docs, collectionName);
      enriched.forEach((job) => {
        const key = String(job.jobFairId);
        if (!jobsByFair.has(key)) jobsByFair.set(key, []);
        jobsByFair.get(key).push(job);
      });
    } catch (e) {
      if (e.codeName !== 'NamespaceNotFound') throw e;
    }
  }));

  return jobsByFair;
};

// Single job fair, with its postings attached.
router.get('/job-fairs/:id', protect, async (req, res) => {
  try {
    if (req.user?.role !== 'student') {
      return res.status(403).json({ success: false, error: 'Only student accounts can view job fairs' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid job fair id' });
    }

    const fairObjectId = new mongoose.Types.ObjectId(id);
    const fair = await mongoose.connection.db.collection('jobfairs').findOne({ _id: fairObjectId });
    if (!fair) {
      return res.status(404).json({ success: false, error: 'Job fair not found' });
    }

    // Same visibility rule as the list endpoint: the student's own college, or
    // any SMAART fair.
    const collegeId = getId(req.user.college);
    const visible = fair.label === 'smaart job fair'
      || (collegeId && String(fair.college) === String(collegeId));
    if (!visible) {
      return res.status(403).json({ success: false, error: 'This job fair is not available to you' });
    }

    const jobsByFair = await loadJobsForFairs(req.user, [fairObjectId]);
    res.json({ success: true, data: { ...fair, jobs: jobsByFair.get(String(fair._id)) || [] } });
  } catch (err) {
    console.error('[Placements] get job fair error:', err);
    res.status(500).json({ success: false, error: 'Failed to load job fair' });
  }
});

router.get('/job-fairs', protect, async (req, res) => {
  try {
    if (req.user?.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only student accounts can view job fairs',
      });
    }

    const collegeId = getId(req.user.college);
    if (!collegeId) {
      return res.json({ success: true, count: 0, data: [] });
    }

    // Query jobfairs collection directly
    const fairs = await mongoose.connection.db
      .collection('jobfairs')
      .find({
        $or: [
          { college: new mongoose.Types.ObjectId(collegeId) },
          { label: 'smaart job fair' }
        ]
      })
      .sort({ startDate: -1 })
      .toArray();

    // Attach each fair's postings so the card can show a role count.
    const jobsByFair = await loadJobsForFairs(req.user, fairs.map((f) => f._id));

    const data = fairs.map((fair) => ({
      ...fair,
      jobs: jobsByFair.get(String(fair._id)) || [],
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error('[Placements] get job fairs error:', err);
    res.status(500).json({ success: false, error: 'Failed to load job fairs' });
  }
});

// Register student for job fair
router.post('/job-fairs/:id/register', protect, async (req, res) => {
  try {
    if (req.user?.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only student accounts can register for job fairs',
      });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid job fair ID' });
    }

    const fairCollection = mongoose.connection.db.collection('jobfairs');
    const fair = await fairCollection.findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (!fair) {
      return res.status(404).json({ success: false, error: 'Job Fair not found' });
    }

    // Check if student is already registered
    const registeredStudents = fair.registeredStudents || [];
    const isAlreadyRegistered = registeredStudents.some(s => s.toString() === req.user._id.toString());

    if (isAlreadyRegistered) {
      return res.status(400).json({ success: false, error: 'Already registered for this Job Fair' });
    }

    // Add student ID to registeredStudents array
    await fairCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $push: { registeredStudents: req.user._id } }
    );

    // Retrieve updated job fair
    const updatedFair = await fairCollection.findOne({ _id: new mongoose.Types.ObjectId(id) });

    res.json({ success: true, message: 'Successfully registered for Job Fair', data: updatedFair });
  } catch (err) {
    console.error('[Placements] register job fair error:', err);
    res.status(500).json({ success: false, error: 'Failed to register for job fair' });
  }
});
// @route   POST /api/placements/applications/:id/respond-offer
// @desc    Accept or decline an offer with e-signature
// @access  Private (Student)
router.post('/applications/:id/respond-offer', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, error: 'Only student accounts can respond to offers' });
    }

    const { id } = req.params;
    const { status, eSignature } = req.body;

    if (!['Accepted', 'Declined'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid response status' });
    }
    
    if (status === 'Accepted' && (!eSignature || eSignature.trim().length === 0)) {
        return res.status(400).json({ success: false, error: 'E-Signature is required to accept the offer' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid application id' });
    }

    const applicationCollection = mongoose.connection.db.collection('placementapplications');
    const existing = await applicationCollection.findOne({ _id: new mongoose.Types.ObjectId(id) });
    if (!existing) return res.status(404).json({ success: false, error: 'Application not found' });

    // Verify ownership
    if (existing.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to modify this application' });
    }

    // Update application
    const updateData = {
        status: status,
        updatedAt: new Date()
    };
    
    if (status === 'Accepted') {
        updateData.eSignature = eSignature.trim();
        updateData.signatureDate = new Date();
    }

    await applicationCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: updateData }
    );

    res.json({
      success: true,
      message: `Offer successfully ${status === 'Accepted' ? 'accepted' : 'declined'}`,
      data: { status }
    });
  } catch (err) {
    console.error('[Placements] respond offer error:', err);
    res.status(500).json({ success: false, error: 'Failed to process offer response' });
  }
});

module.exports = router;
