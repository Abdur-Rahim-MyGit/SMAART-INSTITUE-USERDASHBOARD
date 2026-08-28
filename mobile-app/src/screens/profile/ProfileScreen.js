import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AppButton from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getRegistration, saveRegistrationSection } from '../../api/profile';
import { getStageStatus } from '../../api/assessments';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ALL_BADGES = [
  { id: 'T1', title: 'Foundation Badge', desc: 'Cleared T1 Baseline Test', icon: '🛡️' },
  { id: 'T2', label: 'Capability Badge', desc: 'Cleared T2 Capability Test', icon: '🏆' },
  { id: 'T3', label: 'Leadership Badge', desc: 'Cleared T3 Leadership Test', icon: '🎖️' },
  { id: 'T4', label: 'Curriculum Master', desc: 'Cleared T4 Final Assessment', icon: '👑' },
  { id: 'PIQ', label: 'Quotient Builder', desc: 'Cleared Personal Intelligence Quotient', icon: '🧍' },
  { id: 'AIQ', label: 'AI Ready Quotient', desc: 'Cleared AI Quotient module', icon: '🤖' },
  { id: 'SQ', label: 'Sustainability Quotient', desc: 'Cleared SQ Quotient module', icon: '🌱' },
];

function AnimatedSection({ children, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 450,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function PressCard({ onPress, disabled, style, children }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} disabled={disabled}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, signOut, refreshUser } = useAuth();
  const { colors: themeColors, theme } = useTheme();

  const [activeTab, setActiveTab] = useState('info'); // 'info' or 'badges'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Profile data structures
  const [regDetails, setRegDetails] = useState(null);
  const [stageStatus, setStageStatus] = useState(null);

  // Edit Sections Modal States
  const [activeSection, setActiveSection] = useState(null); // 'address', 'education'
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Fields States for Form
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('');
  const [zip, setZip] = useState('');

  const [degree, setDegree] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [domain, setDomain] = useState('');

  // Certificate Modal States
  const [certModalVisible, setCertModalVisible] = useState(false);
  const [editingCertIndex, setEditingCertIndex] = useState(null);
  const [certTitle, setCertTitle] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certYear, setCertYear] = useState('');
  const [certUrl, setCertUrl] = useState('');

  const email = user?.email;

  const loadProfileData = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    try {
      const [regData, stageData] = await Promise.all([
        getRegistration(email).catch(() => null),
        getStageStatus(user?._id || user?.id).catch(() => null),
      ]);

      setRegDetails(regData || {});
      if (stageData?.success && stageData?.data) {
        setStageStatus(stageData.data);
      }

      // Initialize form fields
      const pDetails = regData?.personalDetails || {};
      setCity(pDetails.city || '');
      setStateName(pDetails.state || '');
      setCountry(pDetails.country || '');
      setZip(pDetails.zip || '');

      const hEdu = regData?.higherEducation?.[0] || {};
      setDegree(hEdu.degree || '');
      setSpecialization(hEdu.specialization || '');
      setDomain(hEdu.domain || '');
    } catch (err) {
      console.warn('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  }, [email, user]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    await signOut();
    setLogoutLoading(false);
  };

  const openEditSection = (section) => {
    setActiveSection(section);
    setEditModalVisible(true);
  };

  const handleSaveSection = async () => {
    setSaving(true);
    try {
      if (activeSection === 'address') {
        const payload = {
          ...(regDetails?.personalDetails || {}),
          city,
          state: stateName,
          country,
          zip,
        };
        await saveRegistrationSection(email, 'personalDetails', payload);
        Alert.alert('Success', 'Address details updated successfully.');
      } else if (activeSection === 'education') {
        const updatedEdu = [...(regDetails?.higherEducation || [])];
        const eduObj = {
          degree,
          specialization,
          domain,
        };
        if (updatedEdu.length > 0) {
          updatedEdu[0] = { ...updatedEdu[0], ...eduObj };
        } else {
          updatedEdu.push(eduObj);
        }
        await saveRegistrationSection(email, 'higherEducation', updatedEdu);
        Alert.alert('Success', 'Education details updated successfully.');
      }
      setEditModalVisible(false);
      loadProfileData();
      refreshUser();
    } catch (err) {
      Alert.alert('Update Failed', err.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Save / Add Certificate
  const openCertificateEditor = (index = null) => {
    if (index !== null) {
      setEditingCertIndex(index);
      const cert = regDetails?.certificates?.[index] || {};
      setCertTitle(cert.title || '');
      setCertIssuer(cert.issuer || cert.issuingOrg || '');
      setCertYear(cert.yearOfCompletion || '');
      setCertUrl(cert.verificationUrl || cert.link || '');
    } else {
      setEditingCertIndex(null);
      setCertTitle('');
      setCertIssuer('');
      setCertYear('');
      setCertUrl('');
    }
    setCertModalVisible(true);
  };

  const handleSaveCertificate = async () => {
    if (!certTitle.trim()) {
      Alert.alert('Required', 'Please enter certificate title.');
      return;
    }

    setSaving(true);
    try {
      const updatedCerts = [...(regDetails?.certificates || [])];
      const certObj = {
        id: Math.random().toString(36).substr(2, 9),
        title: certTitle,
        issuer: certIssuer,
        issuingOrg: certIssuer,
        yearOfCompletion: certYear,
        verificationType: certUrl ? 'url' : 'none',
        verificationUrl: certUrl,
        link: certUrl,
      };

      if (editingCertIndex !== null) {
        updatedCerts[editingCertIndex] = certObj;
      } else {
        updatedCerts.push(certObj);
      }

      await saveRegistrationSection(email, 'certificates', updatedCerts);
      Alert.alert('Success', 'Certificate details updated.');
      setCertModalVisible(false);
      loadProfileData();
    } catch (err) {
      Alert.alert('Failed to save certificate', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCertificate = async (index) => {
    Alert.alert('Delete Certificate', 'Are you sure you want to remove this certificate?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            const updatedCerts = regDetails.certificates.filter((_, idx) => idx !== index);
            await saveRegistrationSection(email, 'certificates', updatedCerts);
            loadProfileData();
          } catch (err) {
            Alert.alert('Delete Failed', err.message);
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  // Determine Earned Badges
  const earnedBadges = React.useMemo(() => {
    const passed = [];
    if (stageStatus) {
      Object.entries(stageStatus).forEach(([k, v]) => {
        if (v?.completed) passed.push(k);
      });
    }
    return passed;
  }, [stageStatus]);

  const initials = (user?.fullName || 'ST').split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]} edges={['top']}>
      {/* Aurora mesh gradient */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.auroraBlob, { backgroundColor: '#EC4899', top: -100, left: -60, width: 280, height: 280, borderRadius: 140, opacity: theme === 'dark' ? 0.12 : 0.05 }]} />
        <View style={[styles.auroraBlob, { backgroundColor: '#1478B8', bottom: 120, right: -120, width: 340, height: 340, borderRadius: 170, opacity: theme === 'dark' ? 0.1 : 0.04 }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Card Header */}
        <AnimatedSection delay={0}>
          <View style={[styles.profileHeaderCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.avatarCircle, { backgroundColor: themeColors.primaryBright }]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <Text style={[styles.fullName, { color: themeColors.text }]}>{user?.fullName || 'Student Learner'}</Text>
            <Text style={[styles.userEmail, { color: themeColors.textMuted }]}>{user?.email}</Text>
            <View style={styles.badgeBanner}>
              <Feather name="award" size={13} color="#D97706" />
              <Text style={[styles.badgeBannerText, { color: themeColors.text }]}>
                {earnedBadges.length} Milestone Badges Earned
              </Text>
            </View>
          </View>
        </AnimatedSection>

        {/* Tab selector */}
        <AnimatedSection delay={60}>
          <View style={[styles.selectorBar, { backgroundColor: theme === 'dark' ? '#0E3555' : '#EAF7FD' }]}>
            <TouchableOpacity
              style={[styles.selectorBtn, activeTab === 'info' && [styles.selectorBtnActive, { backgroundColor: themeColors.primaryBright }]]}
              onPress={() => setActiveTab('info')}
            >
              <Text style={[styles.selectorText, { color: activeTab === 'info' ? '#FFFFFF' : themeColors.textMuted }]}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selectorBtn, activeTab === 'badges' && [styles.selectorBtnActive, { backgroundColor: themeColors.primaryBright }]]}
              onPress={() => setActiveTab('badges')}
            >
              <Text style={[styles.selectorText, { color: activeTab === 'badges' ? '#FFFFFF' : themeColors.textMuted }]}>Badges</Text>
            </TouchableOpacity>
          </View>
        </AnimatedSection>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={themeColors.primaryBright} />
          </View>
        ) : (
          <View style={styles.tabContent}>
            {/* INFO TAB */}
            {activeTab === 'info' && (
              <View style={styles.sectionsWrap}>
                {/* Personal Section */}
                <AnimatedSection delay={0}>
                <View style={[styles.detailSection, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <Text style={[styles.sectionHeading, { color: themeColors.text }]}>Personal Details</Text>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>Full Name</Text>
                    <Text style={[styles.detailVal, { color: themeColors.text }]}>{user?.fullName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>Email</Text>
                    <Text style={[styles.detailVal, { color: themeColors.text }]}>{user?.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>Mobile</Text>
                    <Text style={[styles.detailVal, { color: themeColors.text }]}>{user?.mobileNumber || 'Not provided'}</Text>
                  </View>
                </View>
                </AnimatedSection>

                {/* Address Section */}
                <AnimatedSection delay={60}>
                <View style={[styles.detailSection, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionHeading, { color: themeColors.text }]}>Contact Address</Text>
                    <TouchableOpacity onPress={() => openEditSection('address')}>
                      <Feather name="edit-2" size={14} color={themeColors.primaryBright} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>City / State</Text>
                    <Text style={[styles.detailVal, { color: themeColors.text }]}>
                      {city || stateName ? `${city}, ${stateName}` : 'Not completed'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>Country / Zip</Text>
                    <Text style={[styles.detailVal, { color: themeColors.text }]}>
                      {country || zip ? `${country} - ${zip}` : 'Not completed'}
                    </Text>
                  </View>
                </View>
                </AnimatedSection>

                {/* Education Section */}
                <AnimatedSection delay={120}>
                <View style={[styles.detailSection, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionHeading, { color: themeColors.text }]}>Education History</Text>
                    <TouchableOpacity onPress={() => openEditSection('education')}>
                      <Feather name="edit-2" size={14} color={themeColors.primaryBright} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>Degree / Specialization</Text>
                    <Text style={[styles.detailVal, { color: themeColors.text }]}>
                      {degree || specialization ? `${degree} in ${specialization}` : 'Not completed'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>Academic Domain</Text>
                    <Text style={[styles.detailVal, { color: themeColors.text }]}>{domain || 'Not completed'}</Text>
                  </View>
                </View>
                </AnimatedSection>

                {/* Institution Row */}
                {user?.collegeDetails && (
                  <AnimatedSection delay={180}>
                  <View style={[styles.detailSection, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                    <Text style={[styles.sectionHeading, { color: themeColors.text }]}>College Details</Text>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>Institution</Text>
                      <Text style={[styles.detailVal, { color: themeColors.text }]}>{user.collegeDetails.name}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: themeColors.textMuted }]}>Campus Address</Text>
                      <Text style={[styles.detailVal, { color: themeColors.text }]} numberOfLines={1}>{user.collegeDetails.address}</Text>
                    </View>
                  </View>
                  </AnimatedSection>
                )}

                {/* Certificates Section */}
                <AnimatedSection delay={240}>
                <View style={[styles.detailSection, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionHeading, { color: themeColors.text }]}>Certifications</Text>
                    <TouchableOpacity onPress={() => openCertificateEditor(null)}>
                      <Feather name="plus" size={15} color={themeColors.primaryBright} />
                    </TouchableOpacity>
                  </View>

                  {(!regDetails?.certificates || regDetails.certificates.length === 0) ? (
                    <Text style={[styles.noCertsText, { color: themeColors.textMuted }]}>
                      No certifications listed. Add certificates to highlight on your placement passport.
                    </Text>
                  ) : (
                    regDetails.certificates.map((cert, index) => (
                      <View key={cert.id || index} style={[styles.certCard, { borderBottomColor: themeColors.border }]}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={[styles.certTitle, { color: themeColors.text }]}>{cert.title}</Text>
                          <Text style={[styles.certIssuer, { color: themeColors.textMuted }]}>
                            {cert.issuer} • {cert.yearOfCompletion}
                          </Text>
                        </View>
                        <View style={styles.certActions}>
                          <TouchableOpacity onPress={() => openCertificateEditor(index)}>
                            <Feather name="edit-2" size={13} color={themeColors.primaryBright} style={{ marginRight: 10 }} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteCertificate(index)}>
                            <Feather name="trash-2" size={13} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
                </AnimatedSection>
              </View>
            )}

            {/* BADGES TAB */}
            {activeTab === 'badges' && (
              <View style={styles.badgesGrid}>
                {ALL_BADGES.map((bd, idx) => {
                  const isEarned = earnedBadges.includes(bd.id);

                  return (
                    <AnimatedSection key={bd.id} delay={idx * 40}>
                      <View
                        style={[
                          styles.badgeCard,
                          { backgroundColor: themeColors.card, borderColor: themeColors.border },
                          !isEarned && { opacity: 0.4 },
                        ]}
                      >
                        <Text style={styles.badgeIcon}>{bd.icon}</Text>
                        <Text style={[styles.badgeName, { color: themeColors.text }]} numberOfLines={1}>
                          {bd.label || bd.title}
                        </Text>
                        <Text style={[styles.badgeDesc, { color: themeColors.textMuted }]} numberOfLines={2}>
                          {bd.desc}
                        </Text>
                        {isEarned && (
                          <View style={styles.earnedTag}>
                            <Feather name="check" size={8} color="#FFFFFF" />
                            <Text style={styles.earnedTagText}>EARNED</Text>
                          </View>
                        )}
                      </View>
                    </AnimatedSection>
                  );
                })}
              </View>
            )}

            {/* Verification & Logout Actions */}
            <View style={{ marginTop: 10, gap: 12 }}>
              <AppButton
                title="Face Verification (Proctored Testing)"
                variant="secondary"
                onPress={() => navigation.navigate('FaceVerificationTest')}
              />
              <AppButton title="Log Out" variant="secondary" onPress={handleLogout} loading={logoutLoading} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* EDIT SECTIONS MODAL */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.bg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalHeaderTitle, { color: themeColors.text }]}>
                Edit {activeSection === 'address' ? 'Address Details' : 'Education Details'}
              </Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setEditModalVisible(false)}>
                <Feather name="x" size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {activeSection === 'address' ? (
                <View>
                  <Text style={[styles.inputLabel, { color: themeColors.text }]}>City</Text>
                  <TextInput
                    style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                    value={city}
                    onChangeText={setCity}
                  />

                  <Text style={[styles.inputLabel, { color: themeColors.text }]}>State</Text>
                  <TextInput
                    style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                    value={stateName}
                    onChangeText={setStateName}
                  />

                  <Text style={[styles.inputLabel, { color: themeColors.text }]}>Country</Text>
                  <TextInput
                    style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                    value={country}
                    onChangeText={setCountry}
                  />

                  <Text style={[styles.inputLabel, { color: themeColors.text }]}>Zip Code</Text>
                  <TextInput
                    style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                    value={zip}
                    onChangeText={setZip}
                  />
                </View>
              ) : (
                <View>
                  <Text style={[styles.inputLabel, { color: themeColors.text }]}>Degree</Text>
                  <TextInput
                    style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                    value={degree}
                    onChangeText={setDegree}
                  />

                  <Text style={[styles.inputLabel, { color: themeColors.text }]}>Specialization</Text>
                  <TextInput
                    style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                    value={specialization}
                    onChangeText={setSpecialization}
                  />

                  <Text style={[styles.inputLabel, { color: themeColors.text }]}>Domain</Text>
                  <TextInput
                    style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                    value={domain}
                    onChangeText={setDomain}
                  />
                </View>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: themeColors.primaryBright }]}
                disabled={saving}
                onPress={handleSaveSection}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Updates</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EDIT CERTIFICATE MODAL */}
      <Modal visible={certModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.bg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalHeaderTitle, { color: themeColors.text }]}>
                {editingCertIndex !== null ? 'Edit Certificate' : 'Add Certificate'}
              </Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setCertModalVisible(false)}>
                <Feather name="x" size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Certificate Title</Text>
              <TextInput
                style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                placeholder="e.g. AWS Cloud Practitioner"
                placeholderTextColor={themeColors.textMuted}
                value={certTitle}
                onChangeText={setCertTitle}
              />

              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Issuing Organization</Text>
              <TextInput
                style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                placeholder="e.g. Amazon Web Services"
                placeholderTextColor={themeColors.textMuted}
                value={certIssuer}
                onChangeText={setCertIssuer}
              />

              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Year of Completion</Text>
              <TextInput
                style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                placeholder="e.g. 2026"
                placeholderTextColor={themeColors.textMuted}
                value={certYear}
                onChangeText={setCertYear}
                keyboardType="numeric"
              />

              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Verification URL (Optional)</Text>
              <TextInput
                style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                placeholder="e.g. https://aws.credentials.com/verify/123"
                placeholderTextColor={themeColors.textMuted}
                value={certUrl}
                onChangeText={setCertUrl}
              />

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: themeColors.primaryBright }]}
                disabled={saving}
                onPress={handleSaveCertificate}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Certificate</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  auroraBlob: {
    position: 'absolute',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  profileHeaderCard: {
    borderRadius: 26,
    borderWidth: 1.5,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0F1E42',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 16,
    elevation: 2,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '850',
  },
  fullName: {
    fontSize: 18,
    fontWeight: '850',
  },
  userEmail: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  badgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    marginTop: 12,
  },
  badgeBannerText: {
    fontSize: 10,
    fontWeight: '800',
  },
  selectorBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    marginBottom: 16,
  },
  selectorBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  selectorBtnActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  selectorText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  tabContent: {
    gap: 16,
  },
  sectionsWrap: {
    gap: 16,
  },
  detailSection: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '850',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.02)',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailVal: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  noCertsText: {
    fontSize: 11.5,
    lineHeight: 16,
    textAlign: 'center',
    paddingVertical: 12,
  },
  certCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  certTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  certIssuer: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  certActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    position: 'relative',
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '850',
  },
  badgeDesc: {
    fontSize: 9.5,
    textAlign: 'center',
    lineHeight: 13,
    marginTop: 2,
  },
  earnedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#10B981',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  earnedTagText: {
    color: '#FFFFFF',
    fontSize: 7.5,
    fontWeight: '900',
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
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalTextInput: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  saveBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
