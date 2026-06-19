const JobApplication = require('../models/JobApplication');

// Create a job application (expects req.body fields and optionally req.file.resume handled upstream)
exports.createApplication = async (req, res) => {
  try {
    const user = req.user || null;
    const payload = {
      student: user ? user._id : (req.body.student || null),
      studentName: req.body.fullName || req.body.studentName || (user && (user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim())),
      studentEmail: req.body.email || (user && user.email),
      studentMobile: req.body.mobile || (user && (user.mobile || user.phone)),
      college: req.body.college || null,
  job: req.params.id || req.body.job || null,
  jobPosting: req.params.id || req.body.job || null,
  jobSource: req.params.source || req.body.jobSource || null,
  postingOrigin: (req.params.source === 'smaartjobpostings' || req.body.jobSource === 'smaartjobpostings') ? 'SMAART' : ((req.params.source === 'jobpostings' || req.body.jobSource === 'jobpostings') ? 'College' : (req.body.postingOrigin || null)),
      jobTitle: req.body.jobTitle || req.body.displayTitle || null,
      companyName: req.body.companyName || req.body.displayCompany || null,
      resumeUrl: null,
      portfolioUrl: req.body.portfolioUrl || null,
      linkedInUrl: req.body.linkedInUrl || null,
      coverLetter: req.body.coverLetter || req.body.message || null,
      status: 'applied',
    };

    // If multer populated req.file, try to extract URL
    if (req.file) {
      payload.resumeUrl = req.file.path || req.file.secure_url || req.file.url || (req.file.filename ? `/uploads/${req.file.filename}` : null);
    } else if (req.body.resumeUrl) {
      payload.resumeUrl = req.body.resumeUrl;
    }

    const application = new JobApplication(payload);
    await application.save();
    return res.json({ success: true, data: application });
  } catch (err) {
    console.error('createApplication error', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

exports.listApplications = async (req, res) => {
  try {
    const query = {};
    // simple filters
    if (req.query.student) query.student = req.query.student;
    if (req.query.job) query.job = req.query.job;
    if (req.query.jobSource) query.jobSource = req.query.jobSource;

    const applications = await JobApplication.find(query).sort({ createdAt: -1 }).limit(200).lean();
    return res.json({ success: true, data: applications });
  } catch (err) {
    console.error('listApplications error', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

exports.getApplication = async (req, res) => {
  try {
    const id = req.params.applicationId;
    const app = await JobApplication.findById(id).lean();
    if (!app) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: app });
  } catch (err) {
    console.error('getApplication error', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

exports.deleteApplication = async (req, res) => {
  try {
    const id = req.params.applicationId;
    const app = await JobApplication.findByIdAndDelete(id);
    if (!app) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('deleteApplication error', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};
