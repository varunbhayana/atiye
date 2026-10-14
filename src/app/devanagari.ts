/**
 * Speech-only conversion of the app's Roman Hinglish into Hindi (Devanagari), so a Hindi voice
 * (e.g. macOS "Lekha") speaks natural Hindi: "Garden mein kitne rabbits hain?" → "बगीचे में कितने खरगोश हैं?".
 * The child still SEES Roman Hinglish on screen; only the audio is Hindi.
 * The dictionary covers every word the app can say (enforced by tests/unit/devanagari.test.ts).
 */
export const HINDI_WORDS: Record<string, string> = {
  // ---- English nouns & words → Hindi vocabulary
  adventure: 'सफ़र', answer: 'जवाब', apple: 'सेब', apples: 'सेब', badge: 'बैज', ball: 'गेंद', balloon: 'गुब्बारा',
  banana: 'केला', bananas: 'केले', beach: 'समुद्र किनारे', bear: 'भालू', bee: 'मधुमक्खी', bees: 'मधुमक्खियाँ',
  block: 'ब्लॉक', blocks: 'ब्लॉक', blue: 'नीला', book: 'किताब', box: 'डिब्बा', butterfly: 'तितली', butterflies: 'तितलियाँ',
  car: 'गाड़ी', carrot: 'गाजर', carrots: 'गाजर', cat: 'बिल्ली', chest: 'संदूक', chick: 'चूज़ा', chicks: 'चूज़े',
  circle: 'गोला', circles: 'गोले', coins: 'सिक्के', cookie: 'बिस्कुट', cookies: 'बिस्कुट', corner: 'कोना', corners: 'कोने',
  counter: 'काउंटर', crayon: 'क्रेयॉन', cupcake: 'केक', cupcakes: 'केक', detective: 'जासूस', dinosaur: 'डायनासोर',
  dog: 'कुत्ता', done: 'डन', duck: 'बत्तख', ducks: 'बत्तखें', equals: 'बराबर', explorer: 'खोजी', fish: 'मछली',
  free: 'फ़्री', frog: 'मेंढक', frogs: 'मेंढक', game: 'खेल', games: 'खेल', garden: 'बगीचे', grapes: 'अंगूर',
  green: 'हरा', group: 'समूह', hello: 'नमस्ते', hi: 'नमस्ते', hurray: 'हुर्रे', island: 'द्वीप', jump: 'छलांग',
  jumps: 'छलांग', just: 'ठीक', kite: 'पतंग', ladybird: 'लेडीबर्ड', ladybirds: 'लेडीबर्ड', lesson: 'पाठ', level: 'लेवल',
  line: 'लाइन', lock: 'ताला', maths: 'गणित', minus: 'घटा', missing: 'ग़ायब', mission: 'मिशन', mix: 'मिलाजुला',
  monster: 'मॉन्स्टर', mushroom: 'मशरूम', mushrooms: 'मशरूम', number: 'नंबर', numbers: 'नंबर', olive: 'जैतून',
  olives: 'जैतून', ollie: 'ऑली', oops: 'अरे', orange: 'संतरा', order: 'क्रम', oval: 'अंडाकार', ovals: 'अंडाकार',
  pattern: 'पैटर्न', pay: 'पैसे', pear: 'नाशपाती', penguin: 'पेंगुइन', penguins: 'पेंगुइन', pepper: 'शिमला मिर्च',
  peppers: 'शिमला मिर्च', picture: 'तस्वीर', pizza: 'पिज़्ज़ा', play: 'खेल', plus: 'जमा', points: 'नोकें',
  puppies: 'पिल्ले', puppy: 'पिल्ला', purple: 'बैंगनी', purse: 'बटुआ', puzzles: 'पहेलियाँ', quiz: 'क्विज़',
  rabbit: 'खरगोश', rabbits: 'खरगोश', rectangle: 'आयत', rectangles: 'आयत', red: 'लाल', repeat: 'दोहराया',
  result: 'नतीजा', save: 'सेव', school: 'स्कूल', screen: 'स्क्रीन', set: 'सेट', shape: 'आकार', sides: 'भुजाएँ',
  sign: 'चिह्न', solve: 'हल', square: 'वर्ग', squares: 'वर्ग', star: 'तारा', stars: 'तारे', step: 'क़दम',
  sticker: 'स्टिकर', stops: 'पड़ाव', strawberries: 'स्ट्रॉबेरी', strawberry: 'स्ट्रॉबेरी', tap: 'टैप', teddy: 'टेडी',
  time: 'समय', tomato: 'टमाटर', tomatoes: 'टमाटर', topping: 'टॉपिंग', toppings: 'टॉपिंग', total: 'कुल',
  tower: 'मीनार', towers: 'मीनारें', toy: 'खिलौना', train: 'रेलगाड़ी', triangle: 'त्रिभुज', triangles: 'त्रिभुज',
  tummy: 'पेट', turtle: 'कछुआ', turtles: 'कछुए', wheel: 'पहिया', yellow: 'पीला', yo: 'यो', yummy: 'स्वादिष्ट',
  min: 'मिनट',
  // ---- Roman Hindi → Devanagari
  aa: 'आ', aage: 'आगे', aaj: 'आज', aakhir: 'आख़िर', aaram: 'आराम', aasmaan: 'आसमान', aata: 'आता', aaya: 'आया',
  aayega: 'आएगा', aayi: 'आई', ab: 'अब', abhi: 'अभी', achhi: 'अच्छी', alag: 'अलग', ande: 'अंडे', apne: 'अपने',
  aur: 'और', baad: 'बाद', baar: 'बार', baare: 'बारे', baari: 'बारी', bach: 'बच', bache: 'बचे', bada: 'बड़ा',
  badalta: 'बदलता', bade: 'बड़े', badhta: 'बढ़ता', bagal: 'बगल', bahut: 'बहुत', banao: 'बनाओ', banate: 'बनाते',
  band: 'बंद', bano: 'बनो', barabar: 'बराबर', barf: 'बर्फ़', beech: 'बीच', bhaari: 'भारी', bharo: 'भरो',
  bhookh: 'भूख', bhookha: 'भूखा', bhookhe: 'भूखे', bilkul: 'बिल्कुल', bol: 'बोल', bola: 'बोला', bolo: 'बोलो',
  bolte: 'बोलते', chaabi: 'चाबी', chaand: 'चाँद', chahiye: 'चाहिए', chale: 'चले', chalein: 'चलें', chalo: 'चलो',
  chalte: 'चलते', chamakta: 'चमकता', chamakti: 'चमकती', cheezein: 'चीज़ें', chhodo: 'छोड़ो', chhota: 'छोटा',
  chhoti: 'छोटी', chuno: 'चुनो', daalo: 'डालो', dabao: 'दबाओ', dabba: 'डब्बा', dabbe: 'डब्बे', dadi: 'दादी',
  dekhne: 'देखने', dekho: 'देखो', dete: 'देते', dhoondho: 'ढूँढो', dhyaan: 'ध्यान', dikhaya: 'दिखाया', dikhta: 'दिखता',
  dikhte: 'दिखते', din: 'दिन', diya: 'दिया', diye: 'दिए', do: 'दो', dono: 'दोनों', ek: 'एक', gaya: 'गया', gaye: 'गए',
  gayi: 'गई', ghatta: 'घटता', gilahri: 'गिलहरी', gin: 'गिन', gine: 'गिने', gino: 'गिनो', ginte: 'गिनते', ginti: 'गिनती',
  gol: 'गोल', haan: 'हाँ', hai: 'है', hain: 'हैं', halka: 'हल्का', hamesha: 'हमेशा', har: 'हर', hatao: 'हटाओ',
  hissa: 'हिस्सा', ho: 'हो', hoon: 'हूँ', hota: 'होता', hote: 'होते', hoti: 'होती', hua: 'हुआ', hue: 'हुए', hum: 'हम',
  humne: 'हमने', indradhanush: 'इंद्रधनुष', inko: 'इनको', inmein: 'इनमें', is: 'इस', iska: 'इसका', isko: 'इसको',
  isliye: 'इसलिए', jaate: 'जाते', jaaye: 'जाए', jagah: 'जगह', jahan: 'जहाँ', jaisa: 'जैसा', jaisi: 'जैसी',
  jaldi: 'जल्दी', jao: 'जाओ', jawab: 'जवाब', jo: 'जो', jodo: 'जोड़ो', ka: 'का', kahan: 'कहाँ', kaisa: 'कैसा', kam: 'कम',
  kamaal: 'कमाल', kar: 'कर', karein: 'करें', karenge: 'करेंगे', karke: 'करके', karo: 'करो', karti: 'करती',
  karwao: 'करवाओ', kaun: 'कौन', kaunsa: 'कौनसा', kaunse: 'कौनसे', kaunsi: 'कौनसी', ke: 'के', kehte: 'कहते',
  khaali: 'ख़ाली', khaata: 'खाता', khadi: 'खड़ी', khao: 'खाओ', khatam: 'ख़त्म', khazane: 'ख़ज़ाने', khel: 'खेल',
  khelna: 'खेलना', khelne: 'खेलने', khelo: 'खेलो', khelte: 'खेलते', khilao: 'खिलाओ', khilaye: 'खिलाए', khincha: 'खिंचा',
  khoj: 'खोज', kholegi: 'खोलेगी', kholta: 'खोलता', khul: 'खुल', khulta: 'खुलता', ki: 'की', kis: 'किस', kitna: 'कितना',
  kitne: 'कितने', kitni: 'कितनी', kiye: 'किए', ko: 'को', koi: 'कोई', koshish: 'कोशिश', kuch: 'कुछ', kursi: 'कुर्सी',
  kya: 'क्या', lagao: 'लगाओ', lagate: 'लगाते', lagega: 'लगेगा', lagi: 'लगी', lamba: 'लंबा', lambi: 'लंबी', le: 'ले',
  lena: 'लेना', liya: 'लिया', liye: 'लिए', magarmach: 'मगरमच्छ', maidan: 'मैदान', main: 'मैं', matlab: 'मतलब',
  mein: 'में', mera: 'मेरा', meri: 'मेरी', mile: 'मिले', milenge: 'मिलेंगे', mili: 'मिली', milke: 'मिलके', muh: 'मुँह',
  naapa: 'नापा', naapne: 'नापने', nahi: 'नहीं', namaste: 'नमस्ते', naya: 'नया', naye: 'नए', ne: 'ने', neeche: 'नीचे',
  nikla: 'निकला', paas: 'पास', pahuncha: 'पहुँचा', pahunche: 'पहुँचे', pakdo: 'पकड़ो', pakka: 'पक्का', par: 'पर',
  paudha: 'पौधा', pe: 'पे', peeche: 'पीछे', pehle: 'पहले', pet: 'पेट', phir: 'फिर', phodo: 'फोड़ो', poori: 'पूरी',
  pura: 'पूरा', raat: 'रात', raha: 'रहा', rahe: 'रहे', rahi: 'रही', raho: 'रहो', rakhe: 'रखे', rakho: 'रखो', rok: 'रोक',
  ruke: 'रुके', ruko: 'रुको', sa: 'सा', saare: 'सारे', saath: 'साथ', sab: 'सब', sabse: 'सबसे', safar: 'सफ़र',
  sahi: 'सही', sawaal: 'सवाल', se: 'से', seedha: 'सीधा', seekha: 'सीखा', seekhein: 'सीखें', seekho: 'सीखो',
  seekhte: 'सीखते', seep: 'सीप', shabaash: 'शाबाश', shuru: 'शुरू', sirf: 'सिर्फ़', socho: 'सोचो', sone: 'सोने',
  sote: 'सोते', subah: 'सुबह', suraj: 'सूरज', swagat: 'स्वागत', taare: 'तारे', taiyaar: 'तैयार', tak: 'तक',
  talaab: 'तालाब', taraf: 'तरफ़', teen: 'तीन', the: 'थे', thi: 'थी', titli: 'तितली', toh: 'तो', tumhara: 'तुम्हारा',
  tumhare: 'तुम्हारे', tumhari: 'तुम्हारी', tumhe: 'तुम्हें', tumne: 'तुमने', ud: 'उड़', udne: 'उड़ने', ugta: 'उगता',
  ulta: 'उल्टा', ulti: 'उल्टी', ungliyan: 'उंगलियाँ', ungliyon: 'उंगलियों', unhe: 'उन्हें', unko: 'उनको', unpe: 'उनपे',
  upar: 'ऊपर', us: 'उस', use: 'उसे', uske: 'उसके', usmein: 'उसमें', uthaoge: 'उठाओगे', utne: 'उतने', wahi: 'वही',
  wahin: 'वहीं', wala: 'वाला', wale: 'वाले', wali: 'वाली', wapas: 'वापस', waqt: 'वक़्त', wo: 'वो', ya: 'या', ye: 'ये',
  zor: 'ज़ोर', zyada: 'ज़्यादा',
  yaaay: 'येएएए', yay: 'येए', yippee: 'यिप्पी', woohoo: 'वूहू', hooray: 'हुर्रे',
  forest: 'फ़ॉरेस्ट', mountain: 'माउंटेन', castle: 'कैसल', addition: 'एडिशन', subtraction: 'सबट्रैक्शन', cave: 'केव',
  compare: 'कम्पेयर', lake: 'लेक', city: 'सिटी', puzzle: 'पज़ल', meadow: 'मेडो', counting: 'काउंटिंग', adding: 'ऐडिंग',
  taking: 'टेकिंग', away: 'अवे', more: 'मोर', less: 'लेस', shapes: 'शेप्स', patterns: 'पैटर्न्स', thinking: 'थिंकिंग',
  measure: 'मेज़र', warm: 'वॉर्म', up: 'अप',
  achha: 'अच्छा', agla: 'अगला', agle: 'अगले', arre: 'अरे', baat: 'बात', badhiya: 'बढ़िया', bas: 'बस', dekhte: 'देखते',
  dobara: 'दोबारा', dots: 'बिंदु', dusra: 'दूसरा', ekdum: 'एकदम', galat: 'ग़लत', hatate: 'हटाते', help: 'मदद', inhe: 'इन्हें',
  jaano: 'जानो', jodte: 'जोड़ते', karne: 'करने', karoge: 'करोगे', karte: 'करते', milo: 'मिलो', milte: 'मिलते', naapte: 'नापते',
  sakte: 'सकते', socha: 'सोचा', super: 'सुपर', thoda: 'थोड़ा', try: 'कोशिश', tum: 'तुम', wah: 'वाह', zabardast: 'ज़बरदस्त', zaroor: 'ज़रूर',
};

/** Words that are deliberately left in the Latin alphabet (child's name etc. are added at runtime). */
export function unknownWords(text: string): string[] {
  return (text.match(/[A-Za-z]+/g) ?? []).filter((w) => !(w.toLowerCase() in HINDI_WORDS));
}

/**
 * Converts Roman Hinglish to Hindi for the speech engine. Digits are left as digits: a Hindi voice reads them
 * in Hindi (एक, दो, तीन). Unknown words (e.g. the child's name) are left unchanged.
 */
const ONES = ['ज़ीरो', 'वन', 'टू', 'थ्री', 'फ़ोर', 'फ़ाइव', 'सिक्स', 'सेवन', 'एट', 'नाइन', 'टेन', 'इलेवन', 'ट्वेल्व', 'थर्टीन', 'फ़ोर्टीन', 'फ़िफ़्टीन', 'सिक्सटीन', 'सेवनटीन', 'एटीन', 'नाइनटीन'];
const TENS = ['', '', 'ट्वेंटी', 'थर्टी', 'फ़ोर्टी', 'फ़िफ़्टी', 'सिक्स्टी', 'सेवेंटी', 'एटी', 'नाइंटी'];

/** Numbers are always said in English (as at school), written in Devanagari for the Hindi voice: 7 → सेवन. */
export function englishNumber(n: number): string {
  if (n < 20) return ONES[n]!;
  if (n < 100) return TENS[Math.floor(n / 10)]! + (n % 10 ? ` ${ONES[n % 10]}` : '');
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} हंड्रेड${n % 100 ? ` ${englishNumber(n % 100)}` : ''}`;
  return String(n);
}

// maths words stay in English too
const MATHS_WORDS: Record<string, string> = { plus: 'प्लस', minus: 'माइनस', equals: 'इक्वल्स' };

export function toHindiSpeech(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}|️/gu, '')
    .replace(/(\d+)\s*-\s*(\d+)/g, '$1 $2')
    .replace(/\s[+]\s/g, ' plus ')
    .replace(/\s[−-]\s/g, ' minus ')
    .replace(/[A-Za-z]+/g, (w) => MATHS_WORDS[w.toLowerCase()] ?? HINDI_WORDS[w.toLowerCase()] ?? w)
    .replace(/\d+/g, (d) => englishNumber(Number(d)))
    .replace(/[—…]/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ---------------------------------------------------------------- names

const CONS: [string, string][] = [
  ['chh', 'छ'], ['kh', 'ख'], ['gh', 'घ'], ['ch', 'च'], ['jh', 'झ'], ['th', 'थ'], ['dh', 'ध'], ['ph', 'फ'], ['bh', 'भ'], ['sh', 'श'],
  ['k', 'क'], ['g', 'ग'], ['j', 'ज'], ['t', 'त'], ['d', 'द'], ['n', 'न'], ['p', 'प'], ['b', 'ब'], ['m', 'म'], ['y', 'य'], ['r', 'र'],
  ['l', 'ल'], ['v', 'व'], ['w', 'व'], ['s', 'स'], ['h', 'ह'], ['f', 'फ़'], ['z', 'ज़'], ['q', 'क'], ['c', 'क'], ['x', 'क्स'],
];
const VOWELS: [string, string, string][] = [
  // roman, independent, matra
  ['aa', 'आ', 'ा'], ['ai', 'ऐ', 'ै'], ['au', 'औ', 'ौ'], ['ee', 'ई', 'ी'], ['ii', 'ई', 'ी'], ['oo', 'ऊ', 'ू'],
  ['a', 'अ', ''], ['i', 'इ', 'ि'], ['u', 'उ', 'ु'], ['e', 'ए', 'े'], ['o', 'ओ', 'ो'],
];

/** Simple phonetic Roman → Devanagari for names: Atiye → अतिये, Atiye → अनाया (final a lengthened). */
export function transliterateName(name: string): string {
  return name.replace(/[A-Za-z]+/g, (word) => {
    const w = word.toLowerCase().replace(/a$/, 'aa');
    let out = '';
    let i = 0;
    let afterConsonant = false;
    while (i < w.length) {
      const v = VOWELS.find(([r]) => w.startsWith(r, i));
      if (v) {
        out += afterConsonant ? v[2] : v[1];
        i += v[0].length;
        afterConsonant = false;
        continue;
      }
      const c = CONS.find(([r]) => w.startsWith(r, i));
      if (c) {
        if (afterConsonant) out += '्';
        out += c[1];
        i += c[0].length;
        afterConsonant = true;
        continue;
      }
      i++;
    }
    return out;
  });
}

/** How Ollie says the child's name: the parent's spelling if given, else a Hindi transliteration for the Hindi voice. */
export function spokenName(name: string, nameSay: string, hindiVoice: boolean): string {
  const say = nameSay.trim();
  const isDevanagari = /[\u0900-\u097F]/.test(say);
  if (say && (hindiVoice || !isDevanagari)) return say;
  if (!name.trim()) return '';
  return hindiVoice ? transliterateName(name.trim()) : name.trim();
}
