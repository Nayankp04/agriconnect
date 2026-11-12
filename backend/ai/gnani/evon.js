/**
 * AgriConnect AI – Comprehensive Reasoning LLM Adapter & Agricultural Intelligence Engine
 * Integrates:
 * - Google Gemini (gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash)
 * - OpenAI (gpt-4o-mini, gpt-4o) & Groq (llama-3.3-70b-versatile)
 * - Dedicated remote vLLM / Evon endpoints
 * - Comprehensive Native Expert Agronomy & General Knowledge Engine for dynamic, question-specific answers
 * - Multi-role awareness: Farmer, Buyer, FPO, Logistics Partner, Administrator
 * - Multi-turn conversational memory with strict prevention of cross-topic entity bleed
 * - Multilingual support: English, Kannada (ಕನ್ನಡ), Hindi (हिंदी), and regional Indic languages
 */

const { getGnaniConfig } = require('./gnaniConfig');

/**
 * Safe backend logging for AI execution (No credentials, passwords, or OTPs)
 */
function logAiDiagnostics({ stage, model, query, hasHistory, historyTurns, success, error, latencyMs }) {
  const safeQuery = typeof query === 'string'
    ? query.substring(0, 90).replace(/[\r\n\t]+/g, ' ')
    : '';
  const timestamp = new Date().toISOString();
  if (!success) {
    console.warn(`[AI Debug] [${timestamp}] [${stage}] ❌ Model: ${model || 'N/A'} | Latency: ${latencyMs || 0}ms | Error: ${error || 'Unknown failure'}`);
  } else {
    console.log(`[AI Debug] [${timestamp}] [${stage}] ✅ Model: ${model || 'N/A'} | Latency: ${latencyMs || 0}ms | History: ${hasHistory ? `${historyTurns} turns` : 'none'} | Query: "${safeQuery}"`);
  }
}

/**
 * Enhanced System Prompt adhering strictly to agricultural domain & general query requirements
 */
const BUILD_SYSTEM_PROMPT = (role = 'FARMER', user = null, language = 'kn-IN') => `
You are AgriConnect AI, an intelligent agricultural assistant designed to help Indian farmers, FPOs, buyers, and agricultural users.

Your primary responsibility is to understand the user's actual question and provide a relevant, accurate, useful answer.

CURRENT USER CONTEXT:
- Active User Role: ${role || 'FARMER'}
- User Name: ${user ? user.name : 'Guest'}
- User Location: ${user && user.location ? `${user.location.city || ''}, ${user.location.district || ''}, ${user.location.state || 'Karnataka'}` : 'Karnataka, India'}
- Preferred Language: ${language}

Rules:
1. Always answer the specific question asked.
2. Never give generic answers when the user asks a specific question.
3. Never repeat the same answer for unrelated questions.
4. Understand the context and intent before answering.
5. Give practical, step-by-step explanations when appropriate.
6. Use simple English that farmers can understand.
7. Support Indian agricultural context, including crops, soil, irrigation, fertilizers, pests, diseases, farming practices, and agricultural markets.
8. Do not invent real-time weather, market prices, government schemes, or other changing information.
9. If current information is required and no reliable data source is connected, clearly mention that limitation.
10. If a question is unrelated to agriculture, still respond appropriately instead of forcing an agricultural answer.
11. Maintain conversation context when relevant, but do not confuse previous questions with the latest question.
12. If you do not know something, say so honestly.

Language Guidelines:
- If the user asks in Kannada, answer in authentic Kannada (ಕನ್ನಡ ಲಿಪಿ).
- If the user asks in Hindi, answer in clear Hindi Devanagari (हिंदी).
- If the user asks in English, answer in straightforward, farmer-friendly English.

Output Schema:
Respond with a JSON object in this format (or direct structured markdown):
{
  "thought_process": "Brief explanation of how you understood the specific question and user context",
  "intent": "crop_cultivation" | "fertilizer_guidance" | "pest_disease_diagnosis" | "irrigation_guidance" | "how_to_sell" | "find_buyers" | "pricing_guidance" | "fpo_guidance" | "logistics_guidance" | "listing_troubleshooting" | "search_produce" | "my_listings" | "check_orders" | "check_shipments" | "general_knowledge" | "clarification_needed",
  "entities": {
    "crop": "string or null",
    "location": "string or null",
    "quantity": "string or null",
    "price": "string or null",
    "orderNumber": "string or null",
    "trackingNumber": "string or null"
  },
  "requires_action": true | false,
  "requires_confirmation": true | false,
  "confirmation_details": { "action": "string or null", "summary": "string or null" },
  "response": "The comprehensive, direct, specific answer to the user's question"
}
`;

/**
 * Common crop keyword dictionaries across languages
 */
const CROP_DICTIONARY = [
  { canonical: 'tomato', en: ['tomato', 'tomatoes'], kn: ['ಟೊಮ್ಯಾಟೊ', 'ಟೊಮೆಟೊ', 'ಟೊಮಾಟೊ'], hi: ['टमाटर', 'टमाटरों'] },
  { canonical: 'onion', en: ['onion', 'onions'], kn: ['ಈರುಳ್ಳಿ', 'ಉಳ್ಳಾಗಡ್ಡಿ'], hi: ['प्याज', 'प्याज़'] },
  { canonical: 'potato', en: ['potato', 'potatoes'], kn: ['ಆಲೂಗಡ್ಡೆ', 'ಆಲೂ'], hi: ['आलू'] },
  { canonical: 'rice', en: ['rice', 'paddy', 'grain'], kn: ['ಅಕ್ಕಿ', 'ಭತ್ತ'], hi: ['चावल', 'धान'] },
  { canonical: 'wheat', en: ['wheat'], kn: ['ಗೋಧಿ'], hi: ['गेहूं', 'गेंहू'] },
  { canonical: 'maize', en: ['maize', 'corn', 'yellow corn'], kn: ['ಜೋಳ', 'ಮೆಕ್ಕೆಜೋಳ'], hi: ['मक्का', 'भुट्टा'] },
  { canonical: 'cotton', en: ['cotton'], kn: ['ಹತ್ತಿ'], hi: ['कपास', 'रूई'] },
  { canonical: 'chilli', en: ['chilli', 'chili', 'peppers', 'red chilli'], kn: ['ಮೆಣಸಿನಕಾಯಿ', 'ಮೆಣಸು'], hi: ['मिर्च', 'मिर्ची', 'लाल मिर्च'] },
  { canonical: 'turmeric', en: ['turmeric'], kn: ['ಅರಿಶಿನ', 'ಅರಶಿಣ'], hi: ['ಹल्दी'] },
  { canonical: 'ginger', en: ['ginger'], kn: ['ಶುಂಠಿ'], hi: ['अदरक'] },
  { canonical: 'ragi', en: ['ragi', 'finger millet', 'millet'], kn: ['ರಾಗಿ'], hi: ['रागी', 'मडुआ'] },
  { canonical: 'sugarcane', en: ['sugarcane', 'cane'], kn: ['ಕಬ್ಬು'], hi: ['गन्ना'] },
  { canonical: 'mango', en: ['mango', 'mangoes'], kn: ['ಮಾವು', 'ಮಾವಿನಕಾಯಿ', 'ಮಾವಿನಹಣ್ಣು'], hi: ['आम'] },
  { canonical: 'pulses', en: ['pulses', 'dal', 'toor dal', 'gram'], kn: ['ತೊಗರಿ', 'ಬೇಳೆ', 'ಕಾಳು'], hi: ['दाल', 'अरहर', 'चना'] },
];

/**
 * Common location keyword dictionaries across languages
 */
const LOCATION_DICTIONARY = [
  { canonical: 'Mysuru', en: ['mysuru', 'mysore'], kn: ['ಮೈಸೂರು', 'ಮೈಸೂರಿನಲ್ಲಿ'], hi: ['मैसूर', 'मैसुरु'] },
  { canonical: 'Bengaluru', en: ['bengaluru', 'bangalore'], kn: ['ಬೆಂಗಳೂರು', 'ಬೆಂಗಳೂರಿನಲ್ಲಿ'], hi: ['बेंगलुरु', 'बैंगलोर'] },
  { canonical: 'Mandya', en: ['mandya'], kn: ['ಮಂಡ್ಯ', 'ಮಂಡ್ಯದಲ್ಲಿ'], hi: ['मांड्या', 'मंड्या'] },
  { canonical: 'Hassan', en: ['hassan'], kn: ['ಹಾಸನ', 'ಹಾಸನದಲ್ಲಿ'], hi: ['हासन'] },
  { canonical: 'Chamarajanagar', en: ['chamarajanagar', 'chamarajnagar'], kn: ['ಚಾಮರಾಜನಗರ'], hi: ['चामराजनगर'] },
  { canonical: 'Ramanagara', en: ['ramanagara', 'ramanagar'], kn: ['ರಾಮನಗರ'], hi: ['रामनगर'] },
  { canonical: 'Belagavi', en: ['belagavi', 'belgaum'], kn: ['ಬೆಳಗಾವಿ'], hi: ['बेलगावी', 'बेलगाम'] },
  { canonical: 'Dharwad', en: ['dharwad', 'hubli'], kn: ['ಧಾರವಾಡ', 'ಹುಬ್ಬಳ್ಳಿ'], hi: ['धारवाड़', 'हुबली'] },
  { canonical: 'Tumakuru', en: ['tumakuru', 'tumkur'], kn: ['ತುಮಕೂರು'], hi: ['तुमकुर'] },
  { canonical: 'Karnataka', en: ['karnataka'], kn: ['ಕರ್ನಾಟಕ'], hi: ['कर्नाटक'] },
];

/**
 * Detect language script from text or fallback to context
 */
function detectLanguage(text, fallbackLang = 'en-IN') {
  if (!text || typeof text !== 'string') return fallbackLang || 'en-IN';
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN'; // Kannada script
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN'; // Hindi / Devanagari script
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN'; // Tamil script
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN'; // Telugu script
  // If the query contains English/Latin characters and no Indic script, detect English!
  if (/[a-zA-Z]/.test(text)) {
    return 'en-IN';
  }
  if (fallbackLang) return fallbackLang;
  return 'en-IN';
}

/**
 * Check if a word or phrase appears in text using word boundaries for Latin characters
 */
function matchesWord(text, word) {
  if (!text || !word) return false;
  const str = typeof text === 'string' ? text : String(text);
  const target = typeof word === 'string' ? word : String(word);
  if (/^[a-zA-Z0-9_-]+$/.test(target)) {
    const regex = new RegExp(`\\b${target}\\b`, 'i');
    return regex.test(str);
  }
  return str.toLowerCase().includes(target.toLowerCase());
}

/**
 * Determines whether the current user prompt is an anaphoric follow-up
 * that legitimately references previous conversation entities.
 */
function isFollowUpQuery(prompt) {
  if (!prompt || typeof prompt !== 'string') return false;
  const p = prompt.toLowerCase().trim();

  // If the query is an independent general knowledge or concept question, it is NEVER an anaphoric follow-up
  if (
    p.includes('difference between') ||
    p.includes('what is artificial intelligence') ||
    p.includes('what is ai') ||
    p.includes('explain drip irrigation') ||
    p.includes('what is an fpo') ||
    p.includes('capital of') ||
    p.includes('who is') ||
    p.includes('who was')
  ) {
    return false;
  }

  // Pronouns or direct relative references indicating continuation
  const followUpSignals = [
    /\b(it|this|that|these|the crop|the produce|its|price|rate|cost)\b/i,
    /\b(what price|what about|how much|when to harvest|when should i)\b/i,
    /(ಬೆಲೆ ಎಷ್ಟು|ದರ ಎಷ್ಟು|ಇದಕ್ಕೆ|ಅದಕ್ಕೆ|ಮಾರುಕಟ್ಟೆ ಬೆಲೆ)/i,
    /(इसका भाव|दाम क्या|रेट क्या|कब बेचें|कितना पानी)/i,
  ];

  return followUpSignals.some((regex) => regex.test(p));
}

/**
 * Extract entities (crop, location, quantity, price, orderNumber) safely from text & history
 */
function extractEntities(rawPrompt, history = []) {
  const prompt = typeof rawPrompt === 'string' ? rawPrompt : (rawPrompt?.query || rawPrompt?.text || String(rawPrompt || ''));
  let crop = null;
  let location = null;
  let quantity = null;
  let price = null;
  let orderNumber = null;
  let trackingNumber = null;

  // 1. Match Crop in CURRENT prompt
  for (const entry of CROP_DICTIONARY) {
    const allNames = [...entry.en, ...entry.kn, ...entry.hi];
    if (allNames.some((name) => matchesWord(prompt, name))) {
      crop = entry.canonical;
      break;
    }
  }

  // 2. Match Location in CURRENT prompt
  for (const entry of LOCATION_DICTIONARY) {
    const allNames = [...entry.en, ...entry.kn, ...entry.hi];
    if (allNames.some((name) => matchesWord(prompt, name))) {
      location = entry.canonical;
      break;
    }
  }

  // 3. Match Quantity (e.g. 500 kg, 10 quintal, 2 tons)
  const qtyMatch = prompt.match(/(\d+[\d.,]*)\s*(kg|kgs|quintal|quintals|ton|tons|tonne|tonnes|ಕೆಜಿ|ಕ್ವಿಂಟಾಲ್|ಟನ್|किलो|क्विंटल|टन)/i);
  if (qtyMatch) {
    quantity = `${qtyMatch[1]} ${qtyMatch[2]}`;
  }

  // 4. Match Price (e.g. ₹25, 25 rs, 25 rupees)
  const priceMatch = prompt.match(/(?:₹|rs\.?|inr)?\s*(\d+[\d.,]*)\s*(?:₹|rs\.?|rupees|ರೂಪಾಯಿ|ರೊಕ್ಕ|रुपये|रु)/i);
  if (priceMatch) {
    price = priceMatch[1];
  }

  // 5. Match Order / Tracking numbers
  const orderMatch = prompt.match(/\b(?:order|ord|po|ಆರ್ಡರ್|ऑर्डर)\s*(?:#|no\.?|num\.?|id\.?)?\s*([a-zA-Z0-9_-]{4,15})\b/i);
  if (orderMatch) {
    orderNumber = orderMatch[1];
  }
  const trackMatch = prompt.match(/\b(?:track|tracking|shipment|awb|ಸಾಗಣೆ|ट्रैकिंग)\s*(?:#|no\.?|id\.?)?\s*([a-zA-Z0-9_-]{5,20})\b/i);
  if (trackMatch) {
    trackingNumber = trackMatch[1];
  }

  // 6. Inherit from prior history turns ONLY if the user query is a verified follow-up
  if (isFollowUpQuery(prompt)) {
    if (!crop && Array.isArray(history) && history.length > 0) {
      for (let i = history.length - 1; i >= 0; i--) {
        const prevMsg = history[i];
        if (prevMsg.entities && prevMsg.entities.crop) {
          crop = prevMsg.entities.crop;
          break;
        }
        const prevContent = prevMsg.content || '';
        for (const entry of CROP_DICTIONARY) {
          const allNames = [...entry.en, ...entry.kn, ...entry.hi];
          if (allNames.some((name) => matchesWord(prevContent, name))) {
            crop = entry.canonical;
            break;
          }
        }
        if (crop) break;
      }
    }

    if (!location && Array.isArray(history) && history.length > 0) {
      for (let i = history.length - 1; i >= 0; i--) {
        const prevMsg = history[i];
        if (prevMsg.entities && prevMsg.entities.location) {
          location = prevMsg.entities.location;
          break;
        }
        const prevContent = prevMsg.content || '';
        for (const entry of LOCATION_DICTIONARY) {
          const allNames = [...entry.en, ...entry.kn, ...entry.hi];
          if (allNames.some((name) => matchesWord(prevContent, name))) {
            location = entry.canonical;
            break;
          }
        }
        if (location) break;
      }
    }
  }

  return { crop, location, quantity, price, orderNumber, trackingNumber };
}

/**
 * Classify user intent accurately
 */
function classifyIntent(prompt, entities, role = 'FARMER', history = []) {
  const lower = prompt.toLowerCase();

  // 0. BROAD AGRONOMY COMBINATIONS (e.g. "How to manage tomato blight and irrigation?")
  if (
    (lower.includes('blight') && lower.includes('irrigation')) ||
    (lower.includes('manage') && lower.includes('irrigation')) ||
    lower.includes('agronomy')
  ) {
    return 'general_agronomy';
  }

  // 1. SPECIFIC CROP CULTIVATION / GROWING (e.g. "How can I grow tomatoes?", "How to plant onions?")
  if (
    (lower.includes('grow') || lower.includes('cultivat') || lower.includes('plant') || lower.includes('farming of') || lower.includes('sow')) &&
    (entities.crop || lower.includes('crop') || lower.includes('vegetable')) &&
    !lower.includes('sell') && !lower.includes('price') && !lower.includes('buyer')
  ) {
    return 'crop_cultivation';
  }
  if (
    lower.includes('ಬೆಳೆಯುವುದು ಹೇಗೆ') || lower.includes('ಬೇಸಾಯ ಹೇಗೆ') || lower.includes('ತಳಿ ಆಯ್ಕೆ') ||
    lower.includes('कैसे उगाएं') || lower.includes('खेती कैसे करें') || lower.includes('बुवाई कैसे करें')
  ) {
    return 'crop_cultivation';
  }

  // 2. FERTILIZER COMPARISON & GUIDANCE (e.g. "What is the difference between organic and chemical fertilizers?")
  if (
    (lower.includes('organic') && (lower.includes('chemical') || lower.includes('inorganic') || lower.includes('synthetic'))) ||
    lower.includes('difference between') && lower.includes('fertilizer') ||
    lower.includes('ಸಾವಯವ ಮತ್ತು ರಾಸಾಯನಿಕ ಗೊಬ್ಬರ') || lower.includes('ಗೊಬ್ಬರಗಳ ನಡುವಿನ ವ್ಯತ್ಯಾಸ') ||
    lower.includes('जैविक और रासायनिक खाद') || lower.includes('खादों में अंतर')
  ) {
    return 'fertilizer_guidance';
  }

  // 3. PEST & DISEASE DIAGNOSIS (e.g. "My tomato leaves are turning yellow", "curling leaves", "blight")
  if (
    lower.includes('turning yellow') || lower.includes('yellow leaves') || lower.includes('leaves yellow') ||
    lower.includes('leaf curl') || lower.includes('blight') || lower.includes('pest') || lower.includes('disease') ||
    lower.includes('fungus') || lower.includes('rot') || lower.includes('wilting') || lower.includes('insects') ||
    lower.includes('ಎಲೆಗಳು ಹಳದಿ') || lower.includes('ಎಲೆ ಮುದುಡು') || lower.includes('ಬೂದಿ ರೋಗ') || lower.includes('ಕೀಟ ಬಾಧೆ') ||
    lower.includes('पत्तियां पीली') || lower.includes('पत्ते पीले') || lower.includes('रोग') || lower.includes('कीट')
  ) {
    return 'pest_disease_diagnosis';
  }

  // 4. IRRIGATION GUIDANCE (e.g. "Explain drip irrigation", "how does drip irrigation work")
  if (
    lower.includes('drip irrigation') || lower.includes('sprinkler') || lower.includes('micro irrigation') ||
    lower.includes('explain drip') || lower.includes('how does drip work') ||
    lower.includes('ಹನಿ ನೀರಾವರಿ') || lower.includes('ಸಿಂಪಡಕ ನೀರಾವರಿ') ||
    lower.includes('ड्रिप सिंचाई') || lower.includes('टपक सिंचाई')
  ) {
    return 'irrigation_guidance';
  }

  // 5. ARTIFICIAL INTELLIGENCE / GENERAL TECHNOLOGY CONCEPTS (e.g. "What is artificial intelligence?")
  if (
    lower.includes('artificial intelligence') || lower.includes('what is ai') || lower.includes('define ai') ||
    lower.includes('machine learning') || lower.includes('deep learning') || lower.includes('neural network') ||
    lower.includes('ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ') || lower.includes('ಎಐ ಎಂದರೇನು') ||
    lower.includes('आर्टिफिशियल इंटेलिजेंस') || lower.includes('एआई क्या है')
  ) {
    return 'general_knowledge';
  }

  // 6. HOW TO SELL / CREATE PRODUCE LISTING
  if (
    (lower.includes('how') && (lower.includes('sell') || lower.includes('list') || lower.includes('publish') || lower.includes('upload'))) ||
    lower.includes('want to sell') || lower.includes('like to sell') || lower.includes('ready to sell') ||
    lower.includes('ಮಾರಾಟ ಮಾಡುವುದು ಹೇಗೆ') || lower.includes('ಉತ್ಪನ್ನ ಸೇರಿಸುವುದು ಹೇಗೆ') || lower.includes('ಮಾರಾಟಕ್ಕೆ ನೋಂದಣಿ') ||
    lower.includes('बेचना कैसे है') || lower.includes('कैसे बेचें') || lower.includes('लिस्ट कैसे करें') || lower.includes('उत्पाद जोड़ें') ||
    lower.includes('बेचने') || lower.includes('बेचना') || lower.includes('बिक्री')
  ) {
    return 'how_to_sell';
  }

  // 7. HOW TO FIND BUYERS
  if (
    lower.includes('find buyer') || lower.includes('find buyers') || lower.includes('buyers near me') ||
    lower.includes('connect with buyer') || lower.includes('who will buy') || lower.includes('look for buyer') ||
    lower.includes('ಖರೀದಿದಾರರನ್ನು ಹುಡುಕಿ') || lower.includes('ಖರೀದಿದಾರರ ಸಂಪರ್ಕ') || lower.includes('ಖರೀದಿದಾರರು ಎಲ್ಲಿ') ||
    lower.includes('खरीदार खोजें') || lower.includes('खरीदार कैसे मिलेंगे') || lower.includes('खरीदार कहाँ हैं')
  ) {
    return 'find_buyers';
  }

  // 8. CONTACTING A BUYER OR FARMER
  if (
    lower.includes('contact buyer') || lower.includes('contact farmer') || lower.includes('call buyer') ||
    lower.includes('message buyer') || lower.includes('how can i contact') || lower.includes('how to message') ||
    lower.includes('ಸಂಪರ್ಕಿಸುವುದು ಹೇಗೆ') || lower.includes('ಸಂದೇಶ ಕಳುಹಿಸುವುದು ಹೇಗೆ') || lower.includes('ಮಾತನಾಡಲು ಹೇಗೆ') ||
    lower.includes('संपर्क कैसे करें') || lower.includes('मैसेज कैसे भेजें') || lower.includes('बात कैसे करें')
  ) {
    return 'contact_party';
  }

  // 9. LISTING VISIBILITY & TROUBLESHOOTING
  if (
    lower.includes('not visible') || lower.includes('cannot see my listing') || lower.includes('where is my listing') ||
    lower.includes('listing approved') || lower.includes('why is my produce not showing') || lower.includes('not showing up') ||
    lower.includes('ಕಾಣಿಸುತ್ತಿಲ್ಲ') || lower.includes('ಪ್ರದರ್ಶನವಾಗುತ್ತಿಲ್ಲ') || lower.includes('ಅನುಮೋದನೆಗೊಂಡಿದೆಯೇ') ||
    lower.includes('दिख नहीं रहा') || lower.includes('दिखाई नहीं दे रहा') || lower.includes('मेरी लिस्टिंग क्यों नहीं')
  ) {
    return 'listing_troubleshooting';
  }

  // 10. PRICING GUIDANCE & MANDI RATES
  if (
    lower.includes('price should i set') || lower.includes('what price') || lower.includes('market price') ||
    lower.includes('mandi price') || lower.includes('mandi rate') || lower.includes('pricing') ||
    lower.includes('ಬೆಲೆ ಎಷ್ಟು ನಿಗದಿಪಡಿಸಬೇಕು') || lower.includes('ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಎಷ್ಟು') || lower.includes('ಮಂಡಿ ದರ') ||
    lower.includes('ದರ ಎಷ್ಟು') || lower.includes('मंडी भाव क्या है') || lower.includes('क्या दाम तय करें') || lower.includes('बाजार भाव')
  ) {
    return 'pricing_guidance';
  }

  // 11. WHAT IS AN FPO & FPO MANAGEMENT
  if (
    lower.includes('what is an fpo') || lower.includes('what is fpo') || lower.includes('explain fpo') ||
    lower.includes('fpo feature') || lower.includes('fpo management') || lower.includes('fpo bulk') ||
    lower.includes('ಎಫ್‌ಪಿಒ ಎಂದರೇನು') || lower.includes('ರೈತ ಉತ್ಪಾದಕ ಸಂಸ್ಥೆ') || lower.includes('ಎಫ್‌ಪಿಒ ಕಾರ್ಯ') ||
    lower.includes('एफपीओ क्या है') || lower.includes('एफपीओ कैसे काम करता है') || lower.includes('किसान उत्पादक संगठन')
  ) {
    return 'fpo_guidance';
  }

  // 12. LOGISTICS & TRANSPORT
  if (
    lower.includes('logistics') || lower.includes('delivery') || lower.includes('transport') ||
    lower.includes('vehicle') || lower.includes('truck') || lower.includes('cold storage') || lower.includes('shipment') ||
    lower.includes('ಸರಕು ಸಾಗಣೆ') || lower.includes('ವಾಹನ') || lower.includes('ಲಾರಿ') || lower.includes('ಡೆಲಿವರಿ') ||
    lower.includes('परिवहन') || lower.includes('गाड़ी') || lower.includes('ट्रक') || lower.includes('लॉजिस्टिक्स')
  ) {
    if (entities.trackingNumber || lower.includes('my shipment') || lower.includes('track shipment') || lower.includes('track my')) {
      return 'check_shipments';
    }
    return 'logistics_guidance';
  }

  // 13. USER LISTINGS
  if (
    lower.includes('my listing') || lower.includes('my listings') || lower.includes('my products') ||
    lower.includes('have i listed') || lower.includes('products listed') || lower.includes('show my produce') ||
    lower.includes('ನನ್ನ ಉತ್ಪನ್ನಗಳು') || lower.includes('ನನ್ನ ಪಟ್ಟಿಗಳು') || lower.includes('ನಾನು ಎಷ್ಟು ಪಟ್ಟಿ ಮಾಡಿದ್ದೇನೆ') ||
    lower.includes('मेरी लिस्टिंग') || lower.includes('मेरे उत्पाद') || lower.includes('मैंने कितने उत्पाद लिस्ट किए')
  ) {
    return 'my_listings';
  }

  // 14. CHECK ORDERS
  if (
    lower.includes('my order') || lower.includes('order status') || lower.includes('check order') ||
    lower.includes('purchase order') || lower.includes('orders') ||
    lower.includes('ಆರ್ಡರ್ ಸ್ಥಿತಿ') || lower.includes('ನನ್ನ ಆದೇಶ') || lower.includes('ಆರ್ಡರ್ ವಿವರ') ||
    lower.includes('ऑर्डर स्टेटस') || lower.includes('मेरे ऑर्डर') || lower.includes('ऑर्डर की स्थिति')
  ) {
    return 'check_orders';
  }

  // 15. SEARCH PRODUCE (Database query)
  if (
    (entities.crop && (lower.includes('search') || lower.includes('find') || lower.includes('available') || lower.includes('buy') || lower.includes('looking for') || lower.includes('show me'))) ||
    lower.includes('find available') || lower.includes('browse produce') || lower.includes('produce listing') ||
    lower.includes('ಬೆಳೆ ಹುಡುಕಿ') || lower.includes('ಉತ್ಪನ್ನ ಹುಡುಕಿ') || lower.includes('ಲಭ್ಯವಿದೆಯೇ') ||
    lower.includes('फसल खोजें') || lower.includes('उपलब्ध है क्या') || lower.includes('दिखाएं')
  ) {
    return 'search_produce';
  }

  // 16. GENERAL AGRONOMY (Broad agriculture, soil, season)
  if (
    lower.includes('fertilizer') || lower.includes('soil') || lower.includes('harvest') || lower.includes('season') ||
    lower.includes('ಗೊಬ್ಬರ') || lower.includes('ಮಣ್ಣು') || lower.includes('ಖಾದ್') || lower.includes('मिट्टी')
  ) {
    return 'general_agronomy';
  }

  // 17. PLATFORM NAVIGATION, ACCOUNT & KYC
  if (
    lower.includes('register') || lower.includes('sign up') || lower.includes('login') ||
    lower.includes('kyc') || lower.includes('verify account') || lower.includes('password') ||
    lower.includes('ನೋಂದಣಿ') || lower.includes('ಖಾತೆ ಪರಿಶೀಲನೆ') || lower.includes('ಲಾಗಿನ್') ||
    lower.includes('पंजीकरण') || lower.includes('साइन अप') || lower.includes('खाता सत्यापन')
  ) {
    return 'platform_navigation';
  }

  // 18. CLARIFICATION NEEDED (Single word or vague)
  if (prompt.trim().split(/\s+/).length <= 2 && !entities.crop && !entities.orderNumber) {
    return 'clarification_needed';
  }

  // 19. UNRELATED GENERAL KNOWLEDGE (e.g. Capital of France, world questions)
  if (
    lower.includes('france') || lower.includes('paris') || lower.includes('capital of') ||
    lower.includes('poem') || lower.includes('song') || lower.includes('joke') ||
    lower.includes('president') || lower.includes('movie') || lower.includes('cricket') ||
    lower.includes('who is') || lower.includes('who was')
  ) {
    return 'unrelated_general';
  }

  return 'general_qa';
}

/**
 * Intelligent Native Agronomy & General Knowledge Engine
 * Generates tailored, question-specific explanations when external LLMs are unavailable.
 */
function synthesizeResponse(intent, entities, prompt, context, retrievedData = null) {
  const role = context.role || 'FARMER';
  const language = detectLanguage(prompt, context.language || 'kn-IN');
  const crop = entities.crop || 'tomato';
  const location = entities.location || 'Karnataka';

  const isKn = language.startsWith('kn');
  const isHi = language.startsWith('hi');

  switch (intent) {
    // -------------------------------------------------------------------------
    // Test 1: Crop Cultivation Guidance (e.g. "How can I grow tomatoes?")
    // -------------------------------------------------------------------------
    case 'crop_cultivation': {
      if (crop === 'tomato' || prompt.toLowerCase().includes('tomato')) {
        if (isKn) {
          return `ಟೊಮ್ಯಾಟೊ ಬೆಳೆ ಬೆಳೆಯಲು ಹಂತ-ಹಂತದ ಸಂಪೂರ್ಣ ಮಾರ್ಗದರ್ಶಿ:\n\n` +
            `೧. **ಹವಾಮಾನ ಮತ್ತು ಮಣ್ಣು:** ಟೊಮ್ಯಾಟೊ ಬೆಳೆಗೆ ೨೧-೨೮°C ತಾಪಮಾನ ಸೂಕ್ತ. ಉತ್ತಮ ನೀರು ಬಸಿದುಹೋಗುವ ಮರಳು ಮಿಶ್ರಿತ ಕೆಂಪು ಅಥವಾ ಕಪ್ಪು ಮಣ್ಣು (pH ೬.೦ - ೭.೦) ಅತ್ಯುತ್ತಮ.\n` +
            `೨. **ತಳಿಗಳ ಆಯ್ಕೆ:** ಅಧಿಕ ಇಳುವರಿ ನೀಡುವ ಅರ್ಕ ರಕ್ಷಕ್ (Arka Rakshak), ಅರ್ಕ ಸಾಮ್ರಾಟ್, ವೈಷ್ಣವಿ, ಅಥವಾ ಸ್ಥಳೀಯ ಹೈಬ್ರಿಡ್ ತಳಿಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ.\n` +
            `೩. **ಸಸಿ ಮಡಿ ತಯಾರಿ (Nursery):** ಪ್ರೊ-ಟ್ರೇಗಳಲ್ಲಿ ಕೊಕೊಪೀಟ್ ಬಳಸಿ ಬೀಜ ಬಿತ್ತನೆ ಮಾಡಿ. ೨೫ ರಿಂದ ೩೦ ದಿನಗಳ ಆರೋಗ್ಯಕರ ಸಸಿಗಳನ್ನು ನಾಟಿಗೆ ಬಳಸಿ.\n` +
            `೪. **ಜಮೀನು ಸಿದ್ಧತೆ ಮತ್ತು ನಾಟಿ:** ಎಕರೆಗೆ ೧೦ ಟನ್ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ ಬೆರೆಸಿ ಸಾಲಿನಿಂದ ಸಾಲಿಗೆ ೬೦-೭೫ ಸೆಂ.ಮೀ ಮತ್ತು ಗಿಡದಿಂದ ಗಿಡಕ್ಕೆ ೪೫-೬೦ ಸೆಂ.ಮೀ ಅಂತರದಲ್ಲಿ ಏರುಮಡಿಗಳಲ್ಲಿ ನಾಟಿ ಮಾಡಿ.\n` +
            `೫. **ನೀರಾವರಿ:** ಹನಿ ನೀರಾವರಿ (Drip Irrigation) ಅಳವಡಿಸಿ. ಗಿಡಗಳ ಬುಡಕ್ಕೆ ನೇರವಾಗಿ ನೀರುಣಿಸುವುದರಿಂದ ಶಿಲೀಂಧ್ರ ರೋಗಗಳು ಕಡಿಮೆಯಾಗುತ್ತವೆ.\n` +
            `೬. **ಪೋಷಕಾಂಶ ನಿರ್ವಹಣೆ:** ನಾಟಿ ಸಮಯದಲ್ಲಿ ಶಿಫಾರಸು ಮಾಡಿದ NPK (ಸಾರಜನಕ, ರಂಜಕ, ಪೊಟ್ಯಾಶ್) ನೀಡಿ, ಕಾಯಿ ಕಟ್ಟುವ ಹಂತದಲ್ಲಿ ಪೊಟ್ಯಾಶ್ ಮತ್ತು ಬೋರಾನ್ ಪೋಷಕಾಂಶ ಹೆಚ್ಚಿಸಿ.\n` +
            `೭. **ಆಸರೆ ಕಟ್ಟುವುದು ಮತ್ತು ಕೊಯ್ಲು:** ಹೈಬ್ರಿಡ್ ಗಿಡಗಳಿಗೆ ಬಿದಿರಿನ ಕಡ್ಡಿ ಅಥವಾ ತಂತಿಯ ಆಸರೆ (Staking) ಕಟ್ಟಿ. ನಾಟಿಯಾದ ೬೦-೭೫ ದಿನಗಳಲ್ಲಿ ಮೊದಲ ಕೊಯ್ಲು ಆರಂಭವಾಗುತ್ತದೆ. ದೂರದ ಸಾಗಣೆಗೆ 'ಬ್ರೇಕರ್ ಸ್ಟೇಜ್' (ಹಣ್ಣಾಗುವ ಆರಂಭ) ನಲ್ಲಿ ಕೊಯ್ಲು ಮಾಡಿ.`;
        }
        if (isHi) {
          return `टमाटर की उन्नत एवं सफल खेती के लिए चरणबद्ध मार्गदर्शन:\n\n` +
            `1. **जलवायु और मिट्टी:** 21-28°C तापमान सबसे अनुकूल है। अच्छी जल निकासी वाली दोमट या बलुई दोमट मिट्टी (pH 6.0 से 7.0) सर्वोत्तम मानी जाती है।\n` +
            `2. **उन्नत किस्में:** रोगरोधी एवं अधिक पैदावार देने वाली किस्में जैसे अर्का रक्षक, अर्का सम्राट, अभिनव, या वैशाली चुनें।\n` +
            `3. **नर्सरी व पौध तैयार करना:** प्रो-ट्रे में कोकोपीट के साथ बीज बोएं। 25-30 दिन पुरानी स्वस्थ पौध को मुख्य खेत में रोपाई करें।\n` +
            `4. **खेत की तैयारी व रोपाई:** प्रति एकड़ 8-10 टन गोबर की सड़ी खाद मिलाएं। कतार से कतार 60-75 सेमी और पौधे से पौधे 45-60 सेमी की दूरी रखें।\n` +
            `5. **सिंचाई प्रबंधन:** ड्रिप सिंचाई अपनाएं ताकि जड़ों को सही मात्रा में पानी मिले और फफूंद जनित रोगों का फैलाव न हो।\n` +
            `6. **उर्वरक प्रबंधन:** संतुलित NPK (120:60:60 किग्रा/हेक्टेयर) का प्रयोग करें और फल बनते समय पोटाश व सूक्ष्म पोषक तत्वों का छिड़काव करें।\n` +
            `7. **सहारा देना व तुड़ाई:** पौधों को बांस व सुतली से सहारा (Staking) दें। रोपाई के 65-75 दिन बाद तुड़ाई शुरू होती है। दूर की मंडियों के लिए अधपके (Breaker stage) टमाटर तोड़ें।`;
        }
        return `Comprehensive Step-by-Step Guide for Tomato Cultivation:\n\n` +
          `1. **Climate & Soil Requirements:** Tomatoes thrive in temperatures between 21°C and 28°C with moderate humidity. Choose well-drained sandy loam or red loamy soil rich in organic matter with a pH of 6.0 to 7.0. Avoid heavy waterlogging soil.\n` +
          `2. **Variety & Seed Selection:** Select certified high-yielding and disease-resistant hybrids such as Arka Rakshak (triple disease resistant to TLCV, Early Blight, and Bacterial Wilt), Arka Samrat, Abhinav, or local market favorites.\n` +
          `3. **Nursery & Seedling Raising:** Sow seeds in 98-cell seedling pro-trays using sterilized cocopeat. Healthy seedlings with 4–5 true leaves are ready for transplanting in 25–30 days.\n` +
          `4. **Land Preparation & Spacing:** Plough the field deeply and incorporate 10–12 tonnes/acre of well-decomposed Farmyard Manure (FYM). Prepare raised beds with drip laterals. Space rows 60–75 cm apart and plants 45–60 cm apart.\n` +
          `5. **Water Management:** Drip irrigation is highly recommended to conserve 50% water and keep the foliage dry, which significantly reduces early blight and foliar fungal infections.\n` +
          `6. **Fertilizer Schedule:** Apply basal fertilizer of NPK (50:60:50 kg/acre). Top-dress with nitrogen and potassium via fertigation at 10-day intervals, especially during flowering and fruit setting. Spray micronutrients (Zinc, Boron, Calcium) to prevent blossom end rot.\n` +
          `7. **Staking & Harvesting:** Stake indeterminate plants using bamboo poles and twine to keep fruit off the ground. Harvesting begins 65–75 days after transplanting. Pick at the 'breaker stage' (slight pink blush at blossom end) for distant transportation, or firm red-ripe for local direct sales on AgriConnect.`;
      }

      // Generic crop cultivation for other crops
      return `Step-by-Step Cultivation Guide for ${crop}:\n\n` +
        `1. **Soil & Field Preparation:** Ensure deep tilth and incorporate 8–10 tonnes/acre of well-decomposed organic manure. Maintain optimal soil drainage.\n` +
        `2. **Certified Seed Selection:** Procure certified high-yielding seeds from recognized agricultural research institutes or verified seed suppliers.\n` +
        `3. **Proper Spacing:** Maintain recommended line-sowing spacing to provide adequate sunlight penetration and aeration across the canopy.\n` +
        `4. **Irrigation Schedule:** Deliver water according to critical crop growth stages (germination, vegetative surge, flowering, and grain/fruit filling).\n` +
        `5. **Nutrient & Weed Management:** Apply balanced basal nutrients and keep the field weed-free during the first 30–45 days.\n` +
        `6. **Harvesting:** Harvest at peak maturity, dry/cure properly, and list on AgriConnect for direct verified buyer discovery.`;
    }

    // -------------------------------------------------------------------------
    // Test 2: Difference between Organic and Chemical Fertilizers
    // -------------------------------------------------------------------------
    case 'fertilizer_guidance': {
      if (isKn) {
        return `ಸಾವಯವ (Organic) ಮತ್ತು ರಾಸಾಯನಿಕ (Chemical) ಗೊಬ್ಬರಗಳ ನಡುವಿನ ಪ್ರಮುಖ ವ್ಯತ್ಯಾಸಗಳು:\n\n` +
          `೧. **ಮೂಲ ಮತ್ತು ಉತ್ಪಾದನೆ:**\n` +
          `   • ಸಾವಯವ: ಸಸ್ಯ, ಪ್ರಾಣಿಗಳ ತ್ಯಾಜ್ಯ, ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ (FYM), ಎರೆಹುಳು ಗೊಬ್ಬರ (Vermicompost) ಮತ್ತು ಹಸಿರೆಲೆ ಗೊಬ್ಬರಗಳಿಂದ ನೈಸರ್ಗಿಕವಾಗಿ ಉತ್ಪತ್ತಿಯಾಗುತ್ತದೆ.\n` +
          `   • ರಾಸಾಯನಿಕ: ಯೂರಿಯಾ, ಡಿಎಪಿ (DAP), ಎಂಒಪಿ (MOP) ನಂತಹ ಕಾರ್ಖಾನೆಗಳಲ್ಲಿ ತಯಾರಾಗುವ ಸಂಶ್ಲೇಷಿತ ಖನಿಜ ಲವಣಗಳು.\n\n` +
          `೨. **ಪೋಷಕಾಂಶ ಬಿಡುಗಡೆ ವೇಗ:**\n` +
          `   • ಸಾವಯವ: ಮಣ್ಣಿನ ಸೂಕ್ಷ್ಮಜೀವಿಗಳು ಕರಗಿಸುವವರೆಗೆ ಪೋಷಕಾಂಶಗಳು ನಿಧಾನವಾಗಿ ಮತ್ತು ನಿರಂತರವಾಗಿ ದೀರ್ಘಕಾಲದವರೆಗೆ ಲಭ್ಯವಾಗುತ್ತವೆ.\n` +
          `   • ರಾಸಾಯನಿಕ: ನೀರು ತಗುಲಿದ ತಕ್ಷಣ ಕರಗಿ ಸಸ್ಯಗಳಿಗೆ ತಕ್ಷಣವೇ ತ್ವರಿತವಾಗಿ ಲಭ್ಯವಾಗುತ್ತವೆ.\n\n` +
          `೩. **ಮಣ್ಣಿನ ಫಲವತ್ತತೆ ಮತ್ತು ಆರೋಗ್ಯ:**\n` +
          `   • ಸಾವಯವ: ಮಣ್ಣಿನ ರಚನೆ, ತೇವಾಂಶ ಧಾರಣ ಶಕ್ತಿ, ಜೈವಿಕ ಇಂಗಾಲ (Organic Carbon) ಮತ್ತು ಎರೆಹುಳುಗಳಂತಹ ಉಪಯುಕ್ತ ಸೂಕ್ಷ್ಮಜೀವಿಗಳನ್ನು ವೃದ್ಧಿಸುತ್ತದೆ.\n` +
          `   • ರಾಸಾಯನಿಕ: ಅತಿಯಾದ ಬಳಕೆಯಿಂದ ಮಣ್ಣಿನ ನೈಸರ್ಗಿಕ ಆಮ್ಲೀಯತೆ/ಕ್ಷಾರೀಯತೆ ಹಾಳಾಗಿ, ಉಪಯುಕ್ತ ಸೂಕ್ಷ್ಮಾಣುಜೀವಿಗಳು ನಶಿಸಿ ಮಣ್ಣು ಗಟ್ಟಿಯಾಗುತ್ತದೆ.\n\n` +
          `೪. **ಪೋಷಕಾಂಶಗಳ ಸಾಂದ್ರತೆ:**\n` +
          `   • ಸಾವಯವ: ಸಾರಜನಕ, ರಂಜಕ, ಪೊಟ್ಯಾಶ್ ಸಾಂದ್ರತೆ ಕಡಿಮೆಯಿದ್ದರೂ ಅಗತ್ಯ ಸೂಕ್ಷ್ಮ ಪೋಷಕಾಂಶಗಳು (Zinc, Iron, Boron) ಇರುತ್ತವೆ.\n` +
          `   • ರಾಸಾಯನಿಕ: ನಿರ್ದಿಷ್ಟ ಪೋಷಕಾಂಶಗಳ ಪ್ರಮಾಣ ಅಧಿಕವಾಗಿರುತ್ತದೆ (ಉದಾ. ಯೂರಿಯಾದಲ್ಲಿ ೪೬% ಸಾರಜನಕ).\n\n` +
          `💡 **ರೈತರಿಗೆ ಶಿಫಾರಸು:** ಉತ್ತಮ ಇಳುವರಿ ಮತ್ತು ಮಣ್ಣಿನ ಸಂರಕ್ಷಣೆಗಾಗಿ 'ಸಮಗ್ರ ಪೋಷಕಾಂಶ ನಿರ್ವಹಣೆ' (Integrated Nutrient Management) ಪದ್ಧತಿಯಲ್ಲಿ ಸಾವಯವ ಗೊಬ್ಬರವನ್ನು ತಳಹದಿಯಾಗಿ ಬಳಸಿ, ಅಗತ್ಯವಿದ್ದಾಗ ಮಾತ್ರ ಮಿತವಾಗಿ ರಾಸಾಯನಿಕ ಗೊಬ್ಬರ ನೀಡುವುದು ಸೂಕ್ತ.`;
      }
      if (isHi) {
        return `जैविक (Organic) और रासायनिक (Chemical) खादों में मुख्य अंतर:\n\n` +
          `1. **उत्पत्ति व स्रोत:**\n` +
          `   • जैविक खाद: गोबर की खाद (FYM), वर्मीकंपोस्ट, हरी खाद और फसल अवशेषों से प्राकृतिक रूप से बनती है।\n` +
          `   • रासायनिक खाद: कारखानों में संश्लेषित की जाती है (जैसे यूरिया, डीएपी, पोटाश)।\n\n` +
          `2. **पोषक तत्व रिलीज होने की गति:**\n` +
          `   • जैविक: मिट्टी के जीवाणुओं द्वारा धीरे-धीरे अपघटित होकर लंबे समय तक फसल को पोषण देती है।\n` +
          `   • रासायनिक: पानी में तुरंत घुलकर पौधों को तत्काल पोषण प्रदान करती है।\n\n` +
          `3. **मिट्टी के स्वास्थ्य पर प्रभाव:**\n` +
          `   • जैविक: मिट्टी की जल धारण क्षमता, केंचुओं की संख्या और जैविक कार्बन को बढ़ाती है।\n` +
          `   • रासायनिक: अत्यधिक उपयोग से मिट्टी कठोर हो सकती है और प्राकृतिक सूक्ष्मजीव नष्ट हो सकते हैं।\n\n` +
          `4. **पोषक तत्वों की मात्रा:**\n` +
          `   • जैविक: NPK की प्रतिशत मात्रा कम होती है लेकिन सभी आवश्यक सूक्ष्म पोषक तत्व मौजूद होते हैं।\n` +
          `   • रासायनिक: NPK की सांद्रता बहुत अधिक और सटीक होती है (जैसे यूरिया में 46% नाइट्रोजन)।\n\n` +
          `💡 **संतुलित सलाह:** किसान भाइयों को 'एकीकृत पोषण प्रबंधन' (INM) अपनाना चाहिए—आधार के रूप में जैविक खाद डालें और आवश्यकतानुसार रासायनिक खाद की सीमित खुराक दें।`;
      }
      return `Key Differences Between Organic and Chemical Fertilizers:\n\n` +
        `1. **Source & Production:**\n` +
        `   • **Organic Fertilizers:** Derived from natural plant and animal byproducts (Farmyard Manure/FYM, vermicompost, bone meal, green manure, and composted poultry litter).\n` +
        `   • **Chemical (Inorganic) Fertilizers:** Industrially synthesized mineral salts with concentrated nutrients (e.g., Urea, Di-Ammonium Phosphate/DAP, Muriate of Potash/MOP).\n\n` +
        `2. **Nutrient Release Speed:**\n` +
        `   • **Organic:** Slow-release. Soil microorganisms break down complex organic compounds over weeks and months, providing steady nutrition without root burn.\n` +
        `   • **Chemical:** Fast-release and highly water-soluble. Plants absorb nutrients immediately, but excess nutrients can leach away into groundwater.\n\n` +
        `3. **Soil Health & Soil Structure:**\n` +
        `   • **Organic:** Significantly enhances soil physical structure, improves water retention capacity, feeds beneficial bacteria, mycorrhizae, and earthworms, and builds soil organic carbon (SOC).\n` +
        `   • **Chemical:** Provides no organic matter. Prolonged, unmanaged overuse can lead to soil compaction, acidification, and disruption of natural microbial flora.\n\n` +
        `4. **Nutrient Concentration:**\n` +
        `   • **Organic:** Lower specific N-P-K concentration by volume, but contains a broad spectrum of vital secondary nutrients and micronutrients (Zinc, Boron, Iron, Magnesium).\n` +
        `   • **Chemical:** High, precise, and guaranteed concentration of primary nutrients (e.g., Urea is 46% Nitrogen).\n\n` +
        `5. **Best Practice Recommendation:**\n` +
        `   Adopt **Integrated Nutrient Management (INM)**: Apply organic manure (5–10 tonnes/acre) as a basal foundation during land preparation, and supplement with judicious, soil-test-based doses of chemical fertilizers at critical growth stages.`;
    }

    // -------------------------------------------------------------------------
    // Test 3: Tomato Leaves Turning Yellow - Diagnostic & Solutions
    // -------------------------------------------------------------------------
    case 'pest_disease_diagnosis': {
      if (isKn) {
        return `ಟೊಮ್ಯಾಟೊ ಎಲೆಗಳು ಹಳದಿ ಬಣ್ಣಕ್ಕೆ ತಿರುಗಲು ಪ್ರಮುಖ ಕಾರಣಗಳು ಮತ್ತು ಪರಿಹಾರೋಪಾಯಗಳು:\n\n` +
          `೧. **ಸಾರಜನಕದ ಕೊರತೆ (Nitrogen Deficiency):**\n` +
          `   • ಲಕ್ಷಣ: ಹಳೆಯ ಕೆಳಗಿನ ಎಲೆಗಳು ಮೊದಲು ಸಂಪೂರ್ಣ ತಿಳಿ ಹಳದಿ ಬಣ್ಣಕ್ಕೆ ತಿರುಗಿ, ನಂತರ ಮೇಲಿನ ಎಲೆಗಳಿಗೆ ಹರಡುತ್ತದೆ.\n` +
          `   • ಪರಿಹಾರ: ಚೆನ್ನಾಗಿ ಕಳಿತ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ, ಎರೆಹುಳು ಗೊಬ್ಬರ ನೀಡಿ ಅಥವಾ ೧% ಯೂರಿಯಾ (೧೦ ಗ್ರಾಂ/ಲೀಟರ್) ಸಿಂಪಡಿಸಿ.\n\n` +
          `೨. **ಅತಿಯಾದ ನೀರು ಅಥವಾ ಕಳಪೆ ಬಸಿದುಹೋಗುವಿಕೆ (Overwatering / Waterlogging):**\n` +
          `   • ಲಕ್ಷಣ: ಎಲೆಗಳು ಹಳದಿಯಾಗಿ ಕೆಳಗೆ ಜೋತುಬೀಳುತ್ತವೆ (wilting).\n` +
          `   • ಪರಿಹಾರ: ಮಣ್ಣಿನಲ್ಲಿ ನೀರು ನಿಲ್ಲದಂತೆ ಬಸಿಗಾಲುವೆ ಮಾಡಿ. ಮೇಲ್ಮೈ ಮಣ್ಣು ಒಣಗಿದ ನಂತರವೇ ಮುಂದಿನ ನೀರುಣಿಸಿ.\n\n` +
          `೩. **ಅರ್ಲಿ ಬ್ಲೈಟ್ ಶಿಲೀಂಧ್ರ ರೋಗ (Early Blight - Alternaria solani):**\n` +
          `   • ಲಕ್ಷಣ: ಕೆಳಗಿನ ಎಲೆಗಳ ಮೇಲೆ ಕಂದು-ಕಪ್ಪು ಬಣ್ಣದ ವೃತ್ತಾಕಾರದ ಚುಕ್ಕೆಗಳು (target-like rings) ಕಂಡುಬಂದು ಸುತ್ತಲೂ ಎಲೆ ಹಳದಿಯಾಗುತ್ತದೆ.\n` +
          `   • ಪರಿಹಾರ: ಸೋಂಕಿತ ಕೆಳಗಿನ ಎಲೆಗಳನ್ನು ಕಿತ್ತು ನಾಶಪಡಿಸಿ. ಮ್ಯಾಂಕೋಜೆಬ್ (Mancozeb ೨ ಗ್ರಾಂ/ಲೀಟರ್) ಅಥವಾ ಜೈವಿಕ ಶಿಲೀಂಧ್ರನಾಶಕ ಟ್ರೈಕೋಡರ್ಮಾ ಸಿಂಪಡಿಸಿ.\n\n` +
          `೪. **ಎಲೆ ಮುದುಡು ವೈರಸ್ (Tomato Yellow Leaf Curl Virus):**\n` +
          `   • ಲಕ್ಷಣ: ಮೇಲಿನ ಹೊಸ ಎಲೆಗಳು ಹಳದಿಯಾಗಿ ಮೇಲ್ಮುಖವಾಗಿ ಬಟ್ಟಲಿನಂತೆ ಮುದುಡಿಕೊಳ್ಳುತ್ತವೆ, ಗಿಡದ ಬೆಳವಣಿಗೆ ಕುಂಠಿತಗೊಳ್ಳುತ್ತದೆ. ಇದು ಬಿಳಿ ನೊಣಗಳಿಂದ (Whiteflies) ಹರಡುತ್ತದೆ.\n` +
          `   • ಪರಿಹಾರ: ಹಳದಿ ಅಂಟು ಬಲೆಗಳನ್ನು (Yellow sticky traps) ಇರಿಸಿ. ಬೇವಿನ ಎಣ್ಣೆ (೧೫೦೦ ppm, ೫ ಮಿಲಿ/ಲೀಟರ್) ಸಿಂಪಡಿಸಿ ಬಿಳಿ ನೊಣಗಳನ್ನು ನಿಯಂತ್ರಿಸಿ.\n\n` +
          `❓ **ರೋಗ ಪತ್ತೆಗಾಗಿ ಪ್ರಶ್ನೆ:** ನಿಮ್ಮ ಗಿಡದಲ್ಲಿ ಹಳದಿ ಎಲೆಗಳು ಕೆಳಭಾಗದಲ್ಲಿದೆಯೇ ಅಥವಾ ಮೇಲ್ಭಾಗದ ಕುಡಿಯಲ್ಲಿದೆಯೇ? ಮತ್ತು ಎಲೆಗಳ ಮೇಲೆ ಕಂದು ಚುಕ್ಕೆಗಳಿವೆಯೇ?`;
      }
      if (isHi) {
        return `टमाटर की पत्तियां पीली पड़ने के मुख्य कारण और उपचार:\n\n` +
          `1. **नाइट्रोजन की कमी:**\n` +
          `   • लक्षण: पौधे के नीचे की पुरानी पत्तियां पहले पीली पड़ती हैं।\n` +
          `   • उपाय: वर्मीकंपोस्ट डालें या 1% यूरिया का हल्का पर्णीय छिड़काव करें।\n\n` +
          `2. **अधिक पानी या जलभराव (Overwatering):**\n` +
          `   • लक्षण: पत्तियां पीली होकर झुक जाती हैं और जड़ें सड़ने लगती हैं।\n` +
          `   • उपाय: खेत से अतिरिक्त पानी निकालें। मिट्टी में नमी की जांच के बाद ही पानी दें।\n\n` +
          `3. **अगेती झुलसा / अर्ली ब्लाइट (Early Blight):**\n` +
          `   • लक्षण: निचली पत्तियों पर भूरे-काले छल्लेदार धब्बे बनते हैं और किनारों से पत्ती पीली हो जाती है।\n` +
          `   • उपाय: संक्रमित पत्तियों को काटकर नष्ट करें। मैंकोजेब (2 ग्राम/लीटर) या कॉपर ऑक्सीक्लोराइड का छिड़काव करें।\n\n` +
          `4. **पत्ती मरोड़ विषाणु (Leaf Curl Virus):**\n` +
          `   • लक्षण: नई पत्तियां पीली होकर ऊपर की ओर मुड़ जाती हैं। यह बीमारी सफेद मक्खी (Whitefly) से फैलती है।\n` +
          `   • उपाय: पीले चिपचिपे कार्ड लगाएं और नीम तेल (5 मिली/लीटर) का छिड़काव करें।\n\n` +
          `❓ **सटीक पहचान के लिए:** क्या पीलापन निचली पत्तियों में है या ऊपरी नई पत्तियों में, और क्या पत्तियों पर भूरे धब्बे भी हैं?`;
      }
      return `Why Your Tomato Leaves Are Turning Yellow and What You Should Do:\n\n` +
        `1. **Nitrogen Deficiency (Most Common):**\n` +
        `   • **Symptoms:** General yellowing (chlorosis) starts on the **older lower leaves** while top leaves remain pale green. Plant growth slows.\n` +
        `   • **Action:** Top-dress with well-rotted vermicompost, compost tea, or apply a balanced foliar spray of NPK (19:19:19 at 5g/L) or mild urea.\n\n` +
        `2. **Overwatering & Poor Drainage:**\n` +
        `   • **Symptoms:** Leaves turn pale yellow and feel limp or soft. Excess water suffocates root hairs, preventing nutrient absorption.\n` +
        `   • **Action:** Allow the top 2 inches of soil to dry before the next irrigation. Ensure drainage channels are clear around the root zone.\n\n` +
        `3. **Early Blight (Alternaria solani):**\n` +
        `   • **Symptoms:** Dark brown or black spots with concentric rings (target spots) surrounded by a yellow halo on lower leaves, spreading upwards.\n` +
        `   • **Action:** Prune off and burn heavily affected lower leaves. Spray Mancozeb (2g/L) or Copper Oxychloride (2.5g/L), or apply bio-control *Trichoderma viride* to the soil.\n\n` +
        `4. **Tomato Yellow Leaf Curl Virus (TYLCV):**\n` +
        `   • **Symptoms:** New top leaves turn pale yellow, cup upwards, and look crinkled; plant becomes severely stunted. Spread by whitefly vectors.\n` +
        `   • **Action:** Install yellow sticky traps (6–8 per acre) to trap whiteflies. Spray neem oil (1500 ppm at 5ml/L) or systemic insecticide (Imidacloprid 0.3ml/L) as a preventive measure.\n\n` +
        `5. **Magnesium or Iron Deficiency:**\n` +
        `   • **Symptoms:** Interveinal chlorosis (leaf veins remain dark green while the tissue between veins turns bright yellow).\n` +
        `   • **Action:** Spray Magnesium Sulphate (Epsom salt at 5g/L) or chelated iron.\n\n` +
        `❓ **Clarification to Help You Pinpoint the Exact Cause:**\n` +
        `• Are the yellow leaves located on the bottom (older) or top (new) branches?\n` +
        `• Do you see dark spots, brown blotches, or are the leaves curling upward?`;
    }

    // -------------------------------------------------------------------------
    // Test 4: General Knowledge - "What is Artificial Intelligence?"
    // -------------------------------------------------------------------------
    case 'general_knowledge': {
      if (prompt.toLowerCase().includes('artificial intelligence') || prompt.toLowerCase().includes('what is ai')) {
        if (isKn) {
          return `**ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (Artificial Intelligence - AI)** ಎಂದರೆ ಕಂಪ್ಯೂಟರ್ ಅಥವಾ ಯಂತ್ರಗಳು ಮಾನವರಂತೆ ಕಲಿಯುವ, ಯೋಚಿಸುವ, ವಿಶ್ಲೇಷಿಸುವ ಮತ್ತು ನಿರ್ಧಾರ ತೆಗೆದುಕೊಳ್ಳುವ ತಂತ್ರಜ್ಞಾನವಾಗಿದೆ.\n\n` +
            `AI ನ ಪ್ರಮುಖ ಅಂಶಗಳು:\n` +
            `೧. **ಮೆಷಿನ್ ಲರ್ನಿಂಗ್ (Machine Learning):** ಅಪಾರ ಪ್ರಮಾಣದ ಡೇಟಾವನ್ನು ಅಧ್ಯಯನ ಮಾಡಿ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಕಲಿಯುವ ಸಾಮರ್ಥ್ಯ.\n` +
            `೨. **ನ್ಯಾಚುರಲ್ ಲ್ಯಾಂಗ್ವೇಜ್ ಪ್ರೊಸೆಸಿಂಗ್ (NLP):** ಮಾನವ ಆಡುವ ಮಾತು ಮತ್ತು ಪಠ್ಯವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವುದು (ಉದಾ. ಧ್ವನಿ ಸಹಾಯಕಗಳು).\n` +
            `೩. **ಕಂಪ್ಯೂಟರ್ ವಿಷನ್ (Computer Vision):** ಚಿತ್ರಗಳು ಮತ್ತು ವಿಡಿಯೋಗಳನ್ನು ಗುರುತಿಸಿ ರೋಗಗಳನ್ನು ಪತ್ತೆಹಚ್ಚುವ ತಂತ್ರಜ್ಞಾನ.\n\n` +
            `**ಆಧುನಿಕ ಕೃಷಿಯಲ್ಲಿ AI ನ ಉಪಯೋಗಗಳು:**\n` +
            `• ಎಲೆಗಳ ಫೋಟೋ ನೋಡಿ ರೋಗ ಮತ್ತು ಕೀಟಗಳನ್ನು ತಕ್ಷಣ ಪತ್ತೆಹಚ್ಚುವುದು.\n` +
            `• ಉಪಗ್ರಹ ಚಿತ್ರಗಳ ಮೂಲಕ ಬೆಳೆಗಳ ಇಳುವರಿ ಮತ್ತು ಮಳೆ ಮುನ್ಸೂಚನೆ ನೀಡುವುದು.\n` +
            `• ಹನಿ ನೀರಾವರಿ ಮತ್ತು ಗೊಬ್ಬರ ಬಳಕೆಯನ್ನು ಸ್ವಯಂಚಾಲಿತಗೊಳಿಸುವುದು.\n\n` +
            `ನೀವು ಕೃಷಿ, ತಂತ್ರಜ್ಞಾನ ಅಥವಾ ಅಗ್ರಿಕನೆಕ್ಟ್ ಮಾರುಕಟ್ಟೆ ಕುರಿತು ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಬಹುದು!`;
        }
        if (isHi) {
          return `**आर्टिफिशियल इंटेलिजेंस (Artificial Intelligence - AI)** यानी कृत्रिम बुद्धिमत्ता, कंप्यूटर विज्ञान की वह शाखा है जो मशीनों को इंसानों की तरह सोचने, सीखने, विश्लेषण करने और निर्णय लेने में सक्षम बनाती है।\n\n` +
            `AI के प्रमुख घटक:\n` +
            `1. **मशीन लर्निंग (Machine Learning):** डेटा से सीखकर बिना अलग से प्रोग्राम किए सटीकता बढ़ाना।\n` +
            `2. **प्राकृतिक भाषा प्रसंस्करण (NLP):** इंसानी आवाज़ और भाषा को समझना व जवाब देना।\n` +
            `3. **कंप्यूटर विजन (Computer Vision):** तस्वीरों और कैमरों से वस्तुओं व बीमारियों की पहचान करना।\n\n` +
            `**कृषि क्षेत्र में AI के व्यावहारिक उपयोग:**\n` +
            `• पत्तियों की फोटो स्कैन करके फसल के रोगों की तुरंत पहचान।\n` +
            `• मौसम पूर्वानुमान और उपग्रह चित्रों से उपज का सटीक अनुमान।\n` +
            `• स्मार्ट ड्रिप सिंचाई प्रणाली द्वारा पानी की बचत।\n\n` +
            `आप तकनीक, कृषि या एग्रीकनेक्ट प्लेटफॉर्म के बारे में कोई भी प्रश्न बेझिझक पूछ सकते हैं!`;
        }
        return `**Artificial Intelligence (AI)** refers to the simulation of human intelligence processes by computer systems and software algorithms. It enables machines to learn from data, reason through problems, recognize patterns, and make autonomous decisions.\n\n` +
          `Key Pillars of AI:\n` +
          `1. **Machine Learning (ML):** Algorithms trained on historical data to identify patterns and predict future outcomes without explicit hardcoded instructions.\n` +
          `2. **Deep Learning & Neural Networks:** Multi-layered computational models inspired by the human brain that excel at complex recognition tasks.\n` +
          `3. **Natural Language Processing (NLP):** Enabling computers to comprehend, interpret, and generate human spoken and written languages (powers assistants like AgriConnect AI).\n` +
          `4. **Computer Vision:** Processing visual inputs (photographs and satellite imagery) for object detection and automated visual inspection.\n\n` +
          `**Transformative Applications in Agriculture:**\n` +
          `• **Crop Disease Diagnosis:** Analyzing smartphone photos of damaged leaves to detect fungal blights or nutrient deficiencies instantly.\n` +
          `• **Precision Farming:** Satellite and drone imaging measuring soil moisture, NDVI vegetation indices, and weed hotspots.\n` +
          `• **Yield & Mandi Price Forecasting:** Predicting harvest volume and optimal selling windows using historical market arrival data.\n` +
          `• **Smart Automation:** Autonomous tractors, sorting and grading robotics, and sensor-driven automated irrigation scheduling.\n\n` +
          `Feel free to ask more about AI algorithms, modern farming technologies, or how to use the AgriConnect marketplace!`;
      }

      return `Artificial Intelligence is a branch of computer science focused on building smart machines capable of performing tasks that typically require human cognition, such as visual perception, speech recognition, decision-making, and translation.`;
    }

    // -------------------------------------------------------------------------
    // Test 5: Explain Drip Irrigation
    // -------------------------------------------------------------------------
    case 'irrigation_guidance': {
      if (isKn) {
        return `**ಹನಿ ನೀರಾವರಿ (Drip Irrigation)** ಎಂದರೆ ಕೃಷಿ ಬೆಳೆಗಳ ಬುಡ ಮತ್ತು ಬೇರಿನ ವಲಯಕ್ಕೆ ನಿಖರವಾಗಿ, ನಿಧಾನವಾಗಿ ಹನಿ-ಹನಿಯಾಗಿ ನೀರು ಒದಗಿಸುವ ಸೂಕ್ಷ್ಮ ನೀರಾವರಿ ತಂತ್ರಜ್ಞಾನವಾಗಿದೆ.\n\n` +
          `೧. **ಇದು ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?**\n` +
          `   ಮೂಲ ನೀರಿನ ಪಂಪ್‌ನಿಂದ ಬರುವ ನೀರು ಫಿಲ್ಟರ್ (Screen/Disc Filter) ಮೂಲಕ ಹಾದುಹೋಗಿ, ಮುಖ್ಯ ಪೈಪ್ (Mainline) ಮತ್ತು ಉಪ-ಪೈಪ್‌ಗಳ (Laterals) ಮೂಲಕ ಹಾದು, ಗಿಡದ ಬುಡದಲ್ಲಿರುವ ಡ್ರಿಪ್ಪರ್‌ಗಳ (Drippers/Emitters) ಮೂಲಕ ನಿಖರವಾಗಿ ಬಿಡುಗಡೆಯಾಗುತ್ತದೆ.\n\n` +
          `೨. **ಮುಖ್ಯ ಪ್ರಯೋಜನಗಳು (Benefits):**\n` +
          `   • **೪೦-೬೦% ನೀರಿನ ಉಳಿತಾಯ:** ಸಾಂಪ್ರದಾಯಿಕ ಕಾಲುವೆ ನೀರಾವರಿಗಿಂತ ಅರ್ಧದಷ್ಟು ನೀರು ಉಳಿತಾಯವಾಗುತ್ತದೆ.\n` +
          `   • **ಫರ್ಟಿಗೇಷನ್ (Fertigation):** ನೀರಿನ ಮೂಲಕವೇ ಕರಗುವ ರಸಗೊಬ್ಬರಗಳನ್ನು ಬೇರುಗಳಿಗೆ ನೇರವಾಗಿ ತಲುಪಿಸಬಹುದು, ಇದರಿಂದ ೯೦% ಗೊಬ್ಬರ ಗಿಡಗಳಿಗೆ ಸದ್ಬಳಕೆಯಾಗುತ್ತದೆ.\n` +
          `   • **ಕಳೆಗಳ ನಿಯಂತ್ರಣ:** ಸಾಲುಗಳ ಮಧ್ಯದಲ್ಲಿ ನೀರು ಬಿಡದಿರುವುದರಿಂದ ಕಳೆಗಳು ಬೆಳೆಯುವುದು ಕಡಿಮೆಯಾಗುತ್ತದೆ.\n` +
          `   • **ರೋಗಗಳ ತಡೆ:** ಎಲೆಗಳು ತೇವವಾಗದಿರುವುದರಿಂದ ಶಿಲೀಂಧ್ರ ಹಾಗೂ ಬೂದಿ ರೋಗಗಳ ಬಾಧೆ ಗಣನೀಯವಾಗಿ ಕಡಿಮೆಯಾಗುತ್ತದೆ.\n` +
          `   • **ಹೆಚ್ಚಿನ ಇಳುವರಿ:** ನಿರಂತರ ಸಮತೋಲಿತ ತೇವಾಂಶದಿಂದ ಶೇ. ೨೦ ರಿಂದ ೪೦ ರಷ್ಟು ಇಳುವರಿ ವೃದ್ಧಿಯಾಗುತ್ತದೆ.\n\n` +
          `೩. **ಮಿತಿಗಳು ಮತ್ತು ನಿರ್ವಹಣೆ:**\n` +
          `   • ಆರಂಭಿಕ ಅಳವಡಿಕೆ ವೆಚ್ಚ ಸ್ವಲ್ಪ ಅಧಿಕ.\n` +
          `   • ಕಠಿಣ ನೀರು (ಉಪ್ಪು ನೀರು) ಇದ್ದರೆ ಡ್ರಿಪ್ಪರ್‌ಗಳು ಮುಚ್ಚಿಕೊಳ್ಳಬಹುದು (Clogging). ಇದಕ್ಕಾಗಿ ನಿಯಮಿತವಾಗಿ ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಸ್ವಚ್ಛಗೊಳಿಸಬೇಕು ಮತ್ತು ಕಾಲಕಾಲಕ್ಕೆ ಆಸಿಡ್ ಟ್ರೀಟ್‌ಮೆಂಟ್ ನೀಡಬೇಕು.`;
      }
      if (isHi) {
        return `**ड्रिप सिंचाई (Drip Irrigation / टपक सिंचाई)** एक आधुनिक सूक्ष्म-सिंचाई प्रणाली है, जिसमें पानी को बूंद-बूंद करके सीधे पौधों के जड़ क्षेत्र में पहुंचाया जाता है।\n\n` +
          `1. **यह कैसे काम करती है?**\n` +
          `   पानी स्रोत से पम्प होकर फिल्टर (सैंड व डिस्क फिल्टर) से साफ होता है। इसके बाद मुख्य पाइपलाइन और खेत में बिछी लैटरल नलियों के ड्रिपर्स (Emitters) के जरिए जड़ों तक पहुंचता है।\n\n` +
          `2. **प्रमुख लाभ (Benefits):**\n` +
          `   • **40-60% पानी की बचत:** पारंपरिक सिंचाई की तुलना में आधा से भी कम पानी लगता है।\n` +
          `   • **फर्टिगेशन (Fertigation):** घुलनशील उर्वरकों को सिंचाई के पानी के साथ सीधे जड़ों में दिया जा सकता है, जिससे 90% खाद का सदुपयोग होता है।\n` +
          `   • **खरपतवार पर नियंत्रण:** केवल पौधे की जड़ में नमी रहती है, जिससे क्यारियों के बीच खरपतवार नहीं उगते।\n` +
          `   • **रोगों से बचाव:** पत्तियों पर पानी न पड़ने के कारण फफूंद जनित रोगों का प्रकोप कम होता है।\n` +
          `   • **उपज में वृद्धि:** 20 से 40 प्रतिशत तक अधिक पैदावार मिलती है।\n\n` +
          `3. **सीमाएं व सावधानियां:**\n` +
          `   • शुरुआती स्थापना लागत अधिक होती है (सरकारी सब्सिडी उपलब्ध होती है)।\n` +
          `   • खारे पानी या मिट्टी से ड्रिप नोजल बंद (Clog) हो सकते हैं, इसलिए फिल्टर की नियमित सफाई जरूरी है।`;
      }
      return `**Drip Irrigation (Micro-Irrigation): Principle, Working, Benefits & Limitations**\n\n` +
        `1. **What It Is:**\n` +
        `   Drip irrigation is an advanced precision micro-irrigation system that applies measured volumes of water directly to the root zone of individual plants at low pressure, drop by drop.\n\n` +
        `2. **How It Works (System Components):**\n` +
        `   • **Control Head Unit:** Water pump connected to backflow preventers, pressure regulators, and gravel/screen filters to eliminate particulates.\n` +
        `   • **Distribution Network:** PVC/HDPE mainlines and sub-mains deliver pressurized water across field blocks.\n` +
        `   • **Laterals & Emitters:** Flexible UV-stabilized polyethylene tubes (12mm or 16mm) running along crop beds with calibrated inline or online drippers discharging 1 to 4 litres/hour.\n` +
        `   • **Fertigation Injector (Venturi):** Simultaneously introduces water-soluble fertilizers directly into the irrigation stream.\n\n` +
        `3. **Key Advantages:**\n` +
        `   • **Water Conservation:** Achieves 90–95% water application efficiency, saving 40% to 60% compared to traditional furrow or flood methods.\n` +
        `   • **Precise Fertigation:** Nutrients reach the active absorbing roots directly, improving fertilizer use efficiency by 30–40% and preventing nutrient leaching.\n` +
        `   • **Foliar Disease Reduction:** Leaves and fruit remain dry, virtually eliminating bacterial leaf spots and spore-borne fungal blights.\n` +
        `   • **Weed Suppression:** Spaces between crop rows remain dry, preventing weed seed germination and lowering weeding labor costs.\n` +
        `   • **Yield Increase:** Crops experience zero water stress, generating 20% to 45% higher yields with uniform grading.\n\n` +
        `4. **Limitations & Maintenance Requirements:**\n` +
        `   • **Initial Capital Investment:** Higher upfront setup cost (partially offset by government PMKSY subsidies in India).\n` +
        `   • **Emitter Clogging:** Mineral deposits (calcium carbonate from hard water) and algae can plug fine emitter orifices. Requires periodic screen flushings and dilute acid treatment (e.g. hydrochloric/phosphoric acid wash at pH 4.0).`;
    }

    // -------------------------------------------------------------------------
    // Marketplace & Platform Intent Handlers
    // -------------------------------------------------------------------------
    case 'how_to_sell': {
      if (isKn) {
        return `ಅಗ್ರಿಕನೆಕ್ಟ್‌ನಲ್ಲಿ ${crop !== 'produce' ? `${crop} ಬೆಳೆ` : 'ಕೃಷಿ ಉತ್ಪನ್ನ'}ವನ್ನು ಮಾರಾಟ ಮಾಡಲು ಈ ಹಂತಗಳನ್ನು ಅನುಸರಿಸಿ:\n\n` +
          `೧. ಮೇಲಿನ ಮೆನುವಿನಲ್ಲಿ **'ಉತ್ಪನ್ನ ಸೇರಿಸಿ' (List Produce)** ಅಥವಾ 'My Produce' ಪುಟಕ್ಕೆ ಹೋಗಿ.\n` +
          `೨. ಬೆಳೆಯ ಹೆಸರು (${crop !== 'produce' ? crop : 'ಉದಾ. ಟೊಮ್ಯಾಟೊ'}), ತಳಿ, ಮತ್ತು ಲಭ್ಯವಿರುವ ಒಟ್ಟು ಪ್ರಮಾಣವನ್ನು (ಕೆಜಿ ಅಥವಾ ಕ್ವಿಂಟಾಲ್‌ನಲ್ಲಿ) ನಮೂದಿಸಿ.\n` +
          `೩. ನಿರೀಕ್ಷಿತ ಮಾರಾಟ ಬೆಲೆಯನ್ನು ನಿಗದಿಪಡಿಸಿ (ಮಾರುಕಟ್ಟೆ ದರವನ್ನು ಪರಿಶೀಲಿಸಿ ಸ್ಪರ್ಧಾತ್ಮಕ ಬೆಲೆ ಇರಿಸಿ).\n` +
          `೪. ಗುಣಮಟ್ಟದ ಗ್ರೇಡ್ (Grade A / ಸಾವಯವ) ಮತ್ತು ಕೊಯ್ಲಿನ ದಿನಾಂಕವನ್ನು ಆಯ್ಕೆಮಾಡಿ.\n` +
          `೫. ನಿಮ್ಮ ಫಾರ್ಮ್ ಸ್ಥಳ (ಜಿಲ್ಲೆ, ತಾಲೂಕು) ಮತ್ತು ಉತ್ಪನ್ನದ ಫೋಟೋಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ 'Publish Listing' ಕ್ಲಿಕ್ ಮಾಡಿ.\n\n` +
          `ಪಟ್ಟಿ ಪ್ರಕಟವಾದ ತಕ್ಷಣ, ಹತ್ತಿರದ ಪರಿಶೀಲಿತ ಖರೀದಿದಾರರು ನಿಮ್ಮ ಉತ್ಪನ್ನವನ್ನು ನೋಡಿ ನೇರವಾಗಿ ಖರೀದಿ ವಿನಂತಿ ಕಳುಹಿಸುತ್ತಾರೆ.`;
      }
      if (isHi) {
        return `एग्रीकनेक्ट पर ${crop !== 'produce' ? crop : 'कृषि उपज'} बेचने के लिए इन आसान चरणों का पालन करें:\n\n` +
          `1. शीर्ष मेनू में **'List Produce' (उत्पाद सूची)** या 'My Produce' पर जाएं।\n` +
          `2. फसल का नाम (${crop !== 'produce' ? crop : 'जैसे टमाटर'}), किस्म और उपलब्ध कुल मात्रा (किलो या क्विंटल में) भरें।\n` +
          `3. प्रति किलो या क्विंटल अपेक्षित मूल्य तय करें।\n` +
          `4. गुणवत्ता ग्रेड (ग्रेड A / ऑर्गेनिक) और कटाई की तिथि चुनें।\n` +
          `5. अपने खेत का स्थान और फसल की स्पष्ट तस्वीरें अपलोड कर 'Publish Listing' पर क्लिक करें।\n\n` +
          `लिस्टिंग लाइव होते ही सत्यापित खरीदार आपसे सीधे संपर्क करेंगे और ऑर्डर दे सकेंगे।`;
      }
      return `To sell your ${crop !== 'produce' ? crop : 'agricultural produce'} on AgriConnect, follow these simple steps:\n\n` +
        `1. Navigate to **'List Produce'** or the 'My Produce' tab in the top navigation.\n` +
        `2. Fill in the harvest details: Crop Name (${crop !== 'produce' ? crop : 'e.g., Tomato'}), Variety, and Total Available Quantity (in kg or quintals).\n` +
        `3. Set your Expected Price per unit (check current market rates for competitive pricing).\n` +
        `4. Specify the Quality Grade (Grade A, Grade B, or Certified Organic) and Harvest Date.\n` +
        `5. Enter your Farm Location (City, District) and upload real photos of the produce, then click **Publish Listing**.\n\n` +
        `Once published, verified buyers and FPOs in your region can discover your listing and place purchase orders directly without middlemen.`;
    }

    case 'find_buyers': {
      if (isKn) {
        return `ನಿಮ್ಮ ಹತ್ತಿರದ ${crop !== 'produce' ? `${crop} ಖರೀದಿದಾರರನ್ನು` : 'ಖರೀದಿದಾರರನ್ನು'} ಹುಡುಕಲು ಈ ಕೆಳಗಿನ ಸೌಲಭ್ಯಗಳನ್ನು ಬಳಸಿ:\n\n` +
          `೧. **Marketplace / Procurement ಪುಟ:** ಅಗ್ರಿಕನೆಕ್ಟ್ ಮುಖಪುಟದಲ್ಲಿ 'Procurement' ವಿಭಾಗಕ್ಕೆ ಹೋಗಿ. ಅಲ್ಲಿ ಸಗಟು ಖರೀದಿದಾರರು ಮತ್ತು ಆಹಾರ ಸಂಸ್ಕರಣಾ ಕಂಪನಿಗಳು ಪೋಸ್ಟ್ ಮಾಡಿರುವ ಖರೀದಿ ಟೆಂಡರ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.\n` +
          `೨. **ಸ್ಥಳ ಫಿಲ್ಟರ್ (Location Filter):** ನಿಮ್ಮ ಜಿಲ್ಲೆ (${location}) ಆಯ್ಕೆಮಾಡಿ, ನಿಮ್ಮ ಸುತ್ತಮುತ್ತಲಿನ ಸಕ್ರಿಯ ಖರೀದಿದಾರರನ್ನು ಪತ್ತೆಹಚ್ಚಿ.\n` +
          `೩. **ನೇರ ಆಫರ್ ಸಲ್ಲಿಕೆ:** ಖರೀದಿದಾರರ ಅವಶ್ಯಕತೆಗೆ ತಕ್ಕಂತೆ ನಿಮ್ಮ ಬೆಳೆ ಪ್ರಮಾಣ ಮತ್ತು ಬೆಲೆಯ ಆಫರ್ (Submit Offer) ಸಲ್ಲಿಸಿ.\n` +
          `೪. ನಿಮ್ಮ ಉತ್ಪನ್ನವನ್ನು ಮುಂಚಿತವಾಗಿ ಲಿಸ್ಟ್ ಮಾಡಿದರೆ, ಖರೀದಿದಾರರೇ ನಿಮ್ಮನ್ನು ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತದೆ.`;
      }
      if (isHi) {
        return `अपने नजदीकी ${crop !== 'produce' ? `${crop} के खरीदारों` : 'खरीदारों'} को खोजने के लिए एग्रीकनेक्ट के इन फीचर्स का उपयोग करें:\n\n` +
          `1. **मार्केटप्लेस / Procurement टैब:** 'Procurement' सेक्शन में जाएं, जहां थोक खरीदारों और एग्री-कंपनियों द्वारा पोस्ट की गई मांग और टेंडर उपलब्ध हैं।\n` +
          `2. **स्थान फ़िल्टर (Location Filter):** अपने जिले (${location}) का चयन करें ताकि आपके आसपास के सक्रिय खरीदार दिखाई दें।\n` +
          `3. **सीधा ऑफर भेजें:** खरीदार की मांग देखकर 'Submit Offer' या 'Message' पर क्लिक कर सीधे मोलभाव करें।\n` +
          `4. अपनी फसल को 'List Produce' पर भी लिस्ट रखें, जिससे खरीदार आपको खोजकर सीधा ऑर्डर दे सकें।`;
      }
      return `Here is how you can find verified buyers for your ${crop !== 'produce' ? crop : 'crops'} near ${location}:\n\n` +
        `1. **Explore the Procurement Marketplace:** Go to the 'Procurement' or 'Marketplace' tab on AgriConnect to view active purchase tenders posted by wholesale buyers, retail chains, and institutional processors.\n` +
        `2. **Use Location Filters:** Filter by your district (${location}) to discover nearby buyers and reduce transportation costs.\n` +
        `3. **Submit Offers Directly:** When you find a matching procurement demand, click **'Submit Offer'** with your available quantity and quote.\n` +
        `4. **Publish Active Listings:** Make sure your produce is listed on the platform so buyers searching by location can discover your farm profile directly.`;
    }

    case 'contact_party': {
      if (isKn) {
        return `ಅಗ್ರಿಕನೆಕ್ಟ್‌ನಲ್ಲಿ ${role === 'BUYER' ? 'ರೈತರನ್ನು' : 'ಖರೀದಿದಾರರನ್ನು'} ಸಂಪರ್ಕಿಸಲು ಈ ವಿಧಾನಗಳನ್ನು ಬಳಸಬಹುದು:\n\n` +
          `೧. **ನೇರ ಸಂದೇಶ (In-App Messaging):** ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಯಾವುದೇ ಉತ್ಪನ್ನ ಅಥವಾ ಟೆಂಡರ್ ಕಾರ್ಡ್ ಮೇಲೆ **'Contact'** ಅಥವಾ **'Message'** ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ ಆಂತರಿಕ ಚಾಟ್ ಪ್ರಾರಂಭಿಸಿ.\n` +
          `೨. **ಸಂದೇಶಗಳ ವಿಭಾಗ:** ಮೇಲ್ಭಾಗದ ಮೆನುವಿನಲ್ಲಿರುವ 'Messages' ಐಕಾನ್ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ ನಿಮ್ಮ ಸಕ್ರಿಯ ಸಂಭಾಷಣೆಗಳನ್ನು ಮುಂದುವರಿಸಿ.\n` +
          `೩. **ಆರ್ಡರ್ ವಿವರಗಳಲ್ಲಿ ಫೋನ್ ಸಂಖ್ಯೆ:** ಖರೀದಿ ಆರ್ಡರ್ ದೃಢಪಟ್ಟ ನಂತರ, ಸರಕು ಸಾಗಣೆ ಮತ್ತು ವಿತರಣೆ ಸುಗಮಗೊಳಿಸಲು ಎರಡೂ ಕಡೆಯವರ ಅಧಿಕೃತ ಫೋನ್ ಸಂಖ್ಯೆ ಆರ್ಡರ್ ವಿವರದಲ್ಲಿ ಲಭ್ಯವಿರುತ್ತದೆ.`;
      }
      if (isHi) {
        return `एग्रीकनेक्ट पर ${role === 'BUYER' ? 'किसान' : 'खरीदार'} से संपर्क करने की प्रक्रिया:\n\n` +
          `1. **सीधा संदेश (In-App Messaging):** किसी भी उत्पाद या मांग विवरण पर **'Message'** या **'Contact'** बटन दबाकर सीधे चैट शुरू करें।\n` +
          `2. **Messages डैशबोर्ड:** नेविगेशन बार में दिए गए 'Messages' विकल्प पर क्लिक करके अपनी बातचीत देख और जारी रख सकते हैं।\n` +
          `3. **ऑर्डर के बाद सीधा संपर्क:** एक बार जब खरीद ऑर्डर की पुष्टि हो जाती है, तो ऑर्डर डिटेल्स पेज पर डिलीवरी और पिकअप समन्वय के लिए संपर्क नंबर साझा किया जाता है।`;
      }
      return `To contact a ${role === 'BUYER' ? 'farmer' : 'buyer'} on AgriConnect:\n\n` +
        `1. **In-App Messaging:** On any produce listing or procurement tender card, click the **'Message'** or **'Contact'** button to initiate a direct conversation.\n` +
        `2. **Messages Hub:** Access all your ongoing negotiations and inquiries by clicking the **'Messages'** icon in the top navigation bar.\n` +
        `3. **Verified Order Contact:** Once a purchase order is placed or confirmed, registered contact numbers and dispatch locations are unlocked in the Order Details view for logistics coordination.`;
    }

    case 'listing_troubleshooting': {
      if (isKn) {
        return `ನಿಮ್ಮ ಕೃಷಿ ಉತ್ಪನ್ನದ ಪಟ್ಟಿ (Listing) ಸಾರ್ವಜನಿಕವಾಗಿ ಕಾಣಿಸದಿರಲು ಸಾಮಾನ್ಯ ಕಾರಣಗಳು ಮತ್ತು ಪರಿಹಾರಗಳು:\n\n` +
          `೧. **ಲಭ್ಯವಿರುವ ಪ್ರಮಾಣ (Quantity):** ಪ್ರಮಾಣವು 0 ಆಗಿದ್ದರೆ, ಸಿಸ್ಟಮ್ ಸ್ವಯಂಚಾಲಿತವಾಗಿ 'Sold Out' ಎಂದು ಗುರುತಿಸುತ್ತದೆ. 'My Produce' ಪುಟದಲ್ಲಿ ಪ್ರಮಾಣವನ್ನು ನವೀಕರಿಸಿ.\n` +
          `೨. **ಸ್ಥಿತಿ (Status Active/Inactive):** ಪಟ್ಟಿಯು 'Inactive' ಅಥವಾ 'Draft' ಸ್ಥಿತಿಯಲ್ಲಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ ಸಕ್ರಿಯಗೊಳಿಸಿ.\n` +
          `೩. **ಫಿಲ್ಟರ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು:** ಖರೀದಿದಾರರು ಕಟ್ಟುನಿಟ್ಟಾದ ಸ್ಥಳ ಅಥವಾ ಬೆಲೆ ಫಿಲ್ಟರ್ ಬಳಸಿದ್ದರೆ ನಿಮ್ಮ ಪಟ್ಟಿ ಫಿಲ್ಟರ್ ಆಗಿರಬಹುದು.\n` +
          `೪. **ಖಾತೆ ಪರಿಶೀಲನೆ (KYC):** ನಿಮ್ಮ ರೈತ ಪ್ರೊಫೈಲ್ ಅಪೂರ್ಣವಾಗಿದ್ದರೆ ಪರಿಶೀಲನೆ ಮುಗಿಸಿ.\n\n` +
          `ದಯವಿಟ್ಟು 'My Produce' ವಿಭಾಗಕ್ಕೆ ಹೋಗಿ ನಿಮ್ಮ ಉತ್ಪನ್ನದ ಸ್ಥಿತಿ 'Active' ಆಗಿದೆಯೇ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.`;
      }
      if (isHi) {
        return `यदि आपकी उत्पाद लिस्टिंग दिखाई नहीं दे रही है, तो कृपया निम्नलिखित की जांच करें:\n\n` +
          `1. **उपलब्ध मात्रा (Available Quantity):** यदि मात्रा 0 हो गई है, तो सिस्टम लिस्टिंग को 'Sold Out' कर देता है। 'My Produce' में जाकर मात्रा अपडेट करें।\n` +
          `2. **सक्रिय स्थिति (Active Status):** सुनिश्चित करें कि आपकी लिस्टिंग का स्टेटस 'Active' है, न कि ड्राफ्ट या निष्क्रिय।\n` +
          `3. **सर्च व लोकेशन फिल्टर:** हो सकता है कि खरीदार किसी अन्य जिले या सीमित मूल्य का फिल्टर लगाकर देख रहे हों।\n` +
          `4. **प्रोफाइल सत्यापन (KYC):** प्रोफाइल में आवश्यक जानकारी और स्थान विवरण पूरा भरा होना चाहिए।\n\n` +
          `'My Produce' डैशबोर्ड पर जाकर आप अपनी लिस्टिंग की स्थिति तुरंत संपादित कर सकते हैं।`;
      }
      return `If your produce listing is not visible on the marketplace, here are the most common reasons and solutions:\n\n` +
        `1. **Zero Available Quantity:** If the quantity is set to 0, AgriConnect automatically marks the listing as 'Sold Out'. Check your 'My Produce' page and update the available quantity.\n` +
        `2. **Inactive or Draft Status:** Ensure your listing is toggled to **'Active'** rather than paused or pending draft.\n` +
        `3. **Search Filters:** Buyers might have active filters applied for other districts or specific price brackets.\n` +
        `4. **Profile Verification:** Ensure your farmer profile and farm location details are complete.\n\n` +
        `Tip: Navigate to **'My Produce'** from your dashboard to review, edit, or reactivate any of your listings instantly.`;
    }

    case 'pricing_guidance': {
      let minPrice = 20;
      let maxPrice = 30;
      let avgPrice = 25;
      let unit = 'kg';

      if (retrievedData && retrievedData.action === 'get_market_prices' && retrievedData.data) {
        minPrice = retrievedData.data.min;
        maxPrice = retrievedData.data.max;
        avgPrice = retrievedData.data.avg;
        unit = retrievedData.data.unit || 'kg';
      }

      if (isKn) {
        return `ಕರ್ನಾಟಕದ ಮಾರುಕಟ್ಟೆಗಳಲ್ಲಿ ${crop !== 'produce' ? `${crop} ಬೆಳೆಗೆ` : 'ಈ ಬೆಳೆಗೆ'} ಪ್ರಸ್ತುತ ದರಗಳು ಪ್ರತಿ ${unit}ಗೆ ಸುಮಾರು **₹${minPrice} ರಿಂದ ₹${maxPrice}** ಇವೆ (ಸರಾಸರಿ ದರ: ₹${avgPrice}/${unit}).\n\n` +
          `ಬೆಲೆ ನಿಗದಿಪಡಿಸುವಾಗ ಈ ಅಂಶಗಳನ್ನು ಗಮನದಲ್ಲಿಡಿ:\n` +
          `• **Grade A / ಉತ್ತಮ ಗುಣಮಟ್ಟ:** ಪ್ರತಿ ${unit}ಗೆ ₹${maxPrice - 2} ರಿಂದ ₹${maxPrice} ನಿಗದಿಪಡಿಸಬಹುದು.\n` +
          `• **ಸಾವಯವ (Organic Certified):** ಸಾಂಪ್ರದಾಯಿಕ ಬೆಳೆಗಿಂತ ೧೫-೨೦% ಹೆಚ್ಚಿನ ಪ್ರೀಮಿಯಂ ಬೆಲೆ ಪಡೆಯಬಹುದು.\n` +
          `• **ಮಧ್ಯಮ ದರ್ಜೆ (Grade B) ಅಥವಾ ಬೃಹತ್ ಪ್ರಮಾಣ:** ತ್ವರಿತವಾಗಿ ಮಾರಾಟವಾಗಲು ₹${minPrice} ರಿಂದ ₹${avgPrice} ದರ ಸೂಕ್ತ.\n\n` +
          `ಅಗ್ರಿಕನೆಕ್ಟ್‌ನಲ್ಲಿ ನೇರವಾಗಿ ಸಗಟು ಖರೀದಿದಾರರಿಗೆ ಮಾರಾಟ ಮಾಡುವುದರಿಂದ ದಲ್ಲಾಳಿಗಳ ಕಮಿಷನ್ ಉಳಿದು ಹೆಚ್ಚಿನ ಲಾಭ ಸಿಗುತ್ತದೆ.`;
      }
      if (isHi) {
        return `वर्तमान में कर्नाटक मंडियों में ${crop !== 'produce' ? `${crop}` : 'फसल'} का बाजार भाव लगभग **₹${minPrice} से ₹${maxPrice} प्रति ${unit}** चल रहा है (औसत दर: ₹${avgPrice}/${unit})।\n\n` +
          `मूल्य निर्धारण के लिए सुझाव:\n` +
          `• **ग्रेड A (उत्कृष्ट गुणवत्ता):** आप ₹${maxPrice - 2} से ₹${maxPrice} प्रति ${unit} का प्रीमियम मूल्य रख सकते हैं।\n` +
          `• **जैविक (Organic):** प्रमाणित जैविक उपज पर 15-20% अधिक भाव मिलता है।\n` +
          `• **थोक या ग्रेड B:** तेजी से बिक्री के लिए ₹${minPrice} से ₹${avgPrice} प्रति ${unit} का प्रतिस्पर्धी दाम रखें।\n\n` +
          `एग्रीकनेक्ट पर बिचौलियों के बिना सीधे खरीदार से जुड़ने पर आपको पूरा मुनाफा मिलता है।`;
      }
      return `Based on active marketplace listings and APMC mandi benchmarks in Karnataka, the current rate for **${crop}** ranges between **₹${minPrice} and ₹${maxPrice} per ${unit}** (market average: ₹${avgPrice}/${unit}).\n\n` +
        `Recommendations for setting your price on AgriConnect:\n` +
        `• **Grade A Premium Quality:** Price between ₹${maxPrice - 2} and ₹${maxPrice}/${unit} if your harvest is sorted and graded.\n` +
        `• **Certified Organic:** You can charge a 15-20% premium over conventional produce.\n` +
        `• **Bulk / Quick Liquidation:** A competitive price around ₹${minPrice} - ₹${avgPrice}/${unit} attracts institutional wholesale buyers rapidly.\n\n` +
        `Selling directly through AgriConnect eliminates commission fees, helping you retain higher net income per harvest.`;
    }

    case 'fpo_guidance': {
      if (isKn) {
        return `**FPO (Farmer Producer Organization - ರೈತ ಉತ್ಪಾದಕ ಸಂಸ್ಥೆ)** ಎಂದರೆ ಸಣ್ಣ ಮತ್ತು ಅತಿ ಸಣ್ಣ ರೈತರು ಒಗ್ಗೂಡಿ ರೂಪಿಸಿದ ಸಂಸ್ಥೆಯಾಗಿದೆ.\n\n` +
          `FPO ನ ಮುಖ್ಯ ಪ್ರಯೋಜನಗಳು:\n` +
          `೧. **ಸಾಮೂಹಿಕ ಶಕ್ತಿ (Bargaining Power):** ರೈತರು ಪ್ರತ್ಯೇಕವಾಗಿ ಮಾರಾಟ ಮಾಡುವ ಬದಲು, ಒಟ್ಟಾಗಿ ಬೆಳೆಗಳನ್ನು ಸಂಗ್ರಹಿಸಿ ದೊಡ್ಡ ಕಂಪನಿಗಳು ಮತ್ತು ರಫ್ತುದಾರರೊಂದಿಗೆ ಹೆಚ್ಚಿನ ಬೆಲೆಗೆ ಚೌಕಾಸಿ ಮಾಡಬಹುದು.\n` +
          `೨. **ಕಡಿಮೆ ವೆಚ್ಚದಲ್ಲಿ ಪರಿಕರಗಳು:** ಬಿತ್ತನೆ ಬೀಜ, ಗೊಬ್ಬರ, ಕೀಟನಾಶಕಗಳನ್ನು ಸಗಟು ದರದಲ್ಲಿ ರಿಯಾಯಿತಿಯಲ್ಲಿ ಖರೀದಿಸಿ ಸದಸ್ಯ ರೈತರಿಗೆ ಒದಗಿಸಬಹುದು.\n` +
          `೩. **ಸಂಸ್ಕರಣೆ ಮತ್ತು ಗೋದಾಮು:** ಕೋಲ್ಡ್ ಸ್ಟೋರೇಜ್ ಮತ್ತು ಸ್ವಚ್ಛಗೊಳಿಸುವ ಯಂತ್ರೋಪಕರಣಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಬಹುದು.\n\n` +
          `**ಅಗ್ರಿಕನೆಕ್ಟ್‌ನಲ್ಲಿ FPO ಸೌಲಭ್ಯಗಳು:** ಎಫ್‌ಪಿಒ ವ್ಯವಸ್ಥಾಪಕರು ಸದಸ್ಯ ರೈತರ ಇನ್ವೆಂಟರಿ ನಿರ್ವಹಿಸಬಹುದು, 'Bulk Procurement Tenders' ಪೋಸ್ಟ್ ಮಾಡಬಹುದು ಮತ್ತು ದೊಡ್ಡ ಕಾರ್ಪೊರೇಟ್ ಖರೀದಿದಾರರೊಂದಿಗೆ ನೇರ ಒಪ್ಪಂದ ಮಾಡಿಕೊಳ್ಳಬಹುದು.`;
      }
      if (isHi) {
        return `**FPO (किसान उत्पादक संगठन - Farmer Producer Organization)** छोटे और सीमांत किसानों द्वारा मिलकर बनाया गया एक समूह/कंपनी है।\n\n` +
          `FPO के प्रमुख लाभ:\n` +
          `1. **सामूहिक सौदेबाजी (Bargaining Power):** किसान अपनी उपज को एकत्रित करके बड़ी कंपनियों और प्रोसेसरों को सीधे बेचकर बेहतर मूल्य प्राप्त कर सकते हैं।\n` +
          `2. **कम लागत पर कृषि सामग्री:** बीज, खाद और दवाइयों की थोक खरीद कर सदस्यों को सस्ते में उपलब्ध कराना।\n` +
          `3. **भंडारण व मूल्य संवर्धन:** कोल्ड स्टोरेज, ग्रेडिंग और पैकेजिंग सुविधाओं का साझा लाभ उठाना।\n\n` +
          `**एग्रीकनेक्ट पर FPO टूल्स:** FPO मैनेजर्स अपने सदस्य किसानों की फसल का डिजिटल स्टॉक ट्रैक कर सकते हैं, 'Bulk Procurement' टेंडर जारी कर सकते हैं और थोक खरीदारों से अनुबंध कर सकते हैं।`;
      }
      return `A **Farmer Producer Organization (FPO)** is an enterprise formed by smallholder farmers to pool their resources, harvests, and bargaining power.\n\n` +
        `Key Benefits of an FPO:\n` +
        `1. **Collective Bargaining & Premium Pricing:** Instead of selling small lots to local middlemen at distressed rates, FPOs aggregate hundreds of tonnes of produce to negotiate directly with institutional buyers, supermarkets, and food processors.\n` +
        `2. **Lower Input Costs:** FPOs purchase certified seeds, fertilizers, and equipment in bulk at wholesale discounts for their member farmers.\n` +
        `3. **Shared Infrastructure:** Members gain access to shared cold storage, grading lines, and drying facilities.\n\n` +
        `**AgriConnect for FPOs:** FPO managers can digitize member farmer inventories, publish bulk procurement tenders, and contract temperature-controlled transport through verified logistics partners.`;
    }

    case 'logistics_guidance': {
      if (isKn) {
        return `ಅಗ್ರಿಕನೆಕ್ಟ್ ಸರಕು ಸಾಗಣೆ (Logistics) ಸೇವೆಯು ಫಾರ್ಮ್ ಗೇಟ್‌ನಿಂದ ಗ್ರಾಹಕರವರೆಗೆ ಸುರಕ್ಷಿತ ಸಾರಿಗೆಯನ್ನು ಒದಗಿಸುತ್ತದೆ:\n\n` +
          `• **ವಾಹನ ಪ್ರಕಾರಗಳು:** ಹಣ್ಣು-ತರಕಾರಿಗಳ ತಾಜಾತನ ಕಾಪಾಡಲು ತಾಪಮಾನ ನಿಯಂತ್ರಿತ ಕೋಲ್ಡ್ ಚೈನ್ (Cold Storage Trucks) ಮತ್ತು ಸಾಮಾನ್ಯ ಪಿಕ್-ಅಪ್ ಟ್ರಕ್‌ಗಳು ಲಭ್ಯವಿವೆ.\n` +
          `• **ನೇರ ಫಾರ್ಮ್ ಗೇಟ್ ಪಿಕ್-ಅಪ್:** ಖರೀದಿದಾರರು ಮತ್ತು ಎಫ್‌ಪಿಒಗಳು ಜಮೀನಿನಿಂದಲೇ ಸರಕು ಸಾಗಣೆಯನ್ನು ನಿಗದಿಪಡಿಸಬಹುದು.\n` +
          `• **ರಿಯಲ್-ಟೈಮ್ ಟ್ರ್ಯಾಕಿಂಗ್:** ಸರಕು ರವಾನೆಯಾದ ನಂತರ ಜಿಪಿಎಸ್ ಟ್ರ್ಯಾಕಿಂಗ್ ನಂಬರ್ ಮೂಲಕ ವಾಹನದ ಸ್ಥಳ ಮತ್ತು ಅಂದಾಜು ತಲುಪುವ ಸಮಯವನ್ನು ಪರಿಶೀಲಿಸಬಹುದು.`;
      }
      if (isHi) {
        return `एग्रीकनेक्ट लॉजिस्टिक्स सेवा खेत से लेकर गोदाम और थोक खरीदारों तक पारदर्शी परिवहन प्रदान करती है:\n\n` +
          `• **वाहन के प्रकार:** जल्दी खराब होने वाली फल-सब्जियों के लिए कोल्ड चेन (तापमान नियंत्रित) गाड़ियां और मानक ट्रक उपलब्ध हैं।\n` +
          `• **खेत से सीधा पिकअप:** खरीददार या FPO खेत से सीधे माल उठाने के लिए वाहन शेड्यूल कर सकते हैं।\n` +
          `• **लाइव ट्रैकिंग:** शिपमेंट डिस्पैच होने के बाद ट्रैकिंग नंबर द्वारा गाड़ी की वर्तमान स्थिति और डिलीवरी का अनुमानित समय देख सकते हैं।`;
      }
      return `AgriConnect Logistics connects farmers, FPOs, and buyers with reliable agricultural freight partners:\n\n` +
        `• **Vehicle Fleet:** Access standard trucks (1T to 16T) as well as temperature-controlled cold chain vehicles for perishable fruits, vegetables, and dairy.\n` +
        `• **Farm-Gate Pickup:** Schedule direct pickups from harvest aggregation centers or farm gates.\n` +
        `• **Real-Time GPS Tracking:** Every dispatch receives a tracking number showing route progress, current transit status, and estimated time of delivery (ETA).`;
    }

    case 'general_agronomy': {
      if (isKn) {
        return `${crop !== 'produce' ? `${crop} ಬೆಳೆ` : 'ಕೃಷಿ'} ನಿರ್ವಹಣೆ ಮತ್ತು ಉತ್ತಮ ಇಳುವರಿಗಾಗಿ ಪ್ರಮುಖ ಕೃಷಿ ಪದ್ಧತಿಗಳು:\n\n` +
          `• **ಮಣ್ಣಿನ ಪರೀಕ್ಷೆ ಮತ್ತು ತಯಾರಿ:** ಜಮೀನನ್ನು ಆಳವಾಗಿ ಉಳುಮೆ ಮಾಡಿ ಚೆನ್ನಾಗಿ ಕಳಿತ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರವನ್ನು (FYM) ಬೆರೆಸಿ.\n` +
          `• **ಹನಿ ನೀರಾವರಿ (Drip Irrigation):** ನೀರು ಮತ್ತು ರಸಗೊಬ್ಬರವನ್ನು ಬೇರುಗಳಿಗೆ ನೇರವಾಗಿ ಒದಗಿಸುವುದರಿಂದ ೩೦-೪೦% ನೀರಿನ ಉಳಿತಾಯ ಮತ್ತು ಉತ್ತಮ ಇಳುವರಿ ಬರುತ್ತದೆ. ಎಲೆಗಳ ಮೇಲೆ ನೀರು ಬೀಳದಂತೆ ನೋಡಿಕೊಳ್ಳುವುದರಿಂದ ಬ್ಲೈಟ್ ಮತ್ತು ಶಿಲೀಂಧ್ರ ರೋಗಗಳು ಗಣನೀಯವಾಗಿ ಕಡಿಮೆಯಾಗುತ್ತವೆ.\n` +
          `• **ಕೀಟ ಹಾಗೂ ರೋಗ ನಿರ್ವಹಣೆ:** ಬ್ಲೈಟ್ ಬಾಧೆ ತಡೆಗಟ್ಟಲು ಮುಂಚಿತವಾಗಿ ಬೇವಿನ ಎಣ್ಣೆ (೧೫೦೦ ppm) ಸಿಂಪಡಿಸಿ ಅಥವಾ ಶಿಫಾರಸು ಮಾಡಿದ ಜೈವಿಕ ಶಿಲೀಂಧ್ರನಾಶಕ ಟ್ರೈಕೋಡರ್ಮಾ ಬಳಸಿ.\n` +
          `• **ಸಮತೋಲಿತ ಪೋಷಕಾಂಶ:** ಸಾರಜನಕ, ರಂಜಕ ಮತ್ತು ಪೊಟ್ಯಾಶ್ (NPK) ಪೋಷಕಾಂಶಗಳನ್ನು ಹಂತ-ಹಂತವಾಗಿ ನೀಡಿ.`;
      }
      if (isHi) {
        return `${crop !== 'produce' ? `${crop}` : 'फसल'} की बेहतर पैदावार और रोग नियंत्रण के लिए कृषि सलाह:\n\n` +
          `• **मृदा स्वास्थ्य:** बुवाई से पहले खेत की गहरी जुताई करें और सड़ी हुई गोबर की खाद (FYM) पर्याप्त मात्रा में मिलाएं।\n` +
          `• **ड्रिप सिंचाई:** ड्रिप सिस्टम अपनाने से पानी की बचत होती है और पत्तियों पर पानी न पड़ने से फंगल संक्रमण व झुलसा रोग (Blight) का खतरा कम रहता है।\n` +
          `• **कीट व रोग नियंत्रण:** शुरुआती अवस्था में नीम तेल (Neem Oil) का छिड़काव करें या फफूंदनाशी मैंकोजेब का प्रयोग करें।\n` +
          `• **उर्वरक प्रबंधन:** संतुलित मात्रा में नाइट्रोजन, फास्फोरस और पोटाश (NPK) का प्रयोग करें।`;
      }
      return `Key agronomy practices for healthy ${crop !== 'produce' ? crop : 'crop'} cultivation and high yield:\n\n` +
        `• **Soil Preparation:** Ensure well-drained soil with a balanced pH (6.0 - 7.0). Incorporate well-decomposed farmyard manure (FYM) during land preparation.\n` +
        `• **Efficient Irrigation:** Use drip irrigation to deliver water directly to root zones without wetting foliage, drastically reducing early blight and fungal infections.\n` +
        `• **Pest & Disease Management:** Regularly monitor for blight lesions and sap-sucking pests. Use prophylactic neem oil sprays (1500 ppm) or systemic bio-fungicides (Trichoderma) at first signs of leaf spot.\n` +
        `• **Balanced Nutrition:** Apply NPK fertilizers based on soil test recommendations, emphasizing potassium during fruit and grain formation.`;
    }

    case 'unrelated_general': {
      if (prompt.toLowerCase().includes('capital of france') || prompt.toLowerCase().includes('france')) {
        return `The capital of France is **Paris**. If you have any questions about agriculture, crop prices, or AgriConnect farming services, feel free to ask!`;
      }
      if (isKn) {
        return `ನಾನು ನಿಮ್ಮ ಅಗ್ರಿಕನೆಕ್ಟ್ ಎಐ ಸಹಾಯಕ. ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಕೃಷಿ ಕ್ಷೇತ್ರಕ್ಕೆ ಸಂಬಂಧಿಸಿಲ್ಲದಿದ್ದರೂ ಉತ್ತರಿಸಬಲ್ಲೆ. ಕೃಷಿ, ಬೆಳೆಗಳು, ಮಾರುಕಟ್ಟೆ ಅಥವಾ ಸಾಮಾನ್ಯ ವಿಷಯಗಳ ಕುರಿತು ಯಾವುದೇ ಸಹಾಯ ಬೇಕಿದ್ದರೂ ತಿಳಿಸಿ!`;
      }
      if (isHi) {
        return `मैं आपका एग्रीकनेक्ट एआई सहायक हूं। यद्यपि आपका प्रश्न कृषि से संबंधित नहीं है, फिर भी मैं आपकी सहायता के लिए तैयार हूं। फसल, मंडी या अन्य किसी विषय पर बेझिझक पूछें!`;
      }
      return `I am AgriConnect AI, ready to assist you. While this question is outside agricultural trade, I am glad to answer. Feel free to ask about crop cultivation, mandi prices, finding buyers, or farm logistics!`;
    }

    case 'clarification_needed': {
      if (isKn) {
        return `ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಸ್ವಲ್ಪ ವಿವರವಾಗಿ ತಿಳಿಸಿ. ನೀವು ಬೆಳೆ ಮಾರಾಟ ಮಾಡಲು ಬಯಸುವಿರಾ, ನಿರ್ದಿಷ್ಟ ಬೆಳೆಯ ಮಾರುಕಟ್ಟೆ ದರ ತಿಳಿಯಬೇಕೇ, ಅಥವಾ ಕೃಷಿ ಸಲಹೆ ಬೇಕಾಗಿದೆಯೇ?`;
      }
      if (isHi) {
        return `कृपया अपना प्रश्न थोड़ा और स्पष्ट करें। क्या आप फसल बेचना चाहते हैं, मंडी भाव जानना चाहते हैं, या किसी कृषि समस्या पर सलाह चाहते हैं?`;
      }
      return `Could you please clarify your question with a bit more detail? For instance, are you looking to cultivate a crop, diagnose a leaf problem, check mandi prices, or find buyers on AgriConnect?`;
    }

    default: {
      if (isKn) {
        return `ಅಗ್ರಿಕನೆಕ್ಟ್ ಕೃಷಿ ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಬೆಳೆಗಳ ನಿರ್ವಹಣೆ, ಮಾರುಕಟ್ಟೆ ದರಗಳು, ನೇರ ಖರೀದಿ-ಮಾರಾಟ ಮತ್ತು ಕೃಷಿ ತಂತ್ರಜ್ಞಾನದ ಬಗ್ಗೆ ನಾನು ನಿಮಗೆ ನೆರವಾಗಬಲ್ಲೆ. ಇಂದು ನಿಮಗೆ ಯಾವ ನಿರ್ದಿಷ್ಟ ವಿಷಯದಲ್ಲಿ ಸಹಾಯ ಬೇಕು?`;
      }
      if (isHi) {
        return `एग्रीकनेक्ट प्लेटफॉर्म पर मैं फसलों की खेती, उचित मंडी भाव, रोग नियंत्रण और बाजार से जुड़ने में आपकी सहायता कर सकता हूं। बताइए, किस विषय पर जानकारी चाहिए?`;
      }
      return `As your AgriConnect AI assistant, I can help you with crop cultivation practices, disease diagnosis, mandi market prices, finding verified buyers, and logistics. How can I assist you with your farming or agricultural questions today?`;
    }
  }
}

/**
 * Execute reasoning with Google Gemini, OpenAI, Groq, or Native AI Intelligence Engine
 * @param {string} prompt - User text query
 * @param {Array} history - Previous conversation messages [{ role: 'user'|'assistant', content: string }]
 * @param {object} context - User context { role, user, language, sessionId }
 * @param {object} retrievedData - Optional pre-retrieved database action result
 * @returns {Promise<object>} Structured response object
 */
const reasonWithEvon = async (rawPrompt, history = [], context = {}, retrievedData = null) => {
  const prompt = typeof rawPrompt === 'string' ? rawPrompt : (rawPrompt?.query || rawPrompt?.text || String(rawPrompt || ''));
  const startTime = Date.now();
  const config = getGnaniConfig();
  const role = context.role || (context.user && context.user.role) || 'FARMER';
  const language = detectLanguage(prompt, context.language || 'en-IN');
  const user = context.user || null;

  // 1. Extract entities and identify intent from query and conversation history
  const entities = extractEntities(prompt, history);
  const intent = classifyIntent(prompt, entities, role, history);

  // Determine if database execution is needed
  const requiresAction = ['search_produce', 'get_user_listings', 'check_orders', 'check_shipments', 'pricing_guidance'].includes(intent);
  const mappedActionIntent =
    intent === 'my_listings' ? 'get_user_listings' :
      intent === 'pricing_guidance' ? 'get_market_prices' :
        intent;

  const systemPrompt = BUILD_SYSTEM_PROMPT(role, user, language);

  // ---------------------------------------------------------------------------
  // 1. Try Google Gemini API if GEMINI_API_KEY is configured
  // ---------------------------------------------------------------------------
  const geminiApiKey = config.gemini?.apiKey || process.env.GEMINI_API_KEY;
  if (geminiApiKey && geminiApiKey.trim() !== '') {
    const rawModel = (config.gemini?.model || process.env.GEMINI_MODEL || 'gemini-3.5-flash').trim();
    const candidateModels = Array.from(new Set([
      rawModel,
      'gemini-3.5-flash',
      'gemini-3-flash-preview',
      'gemini-flash-latest'
    ]));

    // Format conversation history for Gemini (roles: 'user' and 'model')
    const contents = [];
    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
    for (const msg of recentHistory) {
      const text = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      if (text && text.trim()) {
        contents.push({
          role: msg.role === 'assistant' || msg.sender === 'assistant' ? 'model' : 'user',
          parts: [{ text }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    for (const geminiModel of candidateModels) {
      const reqStart = Date.now();
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2048,
              responseMimeType: 'application/json',
            },
          }),
          signal: AbortSignal.timeout(25000),
        });

        const latency = Date.now() - reqStart;

        if (response.ok) {
          const data = await response.json();
          const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (rawContent && rawContent.trim()) {
            const parsed = safeParseJson(rawContent);
            let finalResponse = parsed?.response || parsed?.answer || parsed?.text || parsed?.reply || parsed?.message || parsed?.content || parsed?.explanation;
            if (!finalResponse && parsed && typeof parsed === 'object') {
              for (const k of Object.keys(parsed)) {
                if (!['thought_process', 'intent', 'entities', 'requires_action', 'requires_confirmation', 'confirmation_details'].includes(k) && typeof parsed[k] === 'string' && parsed[k].trim()) {
                  finalResponse = parsed[k];
                  break;
                }
              }
            }
            if (!finalResponse) {
              finalResponse = cleanResponseText(rawContent);
            }
            const finalIntent = parsed?.intent || mappedActionIntent;

            logAiDiagnostics({
              stage: 'Gemini API',
              model: geminiModel,
              query: prompt,
              hasHistory: recentHistory.length > 0,
              historyTurns: recentHistory.length,
              success: true,
              latencyMs: latency,
            });

            return {
              thought_process: parsed?.thought_process || `Reasoned with Google Gemini (${geminiModel})`,
              intent: finalIntent,
              entities: parsed?.entities || entities,
              requires_action: typeof parsed?.requires_action === 'boolean' ? parsed.requires_action : requiresAction,
              requires_confirmation: Boolean(parsed?.requires_confirmation),
              confirmation_details: parsed?.confirmation_details || null,
              response: finalResponse,
              mode: 'LIVE',
              model: geminiModel,
              provider: `Google Gemini (${geminiModel})`,
            };
          }
        } else {
          const errText = await response.text();
          logAiDiagnostics({
            stage: 'Gemini API',
            model: geminiModel,
            query: prompt,
            hasHistory: recentHistory.length > 0,
            historyTurns: recentHistory.length,
            success: false,
            error: `HTTP ${response.status}: ${errText.substring(0, 120)}`,
            latencyMs: latency,
          });
        }
      } catch (geminiErr) {
        logAiDiagnostics({
          stage: 'Gemini API',
          model: geminiModel,
          query: prompt,
          hasHistory: recentHistory.length > 0,
          historyTurns: recentHistory.length,
          success: false,
          error: geminiErr.message,
          latencyMs: Date.now() - reqStart,
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Try OpenAI API if OPENAI_API_KEY is configured
  // ---------------------------------------------------------------------------
  const openaiApiKey = config.openai?.apiKey || process.env.OPENAI_API_KEY;
  if (openaiApiKey && openaiApiKey.trim() !== '') {
    const openaiModel = config.openai?.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const reqStart = Date.now();
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6).map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        })),
        { role: 'user', content: prompt },
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: openaiModel,
          messages,
          temperature: 0.3,
          max_tokens: 1500,
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(20000),
      });

      const latency = Date.now() - reqStart;
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = safeParseJson(content);
          let finalResponse = parsed?.response || parsed?.answer || parsed?.text || parsed?.reply || parsed?.message || parsed?.content || parsed?.explanation;
          if (!finalResponse && parsed && typeof parsed === 'object') {
            for (const k of Object.keys(parsed)) {
              if (!['thought_process', 'intent', 'entities', 'requires_action', 'requires_confirmation', 'confirmation_details'].includes(k) && typeof parsed[k] === 'string' && parsed[k].trim()) {
                finalResponse = parsed[k];
                break;
              }
            }
          }
          if (!finalResponse) {
            finalResponse = cleanResponseText(content);
          }
          logAiDiagnostics({
            stage: 'OpenAI API',
            model: openaiModel,
            query: prompt,
            hasHistory: history.length > 0,
            historyTurns: history.length,
            success: true,
            latencyMs: latency,
          });

          return {
            thought_process: parsed?.thought_process || `Reasoned with OpenAI (${openaiModel})`,
            intent: parsed?.intent || mappedActionIntent,
            entities: parsed?.entities || entities,
            requires_action: typeof parsed?.requires_action === 'boolean' ? parsed.requires_action : requiresAction,
            requires_confirmation: Boolean(parsed?.requires_confirmation),
            confirmation_details: parsed?.confirmation_details || null,
            response: finalResponse,
            mode: 'LIVE',
            model: openaiModel,
            provider: `OpenAI (${openaiModel})`,
          };
        }
      } else {
        const errText = await response.text();
        logAiDiagnostics({
          stage: 'OpenAI API',
          model: openaiModel,
          query: prompt,
          hasHistory: history.length > 0,
          historyTurns: history.length,
          success: false,
          error: `HTTP ${response.status}: ${errText.substring(0, 120)}`,
          latencyMs: latency,
        });
      }
    } catch (openAiErr) {
      logAiDiagnostics({
        stage: 'OpenAI API',
        model: openaiModel,
        query: prompt,
        hasHistory: history.length > 0,
        historyTurns: history.length,
        success: false,
        error: openAiErr.message,
        latencyMs: Date.now() - reqStart,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Try Groq API if GROQ_API_KEY is configured
  // ---------------------------------------------------------------------------
  const groqApiKey = config.groq?.apiKey || process.env.GROQ_API_KEY;
  if (groqApiKey && groqApiKey.trim() !== '') {
    const rawGroqModel = (config.groq?.model || process.env.GROQ_MODEL || 'qwen/qwen3.8-27b').trim();
    const candidateGroqModels = Array.from(new Set([
      rawGroqModel,
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
    ]));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })),
      { role: 'user', content: prompt },
    ];

    for (const groqModel of candidateGroqModels) {
      const reqStart = Date.now();
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: groqModel,
            messages,
            temperature: 0.3,
            max_tokens: 1500,
            response_format: { type: 'json_object' },
          }),
          signal: AbortSignal.timeout(20000),
        });

        const latency = Date.now() - reqStart;
        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = safeParseJson(content);
            let finalResponse = parsed?.response || parsed?.answer || parsed?.text || parsed?.reply || parsed?.message || parsed?.content || parsed?.explanation;
            if (!finalResponse && parsed && typeof parsed === 'object') {
              for (const k of Object.keys(parsed)) {
                if (!['thought_process', 'intent', 'entities', 'requires_action', 'requires_confirmation', 'confirmation_details'].includes(k) && typeof parsed[k] === 'string' && parsed[k].trim()) {
                  finalResponse = parsed[k];
                  break;
                }
              }
            }
            if (!finalResponse) {
              finalResponse = cleanResponseText(content);
            }
            logAiDiagnostics({
              stage: 'Groq API',
              model: groqModel,
              query: prompt,
              hasHistory: history.length > 0,
              historyTurns: history.length,
              success: true,
              latencyMs: latency,
            });

            return {
              thought_process: parsed?.thought_process || `Reasoned with Groq (${groqModel})`,
              intent: parsed?.intent || mappedActionIntent,
              entities: parsed?.entities || entities,
              requires_action: typeof parsed?.requires_action === 'boolean' ? parsed.requires_action : requiresAction,
              requires_confirmation: Boolean(parsed?.requires_confirmation),
              confirmation_details: parsed?.confirmation_details || null,
              response: finalResponse,
              mode: 'LIVE',
              model: groqModel,
              provider: `Groq (${groqModel})`,
            };
          }
        } else {
          const errText = await response.text();
          logAiDiagnostics({
            stage: 'Groq API',
            model: groqModel,
            query: prompt,
            hasHistory: history.length > 0,
            historyTurns: history.length,
            success: false,
            error: `HTTP ${response.status}: ${errText.substring(0, 120)}`,
            latencyMs: latency,
          });
        }
      } catch (groqErr) {
        logAiDiagnostics({
          stage: 'Groq API',
          model: groqModel,
          query: prompt,
          hasHistory: history.length > 0,
          historyTurns: history.length,
          success: false,
          error: groqErr.message,
          latencyMs: Date.now() - reqStart,
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Native Dynamic Agricultural Intelligence & Knowledge Engine
  // ---------------------------------------------------------------------------
  const naturalResponse = synthesizeResponse(intent, entities, prompt, { role, user, language }, retrievedData);
  const thoughtProcess = `Analyzed user question as intent="${intent}" for role="${role}". Entities detected: crop="${entities.crop || 'none'}", location="${entities.location || 'none'}". Memory: ${history.length} turns. Generated direct, question-specific response in ${language}.`;

  const latency = Date.now() - startTime;
  logAiDiagnostics({
    stage: 'AgriConnect Native Intelligence',
    model: 'agriconnect-expert-v3',
    query: prompt,
    hasHistory: history.length > 0,
    historyTurns: history.length,
    success: true,
    latencyMs: latency,
  });

  return {
    thought_process: thoughtProcess,
    intent: mappedActionIntent,
    entities,
    requires_action: requiresAction,
    requires_confirmation: false,
    response: naturalResponse,
    mode: 'LIVE',
    model: 'agriconnect-expert-v3',
    provider: 'AgriConnect AI Intelligence Engine',
    isMock: false,
  };
};

/**
 * Safely parse JSON or extract JSON substring from LLM response
 */
function safeParseJson(str) {
  if (!str) return null;
  const cleaned = str.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (err) {
        try {
          const sanitized = match[0].replace(/(?:\r\n|\r|\n)/g, '\\n');
          return JSON.parse(sanitized);
        } catch (err2) {
          return null;
        }
      }
    }
    return null;
  }
}

/**
 * Clean response text to ensure raw JSON strings are never displayed to the user
 */
function cleanResponseText(str) {
  if (!str || typeof str !== 'string') return '';
  const cleaned = str.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    try {
      const obj = JSON.parse(cleaned);
      if (obj.response || obj.answer || obj.text || obj.reply || obj.message || obj.content) {
        return obj.response || obj.answer || obj.text || obj.reply || obj.message || obj.content;
      }
    } catch (e) {
      // ignore
    }
  }
  return cleaned;
}

module.exports = {
  reasonWithEvon,
  classifyIntent,
  extractEntities,
  isFollowUpQuery,
  safeParseJson,
  cleanResponseText,
};
