import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Loader2, RiAlertLine as AlertTriangle, RotateCcw, ShieldCheck } from "@/components/icons";
import { secureAssessmentApi } from "@/services/secureAssessmentApi";
import { startTokenRenewal } from "@/services/api";
import { isSebBrowser, refreshSebKeys, rememberSecureSession } from "@/utils/secureBrowser";

/**
 * Landing page inside Safe Exam Browser.
 *
 * SEB opens the startURL from the .seb file, which carries a one-time launch
 * token. We swap it for a signed-in session (the server accepts the swap only
 * when the request proves it came from SEB) and go straight to the test.
 */
const HELP = {
  SEB_REQUIRED: "This page only works inside Safe Exam Browser. Go back to the assessment centre in your normal browser and press \"Open in Safe Exam Browser\".",
  SEB_KEY_MISMATCH: "Safe Exam Browser is running a different configuration file. Close it, then launch again from the assessment centre.",
  LAUNCH_EXPIRED: "This launch link has expired. Close Safe Exam Browser, go back to the assessment centre and launch again.",
  LAUNCH_NOT_FOUND: "This launch link is not valid. Launch again from the assessment centre."
};

const SecureEnter = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const lt = params.get("lt") || "";
  const stage = String(params.get("stage") || "T2").toUpperCase();

  const [state, setState] = useState("working"); // working | error
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const ranRef = useRef(false);

  const run = useCallback(async () => {
    setState("working");
    setMessage("");
    if (!lt) {
      setState("error");
      setCode("LAUNCH_NOT_FOUND");
      setMessage(HELP.LAUNCH_NOT_FOUND);
      return;
    }
    try {
      await refreshSebKeys();
      const res = await secureAssessmentApi.exchange(lt);
      if (!res?.success || !res.token) throw Object.assign(new Error(res?.error || "Sign-in failed"), { data: res });

      const user = res.user || {};
      if (user._id && !user.id) user.id = user._id;
      sessionStorage.setItem("token", res.token);
      sessionStorage.setItem("user", JSON.stringify(user));
      if (res.sessionExpiresAt) sessionStorage.setItem("sessionExpiresAt", res.sessionExpiresAt);
      startTokenRenewal();
      rememberSecureSession({
        stage: res.stage || stage,
        assessmentId: res.assessmentId,
        assessmentCode: res.assessmentCode,
        sebVerified: !!res.sebVerified,
        sebVerification: res.sebVerification || ""
      });
      navigate(`/assessment/${res.stage || stage}`, { replace: true });
    } catch (err) {
      const errCode = err?.data?.code || "";
      setCode(errCode);
      setMessage(HELP[errCode] || err?.data?.error || err?.message || t("secure_assessment.enter_failed", "Could not sign you in inside Safe Exam Browser."));
      setState("error");
    }
  }, [lt, navigate, stage, t]);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    run();
  }, [run]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EAF7FD] p-4 text-[#072036] dark:bg-[#072036] dark:text-white">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-md rounded-2xl border border-[#d7ebf5]/80 bg-white p-6 shadow-sm dark:border-[#045C9A]/20 dark:bg-[#0d3a5f] sm:p-8"
      >
        <p className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#35566b] dark:text-[#A6D7E8]">
          {t("secure_assessment.eyebrow", "Secure assessment")}
        </p>

        {state === "working" ? (
          <div id="secure-enter-working" className="mt-4 flex items-start gap-3">
            <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-[#045C9A] dark:text-[#A6D7E8]" />
            <div>
              <h1 className="text-lg font-extrabold text-[#072036] dark:text-white">
                {t("secure_assessment.enter_title", "Signing you in")}
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {t("secure_assessment.enter_text", "Checking Safe Exam Browser and opening your assessment...")}
              </p>
            </div>
          </div>
        ) : (
          <div id="secure-enter-error" data-code={code} className="mt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-300" />
              <div className="min-w-0">
                <h1 className="text-lg font-extrabold text-[#072036] dark:text-white">
                  {t("secure_assessment.enter_error_title", "Could not open the assessment")}
                </h1>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{message}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                id="secure-enter-retry"
                onClick={run}
                className="inline-flex items-center gap-2 rounded-xl bg-[#072036] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#0d3a5f] dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white"
              >
                <RotateCcw className="h-4 w-4" /> {t("common.retry", "Try again")}
              </button>
              {!isSebBrowser() && (
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/assessment-centre")}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#d7ebf5] bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#0d3a5f] dark:text-slate-100"
                >
                  {t("assessments_dashboard.back", "Assessment Centre")}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-2 border-t border-[#d7ebf5] pt-4 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
          <ShieldCheck className="h-4 w-4 text-[#045C9A] dark:text-[#A6D7E8]" />
          {isSebBrowser()
            ? t("secure_assessment.seb_detected", "Safe Exam Browser detected")
            : t("secure_assessment.seb_not_detected", "Safe Exam Browser not detected")}
        </div>
      </motion.div>
    </div>
  );
};

export default SecureEnter;
