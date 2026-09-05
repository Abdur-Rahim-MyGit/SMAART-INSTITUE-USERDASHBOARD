/**
 * QuotientBreakdown — per-quotient results (FR-ASMT-08).
 *
 * The results screen used to show one percentage, a pass/fail and a band pill.
 * That is the least useful thing a capability assessment can tell a student:
 * the whole point of tagging every question to a quotient is that "62%" means
 * nothing while "strong reasoning, weak digital literacy" means something.
 *
 * The data already came back from `submitAssessment` — nothing was rendering it.
 *
 * SHAPE TOLERANCE
 * ---------------
 * The scoring pipeline has been through several revisions and different stages
 * answer with different shapes: a `quotientScores` map, a `quotients` array, or
 * per-quotient keys at the top level. `extractQuotients` accepts all three
 * rather than making the screen guess, because a student seeing an empty panel
 * because the shape changed is worse than a slightly forgiving parser.
 *
 * Codes and names are the platform's seven; see the System Document §8.
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export const QUOTIENTS = {
  CRQ: { name: 'Cognitive Reasoning', tint: '#60A5FA' },
  SRQ: { name: 'Self-Regulation & Drive', tint: '#F87171' },
  LQ: { name: 'Learning Agility', tint: '#34D399' },
  SIQ: { name: 'Social Interaction', tint: '#FBBF24' },
  PEQ: { name: 'Professional Execution', tint: '#A78BFA' },
  DAQ: { name: 'Digital & AI Literacy', tint: '#F472B6' },
  SEQ: { name: 'Social & Emotional', tint: '#38BDF8' },
};

const CODES = Object.keys(QUOTIENTS);

/** Level bands, matching the web's wording. */
function levelFor(pct) {
  if (pct >= 85) return 'Advanced';
  if (pct >= 70) return 'Strong';
  if (pct >= 55) return 'Progressing';
  if (pct >= 40) return 'Developing';
  return 'Emerging';
}

const toPercent = (v) => {
  if (v == null) return null;
  if (typeof v === 'number') return Math.max(0, Math.min(100, Math.round(v)));
  // Objects like { score: 7, total: 10 } or { percentage: 70 }
  if (typeof v === 'object') {
    if (typeof v.percentage === 'number') return toPercent(v.percentage);
    if (typeof v.score === 'number' && typeof v.total === 'number' && v.total > 0) {
      return toPercent((v.score / v.total) * 100);
    }
    if (typeof v.score === 'number') return toPercent(v.score);
  }
  const n = Number(v);
  return Number.isFinite(n) ? toPercent(n) : null;
};

/** @returns {{code: string, name: string, tint: string, pct: number}[]} */
export function extractQuotients(report) {
  if (!report) return [];

  const sources = [
    report.quotientScores,
    report.quotients,
    report.scores,
    report.quotientBreakdown,
    report, // last resort: codes sitting at the top level
  ];

  for (const src of sources) {
    if (!src) continue;

    // Array form: [{ quotient: 'CRQ', percentage: 72 }, ...]
    if (Array.isArray(src)) {
      const rows = src
        .map((item) => {
          const code = String(item?.quotient || item?.code || item?.key || '').toUpperCase();
          if (!QUOTIENTS[code]) return null;
          const pct = toPercent(item?.percentage ?? item?.score ?? item?.value ?? item);
          return pct == null ? null : { code, ...QUOTIENTS[code], pct };
        })
        .filter(Boolean);
      if (rows.length) return rows;
      continue;
    }

    // Map form: { CRQ: 72, SRQ: { score: 6, total: 10 } }
    if (typeof src === 'object') {
      const rows = CODES.map((code) => {
        const raw = src[code] ?? src[code.toLowerCase()];
        const pct = toPercent(raw);
        return pct == null ? null : { code, ...QUOTIENTS[code], pct };
      }).filter(Boolean);
      if (rows.length) return rows;
    }
  }

  return [];
}

export function QuotientBreakdown({ report }) {
  const { colors } = useTheme();
  const rows = useMemo(() => extractQuotients(report), [report]);

  // Silent when there is nothing to show. A stage that measures six quotients
  // should not render an empty seventh, and an older result with no breakdown
  // should not render an apologetic placeholder.
  if (rows.length === 0) return null;

  const strongest = rows.reduce((a, b) => (b.pct > a.pct ? b : a));
  const weakest = rows.reduce((a, b) => (b.pct < a.pct ? b : a));

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: colors.text }]}>Your quotients</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        Every question is tagged to a capability area, so this says which is strong and which needs
        work — not just how many you got right.
      </Text>

      <View style={{ gap: 12, marginTop: 16 }}>
        {rows.map((q) => (
          <View key={q.code}>
            <View style={styles.row}>
              <Text style={[styles.code, { color: q.tint }]}>{q.code}</Text>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {q.name}
              </Text>
              <Text style={[styles.pct, { color: colors.text }]}>{q.pct}%</Text>
            </View>
            <View style={[styles.track, { backgroundColor: colors.border }]}>
              <View style={[styles.fill, { width: `${q.pct}%`, backgroundColor: q.tint }]} />
            </View>
            <Text style={[styles.level, { color: colors.textMuted }]}>{levelFor(q.pct)}</Text>
          </View>
        ))}
      </View>

      {rows.length > 1 && strongest.code !== weakest.code && (
        <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryText, { color: colors.textMuted }]}>
            Strongest: <Text style={{ color: strongest.tint, fontWeight: '800' }}>{strongest.name}</Text>
            {'   ·   '}
            Focus next: <Text style={{ color: weakest.tint, fontWeight: '800' }}>{weakest.name}</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', marginTop: 28 },
  heading: { fontSize: 17, fontWeight: '800' },
  sub: { fontSize: 12.5, lineHeight: 18, marginTop: 5 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  code: { fontSize: 12, fontWeight: '800', width: 38 },
  name: { flex: 1, fontSize: 13, fontWeight: '600' },
  pct: { fontSize: 13, fontWeight: '800' },

  track: { height: 7, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 7, borderRadius: 4 },
  level: { fontSize: 10.5, fontWeight: '700', marginTop: 4 },

  summary: { borderWidth: 1, borderRadius: 14, padding: 13, marginTop: 18 },
  summaryText: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
});

export default QuotientBreakdown;
