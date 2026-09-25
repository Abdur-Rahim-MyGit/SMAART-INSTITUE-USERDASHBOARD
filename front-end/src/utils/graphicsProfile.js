/**
 * Graphics profile: is this browser drawing with real hardware?
 *
 * Inside Safe Exam Browser (a kiosk on its own Windows desktop) and on some
 * remote or virtual machines, Chromium falls back to software rendering.
 * There, every full-screen backdrop blur, animated 120px blur and canvas
 * background is rasterised on the CPU and competes with the face models,
 * which is what makes the exam feel laggy.
 *
 * `lite` switches those decorations off and moves MediaPipe to its CPU
 * delegate. It is on whenever we run inside SEB (the safe assumption) or the
 * WebGL renderer names a software rasteriser.
 */
import { isSebBrowser } from '@/utils/secureBrowser';

const SOFTWARE_RENDERERS = ['swiftshader', 'llvmpipe', 'software', 'basic render', 'microsoft basic', 'vmware', 'virtualbox', 'parallels'];

let cached = null;

export const getGraphicsProfile = () => {
  if (cached) return cached;
  const profile = {
    insideSeb: false,
    renderer: '',
    software: false,
    cores: 0,
    crossOriginIsolated: false,
    lite: false
  };
  try {
    profile.insideSeb = isSebBrowser();
    profile.cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 0;
    profile.crossOriginIsolated = typeof window !== 'undefined' && !!window.crossOriginIsolated;
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const info = gl.getExtension('WEBGL_debug_renderer_info');
        profile.renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || '') : String(gl.getParameter(gl.RENDERER) || '');
        const lower = profile.renderer.toLowerCase();
        profile.software = SOFTWARE_RENDERERS.some((name) => lower.includes(name));
        const lose = gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
      } else {
        profile.software = true;
      }
    }
  } catch {
    /* probing must never break the page */
  }
  profile.lite = profile.insideSeb || profile.software;
  cached = profile;
  return profile;
};

/** Apply the profile to the document so CSS can react (`html.gfx-lite`). */
export const applyGraphicsProfile = () => {
  const profile = getGraphicsProfile();
  if (typeof document === 'undefined') return profile;
  document.documentElement.classList.toggle('gfx-lite', profile.lite);
  // Readable from the console (or a test) when someone reports lag.
  try { window.__smaartGraphics = profile; } catch { /* ignore */ }
  if (profile.lite) {
    console.info(`[Graphics] lite mode on (seb=${profile.insideSeb}, software=${profile.software}, renderer="${profile.renderer}", cores=${profile.cores}, isolated=${profile.crossOriginIsolated})`);
  }
  return profile;
};

export const isLiteGraphics = () => getGraphicsProfile().lite;

export default getGraphicsProfile;
