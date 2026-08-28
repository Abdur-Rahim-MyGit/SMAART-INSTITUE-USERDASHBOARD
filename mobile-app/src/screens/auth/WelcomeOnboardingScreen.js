import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useCameraPermission } from 'react-native-vision-camera';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { radius, shadow } from '../../theme';
import * as storage from '../../utils/storage';
import { getBiometricCapability, promptBiometric } from '../../utils/biometrics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 24 : 16;

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ur', label: 'اردو' },
];

const TRANSLATIONS = {
  en: {
    next: 'Next Slide',
    finish: 'Continue to Sign In',
    skip: 'Skip Introduction',
    prefTitle: 'App Preferences',
    languageLabel: 'Select Language',
    themeLabel: 'Theme Mode',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    apply: 'Apply Preferences',
    granted: 'Granted',
    grant: 'Grant Access',
    optional: 'Optional',
    enabled: 'Enabled',
    enable: 'Enable',
    active: 'Active',
    notifyLabel: 'Push Alerts',
    slides: [
      {
        title: 'Welcome to SMAART Institute',
        desc: 'AI-Powered Learning & Career Platform. Empowering students with smart campus tools for coursework, schedules, and proctored examinations.'
      },
      {
        title: 'About the Program',
        desc: 'Our academic system covers core educational pillars to guide your skills from initial training to direct career placement.',
        acronym: [
          { l: 'S', t: 'Skills Mastery across interactive lessons' },
          { l: 'M', t: 'Mentorship and peer group collaboration' },
          { l: 'A', t: 'Academics tracking with analytics graphs' },
          { l: 'A', t: 'AI Assessments for secure testing' },
          { l: 'R', t: 'Real-time Bulletins & announcements' },
          { l: 'T', t: 'Training & placement passport' },
        ]
      },
      {
        title: 'Secure AI Assessments',
        desc: 'Take secure proctored exams with local on-device face verification. Smaart ensures test integrity while giving you instant diagnostic feedback.'
      },
      {
        title: 'Verifiable Career Passport',
        desc: 'Unlock placement opportunities and showcase your certified skills. Build a verified Digital Career Passport that connects you with global employers.'
      },
      {
        title: 'System Preferences & Ready',
        desc: 'Ensure required integrations are set up. Enable Camera permission for proctoring exams, and activate biometrics for secure lock access.'
      }
    ]
  },
  hi: {
    next: 'अगली स्लाइड',
    finish: 'लॉगिन पर जाएं',
    skip: 'छोड़ें',
    prefTitle: 'ऐप प्राथमिकताएं',
    languageLabel: 'भाषा चुनें',
    themeLabel: 'थीम मोड',
    lightMode: 'लाइट मोड',
    darkMode: 'डार्क मोड',
    apply: 'लागू करें',
    granted: 'स्वीकृत',
    grant: 'अनुमति दें',
    optional: 'वैकल्पिक',
    enabled: 'सक्षम',
    enable: 'सक्षम करें',
    active: 'सक्रिय',
    notifyLabel: 'पुश नोटिफिकेशन',
    slides: [
      {
        title: 'SMAART संस्थान में आपका स्वागत है',
        desc: 'एआई-संचालित शिक्षण और कैरियर मंच। छात्रों को उनके पाठ्यक्रमों, कार्यक्रम समय और परीक्षाओं के लिए स्मार्ट टूल्स के साथ सशक्त बनाना।'
      },
      {
        title: 'कार्यक्रम के बारे में',
        desc: 'हमारा शैक्षणिक कार्यक्रम प्रारंभिक प्रशिक्षण से लेकर सीधे कैरियर प्लेसमेंट तक आपके कौशल का मार्गदर्शन करता है।',
        acronym: [
          { l: 'S', t: 'Skills - इंटरैक्टिव पाठों के माध्यम से कौशल विकास' },
          { l: 'M', t: 'Mentorship - सहकर्मियों और सलाहकारों के साथ सहयोग' },
          { l: 'A', t: 'Academics - विश्लेषिकी ग्राफ के साथ शैक्षिक प्रगति' },
          { l: 'A', t: 'AI Assessments - सुरक्षित एआई मूल्यांकन' },
          { l: 'R', t: 'Results - रीयल-टाइम परिणाम और घोषणाएं' },
          { l: 'T', t: 'Training - प्रशिक्षण और वैश्विक प्लेसमेंट' },
        ]
      },
      {
        title: 'सुरक्षित एआई मूल्यांकन',
        desc: 'ऑन-डिवाइस चेहरा सत्यापन के साथ सुरक्षित एआई-प्रॉक्टर्ड परीक्षाएं लें। सार्ट टेस्ट अखंडता सुनिश्चित करता है और रिपोर्ट देता है।'
      },
      {
        title: 'कौशल पासपोर्ट',
        desc: 'अपने प्रमाणित कौशल को प्रदर्शित करें। एक डिजिटल कैरियर पासपोर्ट बनाएं जो आपको दुनिया भर के शीर्ष नियोक्ताओं से जोड़ता है।'
      },
      {
        title: 'शुरू करने के लिए तैयार?',
        desc: 'सुचारू संचालन और त्वरित लॉगिन सुनिश्चित करने के लिए नीचे दी गई आवश्यक अनुमतियां सक्षम करें।'
      }
    ]
  },
  ta: {
    next: 'அடுத்த பக்கம்',
    finish: 'உள்நுழைய செல்லவும்',
    skip: 'தவிர்க்கவும்',
    prefTitle: 'விருப்பத்தேர்வுகள்',
    languageLabel: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    themeLabel: 'தீம் பயன்முறை',
    lightMode: 'லைட் பயன்முறை',
    darkMode: 'டார்க் பயன்முறை',
    apply: 'பயன்படுத்துக',
    granted: 'அனுமதிக்கப்பட்டது',
    grant: 'அனுமதி வழங்குக',
    optional: 'விருப்பத்திற்குரியது',
    enabled: 'செயல்படுத்தப்பட்டது',
    enable: 'செயல்படுத்து',
    active: 'செயலில் உள்ளது',
    notifyLabel: 'அறிவிப்புகள்',
    slides: [
      {
        title: 'SMAART கல்வி நிறுவனத்திற்கு வரவேற்கிறோம்',
        desc: 'AI-ஆல் இயங்கும் கற்றல் தளம். பாடநெறிகள், அட்டவணைகள் மற்றும் தேர்வுகளுக்கான ஸ்மார்ட் கேம்பஸ் கருவிகள்.'
      },
      {
        title: 'பாடநெறி திட்டம் பற்றி',
        desc: 'எங்கள் கல்வி முறை முதற்கட்ட பயிற்சி முதல் வேலை வாய்ப்பு வரை உங்களது திறன்களை வழிநடத்துகிறது.',
        acronym: [
          { l: 'S', t: 'Skills - திறன்களை மேம்படுத்தும் பாடங்கள்' },
          { l: 'M', t: 'Mentorship - ஆசிரியர்கள் மற்றும் நண்பர்களின் வழிகாட்டுதல்' },
          { l: 'A', t: 'Academics - கல்வி பகுப்பாய்வு வரைபடங்கள்' },
          { l: 'A', t: 'AI Assessments - பாதுகாப்பான AI தேர்வுகள்' },
          { l: 'R', t: 'Results - உடனடி முடிவுகள் மற்றும் அறிவிப்புகள்' },
          { l: 'T', t: 'Training - பயிற்சி மற்றும் வேலை வாய்ப்புகள்' },
        ]
      },
      {
        title: 'பாதுகாப்பான AI மதிப்பீடுகள்',
        desc: 'முக அங்கீகாரத்துடன் கூடிய பாதுகாப்பான AI தேர்வுகளை எழுதுங்கள். உடனடி முடிவுகள் மற்றும் பகுப்பாய்வுகளைப் பெறுங்கள்.'
      },
      {
        title: 'சரிபார்க்கக்கூடிய திறன் பாஸ்போர்ட்',
        desc: 'உங்களது சான்றளிக்கப்பட்ட திறன்களைக் கொண்டு டிஜிட்டல் பாஸ்போர்ட் உருவாக்கி உலகளாவிய வேலை வாய்ப்புகளைப் பெறுங்கள்.'
      },
      {
        title: 'தொடங்க தயாராக உள்ளீர்களா?',
        desc: 'விரைவான உள்நுழைவு மற்றும் பாதுகாப்பான தேர்வுகளுக்கான தேவையான சாதன அனுமதிகளை வழங்கவும்.'
      }
    ]
  },
  te: {
    next: 'తదుపరి స్లైడ్',
    finish: 'లాగిన్ అవ్వండి',
    skip: 'దాటవేయి',
    prefTitle: 'యాప్ ప్రాధాన్యతలు',
    languageLabel: 'భాషను ఎంచుకోండి',
    themeLabel: 'థీమ్ మోడ్',
    lightMode: 'లైట్ మోడ్',
    darkMode: 'డార్క్ మోడ్',
    apply: 'వర్తింపజేయి',
    granted: 'అనుమతించబడింది',
    grant: 'అనుమతి ఇవ్వండి',
    optional: 'ఐచ్ఛికం',
    enabled: 'ప్రారంభించబడింది',
    enable: 'ప్రారంభించు',
    active: 'సక్రియంగా ఉంది',
    notifyLabel: 'పుష్ నోటిఫికేషన్లు',
    slides: [
      {
        title: 'SMAART ఇన్స్టిట్యూట్‌కు స్వాగతం',
        desc: 'AI-ఆధారిత లెర్నింగ్ & కెరీర్ ప్లాట్‌ఫారమ్. విద్యార్థుల కోసం స్మార్ట్ క్యాంపస్ టూల్స్.'
      },
      {
        title: 'విద్యా కార్యక్రమం గురించి',
        desc: 'మా విద్యా విధానం ప్రారంభ శిక్షణ నుండి నేరుగా ఉద్యోగం పొందే వరకు మీ నైపుణ్యాలకు మార్గనిర్దేశం చేస్తుంది.',
        acronym: [
          { l: 'S', t: 'Skills - ఇంటరాక్టివ్ పాఠాల ద్వారా నైపుణ్యాలు' },
          { l: 'M', t: 'Mentorship - సహచరులు మరియు సలహాదారుల సహకారం' },
          { l: 'A', t: 'Academics - విశ్లేషణ గ్రాఫ్‌లతో విద్యా పురోగతి' },
          { l: 'A', t: 'AI Assessments - సురక్షితమైన AI పరీక్షలు' },
          { l: 'R', t: 'Results - తక్షణ ఫలితాలు మరియు ప్రకటనలు' },
          { l: 'T', t: 'Training - శిక్షణ మరియు గ్లోబల్ ప్లేస్‌మెంట్‌లు' },
        ]
      },
      {
        title: 'సురక్షితమైన AI అసెస్‌మెంట్లు',
        desc: 'ఫేస్ వెరిఫికేషన్‌తో సురక్షితమైన AI పరీక్షలను రాయండి. తక్షణ ఫలితాలు మరియు నివేదికలను పొందండి.'
      },
      {
        title: 'స్కిల్స్ పాస్‌పోర్ట్',
        desc: 'మీ నైపుణ్యాలను ప్రదర్శించే డిజిటల్ కెరీర్ పాస్‌పోర్ట్ సృష్టించి గ్లోబల్ ఉద్యోగ అవకాశాలను పొందండి.'
      },
      {
        title: 'ప్రారంభించడానికి సిద్ధంగా ఉన్నారా?',
        desc: 'వేగవంతమైన లాగిన్ మరియు పరీక్షల కొరకు అవసరమైన అనుమతులను కింద ప్రారంభించండి.'
      }
    ]
  },
  ur: {
    next: 'اگلی سلائیڈ',
    finish: 'سائن ان کریں',
    skip: 'چھوڑیں',
    prefTitle: 'ایپ کی ترجیحات',
    languageLabel: 'زبان منتخب کریں',
    themeLabel: 'تھیم mode',
    lightMode: 'لائٹ موڈ',
    darkMode: 'ڈارک موڈ',
    apply: 'ترجیحات لاگو کریں',
    granted: 'منظور شدہ',
    grant: 'اجازت دیں',
    optional: 'اختیاری',
    enabled: 'فعال',
    enable: 'فعال کریں',
    active: 'سرگرم',
    notifyLabel: 'اطلاعات',
    slides: [
      {
        title: 'SMAART انسٹی ٹیوٹ میں خوش آمدید',
        desc: 'AI سے چلنے والا تعلیمی اور کیریئر پلیٹ فارم۔ طلباء کو ان کے کورسز اور امتحانات کے لیے سمارٹ ٹولز فراہم کرنا۔'
      },
      {
        title: 'پروگرام کے بارے میں',
        desc: 'ہمارا تعلیمی نظام بنیادی تربیتی کورسز سے لے کر براہ راست کیریئر پلیسمنٹ تک آپ کی مہارتوں کی رہنمائی کرتا ہے۔',
        acronym: [
          { l: 'S', t: 'Skills - انٹرایکٹو اسباق کے ذریعے مہارت' },
          { l: 'M', t: 'Mentorship - ساتھیوں اور اساتذہ کا تعاون' },
          { l: 'A', t: 'Academics - تعلیمی گراف کے ساتھ کارکردگی' },
          { l: 'A', t: 'AI Assessments - محفوظ AI امتحانات' },
          { l: 'R', t: 'Results - رئیل ٹائم نتائج اور اعلانات' },
          { l: 'T', t: 'Training - تربیت اور عالمی ملازمتیں' },
        ]
      },
      {
        title: 'محفوظ AI امتحانات',
        desc: 'لوکل فیس ویری فیکیشن کے ساتھ محفوظ آن لائن امتحانات دیں۔ اور فوری تشخیصی نتائج حاصل کریں۔'
      },
      {
        title: 'تصدیق شدہ مہارت پاسپورٹ',
        desc: 'اپنی صلاحیتوں کو اجاگر کرنے کے لیے ڈیجیٹل کیریئر پاسپورٹ بنائیں اور عالمی کمپنیوں میں ملازمتیں حاصل کریں۔'
      },
      {
        title: 'شروع کرنے کے لیے تیار ہیں؟',
        desc: 'بہتر کارکردگی اور فوری سائن ان کے لیے ضروری ڈیوائس کی اجازتیں فراہم کریں۔'
      }
    ]
  }
};

export default function WelcomeOnboardingScreen({ navigation }) {
  const { biometricEnabled, setBiometricPreference } = useAuth();
  const { theme, toggleTheme, colors: themeColors } = useTheme();
  
  // Conditionally call hook unconditionally to satisfy Hook rules
  const cameraPerm = Platform.OS !== 'web' ? useCameraPermission() : { hasPermission: true, requestPermission: () => Promise.resolve(true) };
  const hasCameraPermission = Platform.OS === 'web' ? true : cameraPerm.hasPermission;
  const requestCameraPermission = Platform.OS === 'web' ? () => {} : cameraPerm.requestPermission;

  const [activeSlide, setActiveSlide] = useState(0);
  const [bioCapable, setBioCapable] = useState({ available: false, enrolled: false, label: 'Biometrics' });
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [langCode, setLangCode] = useState('en');
  const [pushEnabled, setPushEnabled] = useState(true);

  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  // Animations for floating assets
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  // Retrieve current translations
  const t = TRANSLATIONS[langCode] || TRANSLATIONS.en;

  // Check if onboarding completed previously
  useEffect(() => {
    (async () => {
      try {
        const completed = await storage.getItem('smaart_onboarding_completed');
        const savedLang = await storage.getItem('smaart_pref_language');
        if (savedLang) {
          setLangCode(savedLang);
        }
        if (completed === 'true') {
          navigation.replace('Login');
        } else {
          setCheckingOnboarding(false);
        }
      } catch {
        setCheckingOnboarding(false);
      }
    })();
  }, [navigation]);

  useEffect(() => {
    if (checkingOnboarding) return;

    // Check biometrics capability
    getBiometricCapability().then(setBioCapable);

    // Floating animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    // Pulse animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.9, duration: 3000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, [checkingOnboarding]);

  const handleNext = () => {
    if (activeSlide < 4) {
      scrollViewRef.current?.scrollTo({
        x: (activeSlide + 1) * SCREEN_WIDTH,
        animated: true,
      });
      setActiveSlide(activeSlide + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handleCompleteOnboarding = async () => {
    await storage.setItem('smaart_onboarding_completed', 'true');
    await storage.setItem('smaart_pref_language', langCode);
    navigation.replace('Login');
  };

  const handleRequestCamera = async () => {
    if (!hasCameraPermission) {
      await requestCameraPermission();
    }
  };

  const handleToggleBiometrics = async () => {
    if (!biometricEnabled) {
      const res = await promptBiometric('Enable biometric access for SMAART');
      if (res.success) {
        await setBiometricPreference(true);
      }
    } else {
      await setBiometricPreference(false);
    }
  };

  const handleScroll = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / SCREEN_WIDTH);
    if (index !== activeSlide && index >= 0 && index <= 4) {
      setActiveSlide(index);
    }
  };

  // Determine Logo based on current context theme
  const logoSource = theme === 'dark'
    ? require('../../../assets/smaart-logo.png')
    : require('../../../assets/new_smaart_logo_light.png');
  // Icon-only mark for the header brand lockup — a flattened raster wordmark
  // reads as a small blurry box at header size; the icon + real <Text> below
  // renders crisp at any size and lets us actually control the hierarchy.
  const markSource = theme === 'dark'
    ? require('../../../assets/smaart-mark.png')
    : require('../../../assets/smaart-mark-navy.png');

  if (checkingOnboarding) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: themeColors.bg }]}>
        <RNStatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />
        <Image
          source={logoSource}
          style={styles.loadingLogo}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <RNStatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />

      {/* Pulsing Ambient Background Blobs */}
      <Animated.View style={[styles.blob, styles.blob1, { opacity: pulseAnim }]} />
      <Animated.View style={[styles.blob, styles.blob2, { opacity: pulseAnim }]} />

      {/* Header bar with Settings trigger */}
      <View style={styles.headerBar}>
        <View style={styles.brandHeader}>
          <View style={styles.brandRow}>
            <Image source={markSource} style={styles.brandMark} resizeMode="contain" />
            <View>
              <Text style={[styles.brandName, { color: themeColors.text }]}>SMAART</Text>
              <Text style={[styles.brandNameSub, { color: themeColors.textMuted }]}>INSTITUTE</Text>
            </View>
          </View>
          <Text style={[styles.brandSubtitle, { color: themeColors.primaryBright || '#3B82F6' }]}>
            STUDENT PORTAL
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.prefBtn,
            pressed && styles.prefBtnPressed,
            { backgroundColor: themeColors.card, borderColor: themeColors.border }
          ]}
          onPress={() => setModalVisible(true)}
          hitSlop={12}
        >
          <Feather name="settings" size={18} color={themeColors.text} />
          <Text style={[styles.prefBtnText, { color: themeColors.text }]}>Prefs</Text>
        </Pressable>
      </View>

      {/* Horizontal Scroll Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {/* Slide 1: Welcome & Logo First (With animated student avatars visual) */}
        <View style={styles.slide}>
          <View style={styles.visualContainer}>
            <Animated.View
              style={[
                styles.avatarCluster,
                {
                  transform: [
                    {
                      translateY: floatAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -10],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.avatarCircle, styles.avatarCircleLeft, { borderColor: themeColors.border }]}>
                <Image source={require('../../../assets/avatar_boy1.png')} style={styles.avatarImg} />
              </View>
              <View style={[styles.avatarCircle, styles.avatarCircleRight, { borderColor: themeColors.border }]}>
                <Image source={require('../../../assets/avatar_boy2.png')} style={styles.avatarImg} />
              </View>
              <View style={[styles.avatarCircle, styles.avatarCircleBottom, { borderColor: themeColors.border }]}>
                <Image source={require('../../../assets/avatar_girl.png')} style={styles.avatarImg} />
              </View>
            </Animated.View>
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.slideTitle, { color: themeColors.text }]}>{t.slides[0].title}</Text>
            <Text style={[styles.slideDesc, { color: themeColors.textMuted }]}>{t.slides[0].desc}</Text>
          </View>
        </View>

        {/* Slide 2: About the Program (With acronym details list and minimal_student vector image) */}
        <View style={styles.slide}>
          <View style={styles.visualContainer}>
            <Animated.Image
              source={require('../../../assets/minimal_student.png')}
              style={[
                styles.featureImage,
                {
                  transform: [
                    {
                      translateY: floatAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -8],
                      }),
                    },
                  ],
                },
              ]}
              resizeMode="contain"
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.slideTitle, { color: themeColors.text }]}>{t.slides[1].title}</Text>
            <Text style={[styles.slideDesc, { color: themeColors.textMuted }]}>{t.slides[1].desc}</Text>
            
            {/* Acronym Grid */}
            <View style={[styles.acronymCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              {t.slides[1].acronym.map((item, idx) => (
                <View key={idx} style={styles.acronymRow}>
                  <View style={[styles.acronymLetterWrap, { backgroundColor: themeColors.pillBg }]}>
                    <Text style={[styles.acronymLetter, { color: themeColors.primaryBright }]}>{item.l}</Text>
                  </View>
                  <Text style={[styles.acronymText, { color: themeColors.textMuted }]} numberOfLines={1}>
                    {item.t}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Slide 3: Secure AI Assessments (Using custom generated 3D illustration) */}
        <View style={styles.slide}>
          <View style={styles.visualContainer}>
            <Animated.Image
              source={require('../../../assets/ai_assessment_career.jpg')}
              style={[
                styles.featureImage,
                {
                  transform: [
                    {
                      translateY: floatAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -12],
                      }),
                    },
                  ],
                },
              ]}
              resizeMode="contain"
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.slideTitle, { color: themeColors.text }]}>{t.slides[2].title}</Text>
            <Text style={[styles.slideDesc, { color: themeColors.textMuted }]}>{t.slides[2].desc}</Text>
          </View>
        </View>

        {/* Slide 4: Digital Career Passport (With assessment_rocket vector image) */}
        <View style={styles.slide}>
          <View style={styles.visualContainer}>
            <Animated.Image
              source={require('../../../assets/assessment_rocket.png')}
              style={[
                styles.featureImage,
                {
                  transform: [
                    {
                      translateY: floatAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -10],
                      }),
                    },
                  ],
                },
              ]}
              resizeMode="contain"
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.slideTitle, { color: themeColors.text }]}>{t.slides[3].title}</Text>
            <Text style={[styles.slideDesc, { color: themeColors.textMuted }]}>{t.slides[3].desc}</Text>
          </View>
        </View>

        {/* Slide 5: System Permissions */}
        <View style={styles.slide}>
          <View style={[styles.permissionsContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.permissionsTitle, { color: themeColors.text }]}>Required Approvals</Text>
            <Text style={[styles.permissionsSubtitle, { color: themeColors.textMuted }]}>
              Smaart requires secure integrations for proctoring and unlock authentication.
            </Text>

            {/* Permission Option 1: Camera */}
            <Pressable
              style={({ pressed }) => [
                styles.permissionItem,
                hasCameraPermission && styles.permissionItemActive,
                pressed && styles.permissionItemPressed,
                { backgroundColor: themeColors.bg, borderColor: hasCameraPermission ? 'rgba(59, 130, 246, 0.2)' : 'transparent' }
              ]}
              onPress={handleRequestCamera}
            >
              <View style={[styles.permissionIconWrap, hasCameraPermission && { backgroundColor: themeColors.primary }]}>
                <Feather name="camera" size={20} color={hasCameraPermission ? '#FFFFFF' : themeColors.textMuted} />
              </View>
              <View style={styles.permissionInfo}>
                <Text style={[styles.permissionLabel, { color: themeColors.text }]}>Camera Access</Text>
                <Text style={[styles.permissionDesc, { color: themeColors.textMuted }]}>Used for local face proctoring validation.</Text>
              </View>
              <Text style={[styles.permissionStatus, { color: hasCameraPermission ? themeColors.success : themeColors.textMuted }]}>
                {hasCameraPermission ? t.granted : t.grant}
              </Text>
            </Pressable>

            {/* Permission Option 2: Biometrics */}
            {bioCapable.available && (
              <Pressable
                style={({ pressed }) => [
                  styles.permissionItem,
                  biometricEnabled && styles.permissionItemActive,
                  pressed && styles.permissionItemPressed,
                  { backgroundColor: themeColors.bg, borderColor: biometricEnabled ? 'rgba(59, 130, 246, 0.2)' : 'transparent' }
                ]}
                onPress={handleToggleBiometrics}
              >
                <View style={[styles.permissionIconWrap, biometricEnabled && { backgroundColor: themeColors.primary }]}>
                  <Feather name="shield" size={20} color={biometricEnabled ? '#FFFFFF' : themeColors.textMuted} />
                </View>
                <View style={styles.permissionInfo}>
                  <Text style={[styles.permissionLabel, { color: themeColors.text }]}>{bioCapable.label} Unlock</Text>
                  <Text style={[styles.permissionDesc, { color: themeColors.textMuted }]}>{t.optional} - quick secure access.</Text>
                </View>
                <Text style={[styles.permissionStatus, { color: biometricEnabled ? themeColors.success : themeColors.primaryBright }]}>
                  {biometricEnabled ? t.enabled : t.enable}
                </Text>
              </Pressable>
            )}

            {/* Permission Option 3: Notifications */}
            <View style={[
              styles.permissionItem,
              pushEnabled && styles.permissionItemActive,
              { backgroundColor: themeColors.bg, borderColor: pushEnabled ? 'rgba(59, 130, 246, 0.2)' : 'transparent' }
            ]}>
              <View style={[styles.permissionIconWrap, pushEnabled && { backgroundColor: themeColors.primary }]}>
                <Feather name="bell" size={20} color={pushEnabled ? '#FFFFFF' : themeColors.textMuted} />
              </View>
              <View style={styles.permissionInfo}>
                <Text style={[styles.permissionLabel, { color: themeColors.text }]}>Push Notifications</Text>
                <Text style={[styles.permissionDesc, { color: themeColors.textMuted }]}>Alerts for schedules and notices.</Text>
              </View>
              <Text style={[styles.permissionStatus, { color: themeColors.success }]}>{t.active}</Text>
            </View>
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.slideTitle, { color: themeColors.text }]}>{t.slides[4].title}</Text>
            <Text style={[styles.slideDesc, { color: themeColors.textMuted }]}>{t.slides[4].desc}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Pagination Footer */}
      <View style={styles.footer}>
        <View style={styles.pagingDotsWrap}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                activeSlide === i && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            pressed && styles.ctaBtnPressed,
            { backgroundColor: themeColors.primary }
          ]}
          onPress={handleNext}
        >
          <Text style={styles.ctaBtnText}>
            {activeSlide === 4 ? t.finish : t.next}
          </Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" />
        </Pressable>

        <Pressable onPress={handleCompleteOnboarding} style={styles.skipBtn}>
          <Text style={[styles.skipBtnText, { color: themeColors.textMuted }]}>{t.skip}</Text>
        </Pressable>
      </View>

      {/* Preferences Pop-up Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>{t.prefTitle}</Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
                hitSlop={8}
              >
                <Feather name="x" size={20} color={themeColors.text} />
              </Pressable>
            </View>

            {/* Language Selector Section */}
            <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>{t.languageLabel}</Text>
            <View style={styles.languageGrid}>
              {LANGUAGES.map((lang) => {
                const isActive = langCode === lang.code;
                return (
                  <Pressable
                    key={lang.code}
                    style={[
                      styles.langBtn,
                      { borderColor: themeColors.border },
                      isActive && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
                    ]}
                    onPress={() => setLangCode(lang.code)}
                  >
                    <Text style={[styles.langBtnText, { color: isActive ? '#FFFFFF' : themeColors.text }]}>
                      {lang.label}
                    </Text>
                    {isActive && <Feather name="check" size={12} color="#FFFFFF" style={{ marginLeft: 4 }} />}
                  </Pressable>
                );
              })}
            </View>

            {/* Theme Toggle Section */}
            <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.preferenceLabelText, { color: themeColors.text }]}>{t.themeLabel}</Text>
                <Text style={[styles.preferenceDescText, { color: themeColors.textMuted }]}>
                  {theme === 'dark' ? t.darkMode : t.lightMode}
                </Text>
              </View>
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: '#94A3B8', true: '#3B82F6' }}
                thumbColor={Platform.OS === 'ios' ? undefined : (theme === 'dark' ? '#2563EB' : '#F1F5F9')}
              />
            </View>

            {/* Push Notifications Section */}
            <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
            <View style={styles.preferenceRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.preferenceLabelText, { color: themeColors.text }]}>{t.notifyLabel}</Text>
                <Text style={[styles.preferenceDescText, { color: themeColors.textMuted }]}>
                  Enable campus schedule reminders
                </Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: '#94A3B8', true: '#3B82F6' }}
                thumbColor={Platform.OS === 'ios' ? undefined : (pushEnabled ? '#2563EB' : '#F1F5F9')}
              />
            </View>

            {/* Apply Action */}
            <Pressable
              style={({ pressed }) => [
                styles.applyBtn,
                pressed && styles.applyBtnPressed,
                { backgroundColor: themeColors.primary }
              ]}
              onPress={async () => {
                await storage.setItem('smaart_pref_language', langCode);
                setModalVisible(false);
              }}
            >
              <Text style={styles.applyBtnText}>{t.apply}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    width: 220,
    height: 75,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    width: 280,
    height: 280,
  },
  blob1: {
    top: -50,
    left: -50,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  blob2: {
    bottom: 120,
    right: -50,
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 12,
  },
  brandHeader: {
    alignItems: 'flex-start',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandMark: {
    width: 34,
    height: 34,
    marginRight: 10,
  },
  brandName: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.2,
    lineHeight: 21,
  },
  brandNameSub: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 2.4,
    lineHeight: 13,
  },
  brandSubtitle: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 6,
    marginLeft: 44,
  },
  prefBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1.2,
  },
  prefBtnPressed: {
    opacity: 0.8,
  },
  prefBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  visualContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCluster: {
    width: 200,
    height: 180,
    position: 'relative',
  },
  avatarCircle: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: 'hidden',
    borderWidth: 3,
  },
  avatarCircleLeft: {
    top: 10,
    left: 10,
    backgroundColor: '#FBCFE8',
  },
  avatarCircleRight: {
    top: 10,
    right: 10,
    backgroundColor: '#BAE6FD',
  },
  avatarCircleBottom: {
    bottom: 10,
    left: 62,
    backgroundColor: '#FED7AA',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  featureImage: {
    width: '90%',
    height: '100%',
    borderRadius: radius.lg,
  },
  textContainer: {
    marginTop: 18,
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 23,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 30,
  },
  slideDesc: {
    fontSize: 13.5,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    paddingHorizontal: 10,
  },
  acronymCard: {
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 12,
    marginTop: 14,
  },
  acronymCardContent: {
    backgroundColor: 'transparent',
  },
  acronymRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  acronymLetterWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  acronymLetter: {
    fontSize: 12,
    fontWeight: '900',
  },
  acronymText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  permissionsContainer: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: 16,
    height: 240,
    justifyContent: 'center',
  },
  permissionsTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  permissionsSubtitle: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  permissionItemActive: {
    opacity: 1,
  },
  permissionItemPressed: {
    opacity: 0.8,
  },
  permissionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  permissionDesc: {
    fontSize: 10,
    marginTop: 1,
  },
  permissionStatus: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  pagingDotsWrap: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(120, 120, 120, 0.2)',
    marginHorizontal: 3.5,
  },
  activeDot: {
    width: 18,
    backgroundColor: '#3B82F6',
  },
  ctaBtn: {
    width: '100%',
    height: 52,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.button,
  },
  ctaBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  ctaBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 8,
  },
  skipBtn: {
    paddingVertical: 10,
    marginTop: 6,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1.2,
    marginRight: 8,
    marginBottom: 8,
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dividerLine: {
    height: 1.2,
    width: '100%',
    marginVertical: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceLabelText: {
    fontSize: 14,
    fontWeight: '800',
  },
  preferenceDescText: {
    fontSize: 11,
    marginTop: 2,
  },
  applyBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    ...shadow.button,
  },
  applyBtnPressed: {
    opacity: 0.9,
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
