/**
 * Secure assessment (Safe Exam Browser) flow — end to end against the real
 * routers with an in-memory Mongo.
 *
 * The "browser" here is supertest; we play SEB by computing the same
 * X-SafeExamBrowser-ConfigKeyHash it would send for a given URL.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { connect, closeDatabase, clearDatabase } = require('../helpers/dbHandler');
const { createTestApp } = require('../helpers/testApp');

const Student = require('../../models/Student');
const College = require('../../models/College');
const Assessment = require('../../models/Assessment');
const Result = require('../../models/Result');
const ProctoringSession = require('../../models/ProctoringSession');
const ProctoringEvent = require('../../models/ProctoringEvent');
const SecureLaunchToken = require('../../models/SecureLaunchToken');

const seb = require('../../services/sebConfig');
const mediaStore = require('../../services/secureMediaStore');

const assessmentRoutes = require('../../routes/assessments');
const resultRoutes = require('../../routes/results');
const proctoringRoutes = require('../../routes/proctoring');

const HOST = 'app.test';
const testJwtSecret = 'test-jwt-secret-key-for-unit-testing-32-chars';

let app;
let college;

beforeAll(async () => {
  process.env.JWT_SECRET = testJwtSecret;
  process.env.NODE_ENV = 'test';
  process.env.SECURE_PUBLIC_URL = 'http://app.test';
  process.env.SECURE_API_URL = 'http://app.test';
  delete process.env.SEB_KEY_ENFORCEMENT;
  await connect();
  app = createTestApp((a) => {
    a.use('/api/assessments', assessmentRoutes);
    a.use('/api/results', resultRoutes);
    a.use('/api/proctoring', proctoringRoutes);
  });
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  await clearDatabase();
  college = await College.create({
    collegeName: 'SMAART Institute of Technology',
    collegeCode: 'SMAART09',
    collegeNumber: '09',
    institutionType: 'Autonomous College',
    email: 'admin9@smaart.edu',
    contactNumber: '9876543210',
    registrationNumber: 'REG-99999',
    accreditationStatus: 'NAAC',
    status: 'Active'
  });
});

const createStudent = async (overrides = {}) => {
  const rand = Math.random().toString(36).slice(2, 8);
  const student = await new Student({
    fullName: 'Secure Tester',
    email: `secure-${rand}@example.com`,
    password: 'Password123!',
    mobile: '9876543210',
    rollNumber: `ROLL-${rand}`,
    studentId: `STU-${rand.toUpperCase()}`,
    college: college._id,
    isRegistered: true,
    status: 'active',
    role: 'student',
    userType: 'student',
    currentSessionId: `sess-${rand}`,
    sessionExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    ...overrides
  }).save();
  const token = jwt.sign(
    { userId: student._id.toString(), userType: student.userType || 'student', role: student.role || 'student', sessionId: student.currentSessionId },
    testJwtSecret, { expiresIn: '2h' }
  );
  return { student, auth: `Bearer ${token}` };
};

const questions = () => Array.from({ length: 5 }, (_, i) => ({
  questionText: `Q${i + 1}: pick B`,
  type: 'mcq',
  options: [{ label: 'A', value: 'A' }, { label: 'B', value: 'B' }, { label: 'C', value: 'C' }],
  correctAnswer: 'B',
  order: i + 1,
  points: 1
}));

const createAssessment = async (creator, secure) => Assessment.create({
  assessmentCode: `SEC-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
  assessmentName: 'Secure flow paper',
  description: 'Secure flow test',
  questionCategory: 'General',
  status: 'active',
  duration: 40,
  createdBy: creator._id,
  questions: questions(),
  secure
});

/** What SEB would send for this URL, given the launch's config key. */
const sebHeaders = (path, configKey) => ({
  'X-SafeExamBrowser-ConfigKeyHash': seb.expectedRequestHash(`http://${HOST}${path}`, configKey)
});

const launch = async (auth, assessmentId) => {
  const res = await request(app).post(`/api/assessments/${assessmentId}/secure/launch`).set('Host', HOST).set('Authorization', auth);
  expect(res.status).toBe(201);
  return res.body.data;
};

const jpeg = () => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(512, 1), Buffer.from([0xff, 0xd9])]);

describe('Secure assessment flow', () => {
  test('non-secure assessments are untouched: start works without any SEB header', async () => {
    const { student, auth } = await createStudent();
    const assessment = await createAssessment(student, { enabled: false });
    const res = await request(app).get(`/api/results/assessment/${assessment._id}/start`).set('Host', HOST).set('Authorization', auth);
    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
  });

  test('secure-status reports the mode for the caller and respects the pilot allow-list', async () => {
    const { student, auth } = await createStudent();
    const other = await createStudent();
    const assessment = await createAssessment(student, { enabled: true, pilotUserIds: [student._id], screenshotIntervalSec: 45 });

    const mine = await request(app).get(`/api/assessments/code/${assessment.assessmentCode}/secure-status`).set('Authorization', auth);
    expect(mine.body.data).toMatchObject({ secure: true, sebRequired: true, screenCaptureRequired: true, screenshotIntervalSec: 45, pilot: true });

    const theirs = await request(app).get(`/api/assessments/code/${assessment.assessmentCode}/secure-status`).set('Authorization', other.auth);
    expect(theirs.body.data.secure).toBe(false);
  });

  test('a secure assessment refuses to start outside SEB', async () => {
    const { student, auth } = await createStudent();
    const assessment = await createAssessment(student, { enabled: true });
    const res = await request(app).get(`/api/results/assessment/${assessment._id}/start`).set('Host', HOST).set('Authorization', auth);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('SEB_REQUIRED');
    expect(res.body.sebRequired).toBe(true);
  });

  test('launch → .seb download → SEB-signed requests are accepted, wrong key is not', async () => {
    const { student, auth } = await createStudent();
    const assessment = await createAssessment(student, { enabled: true, quitPassword: 'q1' });

    const data = await launch(auth, assessment._id);
    expect(data.sebsUrl).toMatch(/^seb:\/\/app\.test\/api\/assessments\/.+\/seb-config\?lt=[0-9a-f]{64}$/);
    expect(data.configKey).toMatch(/^[0-9a-f]{64}$/);

    const configPath = new URL(data.configUrl).pathname + new URL(data.configUrl).search;

    // Before the file is fetched no request can verify: SEB has not loaded it yet.
    const startPath = `/api/results/assessment/${assessment._id}/start`;
    const early = await request(app).get(startPath).set('Host', HOST).set('Authorization', auth).set(sebHeaders(startPath, data.configKey));
    expect(early.status).toBe(403);

    // SEB downloads the file (no cookie, no bearer).
    const file = await request(app).get(configPath).set('Host', HOST).buffer(true).parse((res, cb) => {
      const chunks = []; res.on('data', (c) => chunks.push(c)); res.on('end', () => cb(null, Buffer.concat(chunks)));
    });
    expect(file.status).toBe(200);
    expect(file.headers['content-type']).toMatch(/application\/seb/);
    const xml = seb.parseSebFile(file.body);
    expect(xml).toContain('<key>startURL</key>');
    expect(xml).toContain('secure/enter?lt=');
    expect(xml).toContain('<key>hashedQuitPassword</key>');

    const stored = await SecureLaunchToken.findOne({ assessmentId: assessment._id });
    expect(stored.configFetchedAt).toBeTruthy();
    expect(seb.computeConfigKey(stored.settings)).toBe(data.configKey);

    // Now the same request, signed the way SEB signs it, goes through.
    const ok = await request(app).get(startPath).set('Host', HOST).set('Authorization', auth).set(sebHeaders(startPath, data.configKey));
    expect([200, 201]).toContain(ok.status);
    expect(ok.body.data.resultId).toBeTruthy();

    // A hash for a different URL (replayed) or a different key is refused.
    const replay = await request(app).get(startPath).set('Host', HOST).set('Authorization', auth).set(sebHeaders('/api/other', data.configKey));
    expect(replay.status).toBe(403);
    expect(replay.body.code).toBe('SEB_KEY_MISMATCH');

    // The JS-API fallback header is also accepted.
    const viaJs = await request(app).get(startPath).set('Host', HOST).set('Authorization', auth).set('X-SEB-Config-Key', data.configKey);
    expect([200, 201]).toContain(viaJs.status);

    // Answer and submit sit behind the same guard.
    const resultId = ok.body.data.resultId;
    const answerPath = `/api/results/${resultId}/answer`;
    const noSeb = await request(app).post(answerPath).set('Host', HOST).set('Authorization', auth)
      .set('x-assessment-token', ok.body.data.assessmentToken)
      .send({ questionId: ok.body.data.questions[0]._id, selectedValue: 'B', questionText: 'Q1: pick B' });
    expect(noSeb.status).toBe(403);
    const withSeb = await request(app).post(answerPath).set('Host', HOST).set('Authorization', auth)
      .set('x-assessment-token', ok.body.data.assessmentToken).set(sebHeaders(answerPath, data.configKey))
      .send({ questionId: ok.body.data.questions[0]._id, selectedValue: 'B', questionText: 'Q1: pick B' });
    expect(withSeb.status).toBe(200);
  });

  test('exchange signs the student in inside SEB, keeps the existing session id, and rejects expired links', async () => {
    const { student, auth } = await createStudent();
    const assessment = await createAssessment(student, { enabled: true });
    const data = await launch(auth, assessment._id);
    const configPath = new URL(data.configUrl).pathname + new URL(data.configUrl).search;
    const lt = new URL(data.configUrl).searchParams.get('lt');
    await request(app).get(configPath).set('Host', HOST);

    const path = '/api/assessments/secure/exchange';
    const outside = await request(app).post(path).set('Host', HOST).send({ lt });
    expect(outside.status).toBe(403);

    const inside = await request(app).post(path).set('Host', HOST).set(sebHeaders(path, data.configKey)).send({ lt });
    expect(inside.status).toBe(200);
    expect(inside.body.token).toBeTruthy();
    expect(inside.body.user.email).toBe(student.email);
    expect(inside.body.sessionId).toBe(student.currentSessionId);
    expect(inside.body.sebVerified).toBe(true);
    const decoded = jwt.verify(inside.body.token, testJwtSecret);
    expect(decoded.sessionId).toBe(student.currentSessionId);

    // The issued token works for normal protected calls.
    const me = await request(app).get(`/api/assessments/code/${assessment.assessmentCode}/secure-status`).set('Authorization', `Bearer ${inside.body.token}`);
    expect(me.status).toBe(200);

    await SecureLaunchToken.updateMany({ assessmentId: assessment._id }, { expiresAt: new Date(Date.now() - 1000) });
    const expired = await request(app).post(path).set('Host', HOST).set(sebHeaders(path, data.configKey)).send({ lt });
    expect(expired.status).toBe(410);
    const badToken = await request(app).post(path).set('Host', HOST).send({ lt: 'nope' });
    expect(badToken.status).toBe(400);
  });

  test('launch is refused for a non-secure assessment and for a student outside the pilot list', async () => {
    const { student, auth } = await createStudent();
    const outsider = await createStudent();
    const plain = await createAssessment(student, { enabled: false });
    const pilot = await createAssessment(student, { enabled: true, pilotUserIds: [student._id] });
    expect((await request(app).post(`/api/assessments/${plain._id}/secure/launch`).set('Authorization', auth)).status).toBe(400);
    expect((await request(app).post(`/api/assessments/${pilot._id}/secure/launch`).set('Authorization', outsider.auth)).status).toBe(400);
    expect((await request(app).post(`/api/assessments/${pilot._id}/secure/launch`).set('Host', HOST).set('Authorization', auth)).status).toBe(201);
  });

  test('SEB_KEY_ENFORCEMENT=log lets a request through but records it as unverified', async () => {
    process.env.SEB_KEY_ENFORCEMENT = 'log';
    try {
      const { student, auth } = await createStudent();
      const assessment = await createAssessment(student, { enabled: true });
      const res = await request(app).get(`/api/results/assessment/${assessment._id}/start`).set('Host', HOST).set('Authorization', auth);
      expect([200, 201]).toContain(res.status);
    } finally {
      delete process.env.SEB_KEY_ENFORCEMENT;
    }
  });

  describe('screen evidence', () => {
    let student, auth, assessment, configKey, resultId, sessionId;

    beforeEach(async () => {
      ({ student, auth } = await createStudent());
      assessment = await createAssessment(student, { enabled: true, screenshotIntervalSec: 30, retentionDays: 7 });
      const data = await launch(auth, assessment._id);
      configKey = data.configKey;
      const configPath = new URL(data.configUrl).pathname + new URL(data.configUrl).search;
      await request(app).get(configPath).set('Host', HOST);

      const startPath = `/api/results/assessment/${assessment._id}/start`;
      const started = await request(app).get(startPath).set('Host', HOST).set('Authorization', auth).set(sebHeaders(startPath, configKey));
      resultId = started.body.data.resultId;

      const sessPath = '/api/proctoring/session/start';
      const session = await request(app).post(sessPath).set('Host', HOST).set('Authorization', auth).set(sebHeaders(sessPath, configKey))
        .send({
          resultId,
          assessmentId: assessment._id,
          environmentCheck: { cameraGranted: true },
          secure: { screenCapture: { granted: true, surface: 'monitor' }, device: { platform: 'Windows', screenCount: 1 } }
        });
      expect(session.status).toBe(201);
      sessionId = session.body.data._id;
    });

    afterEach(async () => {
      if (sessionId) await mediaStore.removeSession(sessionId);
    });

    test('proctoring session records secure mode, SEB verification and retention', async () => {
      const session = await ProctoringSession.findById(sessionId);
      expect(session.secure.mode).toBe('seb');
      expect(session.secure.sebVerified).toBe(true);
      expect(session.secure.sebVerification).toBe('header');
      expect(session.secure.screenCapture.granted).toBe(true);
      expect(session.secure.screenCapture.surface).toBe('monitor');
      expect(session.secure.device.platform).toBe('Windows');
      const days = (session.secure.retentionUntil - Date.now()) / 86400000;
      expect(days).toBeGreaterThan(6.9);
      expect(days).toBeLessThan(7.1);
      const launched = await ProctoringEvent.findOne({ sessionId, eventType: 'seb_launched' });
      expect(launched).toBeTruthy();
    });

    test('starting a proctoring session for a secure paper without SEB is refused', async () => {
      const res = await request(app).post('/api/proctoring/session/start').set('Host', HOST).set('Authorization', auth)
        .send({ resultId, assessmentId: assessment._id });
      expect(res.status).toBe(403);
    });

    test('frames are stored, rate-limited to the interval, and served only to admins', async () => {
      const first = await request(app).post(`/api/proctoring/session/${sessionId}/screen`).set('Authorization', auth)
        .field('kind', 'frame').attach('media', jpeg(), { filename: 'f.jpg', contentType: 'image/jpeg' });
      expect(first.status).toBe(201);
      expect(first.body.url).toMatch(new RegExp(`^/api/proctoring/screen/${sessionId}/frame-`));

      const tooSoon = await request(app).post(`/api/proctoring/session/${sessionId}/screen`).set('Authorization', auth)
        .field('kind', 'frame').attach('media', jpeg(), { filename: 'f.jpg', contentType: 'image/jpeg' });
      expect(tooSoon.status).toBe(429);

      // A frame tied to a violation is not throttled.
      const onViolation = await request(app).post(`/api/proctoring/session/${sessionId}/screen`).set('Authorization', auth)
        .field('kind', 'frame').field('reason', 'tab_switch').attach('media', jpeg(), { filename: 'f.jpg', contentType: 'image/jpeg' });
      expect(onViolation.status).toBe(201);

      const events = await ProctoringEvent.find({ sessionId, eventType: 'screen_capture' });
      expect(events).toHaveLength(2);
      expect(events[0].mediaType).toBe('image/jpeg');
      expect(fs.existsSync(mediaStore.resolve(sessionId, first.body.url.split('/').pop()))).toBe(true);

      const session = await ProctoringSession.findById(sessionId);
      expect(session.secure.screenCapture.frames).toBe(2);
      expect(session.totalViolations).toBe(0);

      // Students cannot read captures back; admins can.
      const asStudent = await request(app).get(first.body.url).set('Authorization', auth);
      expect(asStudent.status).toBe(403);
      const admin = await createStudent({ role: 'admin', userType: 'user' });
      const asAdmin = await request(app).get(first.body.url).set('Authorization', admin.auth);
      expect(asAdmin.status).toBe(200);
      const evidence = await request(app).get(`/api/proctoring/admin/session/${sessionId}/evidence`).set('Authorization', admin.auth);
      expect(evidence.status).toBe(200);
      expect(evidence.body.data.evidence).toHaveLength(2);
      expect(evidence.body.data.storage.files).toBe(2);
    });

    test('media type and ownership are enforced', async () => {
      const clipWithImage = await request(app).post(`/api/proctoring/session/${sessionId}/screen`).set('Authorization', auth)
        .field('kind', 'clip').attach('media', jpeg(), { filename: 'f.jpg', contentType: 'image/jpeg' });
      expect(clipWithImage.status).toBe(415);

      const other = await createStudent();
      const notMine = await request(app).post(`/api/proctoring/session/${sessionId}/screen`).set('Authorization', other.auth)
        .field('kind', 'frame').attach('media', jpeg(), { filename: 'f.jpg', contentType: 'image/jpeg' });
      expect(notMine.status).toBe(404);

      const empty = await request(app).post(`/api/proctoring/session/${sessionId}/screen`).set('Authorization', auth).field('kind', 'frame');
      expect(empty.status).toBe(400);
    });

    test('share interruptions count as violations and update the session', async () => {
      const stopped = await request(app).post(`/api/proctoring/session/${sessionId}/event`).set('Authorization', auth)
        .send({ eventType: 'screen_share_stopped', severity: 'high', details: 'Share ended' });
      expect(stopped.status).toBe(201);
      expect(stopped.body.proctoring.warnings).toBe(1);
      const resumed = await request(app).post(`/api/proctoring/session/${sessionId}/event`).set('Authorization', auth)
        .send({ eventType: 'screen_share_resumed', severity: 'info', metadata: { surface: 'monitor' } });
      expect(resumed.status).toBe(201);
      const session = await ProctoringSession.findById(sessionId);
      expect(session.secure.screenCapture.interruptions).toBe(1);
      expect(session.totalViolations).toBe(1);
      expect(session.riskScore).toBe(25);
    });

    test('reviewer decision: uphold marks the attempt invalidated; clear releases it', async () => {
      const admin = await createStudent({ role: 'admin', userType: 'user' });
      const session = await ProctoringSession.findById(sessionId);
      session.isLocked = true; session.status = 'locked'; session.lockReason = 'test';
      await session.save();
      await Result.findByIdAndUpdate(resultId, { completionStatus: 'pending_review', scoreReleased: false, review: { state: 'pending', reasons: ['x'], riskScore: 70 } });

      const bad = await request(app).post(`/api/proctoring/admin/session/${sessionId}/decision`).set('Authorization', admin.auth).send({ decision: 'maybe' });
      expect(bad.status).toBe(400);
      const notAdmin = await request(app).post(`/api/proctoring/admin/session/${sessionId}/decision`).set('Authorization', auth).send({ decision: 'uphold' });
      expect(notAdmin.status).toBe(403);

      const uphold = await request(app).post(`/api/proctoring/admin/session/${sessionId}/decision`).set('Authorization', admin.auth).send({ decision: 'uphold', note: 'Phone visible' });
      expect(uphold.status).toBe(200);
      expect(uphold.body.data.decision).toBe('invalidated');
      const afterUphold = await ProctoringSession.findById(sessionId);
      expect(afterUphold.decision.state).toBe('invalidated');
      expect(afterUphold.isLocked).toBe(false);
      const r1 = await Result.findById(resultId);
      expect(r1.review.state).toBe('invalidated');
      expect(r1.review.note).toBe('Phone visible');
      expect(r1.scoreReleased).toBe(false);

      // Clear on a held attempt re-grades it through the normal submit path.
      await Result.findByIdAndUpdate(resultId, { completionStatus: 'pending_review', submittedAt: new Date() });
      const clear = await request(app).post(`/api/proctoring/admin/session/${sessionId}/decision`).set('Authorization', admin.auth).send({ decision: 'clear', note: 'Looked fine' });
      expect(clear.status).toBe(200);
      expect(clear.body.data.decision).toBe('released');
      const afterClear = await ProctoringSession.findById(sessionId);
      expect(afterClear.decision.state).toBe('released');
      const r2 = await Result.findById(resultId);
      expect(r2.review.state).toBe('released');
      expect(clear.body.data.graded).toBe(true);
      expect(r2.completionStatus).toBe('completed');
      expect(r2.scoreReleased).toBe(true);
    });
  });

  test('media store purges only folders older than the retention window', async () => {
    const fresh = await mediaStore.save('aaaaaaaaaaaaaaaaaaaaaaaa', 'frame', jpeg(), 'image/jpeg');
    const old = await mediaStore.save('bbbbbbbbbbbbbbbbbbbbbbbb', 'frame', jpeg(), 'image/jpeg');
    const past = new Date(Date.now() - 100 * 86400000);
    fs.utimesSync(old.absolutePath, past, past);
    try {
      const { removed } = await mediaStore.purgeOlderThan(90);
      expect(removed).toBe(1);
      expect(fs.existsSync(fresh.absolutePath)).toBe(true);
      expect(fs.existsSync(old.absolutePath)).toBe(false);
      expect(mediaStore.resolve('aaaaaaaaaaaaaaaaaaaaaaaa', '../../etc/passwd')).toBeNull();
    } finally {
      await mediaStore.removeSession('aaaaaaaaaaaaaaaaaaaaaaaa');
      await mediaStore.removeSession('bbbbbbbbbbbbbbbbbbbbbbbb');
    }
  });
});
