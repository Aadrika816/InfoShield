/**
 * InfoShield - Groq LPU Cloud AI Inference Service
 * Connects to ultra-low latency Groq API (Qwen 3.8 / Llama on Groq LPU)
 */

class GroqService {
  constructor(apiKey) {
    this.storageKey = "infoshield_groq_api_key";
    this.defaultKey = "YOUR_GROQ_API_KEY";
    this.apiKey = apiKey || localStorage.getItem(this.storageKey) || this.defaultKey;
    this.model = "qwen/qwen3.8-27b";
    this.endpoint = "https://api.groq.com/openai/v1/chat/completions";
    this.isEnabled = true;
  }

  setApiKey(key) {
    if (key && key.trim()) {
      this.apiKey = key.trim();
      localStorage.setItem(this.storageKey, this.apiKey);
    }
  }

  getApiKey() {
    return this.apiKey;
  }

  getMaskedKey() {
    if (!this.apiKey || this.apiKey.length < 10) return "Not Configured";
    return this.apiKey.substring(0, 7) + "..." + this.apiKey.substring(this.apiKey.length - 4);
  }

  /**
   * Run cloud inference using Groq's high-speed LPU
   * @param {string} text - Message or extracted OCR text
   * @param {string} optionalUrl - Domain or link
   * @param {InfoShieldAnalyzer} localAnalyzer - Local analyzer for official ground truth cross-reference
   */
  async analyze(text, optionalUrl = "", localAnalyzer = null) {
    const rawContent = (text || "").trim();
    const content = rawContent.toLowerCase();

    // 1. Run local entity extraction and ground truth cross-referencing
    let entities = { schemes: [], amounts: [], phones: [], domains: [], urgencyKeywords: [], feeTerms: [] };
    let verificationMatch = { matchedScheme: null, matchedPibScam: null };
    
    if (localAnalyzer) {
      entities = localAnalyzer.extractEntities(rawContent, optionalUrl);
      verificationMatch = localAnalyzer.crossReferenceOfficialData(content, entities);
    }

    // 2. Build Groq AI Prompt
    const systemPrompt = `You are InfoShield AI, a premier Indian civic-tech cyber intelligence system. 
Your mission is to protect Indian citizens from fake government schemes, fraudulent WhatsApp forwards, phishing traps, and monetary scams.
Analyze the provided claim thoroughly.

Respond ONLY with a valid, clean JSON object matching this exact schema:
{
  "verdict": "POTENTIALLY_FAKE" | "LIKELY_GENUINE" | "NEEDS_VERIFICATION",
  "riskScore": <integer between 0 and 100>,
  "verdictTitle": "<Concise punchy verdict title, e.g., 'High Scam Risk: Advance Fee Phishing Trap'>",
  "categoryDetected": "<e.g., '🏥 Healthcare', '💰 MSME Loans', '📱 Student Tech', '🌾 Agriculture & Welfare', '⚡ Utilities', '💼 Jobs'>",
  "primaryTrigger": "<A crystal-clear 1-2 sentence explanation of why this verdict was issued>",
  "redFlags": [
    {
      "severity": "CRITICAL" | "HIGH" | "MEDIUM",
      "label": "<Short red flag title>",
      "description": "<Why this is dangerous or deceptive>"
    }
  ],
  "greenFlags": [
    {
      "label": "<Trust signal title>",
      "description": "<Why this aspect indicates legitimacy>"
    }
  ],
  "immediateAction": "<Direct actionable guidance for the citizen>"
}

Rules:
1. Central Government welfare schemes (PM-KISAN, Ayushman Bharat, PMAY, Mudra) NEVER demand upfront registration/stamp fees via WhatsApp or UPI. Demanding payment is an immediate 90%+ risk.
2. Official portals end with '.gov.in' or '.nic.in'. Unofficial domains (.online, .xyz, .top, .site) are severe red flags.
3. Be objective, realistic, and prioritize citizen safety.`;

    const userPrompt = `Analyze this message/claim received by an Indian citizen:
"""
${rawContent}
"""
${optionalUrl ? `Associated URL: ${optionalUrl}` : ""}`;

    // 3. Call Groq API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second safety timeout

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API responded with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const rawAiText = data.choices[0].message.content;
      const aiResult = JSON.parse(rawAiText);

      // Map to UI-ready format
      const verdict = aiResult.verdict || (aiResult.riskScore > 60 ? "POTENTIALLY_FAKE" : aiResult.riskScore < 25 ? "LIKELY_GENUINE" : "NEEDS_VERIFICATION");
      const verdictClass = verdict === "LIKELY_GENUINE" ? "card-genuine" : verdict === "POTENTIALLY_FAKE" ? "card-fake" : "card-warning";

      // Build explainability reasons
      const explainabilityReasons = [];
      if (aiResult.redFlags && Array.isArray(aiResult.redFlags)) {
        aiResult.redFlags.forEach(f => explainabilityReasons.push(`🚩 ${f.label}: ${f.description}`));
      }
      if (aiResult.greenFlags && Array.isArray(aiResult.greenFlags)) {
        aiResult.greenFlags.forEach(f => explainabilityReasons.push(`✅ ${f.label}: ${f.description}`));
      }

      // Generate local safety advisory fallback/enhancement
      let advisory = null;
      if (localAnalyzer) {
        advisory = localAnalyzer.generateSafetyAdvisory({ verdict }, verificationMatch);
      }

      return {
        timestamp: new Date().toISOString(),
        rawInput: rawContent,
        entities,
        redFlags: aiResult.redFlags || [],
        greenFlags: aiResult.greenFlags || [],
        matchedScheme: verificationMatch.matchedScheme,
        matchedPibScam: verificationMatch.matchedPibScam,
        riskScore: Math.min(100, Math.max(0, parseInt(aiResult.riskScore, 10) || 50)),
        verdict,
        verdictTitle: aiResult.verdictTitle || (verdict === "POTENTIALLY_FAKE" ? "High Scam Risk Detected" : "Verified Authentic Claim"),
        verdictClass,
        categoryDetected: aiResult.categoryDetected || "🏛️ Public Welfare",
        primaryTrigger: aiResult.primaryTrigger || "Analysis completed via Groq Cloud AI Inference.",
        officialStatusText: verificationMatch.matchedPibScam ? "PIB Fact Check Debunk Record Found" : verificationMatch.matchedScheme ? "Official Government Scheme Matched" : "No Direct Ground-Truth DB Match",
        immediateAction: aiResult.immediateAction || "Verify through official .gov.in portals.",
        advisory,
        explainabilityReasons,
        isGroqPowered: true,
        modelName: "Qwen 3.8 (27B) on Groq LPU"
      };

    } catch (err) {
      console.warn("Groq inference error, falling back to local engine:", err);
      // Fallback gracefully to local engine
      if (localAnalyzer) {
        const fallback = localAnalyzer.analyze(text, optionalUrl);
        fallback.fallbackReason = `Groq Cloud AI unreachable (${err.message}). Evaluated via Local Deterministic Engine.`;
        return fallback;
      }
      throw err;
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { GroqService };
}
