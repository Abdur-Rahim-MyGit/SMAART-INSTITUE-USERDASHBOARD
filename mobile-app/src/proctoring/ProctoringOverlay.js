/**
 * ProctoringOverlay — the four proctoring surfaces (FR-PROC-14).
 *
 *   ok     a small always-on status chip, so monitoring is never covert
 *   warn   a dismissible banner — the attempt continues
 *   pause  a full-screen block; the clock keeps running, which is the point
 *   held   a terminal screen; the attempt is over and under review
 *
 * The tier comes from the server and is rendered as given. There is no local
 * escalation logic here on purpose: if this component decided when to block,
 * it would eventually disagree with the gate that decides whether the attempt
 * counts, and a student would be stopped by one and passed by the other.
 *
 * In FLAG_ONLY_MODE the server never sends `pause` or `held` — it downgrades
 * them to `warn` before they leave the building. So the blocking branches below
 * simply never render in that mode, without this file knowing the mode exists.
 */
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { TIER_COPY } from './events';

/** Always-visible proof that monitoring is on, and whether it is healthy. */
export function ProctoringStatusChip({ decision, degraded, sessionId }) {
  const { colors } = useTheme();

  const state = !sessionId
    ? { icon: 'shield-off', tint: colors.textMuted, label: 'Not monitored' }
    : degraded
      ? { icon: 'wifi-off', tint: colors.warning, label: 'Reconnecting' }
      : decision.tier === 'warn'
        ? { icon: 'alert-triangle', tint: colors.warning, label: `${decision.warnings} flagged` }
        : { icon: 'shield', tint: colors.success, label: 'Monitored' };

  return (
    <View style={[styles.chip, { backgroundColor: `${state.tint}1A`, borderColor: `${state.tint}55` }]}>
      <Feather name={state.icon} size={11} color={state.tint} />
      <Text style={[styles.chipText, { color: state.tint }]}>{state.label}</Text>
    </View>
  );
}

/** Non-blocking coaching banner for tier `warn`. */
export function ProctoringWarningBanner({ decision, onDismiss }) {
  const { colors } = useTheme();
  if (decision.tier !== 'warn' || decision.warnings === 0) return null;

  const copy = TIER_COPY.warn;
  return (
    <View style={[styles.banner, { backgroundColor: `${colors.warning}14`, borderColor: `${colors.warning}44` }]}>
      <Feather name="alert-triangle" size={16} color={colors.warning} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.bannerTitle, { color: colors.text }]}>{copy.title}</Text>
        <Text style={[styles.bannerBody, { color: colors.textMuted }]}>
          {copy.body}
          {decision.maxWarnings ? ` (${decision.warnings} of ${decision.maxWarnings})` : ''}
        </Text>
      </View>
      <Pressable onPress={onDismiss} hitSlop={10}>
        <Feather name="x" size={15} color={colors.iconMuted} />
      </Pressable>
    </View>
  );
}

/**
 * Blocking screen for `pause` and `held`.
 *
 * `pause` offers "I'm back" — a resume the student controls, because the fault
 * may already be corrected by the time they read it. `held` offers nothing but
 * an exit: the decision is the server's and is not negotiable from a phone.
 */
export function ProctoringBlockModal({ decision, onResume, onExit }) {
  const { colors } = useTheme();
  const tier = decision.tier;
  const visible = tier === 'pause' || tier === 'held';
  if (!visible) return null;

  const held = tier === 'held';
  const copy = TIER_COPY[tier];
  const tint = held ? colors.danger : colors.warning;

  return (
    <Modal visible transparent={false} animationType="fade" onRequestClose={() => {}}>
      <View style={[styles.blockRoot, { backgroundColor: colors.bg }]}>
        <View style={[styles.blockIcon, { backgroundColor: `${tint}1A` }]}>
          <Feather name={held ? 'lock' : 'pause'} size={30} color={tint} />
        </View>

        <Text style={[styles.blockTitle, { color: colors.text }]}>{copy.title}</Text>
        <Text style={[styles.blockBody, { color: colors.textMuted }]}>{copy.body}</Text>

        {!!decision.reason && (
          <View style={[styles.reasonBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.reasonLabel, { color: colors.iconMuted }]}>REASON</Text>
            <Text style={[styles.reasonText, { color: colors.text }]}>{decision.reason}</Text>
          </View>
        )}

        {held && !!decision.ticketId && (
          <Text style={[styles.ticket, { color: colors.iconMuted }]}>
            Reference: {decision.ticketId}
          </Text>
        )}

        <View style={styles.blockActions}>
          {!held && (
            <Pressable
              onPress={onResume}
              style={[styles.primaryBtn, { backgroundColor: colors.primaryBright }]}
            >
              <Text style={styles.primaryBtnText}>I'm back — continue</Text>
            </Pressable>
          )}
          <Pressable onPress={onExit} style={[styles.secondaryBtn, { borderColor: colors.border }]}>
            <Text style={[styles.secondaryBtnText, { color: colors.textMuted }]}>
              {held ? 'Back to assessments' : 'Leave the assessment'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4,
  },
  chipText: { fontSize: 10, fontWeight: '800' },

  banner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 14,
  },
  bannerTitle: { fontSize: 13, fontWeight: '800' },
  bannerBody: { fontSize: 11.5, lineHeight: 16.5, marginTop: 2 },

  blockRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  blockIcon: {
    width: 74, height: 74, borderRadius: 37,
    alignItems: 'center', justifyContent: 'center', marginBottom: 22,
  },
  blockTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  blockBody: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 12, maxWidth: 340 },

  reasonBox: {
    alignSelf: 'stretch', borderWidth: 1, borderRadius: 14,
    padding: 14, marginTop: 22,
  },
  reasonLabel: { fontSize: 9.5, fontWeight: '800', letterSpacing: 1, marginBottom: 5 },
  reasonText: { fontSize: 13, lineHeight: 19 },
  ticket: { fontSize: 11.5, fontWeight: '700', marginTop: 14 },

  blockActions: { alignSelf: 'stretch', gap: 10, marginTop: 30 },
  primaryBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  secondaryBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryBtnText: { fontSize: 14, fontWeight: '700' },
});
