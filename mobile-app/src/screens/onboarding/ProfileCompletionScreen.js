/**
 * FR-AUTH-12 — Onboarding profile completion.
 *
 * Shown by RootNavigator to any signed-in student whose `isRegistered` is not
 * true. That's the same gate the web dashboard uses to force its
 * ComprehensiveSignup form, so a student who finishes here won't be asked again
 * on the web, and vice versa.
 *
 * Two backend behaviours shape this screen (see api/profile.js for the detail):
 *
 *   • Each step saves through PATCH /users/register-section, which MERGES —
 *     so leaving halfway and coming back later keeps what was already entered.
 *   • Only POST /users/register-details sets `isRegistered = true`, and it
 *     REPLACES the whole subdoc — which is why the final submit reads the
 *     existing record and layers these answers on top rather than posting only
 *     what this screen collected.
 *
 * Scope note: the web form has 11 sections including file uploads (marksheets,
 * certificates). This asks for the four that gate the rest of the product —
 * identity, address, current qualification, and career goals — and leaves the
 * document-upload sections to the web, where the file pickers already exist.
 * Skipping is allowed: nothing in Phase 1 hard-requires a complete profile, and
 * blocking a student out of the app over an optional form would be worse.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AuthScreenLayout from '../../components/AuthScreenLayout';
import PillInput from '../../components/PillInput';
import PillButton from '../../components/PillButton';
import ChipSelect from '../../components/ChipSelect';
import Banner from '../../components/Banner';
import { FadeSlideIn } from '../../components/Motion';
import { useAuth } from '../../context/AuthContext';
import { completeRegistration, getRegistration, saveRegistrationSection } from '../../api/profile';
import { colors, radius } from '../../theme';

const STEPS = ['You', 'Address', 'Education', 'Goals'];

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduated'];

const QUALIFICATIONS = [
  { value: 'undergraduate', label: 'Undergraduate' },
  { value: 'postgraduate', label: 'Postgraduate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'doctorate', label: 'Doctorate' },
];

export default function ProfileCompletionScreen() {
  const { user, college, refreshUser, signOut } = useAuth();
  const email = user?.email;

  const [step, setStep] = useState(0);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — identity
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [mobile, setMobile] = useState(user?.mobileNumber || '');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState(user?.gender || '');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');

  // Step 2 — address
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [pincode, setPincode] = useState('');

  // Step 3 — current qualification
  const [qualificationLevel, setQualificationLevel] = useState('');
  const [degree, setDegree] = useState('');
  const [institutionName, setInstitutionName] = useState(college?.collegeName || '');
  const [yearOfPassing, setYearOfPassing] = useState('');
  const [cgpa, setCgpa] = useState('');

  // Step 4 — goals
  const [shortTerm, setShortTerm] = useState('');
  const [longTerm, setLongTerm] = useState('');

  // Prefill from anything already saved (web progress, or a previous partial
  // run of this wizard) so nothing is retyped.
  useEffect(() => {
    if (!email) {
      setLoadingExisting(false);
      return;
    }
    (async () => {
      try {
        const existing = await getRegistration(email);
        if (existing) {
          setFullName((v) => existing.fullName || v);
          setMobile((v) => existing.mobileNumber || existing.mobile || v);
          setDob((v) => (existing.dob ? String(existing.dob).slice(0, 10) : v));
          setGender((v) => existing.gender || v);
          setDepartment((v) => existing.department || v);
          setYearOfStudy((v) => existing.yearOfStudy || v);

          const addr = existing.address || {};
          setCity((v) => addr.city || v);
          setState((v) => addr.state || v);
          setCountry((v) => addr.country || v);
          setPincode((v) => addr.pincode || v);

          const he = Array.isArray(existing.higherEducation)
            ? existing.higherEducation[0]
            : existing.higherEducation;
          if (he) {
            setQualificationLevel((v) => he.qualificationLevel || v);
            setDegree((v) => he.degree || v);
            setInstitutionName((v) => he.institutionName || v);
            setYearOfPassing((v) => he.yearOfPassing || v);
            setCgpa((v) => he.cgpaPercentage || v);
          }

          const goals = existing.careerGoals || {};
          setShortTerm((v) => goals.shortTerm || v);
          setLongTerm((v) => goals.longTerm || v);
        }
      } catch {
        // A missing record is the normal case for a brand-new account.
      } finally {
        setLoadingExisting(false);
      }
    })();
  }, [email]);

  const higherEducationPayload = useMemo(
    () => [
      {
        qualificationLevel,
        degree,
        degreeFullName: degree,
        specialization: department,
        institutionName,
        university: '',
        location: city,
        yearOfPassing,
        cgpaPercentage: cgpa,
        degreeStatus: yearOfStudy === 'Graduated' ? 'completed' : 'pursuing',
        certificate: '',
      },
    ],
    [qualificationLevel, degree, department, institutionName, city, yearOfPassing, cgpa, yearOfStudy]
  );

  const personalDetailsPayload = useMemo(
    () => ({
      fullName,
      mobileNumber: mobile,
      dob: dob || null,
      gender,
      department,
      yearOfStudy,
      institution: institutionName || college?.collegeName || '',
      cgpa,
      address: { city, state, country, pincode, street: '', district: '' },
    }),
    [fullName, mobile, dob, gender, department, yearOfStudy, institutionName, college, cgpa, city, state, country, pincode]
  );

  /** Validate + persist the current step. Returns false to stay put. */
  const saveStep = useCallback(async () => {
    setError('');

    if (!email) {
      setError('Your session is missing an email address. Please sign out and sign in again.');
      return false;
    }

    if (step === 0) {
      if (!fullName.trim()) {
        setError('Enter your full name.');
        return false;
      }
      if (!/^[0-9]{10}$/.test(mobile)) {
        setError('Enter a valid 10-digit mobile number.');
        return false;
      }
      if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        setError('Date of birth must be in YYYY-MM-DD format.');
        return false;
      }
    }

    if (step === 3 && !shortTerm.trim()) {
      setError('Tell us at least your short-term goal — one line is enough.');
      return false;
    }

    const sectionByStep = [
      ['personalDetails', personalDetailsPayload],
      [
        'address',
        { city, state, country, pincode, street: '', district: '' },
      ],
      ['higherEducation', higherEducationPayload],
      ['careerGoals', { shortTerm, mediumTerm: '', longTerm }],
    ][step];

    setSaving(true);
    try {
      await saveRegistrationSection(email, sectionByStep[0], sectionByStep[1]);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    step,
    fullName,
    mobile,
    dob,
    shortTerm,
    longTerm,
    email,
    personalDetailsPayload,
    higherEducationPayload,
    city,
    state,
    country,
    pincode,
  ]);

  const handleNext = async () => {
    const ok = await saveStep();
    if (!ok) return;

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Final step — flip isRegistered.
    setSaving(true);
    setError('');
    try {
      await completeRegistration({
        email,
        fullName,
        mobileNumber: mobile,
        personalDetails: personalDetailsPayload,
        sections: {
          higherEducation: higherEducationPayload,
          careerGoals: { shortTerm, mediumTerm: '', longTerm },
        },
      });
      // Re-read from the server so `needsProfileCompletion` clears and
      // RootNavigator swaps to the app shell.
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingExisting) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <AuthScreenLayout
      title="Complete your profile"
      subtitle="This unlocks assessments, courses and placement matching"
      onBack={step > 0 ? () => setStep((s) => s - 1) : undefined}
    >
      <FadeSlideIn duration={400}>
      {/* Step indicator */}
      <View style={styles.stepper}>
        {STEPS.map((label, i) => (
          <View key={label} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                i === step && styles.stepDotActive,
                i < step && styles.stepDotDone,
              ]}
            >
              {i < step ? (
                <Feather name="check" size={12} color="#FFFFFF" />
              ) : (
                <Text style={[styles.stepNum, i === step && styles.stepNumActive]}>{i + 1}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
          </View>
        ))}
      </View>

      {step === 0 ? (
        <>
          <PillInput
            label="Full Name"
            icon="user"
            placeholder="Your full name"
            autoCapitalize="words"
            value={fullName}
            onChangeText={setFullName}
          />
          <PillInput
            label="Mobile Number"
            icon="phone"
            placeholder="10-digit number"
            keyboardType="number-pad"
            maxLength={10}
            value={mobile}
            onChangeText={(t) => setMobile(t.replace(/[^0-9]/g, ''))}
          />
          <PillInput
            label="Date of Birth"
            icon="calendar"
            placeholder="YYYY-MM-DD"
            maxLength={10}
            value={dob}
            onChangeText={setDob}
          />
          <ChipSelect label="Gender" options={GENDERS} value={gender} onChange={setGender} />
          <PillInput
            label="Department / Branch"
            icon="book"
            placeholder="e.g. Computer Science"
            autoCapitalize="words"
            value={department}
            onChangeText={setDepartment}
          />
          <ChipSelect
            label="Year of Study"
            options={YEARS}
            value={yearOfStudy}
            onChange={setYearOfStudy}
          />
        </>
      ) : null}

      {step === 1 ? (
        <>
          <PillInput
            label="City"
            icon="map-pin"
            placeholder="City"
            autoCapitalize="words"
            value={city}
            onChangeText={setCity}
          />
          <PillInput
            label="State"
            icon="map"
            placeholder="State"
            autoCapitalize="words"
            value={state}
            onChangeText={setState}
          />
          <PillInput
            label="Country"
            icon="globe"
            placeholder="Country"
            autoCapitalize="words"
            value={country}
            onChangeText={setCountry}
          />
          <PillInput
            label="Pincode"
            icon="hash"
            placeholder="6-digit pincode"
            keyboardType="number-pad"
            maxLength={6}
            value={pincode}
            onChangeText={(t) => setPincode(t.replace(/[^0-9]/g, ''))}
          />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <ChipSelect
            label="Qualification Level"
            options={QUALIFICATIONS}
            value={qualificationLevel}
            onChange={setQualificationLevel}
          />
          <PillInput
            label="Degree"
            icon="award"
            placeholder="e.g. B.Tech, B.Sc, MBA"
            autoCapitalize="characters"
            value={degree}
            onChangeText={setDegree}
          />
          <PillInput
            label="Institution"
            icon="home"
            placeholder="Your college or university"
            autoCapitalize="words"
            value={institutionName}
            onChangeText={setInstitutionName}
          />
          <PillInput
            label="Year of Passing"
            icon="calendar"
            placeholder="e.g. 2027"
            keyboardType="number-pad"
            maxLength={4}
            value={yearOfPassing}
            onChangeText={(t) => setYearOfPassing(t.replace(/[^0-9]/g, ''))}
          />
          <PillInput
            label="CGPA / Percentage"
            icon="trending-up"
            placeholder="e.g. 8.4 or 84"
            keyboardType="decimal-pad"
            value={cgpa}
            onChangeText={setCgpa}
          />
        </>
      ) : null}

      {step === 3 ? (
        <>
          {/* Single-line on purpose — PillInput is a fixed-height pill, and a
              one-liner is all the career-goal fields need. */}
          <PillInput
            label="Short-term goal (next 1–2 years)"
            icon="target"
            placeholder="e.g. Land a backend internship"
            value={shortTerm}
            onChangeText={setShortTerm}
            returnKeyType="next"
          />
          <PillInput
            label="Long-term goal (optional)"
            icon="flag"
            placeholder="e.g. Become a systems architect"
            value={longTerm}
            onChangeText={setLongTerm}
            returnKeyType="done"
          />
          <View style={styles.finalNote}>
            <Feather name="info" size={15} color={colors.primary} />
            <Text style={styles.finalNoteText}>
              You can add marksheets, certificates and projects later from the web dashboard.
            </Text>
          </View>
        </>
      ) : null}

      <Banner variant="error" message={error} />

      <PillButton
        title={step === STEPS.length - 1 ? 'Finish & Enter App' : 'Save & Continue'}
        icon={step === STEPS.length - 1 ? 'check' : 'arrow-right'}
        onPress={handleNext}
        loading={saving}
      />

      <Pressable onPress={signOut} style={styles.footerBtn} hitSlop={8}>
        <Text style={styles.footerNote}>Sign out</Text>
      </Pressable>
      </FadeSlideIn>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },

  stepper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 26,
    paddingHorizontal: 4,
  },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepDotActive: { backgroundColor: '#EAF7FD', borderColor: colors.primary },
  stepDotDone: { backgroundColor: colors.success, borderColor: colors.success },
  stepNum: { fontSize: 11, fontWeight: '800', color: colors.mutedLight },
  stepNumActive: { color: colors.primary },
  stepLabel: { fontSize: 10.5, fontWeight: '700', color: colors.mutedLight },
  stepLabelActive: { color: colors.primary },

  finalNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EAF7FD',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: radius.lg,
    padding: 13,
    marginBottom: 18,
  },
  finalNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    color: '#1E3A8A',
    marginLeft: 9,
  },

  footerBtn: { alignItems: 'center', paddingVertical: 8 },
  footerNote: { fontSize: 12.5, fontWeight: '700', color: colors.muted },
});
