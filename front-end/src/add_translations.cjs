const fs = require('fs');
const path = require('path');

const locales = {
  "en": {
    "home": "Home",
    "my_career_paths": "My Career Paths",
    "view_career_path": "View Career Path",
    "continue_path": "Continue Path",
    "primary_path": "Primary Path",
    "secondary_path": "Secondary Path",
    "tertiary_path": "Tertiary Path",
    "active_skills_to_master": "Active Skills to Master",
    "track_targeted_skills": "Track your targeted skills across your career directions",
    "no_active_skills": "No active skills in this pathway.",
    "jump_into_roadmap": "Jump into the Career Roadmap for",
    "to_start_mastering": "to start mastering new skills!",
    "add": "Add",
    "no_tasks": "No tasks",
    "tasks_count": "{{completed}} of {{total}} completed"
  },
  "ur": {
    "home": "ہوم",
    "my_career_paths": "میرے کیریئر کے راستے",
    "view_career_path": "کیریئر کا راستہ دیکھیں",
    "continue_path": "راستہ جاری رکھیں",
    "primary_path": "پرائمری راستہ",
    "secondary_path": "سیکنڈری راستہ",
    "tertiary_path": "ٹیرشری راستہ",
    "active_skills_to_master": "سیکھنے کے لیے فعال مہارتیں",
    "track_targeted_skills": "اپنے کیریئر کی سمتوں میں اپنی مطلوبہ مہارتوں کو ٹریک کریں",
    "no_active_skills": "اس راستے میں کوئی فعال مہارتیں نہیں ہیں۔",
    "jump_into_roadmap": "کیریئر روڈ میپ پر جائیں برائے",
    "to_start_mastering": "نئی مہارتیں سیکھنا شروع کرنے کے لیے!",
    "add": "شامل کریں",
    "no_tasks": "کوئی کام نہیں",
    "tasks_count": "{{total}} میں سے {{completed}} مکمل"
  },
  "hi": {
    "home": "होम",
    "my_career_paths": "मेरे करियर पथ",
    "view_career_path": "करियर पथ देखें",
    "continue_path": "पथ जारी रखें",
    "primary_path": "प्राथमिक पथ",
    "secondary_path": "माध्यमिक पथ",
    "tertiary_path": "तृतीयक पथ",
    "active_skills_to_master": "सक्रिय कौशल सीखने के लिए",
    "track_targeted_skills": "अपने करियर दिशाओं में अपने लक्षित कौशलों को ट्रैक करें",
    "no_active_skills": "इस पथ में कोई सक्रिय कौशल नहीं है।",
    "jump_into_roadmap": "करियर रोडमैप पर जाएं",
    "to_start_mastering": "नए कौशल सीखना शुरू करने के लिए!",
    "add": "जोड़ें",
    "no_tasks": "कोई कार्य नहीं",
    "tasks_count": "{{total}} में से {{completed}} पूरे हुए"
  },
  "fr": {
    "home": "Accueil",
    "my_career_paths": "Mes plans de carrière",
    "view_career_path": "Voir le plan de carrière",
    "continue_path": "Continuer le chemin",
    "primary_path": "Plan primaire",
    "secondary_path": "Plan secondaire",
    "tertiary_path": "Plan tertiaire",
    "active_skills_to_master": "Compétences actives à maîtriser",
    "track_targeted_skills": "Suivez vos compétences ciblées dans vos plans de carrière",
    "no_active_skills": "Aucune compétence active dans ce plan.",
    "jump_into_roadmap": "Accéder à la feuille de route pour",
    "to_start_mastering": "pour commencer à maîtriser de nouvelles compétences!",
    "add": "Ajouter",
    "no_tasks": "Aucune tâche",
    "tasks_count": "{{completed}} sur {{total}} terminés"
  },
  "kn": {
    "home": "ಮುಖಪುಟ",
    "my_career_paths": "ನನ್ನ ವೃತ್ತಿ ಮಾರ್ಗಗಳು",
    "view_career_path": "ವೃತ್ತಿ ಮಾರ್ಗವನ್ನು ವೀಕ್ಷಿಸಿ",
    "continue_path": "ಮಾರ್ಗವನ್ನು ಮುಂದುವರಿಸಿ",
    "primary_path": "ಪ್ರಾಥಮಿಕ ಮಾರ್ಗ",
    "secondary_path": "ದ್ವಿತೀಯ ಮಾರ್ಗ",
    "tertiary_path": "ತೃತೀಯ ಮಾರ್ಗ",
    "active_skills_to_master": "ಕರಗತ ಮಾಡಿಕೊಳ್ಳಬೇಕಾದ ಸಕ್ರಿಯ ಕೌಶಲ್ಯಗಳು",
    "track_targeted_skills": "ನಿಮ್ಮ ವೃತ್ತಿ ದಿಕ್ಕುಗಳಲ್ಲಿ ನಿಮ್ಮ ಉದ್ದೇಶಿತ ಕೌಶಲ್ಯಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ",
    "no_active_skills": "ಈ ಮಾರ್ಗದಲ್ಲಿ ಯಾವುದೇ ಸಕ್ರಿಯ ಕೌಶಲ್ಯಗಳಿಲ್ಲ.",
    "jump_into_roadmap": "ವೃತ್ತಿ ಮಾರ್ಗಸೂಚಿಗೆ ಹೋಗಿ",
    "to_start_mastering": "ಹೊಸ ಕೌಶಲ್ಯಗಳನ್ನು ಕರಗतಗೊಳಿಸಲು!",
    "add": "ಸೇರಿಸಿ",
    "no_tasks": "ಯಾವುದೇ ಕೆಲಸಗಳಿಲ್ಲ",
    "tasks_count": "{{total}} ರಲ್ಲಿ {{completed}} ಪೂರ್ಣಗೊಂಡಿದೆ"
  },
  "ml": {
    "home": "ഹോം",
    "my_career_paths": "എന്റെ കരിയർ പാതകൾ",
    "view_career_path": "കരിയർ പാത കാണുക",
    "continue_path": "പാത തുടരുക",
    "primary_path": "പ്രാഥമിക പാത",
    "secondary_path": "ദ്വതീയ പാത",
    "tertiary_path": "തൃതീയ പാത",
    "active_skills_to_master": "മാസ്റ്റർ ചെയ്യേണ്ട സജീവ കഴിവുകൾ",
    "track_targeted_skills": "നിങ്ങളുടെ കരിയർ ദിശകളിലുടനീളം നിങ്ങളുടെ ലക്ഷ്യമിട്ട കഴിവുകൾ ട്രാക്ക് ചെയ്യുക",
    "no_active_skills": "ഈ പാതയിൽ സജീവമായ കഴിവുകളൊന്നുമില്ല.",
    "jump_into_roadmap": "കരിയർ റോഡ്മാപ്പിലേക്ക് പോകുക",
    "to_start_mastering": "പുതിയ കഴിവുകൾ മാസ്റ്റർ ചെയ്യാൻ ആരംഭിക്കുക!",
    "add": "ചേർക്കുക",
    "no_tasks": "ചുമതലകൾ ഒന്നുമില്ല",
    "tasks_count": "{{total}}-ൽ {{completed}} പൂർത്തിയായി"
  },
  "pa": {
    "home": "ਹੋਮ",
    "my_career_paths": "ਮੇਰੇ ਕਰੀਅਰ ਦੇ ਰਸਤੇ",
    "view_career_path": "ਕਰੀਅਰ ਦਾ ਰਸਤਾ ਦੇਖੋ",
    "continue_path": "ਰਸਤਾ ਜਾਰੀ ਰੱਖੋ",
    "primary_path": "ਪ੍ਰਾਇਮਰੀ ਰਸਤਾ",
    "secondary_path": "ਸੈਕੰਡਰੀ ਰਸਤਾ",
    "tertiary_path": "ਤਿਆਰੀ ਰਸਤਾ",
    "active_skills_to_master": "ਸਿੱਖਣ ਲਈ ਸਰਗਰਮ ਹੁਨਰ",
    "track_targeted_skills": "ਆਪਣੇ ਕਰੀਅਰ ਦੀਆਂ ਦਿਸ਼ਾਵਾਂ ਵਿੱਚ ਆਪਣੇ ਨਿਸ਼ਾਨੇ ਵਾਲੇ ਹੁਨਰਾਂ ਨੂੰ ਟਰੈਕ ਕਰੋ",
    "no_active_skills": "ਇਸ ਰਸਤੇ ਵਿੱਚ ਕੋਈ ਸਰਗਰਮ ਹੁਨਰ ਨਹੀਂ ਹੈ।",
    "jump_into_roadmap": "ਕਰੀਅਰ ਰੋਡਮੈਪ 'ਤੇ ਜਾਓ",
    "to_start_mastering": "ਨਵੇਂ ਹੁਨਰ ਸਿੱਖਣਾ ਸ਼ੁਰੂ ਕਰਨ ਲਈ!",
    "add": "ਜੋੜੋ",
    "no_tasks": "ਕੋਈ ਕੰਮ ਨਹੀਂ",
    "tasks_count": "{{total}} ਵਿੱਚੋਂ {{completed}} ਮੁਕੰਮल"
  },
  "ta": {
    "home": "முகப்பு",
    "my_career_paths": "எனது தொழில் பாதைகள்",
    "view_career_path": "தொழில் பாதையைக் காண்க",
    "continue_path": "பாதையைத் தொடரவும்",
    "primary_path": "முதன்மை பாதை",
    "secondary_path": "இரண்டாம் நிலை பாதை",
    "tertiary_path": "மூன்றாம் நிலை பாதை",
    "active_skills_to_master": "மாஸ்டர் செய்ய வேண்டிய செயலில் உள்ள திறன்கள்",
    "track_targeted_skills": "உங்கள் தொழில் திசைகளில் உங்கள் இலக்கு திறன்களை கண்காணிக்கவும்",
    "no_active_skills": "இந்த பாதையில் செயலில் உள்ள திறன்கள் எதுவும் இல்லை.",
    "jump_into_roadmap": "தொழில் வரைபடத்திற்கு செல்லவும்",
    "to_start_mastering": "புதிய திறன்களை மாஸ்டர் செய்ய தொடங்கவும்!",
    "add": "சேர்",
    "no_tasks": "பணிகள் இல்லை",
    "tasks_count": "{{total}} இல் {{completed}} முடிந்தது"
  },
  "te": {
    "home": "హోమ్",
    "my_career_paths": "నా కెరీర్ మార్గాలు",
    "view_career_path": "కెరీర్ మార్గాన్ని వీక్షించండి",
    "continue_path": "మార్గాన్ని కొనసాగించండి",
    "primary_path": "ప్రాథమిక మార్గం",
    "secondary_path": "ద్వితీయ మార్గం",
    "tertiary_path": "తృతీయ మార్గం",
    "active_skills_to_master": "మాస్టర్ చేయడానికి క్రియాశీల నైపుణ్యాలు",
    "track_targeted_skills": "మీ కెరీర్ దిశలలో మీ లక్ష్య నైపుణ్యాలను ట్రాక్ చేయండి",
    "no_active_skills": "ఈ మార్గంలో క్రియాశీల నైపుణ్యాలు లేవు.",
    "jump_into_roadmap": "కెరీర్ రోడ్‌మ్యాప్‌లోకి వెళ్ళండి",
    "to_start_mastering": "కొత్త నైపుణ్యాలను నేర్చుకోవడం ప్రారంభించడానికి!",
    "add": "జోడించు",
    "no_tasks": "పనులు లేవు",
    "tasks_count": "{{total}} లో {{completed}} పూర్తయింది"
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
