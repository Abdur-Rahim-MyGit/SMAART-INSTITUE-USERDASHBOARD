/**
 * Career Agent Models
 * Ported from Career-Agent/backend/mongoDb.js
 * Registers MongoDB models for the Career Intelligence system.
 * Safe to require multiple times — uses mongoose.models cache.
 */
const mongoose = require('mongoose');

// ── CareerAnalysis (analysis result storage) ──────────────────────────────────
const careerAnalysisSchema = new mongoose.Schema({
  student_name: { type: String },
  student_email: { type: String, index: true },
  primary_role: { type: String },
  input_data: { type: mongoose.Schema.Types.Mixed, required: true },
  output_data: { type: mongoose.Schema.Types.Mixed, required: true },
  profile_hash: { type: String, index: true },
  college_code: { type: String, index: true },
  zone_primary: { type: String, enum: ['Green', 'Amber', 'Red', 'Unknown'] },
  zone_secondary: { type: String, enum: ['Green', 'Amber', 'Red', 'Unknown'] },
  zone_tertiary: { type: String, enum: ['Green', 'Amber', 'Red', 'Unknown'] },
  missing_skills: [String],
  matched_skills: [String],
  skill_coverage_pct: Number,
  path_text: String,
  future_scope_text: String,
  is_synthetic: { type: Boolean, default: false },
  student_rating: { type: Number, min: 1, max: 5 },
  consent_for_training: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});
const CareerAnalysisModel = mongoose.models['CareerAnalysis'] ||
  mongoose.model('CareerAnalysis', careerAnalysisSchema);

// ── CareerAgentData (career_agent_data collection — direction mappings) ────────
const careerAgentDataSchema = new mongoose.Schema({}, { strict: false });
const CareerAgentDataModel = mongoose.models['CareerAgentData'] ||
  mongoose.model('CareerAgentData', careerAgentDataSchema, 'careerdirections');

// ── CareerRole (careerroles collection — role intelligence) ───────────────────
const careerRolesSchema = new mongoose.Schema({
  role_name: { type: String, required: true, unique: true, index: true },
  job_family: String,
  domain_skills: [mongoose.Schema.Types.Mixed],
  technical_skills: [mongoose.Schema.Types.Mixed],
  ai_skills: [mongoose.Schema.Types.Mixed],
  foundational_skills: [mongoose.Schema.Types.Mixed],
  ai_exposure_pct: Number,
  ai_exposure_level: String,
  ai_exposure_detail: String,
  human_value_tasks: String,
  salary_range_low: Number,
  salary_range_high: Number,
  salary_progression: mongoose.Schema.Types.Mixed,
  english_requirement: String,
  remote_friendly: String,
  emerging_role_flag: Boolean,
  programme_levels: String,
  narrative_para1: String,
  narrative_para2: String,
  narrative_para3: String,
  updatedAt: { type: Date, default: Date.now }
}, { strict: false });
const CareerRoleModel = mongoose.models['CareerRole'] ||
  mongoose.model('CareerRole', careerRolesSchema, 'careerroles');
const CareerRolesModel = CareerRoleModel;

// ── CareerDirection (degree → direction mapping) ──────────────────────────────
const CareerDirectionSchema = new mongoose.Schema({
  degree: { type: String, required: true, index: true },
  programme_level: String,
  directions: [mongoose.Schema.Types.Mixed],
  updatedAt: { type: Date, default: Date.now }
}, { strict: false });
const CareerDirectionModel = mongoose.models['CareerDirection'] ||
  mongoose.model('CareerDirection', CareerDirectionSchema);

// ── RoleProfile (roles-profile-data collection) ───────────────────────────────
const RoleProfileSchema = new mongoose.Schema({
  jobFamily: String,
  roleId: String,
  roleTitle: String,
  aiExposurePct: Number,
  aiExposureLevel: String,
  humanValueTasks: String,
  salaryYear0_1: String,
  salaryYear2_3: String,
  salaryYear4_5: String,
  salaryYear6plus: String,
  englishRequirement: String,
  englishContext: String,
  whatRoleDoes: String,
  howAiChanging: String,
  whoShouldConsider: String,
  careerGrowthPath: String
}, { collection: 'roles-profile-data', timestamps: true });
RoleProfileSchema.index({ roleTitle: 'text', jobFamily: 'text' });
const RoleProfileModel = mongoose.models['RoleProfile'] ||
  mongoose.model('RoleProfile', RoleProfileSchema);

// ── RoleSkill (roleSkills collection) ─────────────────────────────────────────
const RoleSkillSchema = new mongoose.Schema({
  jobFamily: { type: String, required: true },
  jobCode: { type: String, required: true, index: true },
  roleTitle: { type: String, required: true, unique: true, index: true },
  skills: [{
    skillCategory: String,
    skillName: String,
    certificationName: String,
    platform: String,
    importance: String
  }],
  updatedAt: { type: Date, default: Date.now }
}, { strict: false });
const RoleSkillModel = mongoose.models['RoleSkill'] ||
  mongoose.model('RoleSkill', RoleSkillSchema, 'roleSkills');

// ── SkillProgress (per-user skill tracking) ───────────────────────────────────
const SkillProgressSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  skillName: { type: String, required: true },
  status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'Not Started' },
  updatedAt: { type: Date, default: Date.now }
}, { strict: false });
SkillProgressSchema.index({ email: 1, skillName: 1 }, { unique: true });
const SkillProgressModel = mongoose.models['SkillProgress'] ||
  mongoose.model('SkillProgress', SkillProgressSchema, 'skillProgress');

module.exports = {
  CareerAnalysisModel,
  CareerAgentDataModel,
  CareerRoleModel,
  CareerRolesModel,
  CareerDirectionModel,
  RoleProfileModel,
  RoleSkillModel,
  SkillProgressModel
};
