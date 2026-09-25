const crypto = require('crypto');
const seb = require('../../services/sebConfig');

const sample = () => seb.buildSebSettings({
  assessment: { assessmentCode: 'ASM00009' },
  startUrl: 'https://app.example.edu/secure/enter?lt=abc123&stage=SP',
  quitUrl: 'https://app.example.edu/secure/exit',
  allowedHosts: ['https://api.example.edu'],
  quitPassword: 'quit-me'
});

describe('services/sebConfig', () => {
  test('builds settings that point SEB at the app and lock it to our hosts', () => {
    const s = sample();
    expect(s.startURL).toBe('https://app.example.edu/secure/enter?lt=abc123&stage=SP');
    expect(s.quitURL).toBe('https://app.example.edu/secure/exit');
    expect(s.URLFilterEnable).toBe(true);
    const allow = s.URLFilterRules.filter((r) => r.action === 1).map((r) => r.expression);
    expect(allow).toEqual(expect.arrayContaining(['app.example.edu/*', 'api.example.edu/*']));
    expect(s.URLFilterRules[s.URLFilterRules.length - 1]).toEqual({ action: 0, active: true, expression: '*', regex: false });
    expect(s.allowedDisplaysMaxNumber).toBe(1);
    expect(s.browserMediaCaptureScreen).toBe(true);
    expect(s.sendBrowserExamKey).toBe(true);
    expect(s.hashedQuitPassword).toBe(crypto.createHash('sha256').update('quit-me').digest('hex').toUpperCase());
  });

  test('omits the quit password hash when none is set', () => {
    const s = seb.buildSebSettings({ assessment: {}, startUrl: 'https://a.b/c', quitUrl: 'https://a.b/exit' });
    expect(s.hashedQuitPassword).toBeUndefined();
  });

  test('config key is deterministic, ignores originatorVersion and key order', () => {
    const a = sample();
    const b = { ...sample(), originatorVersion: 'something else' };
    const reordered = Object.fromEntries(Object.entries(sample()).reverse());
    const key = seb.computeConfigKey(a);
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(seb.computeConfigKey(b)).toBe(key);
    expect(seb.computeConfigKey(reordered)).toBe(key);
    expect(seb.computeConfigKey({ ...a, startURL: 'https://other/' })).not.toBe(key);
  });

  test('config key JSON follows the SEB rules: compact, keys sorted case-insensitively, no originatorVersion', () => {
    const json = seb.configKeyJson({ b: 1, A: true, c: { z: [], y: 'x' }, originatorVersion: 'v' });
    expect(json).toBe('{"A":true,"b":1,"c":{"y":"x","z":[]}}');
  });

  test('request hash is sha256(url + configKey)', () => {
    const key = seb.computeConfigKey(sample());
    const url = 'https://api.example.edu/api/results/assessment/1/start';
    expect(seb.expectedRequestHash(url, key))
      .toBe(crypto.createHash('sha256').update(url + key).digest('hex'));
  });

  test('.seb file is gzip(plnd + gzip(plist)) and round-trips', () => {
    const s = sample();
    const file = seb.serializeSebFile(s);
    expect(file[0]).toBe(0x1f); // gzip magic
    expect(file[1]).toBe(0x8b);
    const xml = seb.parseSebFile(file);
    expect(xml).toContain('<plist version="1.0">');
    expect(xml).toContain('<key>startURL</key>');
    expect(xml).toContain('<string>https://app.example.edu/secure/enter?lt=abc123&amp;stage=SP</string>');
    expect(xml).toContain('<key>hashedQuitPassword</key>');
    expect(xml).not.toContain('quit-me');
  });

  test('plist escapes XML and serialises every value type', () => {
    const xml = seb.toPlistXml({ s: 'a<b>&"c"', n: 2, r: 1.5, t: true, f: false, arr: [1, 'x'], d: {}, e: [] });
    expect(xml).toContain('<string>a&lt;b&gt;&amp;&quot;c&quot;</string>');
    expect(xml).toContain('<integer>2</integer>');
    expect(xml).toContain('<real>1.5</real>');
    expect(xml).toContain('<true/>');
    expect(xml).toContain('<false/>');
    expect(xml).toContain('<dict/>');
    expect(xml).toContain('<array/>');
  });

  test('sebs:// link derives from the https download URL', () => {
    expect(seb.toSebsUrl('https://api.example.edu/api/assessments/1/seb-config?lt=x')).toBe('sebs://api.example.edu/api/assessments/1/seb-config?lt=x');
    expect(seb.toSebsUrl('http://localhost:5000/x')).toBe('seb://localhost:5000/x');
  });

  test('absoluteRequestUrl drops the fragment and uses proxy-aware protocol/host', () => {
    const req = { protocol: 'https', get: () => 'app.example.edu', originalUrl: '/api/x?y=1#frag' };
    expect(seb.absoluteRequestUrl(req)).toBe('https://app.example.edu/api/x?y=1');
  });

  test('publicAppOrigin prefers SECURE_PUBLIC_URL, then FRONTEND_URL, then the request', () => {
    const prev = { a: process.env.SECURE_PUBLIC_URL, b: process.env.FRONTEND_URL, c: process.env.APP_URL };
    process.env.SECURE_PUBLIC_URL = 'https://one.example/';
    process.env.FRONTEND_URL = 'https://two.example';
    expect(seb.publicAppOrigin()).toBe('https://one.example');
    delete process.env.SECURE_PUBLIC_URL;
    expect(seb.publicAppOrigin()).toBe('https://two.example');
    delete process.env.FRONTEND_URL;
    delete process.env.APP_URL;
    expect(seb.publicAppOrigin({ protocol: 'http', get: () => 'h:1' })).toBe('http://h:1');
    if (prev.a) process.env.SECURE_PUBLIC_URL = prev.a;
    if (prev.b) process.env.FRONTEND_URL = prev.b;
    if (prev.c) process.env.APP_URL = prev.c;
  });
});
