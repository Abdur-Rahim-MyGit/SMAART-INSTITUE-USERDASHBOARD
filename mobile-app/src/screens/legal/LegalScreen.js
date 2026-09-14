/**
 * LegalScreen — Privacy Policy and Terms of Use.
 *
 * Both stores require a reachable privacy policy for an app that uses the
 * camera and processes biometric data (face verification for proctoring), and
 * the app previously had neither screen anywhere. Rendered from local content
 * rather than a WebView so the documents are readable with no network and
 * cannot 404 during store review.
 *
 * The canonical hosted versions live at the URLs in `HOSTED_URLS` below — those
 * are what you paste into App Store Connect and the Play Console. Keep the two
 * in step when either changes.
 */
import React from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 24 : 16;

export const HOSTED_URLS = {
  privacy: 'https://app.smaartminds.com/privacy',
  terms: 'https://app.smaartminds.com/terms',
};

/** Last substantive revision — shown to the reader and used in store listings. */
const LAST_UPDATED = '11 September 2026';

const PRIVACY_SECTIONS = [
  {
    heading: 'What this app collects',
    body:
      'Your account details (name, email, mobile number, institution, course and batch), your assessment attempts and scores, your course progress, and the content you post in the community. All of it is data you or your institution entered.',
  },
  {
    heading: 'Camera and face verification',
    body:
      'Proctored assessments verify that the person taking the test is the person enrolled. The camera captures frames only while an assessment is open. Face matching runs on your device: a frame is turned into a numeric descriptor and compared against the reference descriptor from your registration. Camera frames are not uploaded and not stored. Only the outcome — verified or not, plus any proctoring events — reaches our servers.',
  },
  {
    heading: 'Biometric unlock',
    body:
      'If you enable fingerprint or Face ID unlock, the check is performed by your operating system. SMAART never receives your fingerprint or face data; the app is only told whether the unlock succeeded.',
  },
  {
    heading: 'Notifications',
    body:
      'With your permission the app registers a push token so we can send exam reminders, results and institution announcements. Signing out unregisters that device.',
  },
  {
    heading: 'Who can see your data',
    body:
      'Your institution’s administrators and faculty can see your enrolment, assessment results and course progress. Employers see only what you submit with a job application. We do not sell your data and we do not share it for advertising.',
  },
  {
    heading: 'How long we keep it',
    body:
      'Academic records are retained for as long as your institution requires them. You can ask us to delete your account and associated personal data at any time using the address below; records your institution is legally obliged to keep may be retained in anonymised form.',
  },
  {
    heading: 'Your choices',
    body:
      'You can review and correct your profile in the app, revoke camera or notification permission in your device settings at any time, and request a copy or deletion of your data. Revoking camera permission means proctored assessments cannot be taken.',
  },
  {
    heading: 'Contact',
    body: 'Questions, corrections and deletion requests: privacy@smaartminds.com',
  },
];

const TERMS_SECTIONS = [
  {
    heading: 'Who may use SMAART',
    body:
      'The app is for students, faculty and staff of institutions partnered with SMAART. Accounts are issued by your institution or created with an institution-verified email address. Accounts are personal — do not share your credentials.',
  },
  {
    heading: 'Assessment integrity',
    body:
      'Assessments are proctored. You agree not to seek or give help during an attempt, not to record or redistribute questions, and not to use another person’s identity. Attempts are timed by our servers and submit automatically when time expires. Detected violations may pause an attempt, withhold a score pending review, or void a result.',
  },
  {
    heading: 'Attempt limits',
    body:
      'Each assessment stage allows a limited number of attempts, and stages unlock in sequence. Once you have passed a stage you cannot retake it. Exhausting your attempts means restarting the course.',
  },
  {
    heading: 'Community conduct',
    body:
      'Posts, replies and group messages are moderated. Harassment, discriminatory language, solicitation of academic dishonesty and spam are removed and may cost you access to community features.',
  },
  {
    heading: 'Placements',
    body:
      'Job postings and outcomes are the responsibility of the employers and your institution’s placement cell. SMAART provides the application channel; it does not guarantee interviews, offers or employment. Information you submit in an application is shared with that employer.',
  },
  {
    heading: 'Content and ownership',
    body:
      'Course material, question banks and assessment content remain the property of SMAART and its partner institutions and may not be copied or redistributed. Work you author — notes, posts, vision boards, resumes — remains yours; you grant us the licence needed to store and display it inside the platform.',
  },
  {
    heading: 'Availability and changes',
    body:
      'We may update, suspend or withdraw features. Where a change materially affects you we will tell you in the app. Continued use after a change means you accept the revised terms.',
  },
  {
    heading: 'Contact',
    body: 'support@smaartminds.com',
  },
];

const DOCS = {
  privacy: {
    title: 'Privacy Policy',
    intro:
      'How SMAART Institute collects, uses and protects your information. This policy covers the mobile app; the same terms apply to the SMAART web platform.',
    sections: PRIVACY_SECTIONS,
    hostedUrl: HOSTED_URLS.privacy,
  },
  terms: {
    title: 'Terms of Use',
    intro: 'The rules for using SMAART Institute. By signing in you agree to these terms.',
    sections: TERMS_SECTIONS,
    hostedUrl: HOSTED_URLS.terms,
  },
};

/**
 * @param route.params.doc — 'privacy' | 'terms'. Defaults to the privacy policy
 *   so a mis-registered route still renders the one the stores require.
 */
export default function LegalScreen({ navigation, route }) {
  const doc = DOCS[route?.params?.doc] || DOCS.privacy;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <RNStatusBar barStyle="light-content" backgroundColor={colors.navyDarkest} />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.title}>{doc.title}</Text>
        <Text style={styles.updated}>Last updated {LAST_UPDATED}</Text>
      </View>

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>{doc.intro}</Text>

        {doc.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <Pressable
          style={styles.webLink}
          onPress={() => Linking.openURL(doc.hostedUrl).catch(() => {})}
        >
          <Feather name="external-link" size={15} color={colors.primaryBright} />
          <Text style={styles.webLinkText}>Read the full version on the web</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navyDarkest },
  header: {
    paddingHorizontal: 24,
    paddingTop: STATUS_BAR_HEIGHT,
    paddingBottom: 24,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  updated: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 6,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.navyDark,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 48,
  },
  intro: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 26,
  },
  section: { marginBottom: 22 },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 7,
  },
  sectionBody: {
    fontSize: 13.5,
    lineHeight: 21,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.66)',
  },
  webLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  webLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryBright,
  },
});
