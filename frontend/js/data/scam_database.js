/**
 * InfoShield - Scam Patterns & Fact-Checked Misinformation Database
 * Based on Press Information Bureau (PIB) Fact Check & National Cyber Crime Portal bulletins
 */

const PIB_FACT_CHECKS = [
  {
    id: "pib-laptop-2024",
    title: "Fake 'PM Free Laptop Scheme 2024' demanding ₹250–₹299 registration fee",
    scamType: "Financial & Data Theft",
    pibVerdict: "FAKE / FRAUD",
    pibSummary: "PIB Fact Check confirmed that the Central Government is NOT running any 'Free Laptop Scheme' requiring citizens to pay online registration charges or share on WhatsApp.",
    refUrl: "https://factcheck.pib.gov.in",
    keywords: ["free laptop", "laptop yojana", "laptop scheme", "free hp laptop", "50000 laptop", "pm-laptop-yojana"],
    debunkProof: "Government never charges money for student benefits. Genuine student hardware or digital programs are announced only on education.gov.in or scholarships.gov.in."
  },
  {
    id: "pib-electricity-bill",
    title: "Fake Electricity Bill Disconnection Warning on WhatsApp",
    scamType: "Cyber Phishing & Remote Access Scam",
    pibVerdict: "FAKE / FRAUD",
    pibSummary: "Fraudsters send WhatsApp SMS stating 'Dear consumer, your electricity power will be disconnected tonight at 9:30 PM because your previous month bill was not updated. Please call officer immediately.'",
    refUrl: "https://factcheck.pib.gov.in",
    keywords: ["electricity will be disconnected", "power will be disconnected", "electricity officer", "bijli bill", "bill was not updated", "disconnected tonight"],
    debunkProof: "Power distribution companies never ask customers to call personal mobile numbers or download QuickSupport / AnyDesk APKs to pay bills."
  },
  {
    id: "pib-ayushman-card",
    title: "Fake 'Ayushman Bharat Golden Card' download fee ₹450 & Aadhaar OTP harvest",
    scamType: "Healthcare Identity & Cyber Fraud",
    pibVerdict: "FAKE / FRAUD",
    pibSummary: "A fake website and WhatsApp forward offers home delivery of 'VIP Ayushman Golden Card' for ₹450. National Health Authority (NHA) confirmed that Ayushman Card creation is 100% FREE.",
    refUrl: "https://factcheck.pib.gov.in",
    keywords: ["ayushman golden card", "vip golden card", "ayushman card free", "treatment card delivered", "ayushman card 450", "ayushman-card-free", "ayushman-card"],
    debunkProof: "Ayushman Bharat cards are issued free of cost at government hospitals and verified CSCs. Government never charges registration fees or requests OTP via private links."
  },
  {
    id: "pib-sbi-yono",
    title: "Fake SBI YONO Account Suspension & Security APK Download Scam",
    scamType: "Banking Phishing & Remote Trojan APK",
    pibVerdict: "FAKE / BANKING FRAUD",
    pibSummary: "Fraudulent SMS claiming SBI Net Banking / YONO account is suspended and urging users to download an APK file from third-party links to update PAN/KYC.",
    refUrl: "https://factcheck.pib.gov.in",
    keywords: ["sbi yono", "account has been suspended", "sbi-kyc-verify", "pending kyc verification", "sbi.apk", "reactivation fee"],
    debunkProof: "Banks never send APK download links or demand reactivation charges via SMS. Always use official Google Play Store or sbi.co.in."
  },
  {
    id: "pib-railway-recruitment",
    title: "Fake Railway TTE / Group D Recruitment appointment letter demanding security deposit",
    scamType: "Job & Recruitment Fraud",
    pibVerdict: "FAKE / FRAUD",
    pibSummary: "Forged appointment letters carrying Indian Railways emblem sent via email/WhatsApp asking for ₹750 - ₹5,000 training fee.",
    refUrl: "https://factcheck.pib.gov.in",
    keywords: ["railway appointment letter", "tte recruitment", "railway training fee", "railway recruitment fee", "direct joining notice", "railway-recruitment"],
    debunkProof: "Indian Railways notices and results are ONLY published on official RRB websites (*.rrb.gov.in). Railway never asks for deposit via UPI."
  },
  {
    id: "pib-kanya-ashirwad",
    title: "Fake 'Pradhan Mantri Kanya Ashirwad Yojana' promising ₹2,000/month",
    scamType: "Social Security Fraud",
    pibVerdict: "FAKE / NON-EXISTENT",
    pibSummary: "A viral YouTube and WhatsApp message claims that under 'PM Kanya Ashirwad Yojana', all girl children will receive ₹2,000 monthly allowance into their bank accounts after paying ₹500 verification fee.",
    refUrl: "https://factcheck.pib.gov.in",
    keywords: ["kanya ashirwad", "kanya aashirvaad", "girl child 2000", "ladli ashirwad yojana"],
    debunkProof: "No scheme named 'Pradhan Mantri Kanya Ashirwad Yojana' is operated by the Government of India. It is a fraudulent scam aimed at stealing bank details."
  },
  {
    id: "pib-ramban-suraksha",
    title: "Fake 'PM Ramban Suraksha Yojana' offering ₹4,000 relief",
    scamType: "Phishing & Fake Subsidy",
    pibVerdict: "FAKE / FRAUD",
    pibSummary: "Claims circulating on social media state that under 'PM Ramban Suraksha Yojana', youth are given ₹4,000 free financial aid by registering on a blog link.",
    refUrl: "https://factcheck.pib.gov.in",
    keywords: ["ramban suraksha", "rambaan suraksha", "pm ramban", "youth relief 4000"],
    debunkProof: "PIB Fact Check verified this claim as completely fake. No such scheme exists."
  },
  {
    id: "pib-mudra-stamp-fee",
    title: "Fake 'PM Mudra Loan' sanction letter demanding ₹1,250 - ₹3,500 stamp duty fee",
    scamType: "Financial & Loan Fraud",
    pibVerdict: "FAKE / LOAN FRAUD",
    pibSummary: "Scammers forge Ministry of Finance and MUDRA letterheads claiming loan is approved at 0% interest and demand stamp duty / verification fees through UPI.",
    refUrl: "https://factcheck.pib.gov.in",
    keywords: ["mudra loan", "mudra approved", "stamp duty", "mudra officer", "0% interest loan", "tarun loan", "mudra-loan"],
    debunkProof: "Mudra loans are sanctioned ONLY through registered commercial banks and NBFCs. The Ministry of Finance never issues direct sanction letters or asks for stamp duty fee via WhatsApp."
  },
  {
    id: "pib-smartphone-tablet",
    title: "Fake 'PM Free Smartphone Yojana 2024' demanding courier / delivery charge",
    scamType: "Phishing & Identity Theft",
    pibVerdict: "FAKE / FRAUD",
    pibSummary: "Viral WhatsApp forwards claim that under Digital India, all college and school students will receive a free 5G smartphone on paying ₹199 courier delivery charge.",
    refUrl: "https://factcheck.pib.gov.in",
    keywords: ["free smartphone", "free phone", "free tablet", "courier delivery charge", "free-5g-smartphone", "smartphone yojana"],
    debunkProof: "Government of India is not running any nationwide free smartphone distribution scheme charging delivery fees via private links."
  },
  {
    id: "pib-sukanya-bonus",
    title: "Fake 'Sukanya Samriddhi ₹5 Lakh Cash Bonus' link demanding activation fee",
    scamType: "Welfare Phishing Scam",
    pibVerdict: "FAKE / FRAUD",
    pibSummary: "Social media links allege the Prime Minister has announced ₹5,00,000 cash grant for every girl child under Sukanya Samriddhi upon paying ₹500 account activation fee.",
    refUrl: "https://factcheck.pib.gov.in",
    keywords: ["sukanya bonus", "girl child 5 lakh", "sukanya cash bonus", "sukanya activation fee"],
    debunkProof: "Sukanya Samriddhi is a long-term small-savings scheme operated through Post Offices and banks. There is no grant or lump-sum bonus distributed via online links."
  },
  {
    id: "pib-pmay-allotment",
    title: "Fake 'Pradhan Mantri Awas Yojana' House Allotment Letter demanding ₹1,500 file charge",
    scamType: "Housing & Financial Fraud",
    pibVerdict: "FAKE / FRAUD",
    pibSummary: "Fraudulent PDF allotment letters promising immediate flat handover under PMAY upon paying ₹1,500 file processing fee.",
    refUrl: "https://factcheck.pib.gov.in",
    keywords: ["awas allotment", "pmay flat", "house allotment letter", "file processing fee", "pm-awas-yojana"],
    debunkProof: "MoHUA strictly prohibits charging fees for PMAY housing verification or allotment letters. Beneficiaries are selected transparently through official SECC lists."
  }
];

const RED_FLAG_PATTERNS = {
  // Demand for money or registration fee (English, Hindi, Hinglish, Punjabi, etc.)
  feePatterns: [
    /(?:pay|send|deposit|transfer|charge|fee|shulk|rupees|rs\.?|inr|₹|ਫੀਸ|ਪੈਸੇ|ਰੁਪਏ|रुपये|पैसे|शुल्क|फीस)\s*(?:only)?\s*([0-9]+)/i,
    /registration\s*(?:fee|charge|amount|cost)/i,
    /processing\s*(?:fee|charge|cost|file)/i,
    /security\s*(?:deposit|money|amount)/i,
    /stamp\s*(?:duty|fee|charge)/i,
    /courier\s*(?:charge|fee|delivery)/i,
    /delivery\s*(?:charge|fee|cost)/i,
    /token\s*(?:money|amount)/i,
    /reactivation\s*(?:fee|charge)/i,
    /allotment\s*(?:fee|charge|money)/i,
    /paisa\s*(?:jama|bhejo|dein|do)/i,
    /paise\s*(?:bhejo|transfer|do|jama)/i,
    /fees\s*(?:bharo|jama|do|lagegi)/i,
    /shulk\s*(?:bhare|jama|matra)/i,
    /पंजीकरण\s*शुल्क|शुल्क\s*जमा|पैसे\s*भेजें|फीस\s*जमा|चालान\s*भरें|डिपॉजिट/i,
    /ਰਜਿਸਟ੍ਰੇਸ਼ਨ\s*ਫੀਸ|ਫੀਸ\s*ਭਰੋ/i,
    /টাকা\s*পাঠান|ফি\s*জমা/i,
    /પૈસા\s*મોકલો|ફી\s*ભરો/i,
    /பணம்\s*செலுத்துங்கள்|கட்டணம்/i,
    /డబ్బులు\s*చెల్లించండి|రుసుము/i,
    /upi\s*(?:id|transfer|payment|se\s*bhejo)/i,
    /google\s*pay|phone\s*pe|paytm|bhim\s*upi/i,
    /advance\s*(?:payment|fee|amount)/i
  ],

  // Artificial urgency or scarcity (including Hinglish)
  urgencyPatterns: [
    /hurry(?:\s+up)?/i,
    /only\s*(?:few|today|left|hours|seats|slots|cards|phones)/i,
    /last\s*date\s*(?:today|tonight|tomorrow|is\s+ending)/i,
    /offer\s*(?:ends|expires|valid\s*till)/i,
    /turant\s*(?:karein|apply|link|bhejo)/i,
    /aakhri\s*(?:mauka|din|tarikh|opportunity)/i,
    /limited\s*(?:period|time|quota|cards|stock|seats)/i,
    /before\s*(?:midnight|today\s*ends)/i,
    /within\s*(?:24|2|3|48)\s*hours/i,
    /तुरंत\s*करें|आखिरी\s*तारीख|आज\s*रात\s*तक|सीमित\s*सीटें|जल्दी\s*करें/i,
    /jald\s*karein|jaldi\s*(?:karo|apply|bharo)|der\s*mat\s*karo/i,
    /aaj\s*raat\s*(?:12\s*baje|tak)/i,
    /link\s*expire\s*(?:ho\s*jayega|hoga)/i,
    /ਛੇਤੀ\s*ਕਰੋ|ਆਖਰੀ\s*ਮੌਕਾ|ਆਖਰੀ\s*ਤਾਰੀਖ/i
  ],

  // WhatsApp viral pyramid sharing requirement (including Hinglish)
  viralSharingPatterns: [
    /share\s*(?:this)?\s*(?:with|to)?\s*([0-9]+|\w+)\s*(?:whatsapp)?\s*(?:groups|friends|contacts|people)/i,
    /forward\s*(?:this)?\s*(?:to|with)?\s*([0-9]+|\w+)\s*(?:groups|friends|people)/i,
    /bhejo\s*([0-9]+)\s*groups/i,
    /5\s*(?:whatsapp\s*)?group/i,
    /10\s*dosto\s*(?:ko|me)/i,
    /10\s*friends/i,
    /forward\s*karo/i,
    /share\s*karo\s*(?:link\s*khulega|tab\s*milega)/i,
    /ग्रुपों\s*में\s*भेजें|दोस्तों\s*को\s*फॉरवर्ड|शेयर\s*करें|व्हाट्सएप\s*ग्रुप/i,
    /ਅੱਗੇ\s*ਭੇਜੋ|ਗਰੁੱਪਾਂ\s*ਵਿੱਚ\s*ਸਾਂਝਾ/i,
    /to\s*activate\s*link/i,
    /to\s*unlock\s*device/i,
    /to\s*get\s*benefit/i,
    /coupon\s*code/i
  ],

  // Requesting sensitive credentials (including Hinglish)
  sensitiveTraps: [
    /\botp\b/i,
    /one\s*time\s*password/i,
    /atm\s*(?:pin|card\s*number)/i,
    /cvv/i,
    /bank\s*(?:password|account\s*password|login\s*id)/i,
    /net\s*banking\s*password/i,
    /aadhaar\s*(?:otp|card\s*photo|verification\s*code|number\s*bhejo)/i,
    /otp\s*(?:share|batao|bhejo|send)/i,
    /ओटीपी|पासवर्ड|पिन\s*नंबर|आधार\s*कार्ड/i,
    /download\s*(?:apk|quicksupport|anydesk|teamviewer)/i,
    /\.apk\b/i,
    /screen\s*share/i
  ],

  // Suspicious Top Level Domains and free hosting often used in phishing
  suspiciousTlds: [
    ".online", ".xyz", ".top", ".tk", ".ml", ".cf", ".gq", ".work",
    ".click", ".site", ".space", ".club", ".link", ".buzz", ".website",
    ".shop", ".fun", ".live", ".icu", ".download", ".vip", ".cc", ".ws", ".cfd"
  ],

  // URL Shorteners frequently used to conceal phishing destinations
  shortenerDomains: [
    "bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rb.gy",
    "wa.me", "v.gd", "shorturl.at", "ow.ly", "buff.ly"
  ],

  // Deceptive Government-Lookalike keywords in hostnames
  lookalikeKeywords: [
    "pmkisan", "pm-kisan", "ayushman", "mudra", "pmay", "yojana-gov",
    "gov-in", "sbi-kyc", "free-laptop", "free-smartphone", "suryaghar",
    "kisan-samman", "modi-yojana", "sarkari-yojana", "e-shram"
  ],

  // Legitimate Official Indian Government Domain Endings
  officialGovDomains: [
    ".gov.in",
    ".nic.in",
    ".ac.in",
    ".edu.in",
    ".res.in",
    ".org.in"
  ]
};

// Comprehensive Preset Sample Test Cases Categorized with BOTH Fake (Scam) and Genuine (True)
const PRESET_TEST_CASES = {
  // 1. HEALTHCARE EXAMPLES
  healthcare_fake: {
    id: "healthcare_fake",
    title: "Ayushman Golden Card ₹450 Fee Scam",
    categoryKey: "healthcare",
    categoryLabel: "🏥 Healthcare",
    isFake: true,
    badgeText: "🚨 High Risk Fake",
    text: "🏥 AYUSHMAN BHARAT GOLDEN CARD 2024 🏥\n\nGet ₹5,00,000 Free Treatment Card delivered directly to your home within 48 hours without any queue.\n\n⚡ Special VIP Golden Card registration fee: ₹450 only. Pay via Google Pay / PhonePe / Paytm.\n\nSend your Aadhaar OTP on this link to download:\nhttp://ayushman-card-free.xyz/apply-now\n\nLimited cards remaining for this month quota!"
  },
  healthcare_genuine: {
    id: "healthcare_genuine",
    title: "Official Ayushman Bharat ABHA Health Advisory",
    categoryKey: "healthcare",
    categoryLabel: "🏥 Healthcare",
    isFake: false,
    badgeText: "✅ Verified Genuine",
    text: "🏥 National Health Authority (NHA) Official Notice 🏥\n\nAyushman Bharat ABHA Health Account creation is 100% FREE for all Indian citizens.\n\nDo NOT pay any fee or share your OTP with any agent. Hospitalization cover up to ₹5,00,000 per family per year is provided at all empanelled public and private hospitals under PM-JAY.\n\nOfficial portal for card download & beneficiary status:\nhttps://beneficiary.nha.gov.in\n\nToll-Free National Health Helpline: 14555"
  },

  // 2. BANKING & FINANCE EXAMPLES
  banking_fake: {
    id: "banking_fake",
    title: "SBI Yono Account Blocked APK Phishing Scam",
    categoryKey: "banking",
    categoryLabel: "🏦 Banking & KYC",
    isFake: true,
    badgeText: "🚨 High Risk Fake",
    text: "SBI Alert: Dear customer, your SBI YONO account has been suspended today due to pending KYC verification.\n\nPay ₹10 reactivation fee and update your PAN card by downloading the official SBI YONO security APK from: http://sbi-kyc-verify.online/sbi.apk\n\nFailing to do so will result in permanent account freeze within 24 hours."
  },
  banking_genuine: {
    id: "banking_genuine",
    title: "Official RBI Kehta Hai / PM Jan Dhan DBT Advisory",
    categoryKey: "banking",
    categoryLabel: "🏦 Banking & KYC",
    isFake: false,
    badgeText: "✅ Verified Genuine",
    text: "Reserve Bank of India (RBI) Public Awareness Notice:\nRBI Kehta Hai: Never download APK files or share your Net Banking password, OTP, ATM PIN, or CVV with anyone calling from an unknown number.\n\nGovernment subsidies under PM Jan Dhan Yojana and DBT are directly transferred to linked bank accounts without any processing fee.\n\nFor cyber financial fraud reporting, call National Cyber Helpline 1930 or visit https://cybercrime.gov.in."
  },

  // 3. STUDENT & WELFARE EXAMPLES
  welfare_fake: {
    id: "welfare_fake",
    title: "PM Free Laptop Scheme 2024 (₹299 Fee)",
    categoryKey: "welfare",
    categoryLabel: "🎓 Student & Welfare",
    isFake: true,
    badgeText: "🚨 High Risk Fake",
    text: "🔥 PRADHAN MANTRI FREE LAPTOP SCHEME 2024 🔥\n\nUnder Digital India initiative, Government of India is distributing Free HP/Dell Laptops + ₹50,000 cash grant to all 10th & 12th passed students across India.\n\n⚠️ Pay only ₹299 registration fee immediately to verify student identity. Last date tonight 11:59 PM!\n\nApply Link: http://pm-laptop-yojana.online/apply\n\n👉 Forward this message to 5 WhatsApp groups to generate your registration coupon code!"
  },
  welfare_genuine: {
    id: "welfare_genuine",
    title: "PM-KISAN 17th Installment Direct Benefit Transfer",
    categoryKey: "welfare",
    categoryLabel: "🎓 Student & Welfare",
    isFake: false,
    badgeText: "✅ Verified Genuine",
    text: "🌾 Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) 🌾\n\nHon'ble Prime Minister has released the 17th installment of ₹2,000 directly to farmer bank accounts through Direct Benefit Transfer (DBT).\n\n⚠️ Official Notice: Government of India NEVER asks for any registration fees, OTP, or APK downloads.\n\nVerify your DBT payment status & eKYC only on the official portal:\nhttps://pmkisan.gov.in\n\nKisan Call Center Toll-Free: 155261 / 1800115526"
  },

  // 4. JOBS & RECRUITMENT EXAMPLES
  jobs_fake: {
    id: "jobs_fake",
    title: "Railway TTE Direct Appointment (₹750 Fee Scam)",
    categoryKey: "jobs",
    categoryLabel: "💼 Jobs & Careers",
    isFake: true,
    badgeText: "🚨 High Risk Fake",
    text: "Ministry of Railways Direct Joining Notice: 4,500 TTE and Clerk vacancies approved. No exam required. Deposit ₹750 refundable training fee via UPI to confirm your appointment letter today: http://railway-recruitment-online.top/join\n\nOffer valid till tonight 10:00 PM."
  },
  jobs_genuine: {
    id: "jobs_genuine",
    title: "Official Staff Selection Commission (SSC) Exam Notice",
    categoryKey: "jobs",
    categoryLabel: "💼 Jobs & Careers",
    isFake: false,
    badgeText: "✅ Verified Genuine",
    text: "Staff Selection Commission (SSC) Important Notice:\nCandidates are advised to apply for Combined Graduate Level Examination (CGL) only through the official Commission website: https://ssc.gov.in.\n\nDo not trust fraudulent appointment letters or recruitment offers on WhatsApp or Telegram demanding security deposits or training fees. SSC recruitment is strictly computer-based through merit."
  },

  // 5. UTILITIES & CIVIC SERVICES EXAMPLES
  utility_fake: {
    id: "utility_fake",
    title: "Electricity Disconnection Threat (Cyber Trap)",
    categoryKey: "utility",
    categoryLabel: "⚡ Utilities & Civic",
    isFake: true,
    badgeText: "🚨 High Risk Fake",
    text: "⚡ URGENT: ELECTRICITY DISCONNECTION NOTICE ⚡\n\nDear Consumer, your electricity power will be DISCONNECTED tonight at 9.30 PM from the electricity power office because your previous month bill was not updated.\n\nPlease immediately contact our power officer at 9876543210 and pay ₹15 update charge on WhatsApp."
  },
  utility_genuine: {
    id: "utility_genuine",
    title: "PM Surya Ghar Muft Bijli (Rooftop Solar Subsidy)",
    categoryKey: "utility",
    categoryLabel: "⚡ Utilities & Civic",
    isFake: false,
    badgeText: "✅ Verified Genuine",
    text: "☀️ PM Surya Ghar: Muft Bijli Yojana ☀️\n\nGet up to ₹78,000 direct subsidy for installing rooftop solar panels. Enjoy up to 300 units of free electricity every month.\n\nApply only through the official national portal: https://pmsuryaghar.gov.in\n\nBeware: Subsidy is credited directly into bank accounts via DBT after installation by empanelled vendors. No agent is authorized to collect cash fees."
  },

  // 6. BUSINESS LOANS & MSME EXAMPLES
  loans_fake: {
    id: "loans_fake",
    title: "PM Mudra Loan ₹10 Lakh 0% Interest (₹1,250 Stamp Fee)",
    categoryKey: "loans",
    categoryLabel: "💰 Business Loans & MSME",
    isFake: true,
    badgeText: "🚨 High Risk Fake",
    text: "💼 PRADHAN MANTRI MUDRA YOJANA LOAN APPROVAL 💼\n\nCongratulations! Your ₹10,00,000 Tarun Mudra Loan has been APPROVED at 0% interest without any collateral.\n\n⚠️ Pay refundable stamp duty & file charge of ₹1,250 within 2 hours to disburse loan into your bank account.\n\nPayment Link: http://mudra-loan-instant-approval.top/pay\n\nSend UPI payment screenshot to confirm disbursement."
  },
  loans_genuine: {
    id: "loans_genuine",
    title: "Official PM SVANidhi & MUDRA Collateral-Free Notice",
    categoryKey: "loans",
    categoryLabel: "💰 Business Loans & MSME",
    isFake: false,
    badgeText: "✅ Verified Genuine",
    text: "Ministry of Finance & MoHUA Official Public Notice:\nUnder PM MUDRA Yojana and PM SVANidhi, loans are sanctioned directly through authorized public & private commercial banks.\n\n⚠️ Ministry of Finance NEVER asks for stamp duty, processing fees, or refundable deposits via UPI or WhatsApp.\n\nVerify eligible banks and apply only through official portals:\nhttps://www.mudra.org.in and https://pmsvanidhi.mohua.gov.in"
  },

  // 7. STUDENT TECH & SCHOLARSHIPS EXAMPLES
  tech_fake: {
    id: "tech_fake",
    title: "Free 5G Smartphone Scheme (₹199 Courier Fee & Share)",
    categoryKey: "tech",
    categoryLabel: "📱 Student Tech & Grants",
    isFake: true,
    badgeText: "🚨 High Risk Fake",
    text: "📱 FREE SMARTPHONE YOJANA 2024 📱\n\nDigital India Initiative: Free 5G Smartphone with 1 Year Free Recharge for all college & 10th/12th students.\n\n⚡ Only 150 phones left for today. Pay ₹199 courier delivery charge now: http://free-5g-smartphone.xyz\n\n👉 Forward this message to 10 friends to unlock device."
  },
  tech_genuine: {
    id: "tech_genuine",
    title: "Official National Scholarship Portal (NSP) Grant Notice",
    categoryKey: "tech",
    categoryLabel: "📱 Student Tech & Grants",
    isFake: false,
    badgeText: "✅ Verified Genuine",
    text: "Ministry of Education Official Student Advisory:\nApplications for National Scholarship Portal (NSP) Central Sector Schemes are 100% FREE.\n\nGovernment NEVER asks students to pay courier charges, application fees, or share messages on WhatsApp.\n\nApply directly on the single verified portal:\nhttps://scholarships.gov.in\n\nNational Scholarship Helpline: 0120-6619540"
  },

  // 8. HOUSING & SHELTER EXAMPLES
  housing_fake: {
    id: "housing_fake",
    title: "PM Awas Yojana House Allotment (₹1,500 File Fee)",
    categoryKey: "housing",
    categoryLabel: "🏠 Housing & Shelter",
    isFake: true,
    badgeText: "🚨 High Risk Fake",
    text: "🏠 PRADHAN MANTRI AWAS YOJANA ALLOTMENT LETTER 🏠\n\nCongratulations! You have been selected for a 2-BHK pucca flat under PMAY Housing Scheme.\n\n⚠️ Deposit ₹1,500 file processing charge via Google Pay / PhonePe within 24 hours to download your allotment certificate: http://pm-awas-yojana-allotment.site/register\n\nFailure to pay will transfer flat to waitlisted applicant."
  },
  housing_genuine: {
    id: "housing_genuine",
    title: "Official Pradhan Mantri Awas Yojana (PMAY) Advisory",
    categoryKey: "housing",
    categoryLabel: "🏠 Housing & Shelter",
    isFake: false,
    badgeText: "✅ Verified Genuine",
    text: "Ministry of Housing and Urban Affairs (MoHUA) Official Notice:\nUnder PMAY, subsidies and house construction grants are directly disbursed into Aadhaar-linked bank accounts via DBT.\n\n⚠️ MoHUA does NOT employ any private agents or brokers. No fee is charged for allotment letter or online registration.\n\nCheck official beneficiary status exclusively at:\nhttps://pmaymis.gov.in\n\nToll-Free Helpline: 1800-11-6163"
  },

  // 9. WOMEN & CHILD WELFARE EXAMPLES
  women_fake: {
    id: "women_fake",
    title: "Sukanya Samriddhi ₹5 Lakh Cash Bonus (₹500 Activation)",
    categoryKey: "women",
    categoryLabel: "👧 Women & Child Welfare",
    isFake: true,
    badgeText: "🚨 High Risk Fake",
    text: "👧 SUKANYA SAMRIDDHI YOJANA CASH BONUS 👧\n\nSpecial Government Grant: All families with girl children under 18 years will receive ₹5,00,000 cash grant in bank account.\n\n⚠️ Pay ₹500 account activation fee immediately on this link: http://sukanya-bonus-grant.online/activate\n\nLast date tomorrow! Forward to all mothers in your family."
  },
  women_genuine: {
    id: "women_genuine",
    title: "Official Sukanya Samriddhi Yojana (SSY) India Post Notice",
    categoryKey: "women",
    categoryLabel: "👧 Women & Child Welfare",
    isFake: false,
    badgeText: "✅ Verified Genuine",
    text: "India Post & Ministry of Finance Official Public Advisory:\nSukanya Samriddhi Yojana (SSY) is an 8.2% annual interest savings scheme.\n\n⚠️ Government does NOT offer any lump-sum bonus or online grants through WhatsApp links. SSY accounts can ONLY be opened in person at authorized Post Offices and commercial bank branches.\n\nOfficial scheme details: https://myscheme.gov.in/schemes/ssy\n\nIndia Post Toll-Free: 1800-266-6868"
  },

  // 10. UNVERIFIED NOTICE EXAMPLE
  unverified_notice: {
    id: "unverified_notice",
    title: "State Youth Skill Allowance (Unverified Notice)",
    categoryKey: "unverified",
    categoryLabel: "⚠️ Unverified Notice",
    isFake: null,
    badgeText: "⚠️ Needs Verification",
    text: "New Welfare Notice: Monthly skill allowance of ₹3,000 announced for unemployed graduate youth across selected districts. No application fee mentioned. Visit your district employment exchange office for registration verification."
  },

  // 11. HINGLISH DIALECT SCAM SAMPLES
  hinglish_kisan_fake: {
    id: "hinglish_kisan_fake",
    title: "Hinglish: PM Kisan ₹25,000 Bonus & ₹500 Fee Trap",
    categoryKey: "welfare",
    categoryLabel: "🇮🇳 Hinglish Dialect",
    isFake: true,
    badgeText: "🚨 High Risk Fake",
    text: "Bhai suno sabhi kisan! PM Kisan Samman Nidhi me 25000 ka special bonus mil raha hai! Bas 500 rs registration fees is link pe bhejo: http://pmkisan-bonus25000.xyz Jaldi karo aakhri mauka hai aaj raat 12 baje tak. 5 dosto ko forward karo tabhi link khulega!"
  },
  hinglish_mudra_fake: {
    id: "hinglish_mudra_fake",
    title: "Hinglish: PM Mudra Loan ₹1,250 Stamp Fee Scam",
    categoryKey: "loans",
    categoryLabel: "🇮🇳 Hinglish Dialect",
    isFake: true,
    badgeText: "🚨 High Risk Fake",
    text: "Mubarak ho! Aapka PM Mudra Loan ₹10,00,000 approve ho gaya hai 0% byaj par. Turant disburse karne ke liye 1250 rs stamp duty charge UPI se bhejo: http://mudra-approval.top par. Der mat karo offer khatam ho jayega."
  },
  hinglish_kisan_genuine: {
    id: "hinglish_kisan_genuine",
    title: "Hinglish: Official PM Kisan 17vi Kist Advisory",
    categoryKey: "welfare",
    categoryLabel: "🇮🇳 Hinglish Dialect",
    isFake: false,
    badgeText: "✅ Verified Genuine",
    text: "Kisan bhaiyo ke liye zaroori soochna: PM-KISAN ki 17vi kist ₹2,000 sidhe bank account me transfer ho chuki hai DBT dwara. Kripya dhyan de ki sarkar kabhi bhi registration fees ya OTP nahi maangti. Status check karne ke liye kewal official portal https://pmkisan.gov.in par jaye ya 155261 par call kare."
  },

  // 12. BENEFIT MISMATCH DEMO (PM KISAN ₹25,000 vs REAL ₹6,000)
  kisan_mismatch_fake: {
    id: "kisan_mismatch_fake",
    title: "Benefit Mismatch: PM Kisan ₹25,000 Claim (Real: ₹6,000)",
    categoryKey: "welfare",
    categoryLabel: "🌾 Benefit Mismatch",
    isFake: true,
    badgeText: "🚨 Benefit Mismatch",
    text: "🌾 PM-KISAN FESTIVE BONUS SCHEME 🌾\n\nUnder special government order, all farmers are now granted a festive bonus of ₹25,000 directly into their bank accounts.\n\n⚠️ Pay refundable verification charge of ₹350 on UPI to authenticate your bank account: http://pmkisan-gov-bonus.online/claim\n\nLimited quota valid till tonight!"
  },

  // Legacy compatibility keys
  scamSample: {
    title: "🚨 PM Free Laptop Scheme 2024 (Fake Fee)",
    text: "🔥 PRADHAN MANTRI FREE LAPTOP SCHEME 2024 🔥\n\nUnder Digital India initiative, Government of India is distributing free laptops + ₹50,000 cash grant to all 10th & 12th passed students across India.\n\n⚠️ Pay only ₹299 registration fee immediately to verify your student identity. Last date tonight 11:59 PM!\n\nApply Link: http://pm-laptop-yojana.online/apply\n\n👉 Forward this message to 5 WhatsApp groups to generate your registration coupon code!"
  },
  fakeElectricitySample: {
    title: "🚨 Electricity Power Cut Scam (Cyber Trap)",
    text: "Dear Consumer, your electricity power will be disconnected tonight at 9.30 PM from the electricity power office because your previous month bill was not updated. Please immediately contact our power officer at 9876543210 and pay ₹15 update charge on WhatsApp."
  },
  genuineSample: {
    title: "✅ PM-KISAN 17th Installment (Official Notice)",
    text: "🌾 Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) 🌾\n\nGovernment of India releases 17th installment of ₹2,000 directly to farmer bank accounts through Direct Benefit Transfer (DBT).\n\nNotice: Government of India NEVER asks for any registration fees, OTP, or APK downloads. Do not trust unverified private portals.\n\nVerify your DBT payment status & eKYC only on the official portal:\nhttps://pmkisan.gov.in\n\nKisan Helpline: 155261 / 1800115526"
  },
  genuineSolarSample: {
    title: "✅ PM Surya Ghar Muft Bijli (Official Solar Scheme)",
    text: "☀️ PM Surya Ghar: Muft Bijli Yojana ☀️\n\nGet up to ₹78,000 direct subsidy for installing rooftop solar panels. Enjoy up to 300 units of free electricity every month.\n\nApply only through the official national portal: https://pmsuryaghar.gov.in\n\nBeware: Subsidy is credited directly into bank accounts via DBT after installation by empanelled vendors. No agent is authorized to collect cash fees."
  }
};

// Website URL Presets (Fake vs Genuine vs Unofficial)
const PRESET_WEBSITES = [
  // FAKE PHISHING DOMAINS
  {
    id: "url_fake_laptop",
    url: "http://pm-laptop-yojana.online/apply",
    label: "🚨 Fake PM Laptop Scheme (.online)",
    category: "fake",
    tag: "High Risk Phishing",
    notes: "Demands ₹299 fee, uses unofficial .online TLD"
  },
  {
    id: "url_fake_ayushman",
    url: "http://ayushman-card-free.xyz/apply-now",
    label: "🚨 Fake Ayushman VIP Card (.xyz)",
    category: "fake",
    tag: "Malicious Phishing TLD",
    notes: "Charges ₹450 for free Ayushman card and steals OTP"
  },
  {
    id: "url_fake_mudra",
    url: "http://mudra-loan-instant-approval.top/pay",
    label: "🚨 Fake Mudra Loan Portal (.top)",
    category: "fake",
    tag: "Loan Advance Fee Trap",
    notes: "Demands ₹1,250 stamp duty fee before loan disbursement"
  },
  {
    id: "url_fake_sbi",
    url: "http://sbi-kyc-verify.online/sbi.apk",
    label: "🚨 Fake SBI YONO APK Download (.online)",
    category: "fake",
    tag: "Remote Trojan APK",
    notes: "Urges downloading dangerous APK file outside Google Play"
  },
  {
    id: "url_fake_phone",
    url: "http://free-5g-smartphone.xyz",
    label: "🚨 Fake Free 5G Smartphone (.xyz)",
    category: "fake",
    tag: "Data Harvesting Phishing",
    notes: "Demands ₹199 courier fee and viral forwarding"
  },
  {
    id: "url_fake_awas",
    url: "http://pm-awas-yojana-allotment.site/register",
    label: "🚨 Fake PM Awas Allotment (.site)",
    category: "fake",
    tag: "Housing Fraud Portal",
    notes: "Demands ₹1,500 file processing charge"
  },

  // GENUINE OFFICIAL GOI PORTALS
  {
    id: "url_genuine_pmkisan",
    url: "https://pmkisan.gov.in",
    label: "✅ Official PM-KISAN Portal (.gov.in)",
    category: "genuine",
    tag: "Ministry of Agriculture",
    notes: "Authentic national farmer DBT verification portal"
  },
  {
    id: "url_genuine_myscheme",
    url: "https://myscheme.gov.in",
    label: "✅ Official myScheme Platform (.gov.in)",
    category: "genuine",
    tag: "National Scheme Gateway",
    notes: "Single-window search for all central & state schemes"
  },
  {
    id: "url_genuine_ayushman",
    url: "https://beneficiary.nha.gov.in",
    label: "✅ Official Ayushman NHA Portal (.gov.in)",
    category: "genuine",
    tag: "National Health Authority",
    notes: "100% free beneficiary card download & hospital list"
  },
  {
    id: "url_genuine_solar",
    url: "https://pmsuryaghar.gov.in",
    label: "✅ Official PM Surya Ghar (.gov.in)",
    category: "genuine",
    tag: "Ministry of New & Renewable Energy",
    notes: "Official rooftop solar subsidy portal"
  },
  {
    id: "url_genuine_scholarships",
    url: "https://scholarships.gov.in",
    label: "✅ Official National Scholarship Portal (.gov.in)",
    category: "genuine",
    tag: "Ministry of Education",
    notes: "Central sector student grant applications (zero fee)"
  },
  {
    id: "url_genuine_cybercrime",
    url: "https://cybercrime.gov.in",
    label: "✅ National Cyber Crime Portal (.gov.in)",
    category: "genuine",
    tag: "Ministry of Home Affairs",
    notes: "Official 1930 cyber fraud reporting portal"
  },

  // UNOFFICIAL THIRD-PARTY / INFORMATIONAL BLOGS
  {
    id: "url_unverified_blog",
    url: "https://all-schemes-news-portal.com",
    label: "⚠️ Third-Party Scheme News Blog (.com)",
    category: "warning",
    tag: "Unofficial Intermediary",
    notes: "Ad-monetized third-party blog. Never enter credentials here."
  },
  {
    id: "url_unverified_sarkari",
    url: "https://sarkariyojananews.in",
    label: "⚠️ Private Welfare Information Blog (.in)",
    category: "warning",
    tag: "Private Entity (Non-Gov)",
    notes: "Private news aggregator. Not an authorized government portal."
  }
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { PIB_FACT_CHECKS, RED_FLAG_PATTERNS, PRESET_TEST_CASES, PRESET_WEBSITES };
}
