import type { Lang } from "../types";

// Navigation labels in the four launch languages.
// DRAFT translations: they need review by native speakers before release (FR-LNG-01).
export const NAV_LABELS: Record<string, Record<Lang, string>> = {
  home: { en: "Home", hi: "होम", mr: "मुख्यपृष्ठ", kn: "ಮುಖಪುಟ" },
  assistant: { en: "Ask VAAKYA", hi: "VAAKYA से पूछें", mr: "VAAKYA ला विचारा", kn: "VAAKYA ಕೇಳಿ" },
  planning: { en: "Planning", hi: "योजना", mr: "नियोजन", kn: "ಯೋಜನೆ" },
  goals: { en: "Goals", hi: "लक्ष्य", mr: "उद्दिष्टे", kn: "ಗುರಿಗಳು" },
  shield: { en: "Scam Shield", hi: "स्कैम शील्ड", mr: "फसवणूक कवच", kn: "ವಂಚನೆ ಕವಚ" },
  schemes: { en: "Schemes", hi: "योजनाएँ", mr: "शासकीय योजना", kn: "ಯೋಜನೆಗಳು" },
  learn: { en: "Learn", hi: "सीखें", mr: "शिका", kn: "ಕಲಿಯಿರಿ" },
  score: { en: "Confidence Score", hi: "विश्वास स्कोर", mr: "आत्मविश्वास गुण", kn: "ವಿಶ್ವಾಸ ಅಂಕ" },
  lifegraph: { en: "Life Graph", hi: "जीवन ग्राफ़", mr: "जीवन आलेख", kn: "ಜೀವನ ನಕ್ಷೆ" },
  voice: { en: "Voice", hi: "आवाज़", mr: "आवाज", kn: "ಧ್ವನಿ" },
  notifications: { en: "Notifications", hi: "सूचनाएँ", mr: "सूचना", kn: "ಅಧಿಸೂಚನೆಗಳು" },
  profile: { en: "Profile", hi: "प्रोफ़ाइल", mr: "प्रोफाइल", kn: "ಪ್ರೊಫೈಲ್" },
  accessibility: { en: "Accessibility", hi: "सुगम्यता", mr: "सुलभता", kn: "ಪ್ರವೇಶಸಾಧ್ಯತೆ" },
};

export const LANG_NAMES: Record<Lang, string> = { en: "English", hi: "हिन्दी", mr: "मराठी", kn: "ಕನ್ನಡ" };
export const isLang = (x: unknown): x is Lang => x === "en" || x === "hi" || x === "mr" || x === "kn";
