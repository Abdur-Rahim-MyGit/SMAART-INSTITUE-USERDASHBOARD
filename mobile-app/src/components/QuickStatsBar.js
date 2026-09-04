/**
 * QuickStatsBar — horizontal strip shown on Home between the hero and cards.
 * Shows: 🔥 Streak days • ⚡ Level/XP • 📚 Enrolled courses
 *
 * Props:
 *   streak      {number}  - day streak count (0 = never)
 *   level       {number}  - XP level
 *   enrolled    {number}  - number of enrolled courses
 *   loading     {bool}    - show skeleton if true
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import SkeletonBox from './SkeletonBox';
import { FadeSlideIn } from './Motion';
import { colors, radius, shadow } from '../theme';

const STATS = [
  { emoji: '🔥', key: 'streak', label: 'Day Streak', format: (v) => v || 0 },
  { emoji: '⚡', key: 'level', label: 'Level', format: (v) => v || 1 },
  { emoji: '📚', key: 'enrolled', label: 'Enrolled', format: (v) => v || 0 },
];

export default function QuickStatsBar({ streak = 0, level = 1, enrolled = 0, loading = false }) {
  const values = { streak, level, enrolled };

  return (
    <FadeSlideIn duration={380} style={styles.container}>
      {STATS.map((stat, idx) => (
        <React.Fragment key={stat.key}>
          <View style={styles.statItem}>
            {loading ? (
              <>
                <SkeletonBox width={28} height={28} borderRadius={14} style={{ marginBottom: 4 }} />
                <SkeletonBox width={32} height={12} borderRadius={4} style={{ marginBottom: 2 }} />
                <SkeletonBox width={44} height={10} borderRadius={4} />
              </>
            ) : (
              <>
                <Text style={styles.emoji}>{stat.emoji}</Text>
                <Text style={styles.value}>{stat.format(values[stat.key])}</Text>
                <Text style={styles.label}>{stat.label}</Text>
              </>
            )}
          </View>
          {idx < STATS.length - 1 && <View style={styles.divider} />}
        </React.Fragment>
      ))}
    </FadeSlideIn>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
    ...shadow.card,
    shadowOpacity: 0.06,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  value: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.navy,
    lineHeight: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
});
