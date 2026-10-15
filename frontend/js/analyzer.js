/**
 * InfoShield - Core AI Content & Scam Analysis Engine (Hybrid Architecture)
 * Combines Rule-Based Red Flags + Indic Semantic Heuristics + Ground Truth Verification
 * Implements: Real URL Analysis, Benefit Mismatch Detection, Phrase Highlighting, and Explainable AI
 */

class InfoShieldAnalyzer {
  constructor(schemesDb, pibDb, patterns) {
    this.schemesDb = schemesDb || OFFICIAL_SCHEMES_DB;
    this.pibDb = pibDb || PIB_FACT_CHECKS;
    this.patterns = patterns || RED_FLAG_PATTERNS;
  }

  /**
   * Main analysis pipeline
   * @param {string} text - Message or extracted OCR text
   * @param {string} optionalUrl - Explicit URL if link tab used
   * @returns {Object} Full explainable verification report
   */
  analyze(text, optionalUrl = "") {
    const rawContent = (text || "").trim();
    const content = rawContent.toLowerCase();

    // 1. NLP Entity & Link Extraction
    const entities = this.extractEntities(rawContent, optionalUrl);

    // 2. Real Deep URL Analysis
    const urlAnalysis = this.analyzeUrls(entities.domains);

    // 3. Knowledge Base Cross-Verification (Official Schemes & PIB Debunks)
    const verificationMatch = this.crossReferenceOfficialData(content, entities);

    // 4. Benefit Mismatch Detection (Claimed amount vs Ground Truth DB)
    const mismatchFindings = this.detectBenefitMismatch(rawContent, content, verificationMatch.matchedScheme, entities);

    // 5. Scam Indicators & Red Flag Heuristics with Exact Phrase Highlighting
    const indicatorFindings = this.detectIndicators(rawContent, content, entities, urlAnalysis, mismatchFindings);

    // 6. Indic Semantic Intent Analysis (Hybrid Layer)
    const semanticAnalysis = this.runSemanticCheck(content, rawContent);

    // 7. Synthesize Risk Score, Confidence & Explainable Verdict
    const evaluation = this.computeVerdict(
      rawContent,
      content,
      indicatorFindings,
      verificationMatch,
      entities,
      urlAnalysis,
      mismatchFindings,
      semanticAnalysis
    );

    // 8. Generate Visual Highlighted HTML
    const highlightedHtml = this.generateHighlightedText(rawContent, indicatorFindings.highlightedPhrases);

    // 9. Generate Citizen Safety Advisory & 1-Tap Cyber Crime Report
    const advisory = this.generateSafetyAdvisory(evaluation, verificationMatch);
    const cyberReportText = this.generateCyberReport(rawContent, entities, evaluation, verificationMatch, indicatorFindings);

    return {
      timestamp: new Date().toISOString(),
      rawInput: rawContent,
      highlightedHtml,
      highlightedPhrases: indicatorFindings.highlightedPhrases,
      entities,
      urlAnalysis,
      redFlags: indicatorFindings.redFlags,
      greenFlags: indicatorFindings.greenFlags,
      matchedScheme: verificationMatch.matchedScheme,
      matchedPibScam: verificationMatch.matchedPibScam,
      benefitMismatch: mismatchFindings.hasMismatch ? mismatchFindings : null,
      semanticInsights: semanticAnalysis,
      riskScore: evaluation.riskScore,
      confidenceScore: evaluation.confidenceScore,
      verdict: evaluation.verdict, // 'LIKELY_GENUINE' | 'NEEDS_VERIFICATION' | 'POTENTIALLY_FAKE'
      verdictTitle: evaluation.verdictTitle,
      verdictClass: evaluation.verdictClass,
      categoryDetected: evaluation.categoryDetected,
      primaryTrigger: evaluation.primaryTrigger,
      officialStatusText: evaluation.officialStatusText,
      immediateAction: evaluation.immediateAction,
      advisory,
      cyberReportText,
      explainabilityReasons: evaluation.explainabilityReasons
    };
  }

  /**
   * Step 1: NLP Entity & Claim Extraction
   */
  extractEntities(rawText, explicitUrl) {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const extractedUrls = rawText.match(urlRegex) || [];
    if (explicitUrl && !extractedUrls.includes(explicitUrl)) {
      extractedUrls.unshift(explicitUrl);
    }

    const domains = extractedUrls.map(url => {
      let hostname = "";
      let protocol = "http:";
      try {
        const parsed = new URL(url.startsWith("http") ? url : "https://" + url);
        hostname = parsed.hostname.toLowerCase();
        protocol = parsed.protocol;
      } catch (e) {
        hostname = url.replace(/https?:\/\//i, "").split("/")[0].toLowerCase();
      }
      return {
        fullUrl: url,
        hostname,
        protocol,
        isOfficialGov: this.isGovDomain(hostname)
      };
    });

    // Extract monetary figures (₹, Rs, INR, numbers with rupees/rs/kist)
    const moneyRegex = /(?:₹|rs\.?|inr|rupees)\s*([0-9,]+(?:\.\d+)?)|([0-9,]+)\s*(?:rs|rupees|ka\s*bonus|kist)/gi;
    const moneyMatches = [];
    const numericAmounts = [];
    let m;
    while ((m = moneyRegex.exec(rawText)) !== null) {
      moneyMatches.push(m[0]);
      const rawNum = (m[1] || m[2] || "").replace(/,/g, "");
      const val = parseFloat(rawNum);
      if (!isNaN(val) && val > 0) {
        numericAmounts.push(val);
      }
    }

    // Phone / Helpline extraction
    const phoneRegex = /(?:\+91[\-\s]?)?[6-9]\d{9}|\b1800\d{6,7}\b|\b1930\b|\b155261\b|\b14555\b/g;
    const phones = rawText.match(phoneRegex) || [];

    return {
      urls: extractedUrls,
      domains,
      moneyMentions: moneyMatches,
      numericAmounts,
      phoneNumbers: phones
    };
  }

  /**
   * Helper: Legitimate Official Indian Government Domain Checker
   */
  isGovDomain(hostname) {
    if (!hostname) return false;
    const clean = hostname.toLowerCase();
    return (
      clean.endsWith(".gov.in") ||
      clean.endsWith(".nic.in") ||
      clean.endsWith(".ac.in") ||
      clean.endsWith(".edu.in") ||
      clean.endsWith(".res.in") ||
      clean === "mudra.org.in" ||
      clean.endsWith(".pib.gov.in") ||
      clean.endsWith(".rbi.org.in") ||
      clean === "standupmitra.in" ||
      clean === "maandhan.in"
    );
  }

  /**
   * Step 2: Real Deep URL Security Analysis
   * Flags: Subdomain spoofing, lookalike domains, shortened URLs, odd TLDs, insecure protocols
   */
  analyzeUrls(domains) {
    const findings = [];
    const suspiciousTlds = this.patterns.suspiciousTlds || [
      ".online", ".xyz", ".top", ".tk", ".ml", ".cf", ".gq", ".work",
      ".click", ".site", ".space", ".club", ".link", ".buzz", ".website",
      ".shop", ".fun", ".live", ".icu", ".download", ".vip", ".cc", ".ws"
    ];
    const shortenerDomains = this.patterns.shortenerDomains || [
      "bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rb.gy", "wa.me", "v.gd", "shorturl.at"
    ];
    const lookalikeKeywords = this.patterns.lookalikeKeywords || [
      "pmkisan", "pm-kisan", "ayushman", "mudra", "pmay", "yojana-gov",
      "gov-in", "sbi-kyc", "free-laptop", "free-smartphone", "suryaghar"
    ];

    for (const d of domains) {
      const host = d.hostname;
      const fullUrl = d.fullUrl;
      const isGov = d.isOfficialGov;
      const audit = {
        url: fullUrl,
        hostname: host,
        isGov,
        isSubdomainSpoofing: false,
        isShortened: false,
        isSuspiciousTld: false,
        isLookalike: false,
        isInsecureHttp: d.protocol === "http:",
        riskLevel: "SAFE",
        badge: "✅ Official Portal",
        details: []
      };

      if (isGov) {
        audit.riskLevel = "SAFE";
        audit.badge = "✅ Official Government Domain (.gov.in)";
        audit.details.push(`Domain '${host}' is an officially verified Government of India portal.`);
      } else {
        // 1. Check Subdomain Spoofing (e.g. pmkisan.gov.in.scam.com)
        if (host.includes(".gov.in.") || host.includes(".nic.in.") || (host.includes("gov.in") && !host.endsWith(".gov.in"))) {
          audit.isSubdomainSpoofing = true;
          audit.riskLevel = "CRITICAL";
          audit.badge = "🚨 Subdomain Deception Spoof";
          audit.details.push(`High-deception subdomain spoofing detected! Host '${host}' embeds 'gov.in' inside an unauthorized third-party domain.`);
        }

        // 2. Check URL Shorteners (Masks destination)
        if (shortenerDomains.some(s => host === s || host.endsWith("." + s))) {
          audit.isShortened = true;
          if (audit.riskLevel !== "CRITICAL") audit.riskLevel = "HIGH";
          audit.badge = "⚠️ Concealed URL Shortener";
          audit.details.push(`URL shortener '${host}' masks the final destination. Government agencies never distribute welfare schemes through shortened links.`);
        }

        // 3. Check Suspicious TLDs (.xyz, .online, .top)
        const matchedTld = suspiciousTlds.find(tld => host.endsWith(tld));
        if (matchedTld) {
          audit.isSuspiciousTld = true;
          audit.riskLevel = "CRITICAL";
          audit.badge = `🚨 High-Risk Phishing TLD (${matchedTld})`;
          audit.details.push(`The domain uses '${matchedTld}', an unofficial TLD heavily associated with disposable phishing portals.`);
        }

        // 4. Lookalike Government Typosquatting
        const matchedKw = lookalikeKeywords.find(kw => host.includes(kw));
        if (matchedKw && !isGov) {
          audit.isLookalike = true;
          audit.riskLevel = "CRITICAL";
          audit.details.push(`Domain '${host}' mimics the official keyword '${matchedKw}' without government authorization.`);
        }

        // 5. Insecure HTTP Check
        if (audit.isInsecureHttp) {
          audit.details.push("Connection is unencrypted (HTTP). Official public service platforms strictly enforce HTTPS.");
        }

        if (audit.details.length === 0) {
          audit.riskLevel = "MEDIUM";
          audit.badge = "⚠️ Unofficial Third-Party Website";
          audit.details.push(`Domain '${host}' is a third-party non-government website.`);
        }
      }

      findings.push(audit);
    }

    return findings;
  }

  /**
   * Step 3: Knowledge Base Cross-Verification
   */
  crossReferenceOfficialData(lowerText, entities) {
    let matchedScheme = null;
    let matchedPibScam = null;
    let bestSchemeScore = 0;

    // Check PIB Fact Check Debunk Records
    for (const scam of this.pibDb) {
      let matchCount = 0;
      for (const kw of scam.keywords) {
        if (lowerText.includes(kw.toLowerCase())) {
          matchCount++;
        }
      }
      if (matchCount > 0) {
        matchedPibScam = scam;
        break;
      }
    }

    // Check Verified Schemes Database
    for (const scheme of this.schemesDb) {
      let schemeScore = 0;
      for (const kw of scheme.keywords) {
        if (lowerText.includes(kw.toLowerCase())) {
          schemeScore += 3;
        }
      }
      if (entities.domains.some(d => d.hostname.includes(scheme.officialDomain))) {
        schemeScore += 8;
      }

      if (schemeScore > bestSchemeScore && schemeScore >= 3) {
        bestSchemeScore = schemeScore;
        matchedScheme = scheme;
      }
    }

    return { matchedScheme, matchedPibScam };
  }

  /**
   * Step 4: Benefit Mismatch Detection
   * Compares claimed financial benefits in message against real government database caps!
   */
  detectBenefitMismatch(rawText, lowerText, matchedScheme, entities) {
    if (!matchedScheme || !matchedScheme.maxBenefitNumeric) {
      return { hasMismatch: false };
    }

    const officialMax = matchedScheme.maxBenefitNumeric;
    const claimedAmounts = entities.numericAmounts || [];

    // Filter amounts that could represent benefit grants (typically >= 1000)
    const largeClaims = claimedAmounts.filter(amt => amt >= 1000);

    for (const claimed of largeClaims) {
      // If claimed amount exceeds official maximum benefit significantly
      if (officialMax > 0 && claimed > officialMax * 1.5) {
        const diffMultiplier = Math.round(claimed / officialMax);
        return {
          hasMismatch: true,
          claimedAmount: claimed,
          officialMax: officialMax,
          schemeName: matchedScheme.name,
          diffMultiplier,
          exactPhrase: `₹${claimed.toLocaleString("en-IN")}`,
          details: `The message claims an exaggerated benefit of ₹${claimed.toLocaleString("en-IN")}, but authentic ${matchedScheme.shortName} guidelines strictly cap benefits at ${matchedScheme.benefitSummary}.`,
          warningTitle: `🚨 Benefit Mismatch: Claim is ${diffMultiplier}x Higher Than Official Limit!`
        };
      }
    }

    return { hasMismatch: false };
  }

  /**
   * Step 5: Scam Indicators & Red Flag Heuristics with Exact Phrase Highlighting
   */
  detectIndicators(rawText, lowerText, entities, urlAnalysis, mismatchFindings) {
    const redFlags = [];
    const greenFlags = [];
    const highlightedPhrases = [];
    let riskPoints = 0;
    let feeCaptured = "";

    // A. Registration / Processing Fee Demand (Major Scam Signal)
    for (const pat of this.patterns.feePatterns) {
      const match = rawText.match(pat);
      if (match) {
        const phrase = match[0];
        feeCaptured = match[1] ? `₹${match[1]}` : phrase;
        redFlags.push({
          code: "FEE_DEMAND",
          severity: "CRITICAL",
          label: "Registration / Processing Fee Demand",
          exactPhrase: phrase,
          riskContribution: "+45% Risk",
          description: `The message demands an upfront payment (${feeCaptured}). Central and State welfare initiatives NEVER charge registration or approval fees via UPI or personal payment links.`
        });
        highlightedPhrases.push({
          phrase,
          code: "FEE_DEMAND",
          color: "red",
          tooltip: "🚨 Fake Fee Demand: Government schemes are 100% free"
        });
        riskPoints += 45;
        break;
      }
    }

    // B. Benefit Mismatch (e.g. ₹25,000 for PM Kisan)
    if (mismatchFindings.hasMismatch) {
      redFlags.push({
        code: "BENEFIT_MISMATCH",
        severity: "CRITICAL",
        label: mismatchFindings.warningTitle,
        exactPhrase: mismatchFindings.exactPhrase,
        riskContribution: "+40% Risk",
        description: mismatchFindings.details
      });
      highlightedPhrases.push({
        phrase: mismatchFindings.exactPhrase,
        code: "BENEFIT_MISMATCH",
        color: "orange",
        tooltip: "⚠️ Exaggerated Claim: Far exceeds authentic government allowance"
      });
      riskPoints += 40;
    }

    // C. Artificial Urgency / Panic Engineering
    for (const pat of this.patterns.urgencyPatterns) {
      const match = rawText.match(pat);
      if (match) {
        const phrase = match[0];
        redFlags.push({
          code: "ARTIFICIAL_URGENCY",
          severity: "MEDIUM",
          label: "High Urgency & Artificial Panic",
          exactPhrase: phrase,
          riskContribution: "+15% Risk",
          description: `Phrases like '${phrase}' are classic psychological pressure tactics used to prevent victims from verifying claims.`
        });
        highlightedPhrases.push({
          phrase,
          code: "ARTIFICIAL_URGENCY",
          color: "amber",
          tooltip: "⏰ Panic Trigger: Artificial deadline designed to rush decisions"
        });
        riskPoints += 15;
        break;
      }
    }

    // D. WhatsApp Viral Forwarding Requirement
    for (const pat of this.patterns.viralSharingPatterns) {
      const match = rawText.match(pat);
      if (match) {
        const phrase = match[0];
        redFlags.push({
          code: "VIRAL_CHAIN_FORWARD",
          severity: "HIGH",
          label: "Forced Viral WhatsApp Forwarding",
          exactPhrase: phrase,
          riskContribution: "+30% Risk",
          description: `Demanding to '${phrase}' is a hallmark pyramid spam technique. Legitimate government benefits are never activated via WhatsApp forwards.`
        });
        highlightedPhrases.push({
          phrase,
          code: "VIRAL_CHAIN_FORWARD",
          color: "red",
          tooltip: "🔗 Pyramid Trap: Authentic schemes never require group shares"
        });
        riskPoints += 30;
        break;
      }
    }

    // E. Sensitive Credentials / APK Download Traps
    for (const pat of this.patterns.sensitiveTraps) {
      const match = rawText.match(pat);
      if (match) {
        const phrase = match[0];
        redFlags.push({
          code: "SENSITIVE_CREDENTIALS",
          severity: "CRITICAL",
          label: "Request for Sensitive Credentials or APK Installation",
          exactPhrase: phrase,
          riskContribution: "+45% Risk",
          description: `The message solicits OTPs, ATM PINs, Aadhaar credentials, or urges installing unverified APK application packages.`
        });
        highlightedPhrases.push({
          phrase,
          code: "SENSITIVE_CREDENTIALS",
          color: "red",
          tooltip: "🔒 Identity Theft Hazard: Never share OTPs or install APKs"
        });
        riskPoints += 45;
        break;
      }
    }

    // F. URL & Domain Security Findings
    for (const audit of urlAnalysis) {
      if (audit.riskLevel === "CRITICAL" || audit.riskLevel === "HIGH") {
        redFlags.push({
          code: "SUSPICIOUS_DOMAIN",
          severity: audit.riskLevel,
          label: audit.badge,
          exactPhrase: audit.url,
          riskContribution: "+35% Risk",
          description: audit.details.join(" ")
        });
        highlightedPhrases.push({
          phrase: audit.url,
          code: "SUSPICIOUS_DOMAIN",
          color: "red",
          tooltip: `🚨 Domain Warning: ${audit.badge}`
        });
        riskPoints += 35;
      } else if (audit.riskLevel === "MEDIUM") {
        redFlags.push({
          code: "UNVERIFIED_DOMAIN",
          severity: "MEDIUM",
          label: audit.badge,
          exactPhrase: audit.url,
          riskContribution: "+15% Risk",
          description: audit.details.join(" ")
        });
        riskPoints += 15;
      } else if (audit.isGov) {
        greenFlags.push({
          code: "OFFICIAL_DOMAIN",
          label: "Verified Government Domain (.gov.in)",
          description: `Reference to authentic portal: '${audit.hostname}'.`
        });
        riskPoints -= 25;
      }
    }

    // G. Trust Signals (Positive Ground Truth)
    if (rawText.includes("1930") || rawText.includes("cybercrime.gov.in")) {
      greenFlags.push({
        code: "CYBER_HELPLINE_MENTION",
        label: "National Cyber Helpline 1930 referenced",
        description: "Directs citizens to the authorized National Cyber Crime Reporting Portal."
      });
      riskPoints -= 10;
    }

    if (/direct\s*benefit\s*transfer|dbt/i.test(rawText)) {
      greenFlags.push({
        code: "DBT_AWARENESS",
        label: "Official Direct Benefit Transfer (DBT) Framework",
        description: "References legitimate direct bank account DBT credit mechanisms."
      });
      riskPoints -= 15;
    }

    if (/never\s*(?:asks|charges)\s*for\s*(?:any)?\s*(?:fee|otp|money|registration)/i.test(rawText) || /100%\s*free/i.test(rawText)) {
      greenFlags.push({
        code: "FRAUD_WARNING_INCLUDED",
        label: "Official Anti-Fraud & Free Service Notice",
        description: "Explicitly warns citizens against fake fee demands and unauthorized third parties."
      });
      riskPoints -= 15;
    }

    return { redFlags, greenFlags, riskPoints, feeCaptured, highlightedPhrases };
  }

  /**
   * Step 6: Indic Semantic Intent Analysis (Hybrid Layer)
   * Evaluates linguistic tone, Hinglish semantics, and social engineering manipulation
   */
  runSemanticCheck(lowerText, rawText) {
    let manipulationScore = 0;
    const cues = [];

    // Financial coercion cue
    if (/urgent|disburse|immediately|disconnection|freeze|block/i.test(lowerText)) {
      manipulationScore += 30;
      cues.push("High Psychological Pressure & Coercive Urgency");
    }

    // Lure / Greed bait cue
    if (/free|cash\s*grant|bonus|0%\s*interest|without\s*collateral|unlimited|vip/i.test(lowerText)) {
      manipulationScore += 35;
      cues.push("Unrealistic Financial Lure / Welfare Baiting");
    }

    // Hinglish dialect phrasing detected
    if (/bhai|suno|kisan|karo|bhejo|aakhri|mauka|der\s*mat|khulega|milega|dosto/i.test(lowerText)) {
      cues.push("Informal Hinglish Social Media Phrasing");
    }

    // Impersonation cues
    if (/prime\s*minister|pradhan\s*mantri|ministry\s*of\s*finance|digital\s*india/i.test(lowerText)) {
      cues.push("Government Authority Impersonation");
    }

    return {
      manipulationScore: Math.min(100, manipulationScore),
      linguisticCues: cues,
      modelType: "Indic Hybrid Semantic & Heuristic Engine"
    };
  }

  /**
   * Step 7: Compute Final Verdict, Risk & Confidence
   */
  computeVerdict(rawText, lowerText, indicatorFindings, verificationMatch, entities, urlAnalysis, mismatchFindings, semanticAnalysis) {
    let riskScore = indicatorFindings.riskPoints;
    const explainabilityReasons = [];

    // Fact-check debunk record overrides
    if (verificationMatch.matchedPibScam) {
      riskScore = Math.max(riskScore, 95);
      indicatorFindings.redFlags.unshift({
        code: "PIB_FACT_CHECK_MATCH",
        severity: "CRITICAL",
        label: "Official PIB Fact-Check Debunk Match!",
        exactPhrase: verificationMatch.matchedPibScam.title,
        riskContribution: "+95% Risk",
        description: `${verificationMatch.matchedPibScam.pibVerdict}: ${verificationMatch.matchedPibScam.pibSummary}`
      });
      explainabilityReasons.push(`Official Debunk Record: Press Information Bureau (PIB) previously investigated and exposed this claim: "${verificationMatch.matchedPibScam.title}".`);
    }

    if (mismatchFindings.hasMismatch) {
      riskScore = Math.max(riskScore, 85);
      explainabilityReasons.push(mismatchFindings.details);
    }

    // Combine with semantic manipulation score (hybrid weighting)
    if (semanticAnalysis.manipulationScore > 50 && riskScore > 30) {
      riskScore = Math.min(100, riskScore + 10);
    }

    // Clamp score
    riskScore = Math.max(0, Math.min(100, riskScore));

    let verdict = "NEEDS_VERIFICATION";
    let verdictTitle = "Needs Verification";
    let verdictClass = "status-amber";
    let confidenceScore = 85;

    const hasCriticalRedFlag = indicatorFindings.redFlags.some(f => f.severity === "CRITICAL" || f.severity === "HIGH");

    if (riskScore >= 50 || hasCriticalRedFlag || verificationMatch.matchedPibScam) {
      verdict = "POTENTIALLY_FAKE";
      verdictTitle = "High Scam Risk: Potentially Fake";
      verdictClass = "status-red";
      confidenceScore = 96;
      explainabilityReasons.push("Multiple critical red flags (upfront fee demands, unofficial domains, or exaggerated benefits) were confirmed.");
    } else if (riskScore <= 20 && verificationMatch.matchedScheme && indicatorFindings.redFlags.length === 0) {
      verdict = "LIKELY_GENUINE";
      verdictTitle = "Verified Authentic Welfare Notice";
      verdictClass = "status-green";
      confidenceScore = 94;
      explainabilityReasons.push(`Matches authentic guidelines for "${verificationMatch.matchedScheme.name}" with zero suspicious flags.`);
    } else {
      verdict = "NEEDS_VERIFICATION";
      verdictTitle = "Needs Official Verification";
      verdictClass = "status-amber";
      confidenceScore = 78;
      explainabilityReasons.push("The text lacks sufficient official verification parameters or originates from an unverified third-party source.");
    }

    const categoryDetected = this.detectCategory(lowerText, verificationMatch.matchedScheme, verificationMatch.matchedPibScam);

    // Primary Trigger / Headline reason
    let primaryTrigger = "";
    if (verificationMatch.matchedPibScam) {
      primaryTrigger = `Matches PIB Fact-Checked fake alert: "${verificationMatch.matchedPibScam.title}"`;
    } else if (mismatchFindings.hasMismatch) {
      primaryTrigger = mismatchFindings.details;
    } else if (indicatorFindings.feeCaptured) {
      primaryTrigger = `Demands upfront payment (${indicatorFindings.feeCaptured}) which authentic government welfare initiatives strictly prohibit.`;
    } else if (indicatorFindings.redFlags.some(f => f.code === "SUSPICIOUS_DOMAIN")) {
      const susp = entities.domains.find(d => !d.isOfficialGov);
      primaryTrigger = `Directs citizens to an unauthorized domain (${susp ? susp.hostname : "non-gov site"}) instead of '.gov.in'.`;
    } else if (verdict === "LIKELY_GENUINE") {
      primaryTrigger = `Direct Benefit Transfer (DBT) via verified official portal (${verificationMatch.matchedScheme ? verificationMatch.matchedScheme.officialDomain : ".gov.in"}) with zero fee.`;
    } else {
      primaryTrigger = "Third-party circular without official government domain verification.";
    }

    let officialStatusText = "";
    if (verificationMatch.matchedPibScam) {
      officialStatusText = `Debunked as FRAUD by Press Information Bureau (PIB)`;
    } else if (verificationMatch.matchedScheme) {
      officialStatusText = `Verified Program: ${verificationMatch.matchedScheme.name} (${verificationMatch.matchedScheme.ministry})`;
    } else {
      officialStatusText = `No corresponding record in Central Government Database`;
    }

    let immediateAction = "";
    if (verdict === "POTENTIALLY_FAKE") {
      immediateAction = "🚨 DO NOT PAY. Do not share OTP. Forward fact-check alert to WhatsApp groups and report on 1930.";
    } else if (verdict === "LIKELY_GENUINE") {
      immediateAction = "✅ Verified safe. Access services exclusively through the official portal (*.gov.in).";
    } else {
      immediateAction = "⚠️ Cross-check claim on myscheme.gov.in or consult local district CSC centre before proceeding.";
    }

    return {
      riskScore,
      confidenceScore,
      verdict,
      verdictTitle,
      verdictClass,
      categoryDetected,
      primaryTrigger,
      officialStatusText,
      immediateAction,
      explainabilityReasons
    };
  }

  /**
   * Helper: Category Detection
   */
  detectCategory(lowerText, matchedScheme, matchedPibScam) {
    if (matchedScheme) {
      if (matchedScheme.category.includes("Healthcare")) return "🏥 Healthcare";
      if (matchedScheme.category.includes("Loans") || matchedScheme.category.includes("MUDRA")) return "💰 Business Loans & MSME";
      if (matchedScheme.category.includes("Housing") || matchedScheme.category.includes("Shelter")) return "🏠 Housing & Shelter";
      if (matchedScheme.category.includes("Women") || matchedScheme.category.includes("Child")) return "👧 Women & Child Welfare";
      if (matchedScheme.category.includes("Education") || matchedScheme.category.includes("Students")) return "🎓 Education & Scholarships";
      if (matchedScheme.category.includes("Financial") || matchedScheme.category.includes("Banking")) return "🏦 Banking & Finance";
      if (matchedScheme.category.includes("Agriculture")) return "🌾 Agriculture & Farmers";
      if (matchedScheme.category.includes("Jobs") || matchedScheme.category.includes("Employment")) return "💼 Jobs & Recruitment";
      if (matchedScheme.category.includes("Energy")) return "⚡ Utilities & Energy";
    }

    if (matchedPibScam) {
      if (matchedPibScam.scamType.includes("Healthcare")) return "🏥 Healthcare";
      if (matchedPibScam.scamType.includes("Loan")) return "💰 Business Loans & MSME";
      if (matchedPibScam.scamType.includes("Housing")) return "🏠 Housing & Shelter";
      if (matchedPibScam.scamType.includes("Social") || matchedPibScam.scamType.includes("Women")) return "👧 Women & Child Welfare";
      if (matchedPibScam.scamType.includes("Banking")) return "🏦 Banking & Finance";
      if (matchedPibScam.scamType.includes("Job")) return "💼 Jobs & Recruitment";
      if (matchedPibScam.scamType.includes("Electricity") || matchedPibScam.scamType.includes("Remote")) return "⚡ Utilities & Energy";
      return "🎓 Student Tech & Grants";
    }

    if (/ayushman|health|card|hospital|treatment|doctor|abha/i.test(lowerText)) return "🏥 Healthcare";
    if (/mudra|loan|svanidhi|tarun|shishu|collateral|stamp\s*duty/i.test(lowerText)) return "💰 Business Loans & MSME";
    if (/awas|pmay|housing|flat|pucca\s*house|allotment/i.test(lowerText)) return "🏠 Housing & Shelter";
    if (/sukanya|kanya|girl\s*child|ladli|beti/i.test(lowerText)) return "👧 Women & Child Welfare";
    if (/sbi|bank|kyc|pan|yono|atm|net\s*banking|rbi/i.test(lowerText)) return "🏦 Banking & Finance";
    if (/railway|recruitment|vacancy|appointment|ssc|tte|job|exam/i.test(lowerText)) return "💼 Jobs & Recruitment";
    if (/electricity|power\s*cut|bijli|solar|rooftop|meter|bill/i.test(lowerText)) return "⚡ Utilities & Energy";
    if (/smartphone|phone|tablet|laptop|student|school|10th|12th|scholarship|nsp/i.test(lowerText)) return "🎓 Student Tech & Grants";
    if (/kisan|farmer|dbt/i.test(lowerText)) return "🌾 Agriculture & Welfare";

    return "🏛️ Public Welfare Initiative";
  }

  /**
   * Step 8: Generate Visual Highlighted HTML
   * Renders the user's message with interactive highlighted marks for caught phrases
   */
  generateHighlightedText(rawText, phrases) {
    if (!rawText) return "";
    let safe = rawText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    for (const item of phrases) {
      if (!item.phrase || item.phrase.trim().length === 0) continue;
      const cleanPhrase = item.phrase.trim();
      // Safe regex escaping
      const escaped = cleanPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const reg = new RegExp(`(${escaped})`, "gi");
      safe = safe.replace(reg, `<mark class="scam-highlight-phrase highlight-${item.color || 'red'}" title="${item.tooltip || 'Red flag detected'}">$1</mark>`);
    }

    return safe.replace(/\n/g, "<br>");
  }

  /**
   * Step 9: Citizen Safety Advisory Generation
   */
  generateSafetyAdvisory(evaluation, verificationMatch) {
    const actionPoints = [];
    let officialPortalUrl = "https://myscheme.gov.in";

    if (verificationMatch.matchedScheme) {
      officialPortalUrl = verificationMatch.matchedScheme.officialUrl;
    }

    if (evaluation.verdict === "POTENTIALLY_FAKE") {
      actionPoints.push("Do NOT send money or UPI payments. Authentic government schemes never charge upfront fees.");
      actionPoints.push("Do NOT click the link or install APK files. Never share your Aadhaar OTP or bank details.");
      actionPoints.push(`Access authentic benefits only through the verified portal: ${officialPortalUrl}`);
      actionPoints.push("Share this InfoShield Fact-Check Alert in the WhatsApp group to protect other members.");
      actionPoints.push("Report cyber financial fraud immediately to National Helpline 1930 or cybercrime.gov.in.");
    } else if (evaluation.verdict === "LIKELY_GENUINE") {
      actionPoints.push(`Confirm your eligibility directly on the official Government of India portal: ${officialPortalUrl}`);
      actionPoints.push("Subsidies are credited straight into Aadhaar-seeded bank accounts via DBT without middlemen.");
      actionPoints.push("Keep your Aadhaar linked with your bank account to receive benefits smoothly.");
    } else {
      actionPoints.push("Verify this notice against the official myScheme portal (myscheme.gov.in) before acting.");
      actionPoints.push("Consult your nearest Common Service Centre (CSC) or district administrative office.");
      actionPoints.push("Never pay cash or advance commission to any unverified agent.");
    }

    return {
      actionPoints,
      officialPortalUrl,
      helpline: "National Cyber Helpline 1930 / Kisan Helpline 155261"
    };
  }

  /**
   * Step 10: Auto-Generate Pre-Filled Cyber Crime Portal Report
   */
  generateCyberReport(rawText, entities, evaluation, verificationMatch, indicatorFindings) {
    const domainStr = entities.domains.map(d => d.hostname).join(", ") || "None mentioned";
    const phoneStr = entities.phoneNumbers.join(", ") || "None mentioned";
    const schemeName = verificationMatch.matchedScheme ? verificationMatch.matchedScheme.name : "Unregistered Scheme";

    return `
NATIONAL CYBER CRIME REPORTING PORTAL (cybercrime.gov.in / Helpline: 1930)
=========================================================================
INCIDENT REPORT: Fake Government Scheme Phishing & Financial Fraud
Date Generated: ${new Date().toLocaleDateString("en-IN")} at ${new Date().toLocaleTimeString("en-IN")}
Investigation Tool: InfoShield AI Citizen Security Engine

1. SUSPECT & PHISHING DETAILS:
   - Suspect Domains / Phishing URLs: ${domainStr}
   - Suspect Contact Numbers: ${phoneStr}
   - Impersonated Government Scheme: ${schemeName}
   - Calculated Fraud Risk Index: ${evaluation.riskScore}% (${evaluation.verdictTitle})

2. RED FLAGS IDENTIFIED:
${indicatorFindings.redFlags.map((f, i) => `   [${i + 1}] ${f.label}: ${f.description}`).join("\n")}

3. SUSPECT MESSAGE CONTENT (EXACT TEXT RECEIVED):
-------------------------------------------------------------------------
${rawText}
-------------------------------------------------------------------------

4. CITIZEN DECLARATION:
   This message was received via social media / messaging channels and verified
   against authentic Government of India ground truth databases (myScheme / PIB Fact Check).
   Kindly investigate the suspect URLs, UPI IDs, and phone numbers involved.
`.trim();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { InfoShieldAnalyzer };
}
