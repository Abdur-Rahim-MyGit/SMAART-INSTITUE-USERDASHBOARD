import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  IconArrowLeft as ArrowLeft,
  Info,
  LifeBuoy,
  Loader2,
  Lock,
  Mic,
  Monitor,
  RiAlertLine as AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Smartphone,
} from "@/components/icons";
import NeuralBackground from "@/components/ui/NeuralBackground";
import PageTransition from "@/components/PageTransition";
import { assessmentApi } from "@/services/assessmentApi";
import { secureAssessmentApi } from "@/services/secureAssessmentApi";
import {
  detectPlatform,
  isSebBrowser,
  SEB_DOWNLOADS,
  SECURE_STAGE_CODES,
  STAGE_TITLES,
} from "@/utils/secureBrowser";

const SURFACE = "bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5]/80 dark:border-[#045C9A]/20 shadow-sm";
const PANEL = "bg-[#F1F5F9] dark:bg-[#072036]/60 border border-[#d7ebf5] dark:border-white/10";
const BTN_PRIMARY = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#072036] px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-[#072036]/20 transition-colors hover:bg-[#0d3a5f] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#A6D7E8] dark:text-[#072036] dark:shadow-none dark:hover:bg-white";
const BTN_GHOST = "inline-flex items-center justify-center gap-2 rounded-xl border border-[#d7ebf5] bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#0d3a5f] dark:text-slate-100 dark:hover:bg-[#0d3a5f]/70";
const LABEL = "text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#35566b] dark:text-[#A6D7E8]";
const EASE = [0.25, 0.1, 0.25, 1];

const LAUNCH_WAIT_MS = 10000;

const StepNumber = ({ n, done }) => (
  <div
    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-extrabold ${
      done
        ? "border-[#045C9A] bg-[#045C9A] text-white"
        : "border-[#d7ebf5] bg-white text-[#045C9A] dark:border-white/10 dark:bg-[#072036] dark:text-[#A6D7E8]"
    }`}
  >
    {done ? <CheckCircle2 className="h-5 w-5" /> : n}
  </div>
);

const Row = ({ icon: Icon, title, text }) => (
  <div className={`flex items-start gap-3 rounded-xl p-3.5 ${PANEL}`}>
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#A6D7E8]/10 dark:text-[#A6D7E8]">
      <Icon className="h-[18px] w-[18px]" />
    </div>
    <div className="min-w-0">
      <p className="text-[13px] font-bold text-[#072036] dark:text-white">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{text}</p>
    </div>
  </div>
);

const SecureLaunch = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { stage: urlStage } = useParams();
  const stageKey = String(urlStage || "T2").toUpperCase();
  const code = SECURE_STAGE_CODES[stageKey];
  const title = t(`baseline_test.stage_titles.${stageKey}`, STAGE_TITLES[stageKey] || stageKey);

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const read = () => setIsDark(document.documentElement.classList.contains("dark"));
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const platform = useMemo(() => detectPlatform(), []);
  const insideSeb = useMemo(() => isSebBrowser(), []);

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState(null);
  const [status, setStatus] = useState(null);
  const [launch, setLaunch] = useState(null);
  const [launching, setLaunching] = useState(false);
  const [launchedAt, setLaunchedAt] = useState(null);
  const [waitedLong, setWaitedLong] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!code) {
        setError(t("secure_assessment.unknown_stage", "This assessment stage does not exist."));
        setLoading(false);
        return;
      }
      try {
        const [assRes, statusRes] = await Promise.all([
          assessmentApi.getByCode(code).catch(() => null),
          secureAssessmentApi.status(code).catch(() => null),
        ]);
        if (cancelled) return;
        const data = statusRes?.data || null;
        setAssessment(assRes?.data || null);
        setStatus(data);
        if (!data?.secure) {
          // Not a secure paper for this student: take the normal path.
          navigate(`/assessment/${stageKey}`, { replace: true });
          return;
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || t("secure_assessment.load_failed", "Could not load this assessment."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [code, navigate, stageKey, t]);

  useEffect(() => {
    if (!launchedAt) return undefined;
    setWaitedLong(false);
    const id = setTimeout(() => setWaitedLong(true), LAUNCH_WAIT_MS);
    return () => clearTimeout(id);
  }, [launchedAt]);

  const startLaunch = useCallback(async () => {
    if (!assessment?._id || launching) return;
    setLaunching(true);
    try {
      const res = await secureAssessmentApi.launch(assessment._id, platform.key);
      if (!res?.success || !res.data?.sebsUrl) throw new Error(res?.error || "Launch failed");
      setLaunch(res.data);
      setLaunchedAt(Date.now());
      // Hands the link to the OS; Safe Exam Browser registers the sebs:// scheme.
      window.location.href = res.data.sebsUrl;
    } catch (err) {
      toast.error(err?.data?.error || err?.message || t("secure_assessment.launch_failed", "Could not prepare the Safe Exam Browser launch."));
    } finally {
      setLaunching(false);
    }
  }, [assessment, launching, platform.key, t]);

  const expiresLabel = useMemo(() => {
    if (!launch?.expiresAt) return "";
    try {
      return new Date(launch.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }, [launch]);

  const totalQuestions = assessment?.questions?.length || status?.totalQuestions || 34;
  const intervalSec = status?.screenshotIntervalSec || 30;
  const retentionDays = status?.retentionDays || 90;

  return (
    <PageTransition>
      <div className="relative min-h-screen overflow-hidden bg-transparent pb-8 transition-colors duration-300">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-25">
          <NeuralBackground theme={isDark ? "dark" : "light"} />
        </div>
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#045C9A]/5 via-blue-500/5 to-transparent blur-[120px] dark:from-blue-900/10" />
          <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent blur-[120px] dark:from-indigo-900/10" />
        </div>

        <main className="relative z-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 pb-10 sm:gap-6 sm:p-5 lg:p-6">
            <button
              type="button"
              onClick={() => navigate("/dashboard/assessment-centre")}
              className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#045C9A] dark:text-slate-400 dark:hover:text-[#A6D7E8] lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("assessments_dashboard.back", "Assessment Centre")}
            </button>

            {/* Hero */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 ${SURFACE}`}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className={LABEL}>{t("secure_assessment.eyebrow", "Secure assessment")}</p>
                  <h1 className="mt-1.5 text-xl font-extrabold text-[#072036] dark:text-white sm:text-2xl">
                    {title}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {t(
                      "secure_assessment.hero_subtitle",
                      "This test runs inside Safe Exam Browser, a free locked-down browser. Your camera, microphone and entire screen stay shared until you submit."
                    )}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 ${PANEL}`}>
                      <ShieldCheck className="h-3.5 w-3.5 text-[#045C9A] dark:text-[#A6D7E8]" />
                      {t("secure_assessment.chip_seb", "Safe Exam Browser")}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 ${PANEL}`}>
                      <Clock className="h-3.5 w-3.5 text-[#045C9A] dark:text-[#A6D7E8]" />
                      {t("secure_assessment.chip_duration", "{{minutes}} min", { minutes: 40 })}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 ${PANEL}`}>
                      <Monitor className="h-3.5 w-3.5 text-[#045C9A] dark:text-[#A6D7E8]" />
                      {t("secure_assessment.chip_questions", "{{count}} questions", { count: totalQuestions })}
                    </span>
                  </div>
                </div>

                <div
                  id="secure-device"
                  data-supported={platform.supported ? "true" : "false"}
                  className={`flex shrink-0 items-center gap-3 rounded-xl p-3.5 ${PANEL} lg:min-w-[260px]`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      platform.supported
                        ? "bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#A6D7E8]/10 dark:text-[#A6D7E8]"
                        : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
                    }`}
                  >
                    {platform.supported ? <Monitor className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className={LABEL}>{t("secure_assessment.device_label", "Your device")}</p>
                    <p className="text-sm font-bold text-[#072036] dark:text-white">{platform.label}</p>
                    <p className={`text-xs font-semibold ${platform.supported ? "text-[#045C9A] dark:text-[#A6D7E8]" : "text-rose-600 dark:text-rose-300"}`}>
                      {platform.supported
                        ? t("secure_assessment.device_ok", "Can run Safe Exam Browser")
                        : t("secure_assessment.device_bad", "Cannot run Safe Exam Browser")}
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>

            {loading ? (
              <div className={`flex items-center justify-center gap-3 rounded-2xl p-10 ${SURFACE}`}>
                <Loader2 className="h-5 w-5 animate-spin text-[#045C9A] dark:text-[#A6D7E8]" />
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t("common.loading", "Loading...")}</span>
              </div>
            ) : error ? (
              <div className={`rounded-2xl p-6 ${SURFACE}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                  <div>
                    <p className="text-sm font-bold text-[#072036] dark:text-white">{error}</p>
                    <button type="button" onClick={() => navigate("/dashboard/assessment-centre")} className={`mt-4 ${BTN_GHOST}`}>
                      {t("assessments_dashboard.back", "Assessment Centre")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                {/* Steps */}
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: EASE, delay: 0.05 }}
                  className="flex flex-col gap-4"
                >
                  {insideSeb && (
                    <div className={`rounded-2xl p-5 ${SURFACE}`}>
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#045C9A] dark:text-[#A6D7E8]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[#072036] dark:text-white">
                            {t("secure_assessment.inside_seb_title", "You are already inside Safe Exam Browser")}
                          </p>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                            {t("secure_assessment.inside_seb_text", "Continue straight to the setup checks.")}
                          </p>
                          <button type="button" id="secure-continue" onClick={() => navigate(`/assessment/${stageKey}`)} className={`mt-3 ${BTN_PRIMARY}`}>
                            {t("secure_assessment.continue", "Continue")} <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1 · Install */}
                  <div className={`rounded-2xl p-5 sm:p-6 ${SURFACE}`}>
                    <div className="flex items-start gap-4">
                      <StepNumber n={1} />
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-extrabold text-[#072036] dark:text-white">
                          {t("secure_assessment.step1_title", "Install Safe Exam Browser (one time)")}
                        </h2>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          {t(
                            "secure_assessment.step1_text",
                            "Safe Exam Browser is free, open source and published by ETH Zurich. Install version 3 or newer, then come back to this page."
                          )}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <a id="seb-download-windows" href={SEB_DOWNLOADS.windows} target="_blank" rel="noreferrer" className={BTN_GHOST}>
                            <Download className="h-4 w-4" /> {t("secure_assessment.download_windows", "Download for Windows")}
                            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                          </a>
                          <a id="seb-download-mac" href={SEB_DOWNLOADS.mac} target="_blank" rel="noreferrer" className={BTN_GHOST}>
                            <Download className="h-4 w-4" /> {t("secure_assessment.download_mac", "Download for macOS")}
                            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                          </a>
                        </div>
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                          {t("secure_assessment.step1_note", "Already installed? Skip to step 3.")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2 · Prepare */}
                  <div className={`rounded-2xl p-5 sm:p-6 ${SURFACE}`}>
                    <div className="flex items-start gap-4">
                      <StepNumber n={2} />
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-extrabold text-[#072036] dark:text-white">
                          {t("secure_assessment.step2_title", "Get your computer ready")}
                        </h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <Row icon={Camera} title={t("secure_assessment.prep_camera", "Working webcam and microphone")} text={t("secure_assessment.prep_camera_text", "Both are checked before the test starts and stay on throughout.")} />
                          <Row icon={Monitor} title={t("secure_assessment.prep_screen", "One screen only")} text={t("secure_assessment.prep_screen_text", "Unplug any second monitor or projector. You will share your entire screen.")} />
                          <Row icon={Lock} title={t("secure_assessment.prep_apps", "Close other apps and save your work")} text={t("secure_assessment.prep_apps_text", "Safe Exam Browser locks the computer until you submit.")} />
                          <Row icon={Clock} title={t("secure_assessment.prep_time", "Charger in, 40 quiet minutes")} text={t("secure_assessment.prep_time_text", "Sit alone in a well-lit room with a stable internet connection.")} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3 · Launch */}
                  <div className={`rounded-2xl p-5 sm:p-6 ${SURFACE}`}>
                    <div className="flex items-start gap-4">
                      <StepNumber n={3} done={!!launch} />
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-extrabold text-[#072036] dark:text-white">
                          {t("secure_assessment.step3_title", "Open the test in Safe Exam Browser")}
                        </h2>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          {t(
                            "secure_assessment.step3_text",
                            "Safe Exam Browser opens, signs you in automatically and starts the setup checks. Keep this tab open: your result appears here once you finish."
                          )}
                        </p>

                        {!platform.supported ? (
                          <div id="secure-unsupported" className="mt-4 rounded-xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-500/25 dark:bg-rose-500/10">
                            <div className="flex items-start gap-3">
                              <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-300" />
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[#072036] dark:text-white">
                                  {t("secure_assessment.unsupported_title", "This device cannot run Safe Exam Browser")}
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                  {t(
                                    "secure_assessment.unsupported_text",
                                    "Use a Windows 10/11 or macOS laptop, or a computer in your college lab. If you do not have access to one, raise a support request and we will arrange a slot."
                                  )}
                                </p>
                                <button type="button" onClick={() => navigate("/dashboard/support")} className={`mt-3 ${BTN_GHOST}`}>
                                  <LifeBuoy className="h-4 w-4" /> {t("secure_assessment.contact_support", "Help & Support")}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <button type="button" id="secure-launch" onClick={startLaunch} disabled={launching || !assessment?._id} className={BTN_PRIMARY}>
                                {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                {launch
                                  ? t("secure_assessment.launch_again", "Open again")
                                  : t("secure_assessment.launch_button", "Open in Safe Exam Browser")}
                              </button>
                              {launch && (
                                <a id="secure-download" href={launch.configUrl} className={BTN_GHOST} download>
                                  <Download className="h-4 w-4" /> {t("secure_assessment.download_file", "Download launch file")}
                                </a>
                              )}
                            </div>

                            {launch && (
                              <div id="secure-launch-status" className={`mt-4 rounded-xl p-4 ${PANEL}`}>
                                <div className="flex items-start gap-3">
                                  {waitedLong ? (
                                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#045C9A] dark:text-[#A6D7E8]" />
                                  ) : (
                                    <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-[#045C9A] dark:text-[#A6D7E8]" />
                                  )}
                                  <div className="min-w-0 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                    <p className="text-sm font-bold text-[#072036] dark:text-white">
                                      {waitedLong
                                        ? t("secure_assessment.launch_waiting_long", "Safe Exam Browser did not open?")
                                        : t("secure_assessment.launch_waiting", "Safe Exam Browser is opening...")}
                                    </p>
                                    <p className="mt-1">
                                      {waitedLong
                                        ? t("secure_assessment.launch_fallback", "Use \"Download launch file\" and double-click the downloaded .seb file. If it still does not open, install Safe Exam Browser from step 1 first.")
                                        : t("secure_assessment.launch_hint", "If your browser asks for permission to open Safe Exam Browser, allow it.")}
                                    </p>
                                    {expiresLabel && (
                                      <p className="mt-2 inline-flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400">
                                        <Clock className="h-3.5 w-3.5" />
                                        {t("secure_assessment.link_valid_until", "Link valid until {{time}}", { time: expiresLabel })}
                                        <span aria-hidden>·</span>
                                        <button type="button" onClick={startLaunch} className="inline-flex items-center gap-1 text-[#045C9A] hover:underline dark:text-[#A6D7E8]">
                                          <RotateCcw className="h-3.5 w-3.5" /> {t("secure_assessment.new_link", "New link")}
                                        </button>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.section>

                {/* Rail */}
                <motion.aside
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: EASE, delay: 0.1 }}
                  className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start"
                >
                  <div className={`rounded-2xl p-5 ${SURFACE}`}>
                    <p className={LABEL}>{t("secure_assessment.next_label", "What happens next")}</p>
                    <ol className="mt-3 space-y-3">
                      {[
                        t("secure_assessment.next_1", "Safe Exam Browser opens and signs you in."),
                        t("secure_assessment.next_2", "Camera, microphone and entire-screen sharing are checked."),
                        t("secure_assessment.next_3", "Your face is registered for identity checks."),
                        t("secure_assessment.next_4", "You take the test. Leaving the window or stopping the share is recorded."),
                        t("secure_assessment.next_5", "On submit, Safe Exam Browser closes. Your result shows in the Assessment Centre."),
                      ].map((text, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#045C9A]/10 text-[10px] font-extrabold text-[#045C9A] dark:bg-[#A6D7E8]/10 dark:text-[#A6D7E8]">
                            {i + 1}
                          </span>
                          <span>{text}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className={`rounded-2xl p-5 ${SURFACE}`}>
                    <p className={LABEL}>{t("secure_assessment.privacy_label", "What is recorded")}</p>
                    <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      <li className="flex items-start gap-2.5">
                        <Camera className="mt-0.5 h-4 w-4 shrink-0 text-[#045C9A] dark:text-[#A6D7E8]" />
                        <span>{t("secure_assessment.privacy_camera", "Webcam identity checks, as in every proctored test.")}</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-[#045C9A] dark:text-[#A6D7E8]" />
                        <span>
                          {t(
                            "secure_assessment.privacy_screen",
                            "A picture of your screen every {{seconds}} seconds and a short clip when something is flagged.",
                            { seconds: intervalSec }
                          )}
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Mic className="mt-0.5 h-4 w-4 shrink-0 text-[#045C9A] dark:text-[#A6D7E8]" />
                        <span>{t("secure_assessment.privacy_mic", "The microphone listens for voices. No audio is stored.")}</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#045C9A] dark:text-[#A6D7E8]" />
                        <span>
                          {t(
                            "secure_assessment.privacy_retention",
                            "Flags are reviewed by a person before any decision. Captures are deleted after {{days}} days.",
                            { days: retentionDays }
                          )}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <button type="button" onClick={() => navigate("/dashboard/support")} className={BTN_GHOST}>
                    <LifeBuoy className="h-4 w-4" /> {t("secure_assessment.need_help", "Need help? Contact support")}
                  </button>
                </motion.aside>
              </div>
            )}
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default SecureLaunch;
