const fs = require('fs');
const path = require('path');

const locales = {
  "en": {
    "home": "Home",
    "my_career_paths": "My Career Paths",
    "view_career_path": "View Career Path",
    "primary_path": "Primary Path",
    "secondary_path": "Secondary Path",
    "tertiary_path": "Tertiary Path",
    "add": "Add"
  },
  "ur": {
    "home": "ہوم",
    "my_career_paths": "میرے کیریئر کے راستے",
    "view_career_path": "کیریئر کا راستہ دیکھیں",
    "primary_path": "پرائمری راستہ",
    "secondary_path": "سیکنڈری راستہ",
    "tertiary_path": "ٹیرشری راستہ",
    "add": "شامل کریں"
  },
  "hi": {
    "home": "होम",
    "my_career_paths": "मेरे करियर पथ",
    "view_career_path": "करियर पथ देखें",
    "primary_path": "प्राथमिक पथ",
    "secondary_path": "माध्यमिक पथ",
    "tertiary_path": "तृतीयक पथ",
    "add": "जोड़ें"
  },
  "fr": {
    "home": "Accueil",
    "my_career_paths": "Mes plans de carrière",
    "view_career_path": "Voir le plan de carrière",
    "primary_path": "Plan primaire",
    "secondary_path": "Plan secondaire",
    "tertiary_path": "Plan tertiaire",
    "add": "Ajouter"
  },
  "kn": {
    "home": "ಮುಖಪುಟ",
    "my_career_paths": "ನನ್ನ ವೃತ್ತಿ ಮಾರ್ಗಗಳು",
    "view_career_path": "ವೃತ್ತಿ ಮಾರ್ಗವನ್ನು ವೀಕ್ಷಿಸಿ",
    "primary_path": "ಪ್ರಾಥಮಿಕ ಮಾರ್ಗ",
    "secondary_path": "ದ್ವಿತೀಯ ಮಾರ್ಗ",
    "tertiary_path": "ತೃತೀಯ ಮಾರ್ಗ",
    "add": "ಸೇರಿಸಿ"
  },
  "ml": {
    "home": "ഹോം",
    "my_career_paths": "എന്റെ കരിയർ പാതകൾ",
    "view_career_path": "കരിയർ പാത കാണുക",
    "primary_path": "പ്രാഥമിക പാത",
    "secondary_path": "ദ്വവതീയ പാത",
    "tertiary_path": "തൃതീയ പാത",
    "add": "ചേർക്കുക"
  },
  "pa": {
    "home": "ਹੋਮ",
    "my_career_paths": "ਮੇਰੇ ਕਰੀਅਰ ਦੇ ਰਸਤੇ",
    "view_career_path": "ਕਰੀਅਰ ਦਾ ਰਸਤਾ ਦੇਖੋ",
    "primary_path": "ਪ੍ਰਾਇਮਰੀ ਰਸਤਾ",
    "secondary_path": "ਸੈਕੰਡਰੀ ਰਸਤਾ",
    "tertiary_path": "ਤਿਆਰੀ ਰਸਤਾ",
    "add": "ਜੋੜੋ"
  },
  "ta": {
    "home": "முகப்பு",
    "my_career_paths": "எனது தொழில் பாதைகள்",
    "view_career_path": "தொழில் பாதையைக் காண்க",
    "primary_path": "முதன்மை பாதை",
    "secondary_path": "இரண்டாம் நிலை பாதை",
    "tertiary_path": "மூன்றாம் நிலை பாதை",
    "add": "சேர்"
  },
  "te": {
    "home": "హోమ్",
    "my_career_paths": "నా కెరీర్ మార్గాలు",
    "view_career_path": "కెరీర్ మార్గాన్ని వీక్షించండి",
    "primary_path": "ప్రాథమిక మార్గం",
    "secondary_path": "ద్వితీయ మార్గం",
    "tertiary_path": "తృతీయ మార్గం",
    "add": "జోడించు"
  }
};

const basePath = path.join(__dirname, 'locales');

Object.keys(locales).forEach(lang => {
  const filePath = path.join(basePath, lang, 'translation.json');
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (!data.dashboard) {
      data.dashboard = {};
    }
    
    const trans = locales[lang];
    Object.keys(trans).forEach(key => {
      data.dashboard[key] = trans[key];
    });
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Updated ${lang} translations.`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});
