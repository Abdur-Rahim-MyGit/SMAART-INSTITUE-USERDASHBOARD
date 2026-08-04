import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import { useAuth } from '../../context/AuthContext';
import { colors, radius, shadow } from '../../theme';

// Real modules from the roadmap (docs/04-React-Native-App-Requirements-and-Roadmap.docx,
// Section 5). None are built yet — each links straight to its own honest
// "Coming Soon" screen rather than pretending there's live course/job data.
const MODULES = [
  {
    key: 'Assessments',
    icon: 'edit-3',
    title: 'Assessments',
    description: 'T1–T4 tests, AIQ and results analysis',
    tag: 'Phase 2',
    iconBg: '#EFF6FF',
    iconColor: colors.primaryBright,
  },
  {
    key: 'Learning',
    icon: 'book-open',
    title: 'Learning',
    description: 'Courses, modules, notes and certificates',
    tag: 'Phase 4',
    iconBg: '#EEF2FF',
    iconColor: colors.navy,
  },
  {
    key: 'Career',
    icon: 'briefcase',
    title: 'Career & Placement',
    description: 'AI coach, resume builder and job board',
    tag: 'Phase 5',
    iconBg: '#FFFBEB',
    iconColor: colors.gold,
  },
  {
    key: 'Community',
    icon: 'users',
    title: 'Community',
    description: 'Vision board, MindCare and community feed',
    tag: 'Phase 6',
    iconBg: '#F0FDF4',
    iconColor: colors.success,
  },
];

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function timeOfDayGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(' ')[0] || 'there';

  return (
    <ScreenContainer contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroGreeting}>Good {timeOfDayGreeting()} 👋</Text>
            <Text style={styles.heroName}>{firstName}</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Profile')} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user?.fullName)}</Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={({ pressed }) => [styles.searchBar, pressed && styles.searchBarPressed]} onPress={() => navigation.navigate('Learning')}>
        <Feather name="search" size={17} color={colors.mutedLight} />
        <Text style={styles.searchPlaceholder}>Search courses, topics...</Text>
      </Pressable>

      <View style={styles.body}>
        <View style={styles.institutionRow}>
          <View style={styles.institutionIcon}>
            <Feather name="home" size={15} color={colors.primary} />
          </View>
          <View style={styles.institutionInfo}>
            <Text style={styles.institutionName} numberOfLines={1}>
              {user?.college?.collegeName || 'Your institution'}
            </Text>
            <Text style={styles.institutionRole}>{user?.role || user?.userType || 'Student'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Explore</Text>

        {MODULES.map((mod) => (
          <Pressable
            key={mod.key}
            style={({ pressed }) => [styles.moduleCard, pressed && styles.moduleCardPressed]}
            onPress={() => navigation.navigate(mod.key)}
          >
            <View style={[styles.moduleIcon, { backgroundColor: mod.iconBg }]}>
              <Feather name={mod.icon} size={20} color={mod.iconColor} />
            </View>
            <View style={styles.moduleInfo}>
              <View style={styles.moduleTitleRow}>
                <Text style={styles.moduleTitle}>{mod.title}</Text>
                <View style={styles.moduleTag}>
                  <Text style={styles.moduleTagText}>{mod.tag}</Text>
                </View>
              </View>
              <Text style={styles.moduleDescription}>{mod.description}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedLight} />
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 0, paddingBottom: 32 },
  hero: {
    backgroundColor: colors.navy,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 44,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroGreeting: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  heroName: { color: colors.white, fontSize: 23, fontWeight: '800', marginTop: 2 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: -24,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    height: 50,
    ...shadow.card,
  },
  searchBarPressed: { backgroundColor: colors.surfaceMuted },
  searchPlaceholder: { marginLeft: 10, color: colors.mutedLight, fontSize: 14, fontWeight: '500' },
  body: { paddingHorizontal: 20, paddingTop: 24 },
  institutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 26,
  },
  institutionIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  institutionInfo: { flex: 1, minWidth: 0 },
  institutionName: { fontSize: 13, fontWeight: '700', color: colors.text },
  institutionRole: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    marginTop: 1,
    textTransform: 'capitalize',
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.navy, marginBottom: 12 },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    ...shadow.card,
    shadowOpacity: 0.04,
  },
  moduleCardPressed: { backgroundColor: colors.surfaceMuted },
  moduleIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  moduleInfo: { flex: 1, minWidth: 0 },
  moduleTitleRow: { flexDirection: 'row', alignItems: 'center' },
  moduleTitle: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  moduleTag: {
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moduleTagText: { fontSize: 9, fontWeight: '800', color: colors.muted, letterSpacing: 0.4 },
  moduleDescription: { fontSize: 12, fontWeight: '500', color: colors.muted, marginTop: 3 },
});
