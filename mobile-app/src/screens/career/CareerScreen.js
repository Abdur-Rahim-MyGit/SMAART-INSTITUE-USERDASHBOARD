import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { placementsAPI } from '../../api/placements';
import { exportResume, listResumes } from '../../api/resumes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Mirrors `back-end/routes/placements.js` — the apply handler rejects anything
 * shorter. Kept as named constants so the counter the student sees and the rule
 * the server enforces cannot drift apart.
 */
const MIN_COVER_LETTER_WORDS = 50;
const MAX_COVER_LETTER_CHARS = 6000;

/** The same word count the backend performs, so the preview matches the verdict. */
function countWords(text) {
  const trimmed = (text || '').trim();
  return trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
}

export function normalizeJobType(job) {
  const combined = [job.displayType, job.type, job.jobType, job.employmentType]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase())
    .join(' ');
  if (!combined) return 'other';
  if (combined.includes('intern')) return 'internship';
  if (combined.includes('part')) return 'part-time';
  if (combined.includes('full') || combined.includes('permanent')) return 'full-time';
  return 'other';
}

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

function PressCard({ onPress, style, children, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} disabled={disabled}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function CareerScreen({ navigation }) {
  const { user } = useAuth();
  const { colors: themeColors, theme } = useTheme();

  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs', 'applied', 'fairs', 'partners'
  const [loading, setLoading] = useState(true);

  // Data States
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [fairs, setFairs] = useState([]);
  const [partners, setPartners] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'full-time', 'part-time', 'internship'
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all', 'smaartjobpostings', 'jobpostings'

  // Offer Letter Response State
  const [selectedOfferApp, setSelectedOfferApp] = useState(null);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [signatureText, setSignatureText] = useState('');
  const [declineReason, setDeclineReason] = useState('');

  // Job Application State.
  //
  // Applying used to post a hardcoded five-word cover letter and nothing else,
  // against a handler that requires fifty words, a resume URL, a mobile number
  // and an active-backlog count — so every application returned 400 and no
  // student could ever apply. These fields are exactly what that handler wants.
  const [applyJob, setApplyJob] = useState(null);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applyMobile, setApplyMobile] = useState('');
  const [activeBacklog, setActiveBacklog] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [resumeLoading, setResumeLoading] = useState(false);
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyError, setApplyError] = useState('');

  const coverLetterWords = countWords(coverLetter);

  const fetchJobs = async () => {
    try {
      const res = await placementsAPI.getJobs({ limit: 100 });
      setJobs(res?.data || res || []);
    } catch (err) {
      console.warn('Failed to load placement jobs:', err);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await placementsAPI.listApplications();
      setApplications(res?.data || res || []);
    } catch (err) {
      console.warn('Failed to load applications:', err);
    }
  };

  const fetchJobFairs = async () => {
    try {
      const res = await placementsAPI.getJobFairs();
      setFairs(res?.data || res || []);
    } catch (err) {
      console.warn('Failed to load job fairs:', err);
    }
  };

  const fetchPartners = async () => {
    try {
      const res = await placementsAPI.getCompanies();
      setPartners(res?.data || res || []);
    } catch (err) {
      console.warn('Failed to load companies:', err);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchJobs();
    if (activeTab === 'applied') await fetchApplications();
    else if (activeTab === 'fairs') await fetchJobFairs();
    else if (activeTab === 'partners') await fetchPartners();
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filters logic
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchType =
        typeFilter === 'all' || normalizeJobType(job) === typeFilter;
      const matchSource =
        sourceFilter === 'all' || job.sourceCollection === sourceFilter;
      
      const title = (job.displayTitle || job.title || '').toLowerCase();
      const company = (job.displayCompany || job.company || '').toLowerCase();
      const location = (job.displayLocation || job.location || '').toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        title.includes(searchQuery.toLowerCase()) ||
        company.includes(searchQuery.toLowerCase()) ||
        location.includes(searchQuery.toLowerCase());

      return matchType && matchSource && matchSearch;
    });
  }, [jobs, typeFilter, sourceFilter, searchQuery]);

  /**
   * Attaches the student's SMAART-built resume to the application.
   *
   * The backend refuses any application without a `resumeUrl` ("Please build
   * your SMAART resume before applying"). Mobile has no PDF renderer, so rather
   * than upload a file it exports the most recently edited resume and sends the
   * public verification URL that `POST /resumes/:id/export` returns — the same
   * link the QR code on the printed resume points at. It is durable, public to
   * a recruiter, and provably SMAART-issued.
   */
  // `POST /resumes/:id/export` is rate-limited to 10 per hour. A student
  // browsing several roles would burn through that just by opening the form,
  // so the exported URL is reused for the rest of the session — it addresses
  // the resume, not the application.
  const cachedResumeRef = useRef(null);

  const attachResume = useCallback(async () => {
    if (cachedResumeRef.current) {
      setResumeUrl(cachedResumeRef.current.url);
      setResumeName(cachedResumeRef.current.name);
      return;
    }

    setResumeLoading(true);
    setApplyError('');
    try {
      const res = await listResumes();
      const resumes = res?.data || [];
      if (!resumes.length) {
        setResumeUrl('');
        setResumeName('');
        setApplyError('You need a SMAART resume before you can apply. Build one, then come back.');
        return;
      }

      // `GET /resumes` sorts by updatedAt descending — the first is the newest.
      const resume = resumes[0];
      const exported = await exportResume(resume._id);
      const url = exported?.data?.verificationUrl;
      if (!url) {
        setApplyError('Could not attach your resume. Please try again in a moment.');
        return;
      }
      const name = resume.title || resume.personalInfo?.targetRole || 'SMAART Resume';
      cachedResumeRef.current = { url, name };
      setResumeUrl(url);
      setResumeName(name);
    } catch (err) {
      setApplyError(err.message || 'Could not attach your resume. Please try again.');
    } finally {
      setResumeLoading(false);
    }
  }, []);

  // Opens the application form. Nothing is sent until the student submits it.
  const handleApply = (job) => {
    const alreadyApplied = applications.some((app) => (app.job?._id || app.job) === job._id);
    if (alreadyApplied) {
      Alert.alert('Already Applied', 'You have already submitted an application for this role.');
      return;
    }

    setApplyJob(job);
    setCoverLetter('');
    setActiveBacklog('');
    setPortfolioUrl('');
    setLinkedInUrl('');
    setResumeUrl('');
    setResumeName('');
    setApplyError('');
    setApplyMobile(user?.mobile || user?.mobileNumber || '');
    setApplyModalVisible(true);
    attachResume();
  };

  /**
   * Validates against the same rules as the server before spending a request,
   * then submits. Every field below is one the backend handler requires.
   */
  const submitApplication = async () => {
    if (!applyJob) return;

    if (coverLetterWords < MIN_COVER_LETTER_WORDS) {
      setApplyError(
        `Your cover letter needs at least ${MIN_COVER_LETTER_WORDS} words — it has ${coverLetterWords}.`
      );
      return;
    }
    if (coverLetter.trim().length > MAX_COVER_LETTER_CHARS) {
      setApplyError(`Your cover letter is too long (maximum ${MAX_COVER_LETTER_CHARS} characters).`);
      return;
    }
    if (!resumeUrl) {
      setApplyError('Your SMAART resume must be attached before you can apply.');
      return;
    }
    if (!applyMobile.trim()) {
      setApplyError('A mobile number is required so the employer can reach you.');
      return;
    }
    // The server treats a missing backlog count as invalid, and 0 is a
    // meaningful answer — so check for "not filled in", not for falsiness.
    if (activeBacklog.trim() === '' || Number.isNaN(Number(activeBacklog))) {
      setApplyError('Enter your number of active backlogs (0 if you have none).');
      return;
    }

    setApplySubmitting(true);
    setApplyError('');
    try {
      const source = applyJob.sourceCollection || 'jobpostings';
      await placementsAPI.applyJob(source, applyJob._id, {
        fullName: user?.fullName || '',
        email: user?.email || '',
        mobile: applyMobile.trim(),
        coverLetter: coverLetter.trim(),
        resumeUrl,
        activeBacklog: Number(activeBacklog),
        portfolioUrl: portfolioUrl.trim() || undefined,
        linkedInUrl: linkedInUrl.trim() || undefined,
      });
      setApplyModalVisible(false);
      setApplyJob(null);
      Alert.alert('Application Submitted! 🎉', 'Your application has been sent to the employer.');
      fetchApplications();
    } catch (err) {
      // The server's message is the specific one (word count, moderation,
      // duplicate) — show it rather than a generic retry prompt.
      setApplyError(err.message || 'Could not submit your application. Please try again.');
    } finally {
      setApplySubmitting(false);
    }
  };

  // Withdraw Application
  const handleWithdraw = (appId) => {
    Alert.alert(
      'Withdraw Application?',
      'Are you sure you want to withdraw your application? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              await placementsAPI.deleteApplication(appId);
              setApplications(applications.filter((a) => a._id !== appId));
              Alert.alert('Withdrawn', 'Your application has been withdrawn.');
            } catch (err) {
              Alert.alert('Withdraw Failed', err.message);
            }
          },
        },
      ]
    );
  };

  // Respond to Offer
  const handleRespondOffer = async (status) => {
    if (status === 'Accepted' && !signatureText.trim()) {
      Alert.alert('Required', 'Please sign your name to accept the offer.');
      return;
    }

    try {
      await placementsAPI.updateApplicationStatus(
        selectedOfferApp._id,
        status,
        signatureText,
        declineReason
      );
      Alert.alert('Success', `Offer status updated to ${status}.`);
      setOfferModalVisible(false);
      setSelectedOfferApp(null);
      setSignatureText('');
      setDeclineReason('');
      fetchApplications();
    } catch (err) {
      Alert.alert('Response Failed', err.message);
    }
  };

  // Status Colors helper
  const getStatusColor = (status) => {
    const norm = String(status || '').toLowerCase();
    if (norm.includes('selected') || norm.includes('accepted') || norm.includes('offer')) return '#10B981';
    if (norm.includes('review') || norm.includes('progress')) return '#F59E0B';
    if (norm.includes('rejected') || norm.includes('declined')) return '#EF4444';
    return '#1478B8';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]} edges={['top']}>
      {/* Aurora Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.auroraBlob, { backgroundColor: '#1478B8', top: -80, left: -60, width: 280, height: 280, borderRadius: 140, opacity: theme === 'dark' ? 0.12 : 0.05 }]} />
        <View style={[styles.auroraBlob, { backgroundColor: '#EC4899', top: 180, right: -120, width: 340, height: 340, borderRadius: 170, opacity: theme === 'dark' ? 0.08 : 0.04 }]} />
      </View>

      <AnimatedSection delay={0}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Career Center</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]}>
            Explore placements, track job applications, and interact with hiring partners.
          </Text>
        </View>
      </AnimatedSection>

      {/* ── AI Career Coach entry (FR-CAR-01) ─────────────────────────────
          The coach is the tab's headline capability but had no entry point on
          mobile at all, so it sits above the placement tabs rather than inside
          them. */}
      <AnimatedSection delay={60}>
        <PressCard
          onPress={() => navigation.navigate('CareerCoachChat')}
          style={[styles.coachCard, { backgroundColor: themeColors.primaryBright }]}
        >
          <View style={styles.coachIcon}>
            <Feather name="compass" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.coachTitle}>AI Career Coach</Text>
            <Text style={styles.coachSub}>Ask about roles, skills and your next step</Text>
          </View>
          <Feather name="arrow-right" size={18} color="#FFFFFF" />
        </PressCard>
      </AnimatedSection>

      {/* ── Career Directions entry ────────────────────────────────────────
          Second in-tab entry point for the direction-lock flow (getDirectionLockStatus
          → onboarding or dashboard), so it's discoverable here as well as from the
          side drawer's "Career Directions" item. */}
      <AnimatedSection delay={120}>
        <PressCard
          onPress={() => navigation.navigate('CareerDirections')}
          style={[styles.directionsCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
        >
          <View style={[styles.directionsIcon, { backgroundColor: 'rgba(4, 92, 154, 0.1)' }]}>
            <Feather name="compass" size={20} color={themeColors.primaryBright} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.directionsTitle, { color: themeColors.text }]}>Career Directions</Text>
            <Text style={[styles.directionsSub, { color: themeColors.textMuted }]}>Lock a target role and get your skill roadmap</Text>
          </View>
          <Feather name="arrow-right" size={18} color={themeColors.textMuted} />
        </PressCard>
      </AnimatedSection>

      {/* Segment Menu Tab Toggles */}
      <AnimatedSection delay={170}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={styles.tabsScroll}>
          {[
            { id: 'jobs', label: 'Explore Jobs', icon: 'briefcase' },
            { id: 'applied', label: 'My Applications', icon: 'check-circle' },
            { id: 'fairs', label: 'Job Fairs', icon: 'calendar' },
            { id: 'partners', label: 'Our Partners', icon: 'users' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabBtn,
                { backgroundColor: themeColors.card, borderColor: themeColors.border },
                activeTab === tab.id && { backgroundColor: themeColors.primaryBright, borderColor: themeColors.primaryBright },
              ]}
              onPress={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
              }}
            >
              <Feather name={tab.icon} size={13} color={activeTab === tab.id ? '#FFFFFF' : themeColors.textMuted} />
              <Text style={[styles.tabBtnText, { color: activeTab === tab.id ? '#FFFFFF' : themeColors.text }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </AnimatedSection>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={themeColors.primaryBright} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.bodyScroll} showsVerticalScrollIndicator={false}>
          {/* SEARCH & FILTERS ON EXPLORE TAB */}
          {activeTab === 'jobs' && (
            <AnimatedSection delay={0} style={styles.filtersSection}>
              {/* Search */}
              <View style={[styles.searchBar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Feather name="search" size={16} color={themeColors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.searchInput, { color: themeColors.text }]}
                  placeholder="Search roles, companies, skills..."
                  placeholderTextColor={themeColors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery !== '' && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Feather name="x" size={16} color={themeColors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Badges Filters row */}
              <View style={styles.badgeFilters}>
                {/* Type Filter */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {[
                    { id: 'all', label: 'All Types' },
                    { id: 'full-time', label: 'Full-Time' },
                    { id: 'part-time', label: 'Part-Time' },
                    { id: 'internship', label: 'Internships' },
                  ].map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      style={[
                        styles.filterPill,
                        { backgroundColor: themeColors.card, borderColor: themeColors.border },
                        typeFilter === f.id && { backgroundColor: themeColors.primaryBright, borderColor: themeColors.primaryBright },
                      ]}
                      onPress={() => setTypeFilter(f.id)}
                    >
                      <Text style={[styles.filterPillText, { color: typeFilter === f.id ? '#FFFFFF' : themeColors.text }]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </AnimatedSection>
          )}

          {/* CONTENT LIST RENDERING */}
          {activeTab === 'jobs' && (
            <AnimatedSection delay={80} style={styles.listContainer}>
              {filteredJobs.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Feather name="info" size={32} color={themeColors.textMuted} />
                  <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>No matching jobs found.</Text>
                </View>
              ) : (
                filteredJobs.map((job) => {
                  const companyInit = (job.displayCompany || job.company || 'C').charAt(0).toUpperCase();
                  const jobType = normalizeJobType(job);
                  const isSmaart = job.sourceCollection === 'smaartjobpostings';

                  return (
                    <PressCard
                      key={job._id}
                      style={[styles.jobCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                      onPress={() =>
                        navigation.navigate('JobDetail', {
                          job,
                          alreadyApplied: applications.some((app) => (app.job?._id || app.job) === job._id),
                          onApply: handleApply,
                        })
                      }
                    >
                      <View style={styles.cardTop}>
                        {/* Company Logo mock */}
                        <View style={[styles.companyLogo, { backgroundColor: 'rgba(4, 92, 154, 0.08)' }]}>
                          <Text style={[styles.companyInit, { color: themeColors.primaryBright }]}>{companyInit}</Text>
                        </View>
                        <View style={styles.cardHeaderInfo}>
                          <Text style={[styles.jobTitle, { color: themeColors.text }]} numberOfLines={1}>
                            {job.displayTitle || job.title}
                          </Text>
                          <Text style={[styles.companyName, { color: themeColors.textMuted }]}>
                            {job.displayCompany || job.company}
                          </Text>
                        </View>
                        <View style={[styles.sourceTag, { backgroundColor: isSmaart ? '#1E293B' : 'rgba(4, 92, 154, 0.1)' }]}>
                          <Text style={[styles.sourceTagText, { color: isSmaart ? '#FFFFFF' : themeColors.primaryBright }]}>
                            {isSmaart ? 'SMAART' : 'COLLEGE'}
                          </Text>
                        </View>
                      </View>

                      {/* Specs */}
                      <View style={styles.cardSpecs}>
                        <View style={styles.specItem}>
                          <Feather name="map-pin" size={12} color={themeColors.textMuted} />
                          <Text style={[styles.specText, { color: themeColors.textMuted }]} numberOfLines={1}>
                            {job.displayLocation || job.location || 'Remote'}
                          </Text>
                        </View>
                        <View style={styles.specItem}>
                          <Feather name="briefcase" size={12} color={themeColors.textMuted} />
                          <Text style={[styles.specText, { color: themeColors.textMuted }]}>{jobType}</Text>
                        </View>
                        {job.ctc && (
                          <View style={styles.specItem}>
                            <Feather name="dollar-sign" size={12} color={themeColors.textMuted} />
                            <Text style={[styles.specText, { color: themeColors.textMuted }]}>{job.ctc}</Text>
                          </View>
                        )}
                      </View>
                    </PressCard>
                  );
                })
              )}
            </AnimatedSection>
          )}

          {activeTab === 'applied' && (
            <AnimatedSection delay={80} style={styles.listContainer}>
              {applications.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Feather name="file-text" size={32} color={themeColors.textMuted} />
                  <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>No submitted applications yet.</Text>
                </View>
              ) : (
                applications.map((app, idx) => {
                  const jobRef = app.job || {};
                  const title = jobRef.displayTitle || app.jobTitle || 'Placement Role';
                  const company = jobRef.displayCompany || app.companyName || 'Hiring Partner';
                  const appStatus = app.status || 'applied';

                  return (
                    <View key={app._id || idx} style={[styles.jobCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                      <View style={styles.cardTop}>
                        <View style={[styles.companyLogo, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                          <Text style={[styles.companyInit, { color: '#10B981' }]}>
                            {(company || 'C').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.cardHeaderInfo}>
                          <Text style={[styles.jobTitle, { color: themeColors.text }]} numberOfLines={1}>
                            {title}
                          </Text>
                          <Text style={[styles.companyName, { color: themeColors.textMuted }]}>{company}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appStatus) + '15' }]}>
                          <Text style={[styles.statusBadgeText, { color: getStatusColor(appStatus) }]}>
                            {appStatus.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.appliedFooter}>
                        {appStatus.toLowerCase() === 'offer' ? (
                          <TouchableOpacity
                            style={[styles.offerBtn, { backgroundColor: '#10B981' }]}
                            onPress={() => {
                              setSelectedOfferApp(app);
                              setOfferModalVisible(true);
                            }}
                          >
                            <Text style={styles.offerBtnText}>View Offer Letter</Text>
                          </TouchableOpacity>
                        ) : (
                          !['accepted', 'declined', 'hired'].includes(appStatus.toLowerCase()) && (
                            <TouchableOpacity style={styles.withdrawBtn} onPress={() => handleWithdraw(app._id)}>
                              <Text style={styles.withdrawText}>Withdraw Application</Text>
                            </TouchableOpacity>
                          )
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </AnimatedSection>
          )}

          {activeTab === 'fairs' && (
            <AnimatedSection delay={80} style={styles.listContainer}>
              {fairs.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Feather name="calendar" size={32} color={themeColors.textMuted} />
                  <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>No job fairs active right now.</Text>
                </View>
              ) : (
                fairs.map((fair) => (
                  <View key={fair._id} style={[styles.jobCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                    <Text style={[styles.fairTitle, { color: themeColors.text }]}>{fair.title}</Text>
                    <Text style={[styles.fairCompany, { color: themeColors.textMuted }]}>{fair.description}</Text>
                    <View style={styles.fairDetailsRow}>
                      <View style={styles.specItem}>
                        <Feather name="calendar" size={12} color={themeColors.textMuted} />
                        <Text style={[styles.specText, { color: themeColors.textMuted }]}>
                          {new Date(fair.date).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.specItem}>
                        <Feather name="map-pin" size={12} color={themeColors.textMuted} />
                        <Text style={[styles.specText, { color: themeColors.textMuted }]} numberOfLines={1}>
                          {fair.location || 'Campus Arena'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </AnimatedSection>
          )}

          {activeTab === 'partners' && (
            <AnimatedSection delay={80} style={styles.partnersGrid}>
              {partners.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Feather name="users" size={32} color={themeColors.textMuted} />
                  <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>No partner data found.</Text>
                </View>
              ) : (
                partners.map((partner) => (
                  <View key={partner._id} style={[styles.partnerCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                    <View style={styles.partnerIconWrap}>
                      <Feather name="briefcase" size={20} color={themeColors.primaryBright} />
                    </View>
                    <Text style={[styles.partnerName, { color: themeColors.text }]} numberOfLines={1}>
                      {partner.name}
                    </Text>
                    <Text style={[styles.partnerType, { color: themeColors.textMuted }]}>
                      {partner.partnerType || 'Employer Partner'}
                    </Text>
                  </View>
                ))
              )}
            </AnimatedSection>
          )}
        </ScrollView>
      )}

      {/* JOB APPLICATION MODAL */}
      <Modal visible={applyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.bg, maxHeight: '90%' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalHeaderTitle, { color: themeColors.text }]} numberOfLines={1}>
                Apply · {applyJob?.displayTitle || applyJob?.title || 'Role'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setApplyModalVisible(false)}
                disabled={applySubmitting}
              >
                <Feather name="x" size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Resume — required by the server, attached automatically. */}
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Your SMAART resume</Text>
              <View
                style={[
                  styles.resumeBox,
                  { backgroundColor: themeColors.card, borderColor: resumeUrl ? '#10B981' : themeColors.border },
                ]}
              >
                {resumeLoading ? (
                  <>
                    <ActivityIndicator size="small" color={themeColors.textMuted} />
                    <Text style={[styles.resumeText, { color: themeColors.textMuted }]}>Attaching…</Text>
                  </>
                ) : resumeUrl ? (
                  <>
                    <Feather name="check-circle" size={16} color="#10B981" />
                    <Text style={[styles.resumeText, { color: themeColors.text }]} numberOfLines={1}>
                      {resumeName} attached
                    </Text>
                  </>
                ) : (
                  <>
                    <Feather name="alert-circle" size={16} color="#F59E0B" />
                    <Text style={[styles.resumeText, { color: themeColors.textMuted }]} numberOfLines={2}>
                      No resume attached
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ResumeBuilder')}>
                      <Text style={styles.resumeAction}>Build one</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Cover letter — 50-word minimum, enforced server-side. */}
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: themeColors.text }]}>Cover letter</Text>
                <Text
                  style={[
                    styles.wordCount,
                    { color: coverLetterWords >= MIN_COVER_LETTER_WORDS ? '#10B981' : themeColors.textMuted },
                  ]}
                >
                  {coverLetterWords}/{MIN_COVER_LETTER_WORDS} words
                </Text>
              </View>
              <TextInput
                style={[
                  styles.modalTextInput,
                  styles.coverLetterInput,
                  { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text },
                ]}
                placeholder={`Why are you right for this role? At least ${MIN_COVER_LETTER_WORDS} words.`}
                placeholderTextColor={themeColors.textMuted}
                value={coverLetter}
                onChangeText={setCoverLetter}
                multiline
                textAlignVertical="top"
                maxLength={MAX_COVER_LETTER_CHARS}
              />

              <Text style={[styles.inputLabel, { color: themeColors.text, marginTop: 14 }]}>Mobile number</Text>
              <TextInput
                style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                placeholder="Where the employer can reach you"
                placeholderTextColor={themeColors.textMuted}
                value={applyMobile}
                onChangeText={setApplyMobile}
                keyboardType="phone-pad"
              />

              <Text style={[styles.inputLabel, { color: themeColors.text, marginTop: 14 }]}>Active backlogs</Text>
              <TextInput
                style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                placeholder="0 if you have none"
                placeholderTextColor={themeColors.textMuted}
                value={activeBacklog}
                onChangeText={(t) => setActiveBacklog(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
              />

              <Text style={[styles.inputLabel, { color: themeColors.text, marginTop: 14 }]}>
                Portfolio link (optional)
              </Text>
              <TextInput
                style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                placeholder="https://"
                placeholderTextColor={themeColors.textMuted}
                value={portfolioUrl}
                onChangeText={setPortfolioUrl}
                autoCapitalize="none"
                keyboardType="url"
              />

              <Text style={[styles.inputLabel, { color: themeColors.text, marginTop: 14 }]}>
                LinkedIn (optional)
              </Text>
              <TextInput
                style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                placeholder="https://linkedin.com/in/…"
                placeholderTextColor={themeColors.textMuted}
                value={linkedInUrl}
                onChangeText={setLinkedInUrl}
                autoCapitalize="none"
                keyboardType="url"
              />

              {applyError ? (
                <View style={styles.applyErrorBox}>
                  <Feather name="alert-circle" size={15} color="#EF4444" />
                  <Text style={styles.applyErrorText}>{applyError}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.applySubmitBtn, { backgroundColor: applySubmitting ? '#64748B' : '#10B981' }]}
                onPress={submitApplication}
                disabled={applySubmitting}
              >
                {applySubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.offerActionText}>Submit application</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* OFFER LETTER RESPOND MODAL */}
      <Modal visible={offerModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.bg, maxHeight: '80%' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalHeaderTitle, { color: themeColors.text }]}>Offer Letter Details</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setOfferModalVisible(false)}>
                <Feather name="x" size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={[styles.offerDetailsBox, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Text style={[styles.offerLabel, { color: themeColors.textMuted }]}>Offered Position</Text>
                <Text style={[styles.offerVal, { color: themeColors.text }]}>
                  {selectedOfferApp?.jobTitle || selectedOfferApp?.job?.displayTitle}
                </Text>
                
                <Text style={[styles.offerLabel, { color: themeColors.textMuted, marginTop: 12 }]}>Annual Package (CTC)</Text>
                <Text style={[styles.offerVal, { color: themeColors.text }]}>
                  {selectedOfferApp?.offeredPackage || 'As discussed'}
                </Text>
              </View>

              <Text style={[styles.inputLabel, { color: themeColors.text, marginTop: 16 }]}>
                Enter Full Name for E-Signature
              </Text>
              <TextInput
                style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                placeholder="Type your name to sign"
                placeholderTextColor={themeColors.textMuted}
                value={signatureText}
                onChangeText={setSignatureText}
              />

              <Text style={[styles.inputLabel, { color: themeColors.text, marginTop: 14 }]}>
                Reason for decline (Optional)
              </Text>
              <TextInput
                style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                placeholder="Reason if declining the offer"
                placeholderTextColor={themeColors.textMuted}
                value={declineReason}
                onChangeText={setDeclineReason}
              />

              <View style={styles.offerActionRow}>
                <TouchableOpacity style={[styles.offerActionBtn, { backgroundColor: '#EF4444' }]} onPress={() => handleRespondOffer('Declined')}>
                  <Text style={styles.offerActionText}>Decline Offer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.offerActionBtn, { backgroundColor: '#10B981' }]} onPress={() => handleRespondOffer('Accepted')}>
                  <Text style={styles.offerActionText}>Accept Offer</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── AI Career Coach entry ──
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    shadowColor: '#045C9A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 5,
  },
  coachIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachTitle: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },
  coachSub: { color: 'rgba(255,255,255,0.85)', fontSize: 11.5, fontWeight: '500', marginTop: 2 },

  // ── Career Directions entry ──
  directionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  directionsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionsTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  directionsSub: { fontSize: 11.5, fontWeight: '500', marginTop: 2 },

  container: {
    flex: 1,
    paddingTop: 20,
  },
  auroraBlob: {
    position: 'absolute',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  tabsContainer: {
    maxHeight: 46,
    marginBottom: 16,
  },
  tabsScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyScroll: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  filtersSection: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  badgeFilters: {
    marginTop: 10,
  },
  filterPill: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '850',
  },
  listContainer: {
    gap: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  jobCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#0F1E42',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 16,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyLogo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInit: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardHeaderInfo: {
    marginLeft: 12,
    flex: 1,
    marginRight: 8,
  },
  jobTitle: {
    fontSize: 14.5,
    fontWeight: '850',
  },
  companyName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  sourceTag: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  sourceTagText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  cardSpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  appliedFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  withdrawBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  withdrawText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  offerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  offerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  fairTitle: {
    fontSize: 15,
    fontWeight: '850',
  },
  fairCompany: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 16,
  },
  fairDetailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  partnersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  partnerCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
  },
  partnerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(4, 92, 154, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  partnerName: {
    fontSize: 12.5,
    fontWeight: '850',
  },
  partnerType: {
    fontSize: 10,
    marginTop: 2,
  },

  /* MODAL OVERLAY STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1.5,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginRight: 10,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    padding: 20,
  },
  detailSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValueText: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  detailGridCell: {
    width: (SCREEN_WIDTH - 60) / 2,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  skillTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  skillTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  applyBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    height: 48,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '850',
  },
  offerDetailsBox: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
  },
  offerLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  offerVal: {
    fontSize: 14,
    fontWeight: '850',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },

  /* JOB APPLICATION FORM */
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 16,
  },
  wordCount: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  coverLetterInput: {
    minHeight: 132,
    paddingTop: 12,
  },
  resumeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  resumeText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
  },
  resumeAction: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3B82F6',
  },
  applyErrorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.28)',
  },
  applyErrorText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#EF4444',
    lineHeight: 18,
  },
  applySubmitBtn: {
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTextInput: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  offerActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  offerActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  offerActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
