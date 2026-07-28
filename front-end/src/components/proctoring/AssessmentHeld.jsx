import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RiRefreshLine, RiTimeLine, RiArrowRightLine } from '@remixicon/react';

/**
 * End of an unverified attempt — the only proctoring outcome a candidate sees.
 *
 * There is no lockout screen and no accusation. We cannot prove anyone
 * cheated, and telling an honest candidate they did is a real harm as well as
 * indefensible if challenged. The wording is "we couldn't verify this
 * attempt", which is both true and survivable.
 *
 * Two paths:
 *   retry  — the attempt is void, they re-sit with a DIFFERENT question set
 *   ticket — retakes exhausted, a human takes over
 *
 * The flag summary is deliberately coarse. Counts and categories are enough to
 * explain the decision; naming the detectors and their thresholds would teach
 * them how to evade it next time.
 */
export const AssessmentHeld = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const outcome = state?.outcome || 'ticket';
  const canRetry = outcome === 'retry';
  const reference = state?.reference || '—';
  const flags = state?.flags || [];
  const retriesRemaining = state?.retriesRemaining ?? 0;
  const answersRecorded = state?.answersRecorded;
  const totalQuestions = state?.totalQuestions;
  const assessmentCode = state?.assessmentCode;

  const decisionBy = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-[#000B1A]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-white/10 dark:bg-[#00152E]"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <RiTimeLine className="h-3.5 w-3.5" aria-hidden="true" />
          {canRetry ? 'Attempt not verified' : 'Under review'}
        </span>

        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
          We couldn't verify this attempt
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {canRetry ? (
            <>
              Your assessment was completed, but our monitoring recorded some
              activity we couldn't verify, so this attempt won't be scored.
              You can take it again — <strong className="font-semibold text-slate-900 dark:text-white">you'll get a different set of questions.</strong>
            </>
          ) : (
            <>
              Your assessment was completed, but we couldn't verify this
              attempt and you've used all your retakes. Our team will review it
              and get back to you.
            </>
          )}
        </p>

        {flags.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              What we recorded
            </div>
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-white/10 dark:border-white/10">
              {flags.map((flag) => (
                <li
                  key={flag.key}
                  className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm"
                >
                  <span className="text-slate-600 dark:text-slate-300">{flag.label}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-slate-900 dark:text-white">
                    {flag.count}×
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <dl className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-white/10 dark:border-white/10">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-slate-500 dark:text-slate-400">Reference</dt>
            <dd className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{reference}</dd>
          </div>
          {answersRecorded != null && totalQuestions != null && (
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-slate-500 dark:text-slate-400">Answers saved</dt>
              <dd className="text-sm font-semibold text-slate-900 dark:text-white">
                {answersRecorded} of {totalQuestions}
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-slate-500 dark:text-slate-400">
              {canRetry ? 'Retakes left' : 'Decision expected by'}
            </dt>
            <dd className="text-sm font-semibold text-slate-900 dark:text-white">
              {canRetry ? retriesRemaining : decisionBy}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          {canRetry ? (
            <button
              type="button"
              onClick={() =>
                navigate(assessmentCode ? `/assessment/${assessmentCode}` : '/dashboard/assessment-centre', {
                  replace: true
                })
              }
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              <RiRefreshLine className="h-4 w-4" aria-hidden="true" />
              Take the assessment again
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/support', { state: { reference, topic: 'assessment_review' } })}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Raise a support ticket
              <RiArrowRightLine className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/dashboard', { replace: true })}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
          >
            Back to dashboard
          </button>
        </div>

        <p className="mt-5 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
          If you believe this is a mistake — a poor connection, someone walking
          past, or a problem with your camera — say so when you get in touch and
          we'll take another look.
        </p>
      </motion.div>
    </div>
  );
};

export default AssessmentHeld;
