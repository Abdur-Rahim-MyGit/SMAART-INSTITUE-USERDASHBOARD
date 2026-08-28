/**
 * ToolkitScreen — the SMAART Toolkit hub (FR mirrors `front-end/src/pages/SMAArtToolkit.jsx`).
 *
 * The web hub is a purely navigational card grid — no data fetching of its
 * own, just a curated list of tool cards that route to sub-pages. This is a
 * faithful mobile port of that grid, using the exact same copy (title / meta /
 * description / CTA) for each tool that has a real mobile destination:
 *   - My Notes           → existing `Notes` stack screen (api/notes.js)
 *   - CGPA Calculator     → new `CgpaCalculator` stack screen (api/cgpa.js)
 *   - General Dictionary  → new `Dictionary` stack screen (public dictionary APIs)
 *   - Resume Builder       → `ResumeBuilder` stack screen (api/resumes.js)
 *
 * Interview Preparation is still intentionally left off this grid rather than
 * linking to a screen that doesn't exist yet — same approach the web hub
 * already takes with its commented-out Library / To-Do cards.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

function AnimatedSection({ children, delay = 0, style }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <Animated.View style={[{ opacity: anim, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

function PressCard({ onPress, style, children }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

const TOOLS = [
  {
    key: 'Dictionary',
    icon: 'book-open',
    meta: 'DEFINITIONS',
    title: 'General Dictionary',
    description:
      'Master professional terminology with our interactive dictionary. Features real-time definitions and daily vocabulary building tools.',
    cta: 'Browse Dictionary',
  },
  {
    key: 'Notes',
    icon: 'edit-3',
    meta: 'CLOUD SYNC + EDITOR',
    title: 'My Notes',
    description:
      'Capture, organize, and sync your thoughts. Keep track of course insights and personal breakthroughs in one secure, cloud-synced space.',
    cta: 'Open My Notes',
  },
  {
    key: 'CgpaCalculator',
    icon: 'percent',
    meta: '3 GRADING METHODS',
    title: 'CGPA Calculator',
    description:
      'Calculate your CGPA effortlessly. Enter your subjects and instantly compute Slab-Based, Continuous, and Equal-Credit results.',
    cta: 'Open Calculator',
  },
  {
    key: 'ResumeBuilder',
    icon: 'file-text',
    meta: 'ATS-FRIENDLY',
    title: 'Resume Builder',
    description:
      'Build and manage multiple resume versions with your experience, education, projects, and skills.',
    cta: 'Open Resume Builder',
  },
];

export default function ToolkitScreen({ navigation }) {
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top']}>
      <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />

      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={[
            styles.backBtn,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              borderColor: themeColors.border,
            },
          ]}
        >
          <Feather name="arrow-left" size={19} color={themeColors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: themeColors.textMuted }]}>Career intelligence</Text>
          <Text style={[styles.title, { color: themeColors.text }]}>SMAART Toolkit</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AnimatedSection delay={0}>
          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
            Explore our curated repository of career intelligence, wellness resources, and learning tools.
          </Text>

          <View style={styles.sectionLabelRow}>
            <Feather name="tool" size={13} color={themeColors.primaryBright} />
            <Text style={[styles.sectionLabel, { color: themeColors.primaryBright }]}>YOUR TOOLS</Text>
            <View style={[styles.sectionRule, { backgroundColor: themeColors.border }]} />
          </View>
        </AnimatedSection>

        <View style={{ gap: 14 }}>
          {TOOLS.map((tool, idx) => (
            <AnimatedSection key={tool.key} delay={70 + idx * 70}>
              <PressCard
                onPress={() => navigation.navigate(tool.key)}
                style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.iconWrap, { backgroundColor: themeColors.primaryBright }]}>
                    <Feather name={tool.icon} size={18} color="#FFFFFF" />
                  </View>
                </View>

                <Text style={[styles.meta, { color: themeColors.primaryBright }]}>{tool.meta}</Text>
                <Text style={[styles.cardTitle, { color: themeColors.text }]}>{tool.title}</Text>
                <Text style={[styles.cardDesc, { color: themeColors.textMuted }]}>{tool.description}</Text>

                <View style={[styles.ctaDivider, { backgroundColor: themeColors.border }]} />

                <View style={[styles.ctaRow, { backgroundColor: isDark ? 'rgba(43,143,204,0.1)' : themeColors.pillBg }]}>
                  <View>
                    <Text style={[styles.ctaText, { color: themeColors.text }]}>{tool.cta}</Text>
                    <Text style={[styles.ctaSub, { color: themeColors.textMuted }]}>Launch from your toolkit</Text>
                  </View>
                  <Feather name="arrow-right" size={16} color={themeColors.primaryBright} />
                </View>
              </PressCard>
            </AnimatedSection>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: { fontSize: 11.5, fontWeight: '600' },
  title: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },

  scroll: { padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 13, fontWeight: '500', lineHeight: 19, marginBottom: 18 },

  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  sectionRule: { flex: 1, height: 1 },

  card: { borderWidth: 1, borderRadius: 20, padding: 18 },
  cardTop: { flexDirection: 'row', marginBottom: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },

  meta: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2, marginBottom: 8 },
  cardDesc: { fontSize: 13, lineHeight: 19, fontWeight: '500' },

  ctaDivider: { height: 1, marginTop: 16, marginBottom: 14 },
  ctaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
  },
  ctaText: { fontSize: 13, fontWeight: '700' },
  ctaSub: { fontSize: 10.5, fontWeight: '500', marginTop: 2 },
});
