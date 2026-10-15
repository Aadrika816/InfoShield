/**
 * InfoShield - Main Application Logic & UI Controller
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Core Services
  const analyzer = new InfoShieldAnalyzer(OFFICIAL_SCHEMES_DB, PIB_FACT_CHECKS, RED_FLAG_PATTERNS);
  const groqService = typeof GroqService !== "undefined" ? new GroqService() : null;
  let currentEngine = "groq"; // Default to Groq Cloud AI powered by user's key!
  let currentLanguage = "en";
  let lastAnalysisResult = null;

  // Audio synthesis for futuristic verification feedback
  const playTone = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "scan") {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === "genuine") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "fake") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(140, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  };

  // DOM Elements
  const langSelect = document.getElementById("langSelect");
  const messageInput = document.getElementById("messageInput");
  const btnScanMessage = document.getElementById("btnScanMessage");
  const btnClearMessage = document.getElementById("btnClearMessage");
  const btnQuickScam = document.getElementById("btnQuickScam");
  const btnQuickGenuine = document.getElementById("btnQuickGenuine");
  const sampleSelectDropdown = document.getElementById("sampleSelectDropdown");
  const activeSampleBanner = document.getElementById("activeSampleBanner");
  const btnDismissActiveSample = document.getElementById("btnDismissActiveSample");

  // Tab elements
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  // Scanner Progress Elements
  const scannerModal = document.getElementById("scannerProgressModal");
  const scanStep1 = document.getElementById("scanStep1");
  const scanStep2 = document.getElementById("scanStep2");
  const scanStep3 = document.getElementById("scanStep3");
  const scanStep4 = document.getElementById("scanStep4");
  const scanStep5 = document.getElementById("scanStep5");
  const progressBarFill = document.getElementById("progressBarFill");

  // Results View Elements
  const resultsContainer = document.getElementById("resultsContainer");
  const verdictCard = document.getElementById("verdictCard");
  const verdictBadge = document.getElementById("verdictBadge");
  const verdictTitle = document.getElementById("verdictTitle");
  const verdictDescription = document.getElementById("verdictDescription");
  const riskGaugeFill = document.getElementById("riskGaugeFill");
  const riskGaugeScore = document.getElementById("riskGaugeScore");
  const redFlagsList = document.getElementById("redFlagsList");
  const greenFlagsList = document.getElementById("greenFlagsList");
  const redFlagsCard = document.getElementById("redFlagsCard");
  const greenFlagsCard = document.getElementById("greenFlagsCard");
  const matchedSchemeCard = document.getElementById("matchedSchemeCard");
  const matchedSchemeContent = document.getElementById("matchedSchemeContent");
  const safetyAdvisoryList = document.getElementById("safetyAdvisoryList");
  const btnVisitOfficial = document.getElementById("btnVisitOfficial");
  const btnReportScam = document.getElementById("btnReportScam");
  const btnShareCard = document.getElementById("btnShareCard");

  // URL Tab Elements
  const urlInput = document.getElementById("urlInput");
  const btnAuditUrl = document.getElementById("btnAuditUrl");
  const urlAuditResult = document.getElementById("urlAuditResult");

  // Schemes Directory Elements
  const schemesListContainer = document.getElementById("schemesListContainer");
  const schemeSearchInput = document.getElementById("schemeSearchInput");
  const schemeCategoryFilter = document.getElementById("schemeCategoryFilter");

  // PIB Alerts Elements
  const pibAlertsContainer = document.getElementById("pibAlertsContainer");

  // Cyber Report Modal Elements
  const cyberReportModal = document.getElementById("cyberReportModal");
  const btnCloseCyberModal = document.getElementById("btnCloseCyberModal");
  const cyberReportText = document.getElementById("cyberReportText");
  const btnCopyCyberReport = document.getElementById("btnCopyCyberReport");

  // Project Info Modal Elements
  const projectInfoModal = document.getElementById("projectInfoModal");
  const btnNavProjectInfo = document.getElementById("btnNavProjectInfo");
  const btnCloseProjectModal = document.getElementById("btnCloseProjectModal");

  // Initialize OCR
  const ocrService = new InfoShieldOCR({
    dropzoneEl: document.getElementById("ocrDropzone"),
    previewContainerEl: document.getElementById("ocrPreviewWrapper"),
    previewImgEl: document.getElementById("ocrPreviewImg"),
    extractedTextEl: document.getElementById("ocrExtractedText"),
    onTextExtracted: (text) => {
      // Optional auto-prompt
    }
  });
  ocrService.init();

  // OCR Buttons
  const btnScanExtracted = document.getElementById("btnScanExtracted");
  const btnLoadSampleScamImg = document.getElementById("btnLoadSampleScamImg");
  const btnLoadSampleGenuineImg = document.getElementById("btnLoadSampleGenuineImg");
  const ocrFileInput = document.getElementById("ocrFileInput");

  // AI Engine Switcher Elements
  const btnEngineLocal = document.getElementById("btnEngineLocal");
  const btnEngineGroq = document.getElementById("btnEngineGroq");
  const engineStatusChip = document.getElementById("engineStatusChip");
  const engineStatusLabel = document.getElementById("engineStatusLabel");
  const btnOpenGroqModal = document.getElementById("btnOpenGroqModal");
  const groqKeyModal = document.getElementById("groqKeyModal");
  const btnCloseGroqModal = document.getElementById("btnCloseGroqModal");
  const groqApiKeyInput = document.getElementById("groqApiKeyInput");
  const btnSaveGroqKey = document.getElementById("btnSaveGroqKey");
  const btnResetGroqKey = document.getElementById("btnResetGroqKey");
  const groqKeyStatusMsg = document.getElementById("groqKeyStatusMsg");

  function updateEngineUI() {
    if (currentEngine === "groq") {
      if (btnEngineGroq) btnEngineGroq.classList.add("active");
      if (btnEngineLocal) btnEngineLocal.classList.remove("active");
      if (engineStatusLabel) engineStatusLabel.textContent = "Groq Cloud AI Active (LPU Powered)";
      const dot = engineStatusChip ? engineStatusChip.querySelector(".status-pulse-dot") : null;
      if (dot) dot.className = "status-pulse-dot groq-glow";
    } else {
      if (btnEngineLocal) btnEngineLocal.classList.add("active");
      if (btnEngineGroq) btnEngineGroq.classList.remove("active");
      if (engineStatusLabel) engineStatusLabel.textContent = "Local Civic Engine Active (Offline)";
      const dot = engineStatusChip ? engineStatusChip.querySelector(".status-pulse-dot") : null;
      if (dot) dot.className = "status-pulse-dot";
    }
  }

  if (btnEngineLocal) {
    btnEngineLocal.addEventListener("click", () => {
      currentEngine = "local";
      updateEngineUI();
    });
  }

  if (btnEngineGroq) {
    btnEngineGroq.addEventListener("click", () => {
      currentEngine = "groq";
      updateEngineUI();
    });
  }

  if (btnOpenGroqModal) {
    btnOpenGroqModal.addEventListener("click", () => {
      if (groqApiKeyInput && groqService) {
        groqApiKeyInput.value = groqService.getApiKey();
      }
      if (groqKeyModal) groqKeyModal.classList.remove("hidden");
    });
  }

  if (btnCloseGroqModal) {
    btnCloseGroqModal.addEventListener("click", () => {
      if (groqKeyModal) groqKeyModal.classList.add("hidden");
    });
  }

  if (btnSaveGroqKey) {
    btnSaveGroqKey.addEventListener("click", () => {
      const newKey = (groqApiKeyInput ? groqApiKeyInput.value : "").trim();
      if (newKey && groqService) {
        groqService.setApiKey(newKey);
        if (groqKeyStatusMsg) {
          groqKeyStatusMsg.innerHTML = "<span>✅</span> <span>Key updated successfully! Model: <strong>qwen/qwen3.8-27b</strong></span>";
        }
        setTimeout(() => {
          if (groqKeyModal) groqKeyModal.classList.add("hidden");
        }, 500);
      }
    });
  }

  if (btnResetGroqKey) {
    btnResetGroqKey.addEventListener("click", () => {
      if (groqService) {
        groqService.setApiKey(groqService.defaultKey);
        if (groqApiKeyInput) groqApiKeyInput.value = groqService.defaultKey;
        if (groqKeyStatusMsg) {
          groqKeyStatusMsg.innerHTML = "<span>✅</span> <span>Reset to default Groq Key!</span>";
        }
      }
    });
  }

  updateEngineUI();

  // --------------------------------------------------------------------------
  // Voice Input (Web Speech Recognition AI - Free, On-Device, Unlimited)
  // --------------------------------------------------------------------------
  const btnVoiceInput = document.getElementById("btnVoiceInput");
  const voiceRecordingBanner = document.getElementById("voiceRecordingBanner");
  const voiceStatusText = document.getElementById("voiceStatusText");
  const btnStopVoice = document.getElementById("btnStopVoice");
  const btnVoiceNotePreset = document.getElementById("btnVoiceNotePreset");

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isRecording = false;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = currentLanguage === "hi" ? "hi-IN" : "en-IN";

    recognition.onstart = () => {
      isRecording = true;
      if (btnVoiceInput) {
        btnVoiceInput.classList.add("recording");
        btnVoiceInput.innerHTML = `<span class="mic-icon">🔴</span> <span>Listening...</span>`;
      }
      if (voiceRecordingBanner) voiceRecordingBanner.classList.remove("hidden");
      if (voiceStatusText) voiceStatusText.textContent = "🎙️ Listening... Speak your doubt in Hindi or English...";
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (messageInput) {
        messageInput.value = transcript;
      }
      if (voiceStatusText) {
        voiceStatusText.textContent = `🎙️ Heard: "${transcript}"`;
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition notice:", event.error);
      stopVoiceRecording();
      if (event.error === "not-allowed") {
        alert("Microphone access was denied. Please allow microphone permissions in your browser URL bar.");
      }
    };

    recognition.onend = () => {
      stopVoiceRecording();
    };
  }

  function startVoiceRecording() {
    if (!recognition) {
      alert("Voice speech recognition is supported natively in Chrome, Edge, and mobile browsers. Please use Chrome/Edge or click 'Try Voice Note Scam'!");
      return;
    }
    try {
      recognition.lang = currentLanguage === "hi" ? "hi-IN" : "en-IN";
      recognition.start();
    } catch (e) {
      console.warn("Speech start note:", e);
    }
  }

  function stopVoiceRecording() {
    isRecording = false;
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }
    if (btnVoiceInput) {
      btnVoiceInput.classList.remove("recording");
      btnVoiceInput.innerHTML = `<span class="mic-icon">🎙️</span> <span>Speak (Voice Input)</span>`;
    }
    if (voiceRecordingBanner) {
      voiceRecordingBanner.classList.add("hidden");
    }
  }

  if (btnVoiceInput) {
    btnVoiceInput.addEventListener("click", () => {
      if (isRecording) {
        stopVoiceRecording();
      } else {
        startVoiceRecording();
      }
    });
  }

  if (btnStopVoice) {
    btnStopVoice.addEventListener("click", () => {
      stopVoiceRecording();
    });
  }

  // Voice Note Scam Simulation Button
  if (btnVoiceNotePreset) {
    btnVoiceNotePreset.addEventListener("click", () => {
      const voiceScamText = "🎙️ [VOICE NOTE TRANSCRIPTION]:\n\"Namaskar, main Bijli Vibhag zonal officer bol raha hoon. Aapka bijli meter update nahi hua hai aur aaj raat 9:30 baje bijli connection disconnect ho jayega. Turant is mobile number par WhatsApp karein aur ₹15 update fee pay karein: 9876543210.\"";
      if (messageInput) {
        messageInput.value = voiceScamText;
      }
      // Trigger scan automatically
      runFullScan(voiceScamText);
    });
  }

  // --------------------------------------------------------------------------
  // Voice Readout (Text-to-Speech - On-Device Web Speech Synthesis)
  // --------------------------------------------------------------------------
  const btnSpeakVerdict = document.getElementById("btnSpeakVerdict");
  let isSpeaking = false;

  function stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isSpeaking = false;
    if (btnSpeakVerdict) {
      btnSpeakVerdict.classList.remove("is-speaking");
      const icon = document.getElementById("speakIcon");
      const label = document.getElementById("speakLabel");
      if (icon) icon.textContent = "🔊";
      if (label) label.textContent = "Listen to Verdict";
    }
  }

  function speakVerdictText(res) {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech audio readout is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    window.speechSynthesis.cancel();

    // Prepare speech text
    let spokenText = "";
    if (res.verdict === "POTENTIALLY_FAKE") {
      spokenText = `Caution! High Scam Risk detected. Calculated risk is ${res.riskScore} percent. ${res.primaryTrigger}. Official advice: Do not send any registration fee, and never share your OTP. Report this message immediately to national cyber helpline 1930.`;
    } else if (res.verdict === "LIKELY_GENUINE") {
      spokenText = `Verified Authentic Notice. Calculated risk is ${res.riskScore} percent. ${res.primaryTrigger}. Access official welfare benefits only through verified dot gov dot in portals.`;
    } else {
      spokenText = `Notice requires official verification. Calculated risk is ${res.riskScore} percent. ${res.primaryTrigger}. Cross check on myScheme dot gov dot in portal.`;
    }

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Pick Indian voice if available
    const voices = window.speechSynthesis.getVoices();
    const indVoice = voices.find(v => v.lang.includes("IN") || v.lang.includes("hi") || v.name.includes("India"));
    if (indVoice) {
      utterance.voice = indVoice;
    }

    utterance.onstart = () => {
      isSpeaking = true;
      if (btnSpeakVerdict) {
        btnSpeakVerdict.classList.add("is-speaking");
        const icon = document.getElementById("speakIcon");
        const label = document.getElementById("speakLabel");
        if (icon) icon.textContent = "⏹️";
        if (label) label.textContent = "Stop Audio";
      }
    };

    utterance.onend = () => {
      stopSpeaking();
    };

    utterance.onerror = () => {
      stopSpeaking();
    };

    window.speechSynthesis.speak(utterance);
  }

  if (btnSpeakVerdict) {
    btnSpeakVerdict.addEventListener("click", () => {
      if (lastAnalysisResult) {
        speakVerdictText(lastAnalysisResult);
      }
    });
  }

  // --------------------------------------------------------------------------
  // Direct WhatsApp Share Warning
  // --------------------------------------------------------------------------
  const btnWhatsAppDirect = document.getElementById("btnWhatsAppDirect");
  if (btnWhatsAppDirect) {
    btnWhatsAppDirect.addEventListener("click", () => {
      if (!lastAnalysisResult) return;
      const res = lastAnalysisResult;
      const statusEmoji = res.verdict === "LIKELY_GENUINE" ? "✅ [GENUINE]" : (res.verdict === "POTENTIALLY_FAKE" ? "🚨 [FAKE SCAM ALERT]" : "⚠️ [UNVERIFIED CLAIM]");
      const msg = `
${statusEmoji} *InfoShield Fact-Check Warning:*
━━━━━━━━━━━━━━━━━━━━
⚠️ *Claim:* "${res.rawInput.substring(0, 90).replace(/\n/g, ' ')}..."
🛡️ *Verdict:* ${res.verdictTitle} (Risk: ${res.riskScore}%)

🔍 *Red Flags Caught:*
${res.explainabilityReasons.slice(0, 3).map(r => `• ${r}`).join('\n')}

🏛️ *Official Advice:*
${res.advisory.actionPoints.slice(0, 2).join('\n')}

📞 Cyber Crime Helpline: 1930 | cybercrime.gov.in
━━━━━━━━━━━━━━━━━━━━
Verified by InfoShield AI (Digital India Citizen Defense)
`.trim();

      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
      window.open(whatsappUrl, "_blank");
    });
  }

  if (ocrFileInput) {
    ocrFileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        ocrService.processImageFile(e.target.files[0]);
      }
    });
  }

  if (btnLoadSampleScamImg) {
    btnLoadSampleScamImg.addEventListener("click", () => {
      ocrService.loadSampleImage("scam");
    });
  }

  if (btnLoadSampleGenuineImg) {
    btnLoadSampleGenuineImg.addEventListener("click", () => {
      ocrService.loadSampleImage("genuine");
    });
  }

  // --------------------------------------------------------------------------
  // Tab Management & Inter-Tab Navigation
  // --------------------------------------------------------------------------
  function switchToTab(targetTab) {
    tabBtns.forEach(b => {
      if (b.getAttribute("data-tab") === targetTab) {
        b.classList.add("active");
      } else {
        b.classList.remove("active");
      }
    });
    tabPanes.forEach(p => {
      if (p.id === `tabPane-${targetTab}`) {
        p.classList.add("active");
      } else {
        p.classList.remove("active");
      }
    });
  }

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      switchToTab(targetTab);
    });
  });

  // Jump from Message tab directly to OCR / Photo upload
  const btnJumpToOcr = document.getElementById("btnJumpToOcr");
  if (btnJumpToOcr) {
    btnJumpToOcr.addEventListener("click", () => {
      switchToTab("ocr");
      const dropzone = document.getElementById("ocrDropzone");
      if (dropzone) dropzone.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  // Transfer extracted OCR text & link to Message Tab
  const btnCopyOcrToMessage = document.getElementById("btnCopyOcrToMessage");
  if (btnCopyOcrToMessage) {
    btnCopyOcrToMessage.addEventListener("click", () => {
      const ocrText = (document.getElementById("ocrExtractedText")?.value || "").trim();
      const ocrUrl = (document.getElementById("ocrAssociatedUrl")?.value || "").trim();
      if (!ocrText && !ocrUrl) {
        alert("Please upload a screenshot or photo to extract text first.");
        return;
      }
      if (messageInput && ocrText) messageInput.value = ocrText;
      const msgUrl = document.getElementById("msgAssociatedUrl");
      if (msgUrl && ocrUrl) msgUrl.value = ocrUrl;
      switchToTab("message");
      if (messageInput) messageInput.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  // Scan Extracted Image Text + Link
  if (btnScanExtracted) {
    btnScanExtracted.addEventListener("click", () => {
      const text = (document.getElementById("ocrExtractedText")?.value || "").trim();
      const associatedUrl = (document.getElementById("ocrAssociatedUrl")?.value || "").trim();
      if (!text && !associatedUrl) {
        alert("Please upload a screenshot or photo, or provide a website link to verify.");
        return;
      }
      let combined = text;
      if (associatedUrl && !combined.includes(associatedUrl)) {
        combined = combined ? `${combined}\n\nAssociated Website Link: ${associatedUrl}` : `Website Link for Verification: ${associatedUrl}`;
      }
      runFullScan(combined);
    });
  }

  // Global Clipboard Image Paste (Ctrl+V anywhere on the page)
  window.addEventListener("paste", (e) => {
    const activeEl = document.activeElement;
    const isTypingText = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
    
    const items = (e.clipboardData || window.clipboardData)?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            switchToTab("ocr");
            ocrService.processImageFile(file);
            const previewWrap = document.getElementById("ocrPreviewWrapper");
            if (previewWrap) previewWrap.scrollIntoView({ behavior: "smooth", block: "center" });
            break;
          }
        }
      }
    }
  });

  // Top Nav Smooth Scrolling
  document.querySelectorAll(".nav-link[data-section]").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const secId = link.getAttribute("data-section");
      const target = document.getElementById(secId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // --------------------------------------------------------------------------
  // Categorized Preset Samples & Active Sample Banner Handler
  // --------------------------------------------------------------------------
  function loadMessageSample(sampleKey) {
    if (!sampleKey || !PRESET_TEST_CASES[sampleKey]) return;
    const sample = PRESET_TEST_CASES[sampleKey];
    messageInput.value = sample.text;

    // Update active sample banner
    const banner = document.getElementById("activeSampleBanner");
    const badge = document.getElementById("activeSampleBadge");
    const cat = document.getElementById("activeSampleCategory");
    const title = document.getElementById("activeSampleTitle");

    if (banner && badge && cat && title) {
      const isFake = sample.isFake;
      badge.textContent = isFake === true ? "🚨 FAKE SCAM" : (isFake === false ? "✅ GENUINE" : "⚠️ UNVERIFIED");
      badge.className = "sample-tag-badge " + (isFake === true ? "is-fake" : (isFake === false ? "is-genuine" : "is-unverified"));
      cat.textContent = sample.categoryLabel || "Public Welfare";
      title.textContent = sample.title;
      banner.classList.remove("hidden");
    }

    playTone("scan");
    messageInput.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (sampleSelectDropdown) {
    sampleSelectDropdown.addEventListener("change", (e) => {
      loadMessageSample(e.target.value);
    });
  }

  if (btnQuickScam) {
    btnQuickScam.addEventListener("click", () => {
      if (sampleSelectDropdown) sampleSelectDropdown.value = "healthcare_fake";
      loadMessageSample("healthcare_fake");
    });
  }

  if (btnQuickGenuine) {
    btnQuickGenuine.addEventListener("click", () => {
      if (sampleSelectDropdown) sampleSelectDropdown.value = "healthcare_genuine";
      loadMessageSample("healthcare_genuine");
    });
  }

  if (btnDismissActiveSample) {
    btnDismissActiveSample.addEventListener("click", () => {
      messageInput.value = "";
      const banner = document.getElementById("activeSampleBanner");
      if (banner) banner.classList.add("hidden");
      if (sampleSelectDropdown) sampleSelectDropdown.value = "";
    });
  }

  // Category filter buttons
  document.querySelectorAll(".cat-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cat-filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.getAttribute("data-category");

      if (sampleSelectDropdown) {
        const optgroups = sampleSelectDropdown.querySelectorAll("optgroup");
        let firstMatchingVal = "";
        optgroups.forEach(og => {
          const label = (og.getAttribute("label") || "").toLowerCase();
          let show = false;
          if (cat === "all") {
            show = true;
          } else if (cat === "healthcare" && label.includes("healthcare")) {
            show = true;
          } else if (cat === "banking" && label.includes("banking")) {
            show = true;
          } else if (cat === "welfare" && (label.includes("agriculture") || label.includes("farmer") || label.includes("welfare"))) {
            show = true;
          } else if (cat === "jobs" && (label.includes("job") || label.includes("recruitment"))) {
            show = true;
          } else if (cat === "utility" && (label.includes("utilit") || label.includes("civic"))) {
            show = true;
          } else if (cat === "loans" && (label.includes("loan") || label.includes("msme"))) {
            show = true;
          } else if (cat === "tech" && (label.includes("tech") || label.includes("scholarship"))) {
            show = true;
          } else if (cat === "housing" && (label.includes("housing") || label.includes("pmay"))) {
            show = true;
          } else if (cat === "women" && (label.includes("women") || label.includes("child"))) {
            show = true;
          }

          og.style.display = show ? "" : "none";
          if (show && !firstMatchingVal) {
            const firstOpt = og.querySelector("option");
            if (firstOpt) firstMatchingVal = firstOpt.value;
          }
        });

        if (cat !== "all" && firstMatchingVal) {
          sampleSelectDropdown.value = firstMatchingVal;
          loadMessageSample(firstMatchingVal);
        }
      }
    });
  });

  // Screenshot Presets Gallery Listeners
  document.querySelectorAll("#screenshotCardsGrid .screenshot-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll("#screenshotCardsGrid .screenshot-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      const sampleKey = card.getAttribute("data-sample-key");
      ocrService.loadSampleImage(sampleKey);
    });
  });

  // URL Presets Bar Chips Listeners (All Groups)
  document.querySelectorAll(".url-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const url = chip.getAttribute("data-url");
      if (urlInput) urlInput.value = url;
      auditUrlDirectly(url);
    });
  });

  // New Scan Button in Results Header
  const btnNewScan = document.getElementById("btnNewScan");
  if (btnNewScan) {
    btnNewScan.addEventListener("click", () => {
      messageInput.value = "";
      resultsContainer.classList.add("hidden");
      const banner = document.getElementById("activeSampleBanner");
      if (banner) banner.classList.add("hidden");
      if (sampleSelectDropdown) sampleSelectDropdown.value = "";
      const verifierSec = document.getElementById("verifierSection");
      if (verifierSec) verifierSec.scrollIntoView({ behavior: "smooth" });
    });
  }

  if (btnClearMessage) {
    btnClearMessage.addEventListener("click", () => {
      messageInput.value = "";
      const banner = document.getElementById("activeSampleBanner");
      if (banner) banner.classList.add("hidden");
      if (sampleSelectDropdown) sampleSelectDropdown.value = "";
      resultsContainer.classList.add("hidden");
    });
  }

  if (btnScanMessage) {
    btnScanMessage.addEventListener("click", () => {
      const text = messageInput.value.trim();
      const associatedUrl = (document.getElementById("msgAssociatedUrl")?.value || "").trim();
      if (!text && !associatedUrl) {
        alert("Please enter a message, upload a screenshot or photo, or provide a website link to verify!");
        return;
      }
      let combined = text;
      if (associatedUrl && !combined.includes(associatedUrl)) {
        combined = combined ? `${combined}\n\nAssociated Website Link: ${associatedUrl}` : `Website Link for Verification: ${associatedUrl}`;
      }
      runFullScan(combined);
    });
  }

  // --------------------------------------------------------------------------
  // Link / URL Auditor Listener
  // --------------------------------------------------------------------------
  if (btnAuditUrl) {
    btnAuditUrl.addEventListener("click", () => {
      const urlText = (urlInput.value || "").trim();
      if (!urlText) {
        alert("Please enter a website link to audit.");
        return;
      }
      auditUrlDirectly(urlText);
    });
  }

  function auditUrlDirectly(url) {
    playTone("scan");
    let domain = "";
    try {
      const parsed = new URL(url.startsWith("http") ? url : "https://" + url);
      domain = parsed.hostname.toLowerCase();
    } catch (e) {
      domain = url.replace(/https?:\/\//i, "").split("/")[0].toLowerCase();
    }

    const isGov = analyzer.isGovDomain(domain);
    const isSuspicious = RED_FLAG_PATTERNS.suspiciousTlds.some(t => domain.endsWith(t));

    let html = "";
    if (isGov) {
      playTone("genuine");
      html = `
        <div class="url-card url-card-safe">
          <div class="url-header">
            <span class="url-badge badge-green">✓ Official Government Domain</span>
            <h4>${domain}</h4>
          </div>
          <p class="url-desc">This domain is registered under official Indian Public/Government infrastructure (.gov.in or .nic.in). Authentic portal for official citizen services.</p>
          <div class="url-actions">
            <a href="${url.startsWith('http') ? url : 'https://' + url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">Visit Official Site ↗</a>
          </div>
        </div>
      `;
    } else if (isSuspicious) {
      playTone("fake");
      html = `
        <div class="url-card url-card-danger">
          <div class="url-header">
            <span class="url-badge badge-red">🚨 Malicious / Suspicious Domain</span>
            <h4>${domain}</h4>
          </div>
          <p class="url-desc"><strong>HIGH RISK:</strong> This domain uses a generic or high-risk extension (${domain.substring(domain.lastIndexOf('.'))}) frequently exploited by cybercriminals to spoof government portals and harvest citizen data.</p>
          <div class="url-actions">
            <button class="btn btn-sm btn-danger" onclick="triggerCyberModalForDomain('${domain}')">Report Phishing Link</button>
          </div>
        </div>
      `;
    } else {
      playTone("scan");
      html = `
        <div class="url-card url-card-warning">
          <div class="url-header">
            <span class="url-badge badge-amber">⚠️ Third-Party / Unofficial Domain</span>
            <h4>${domain}</h4>
          </div>
          <p class="url-desc">This website does NOT belong to the Government of India. It may be a blog, news portal, or unverified intermediary. Do NOT enter bank details or pay fees here.</p>
          <div class="url-actions">
            <a href="https://www.myscheme.gov.in" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">Check on myScheme.gov.in ↗</a>
          </div>
        </div>
      `;
    }

    urlAuditResult.innerHTML = html;
    urlAuditResult.classList.remove("hidden");
  }

  // --------------------------------------------------------------------------
  // AI Scan Pipeline with Simulated Multi-Step Visual Progress
  // --------------------------------------------------------------------------
  async function runFullScan(inputText, inputUrl = "") {
    playTone("scan");

    // Reset & display progress modal
    scannerModal.classList.remove("hidden");
    resetProgressSteps();

    // Step 1: Ingesting
    scanStep1.classList.add("step-active");
    progressBarFill.style.width = "20%";
    await delay(250);
    scanStep1.classList.remove("step-active");
    scanStep1.classList.add("step-done");

    // Step 2: Inference (Groq Cloud LPU or Local NLP)
    scanStep2.classList.add("step-active");
    const scanStep2Text = scanStep2.querySelector("span:last-child");
    if (scanStep2Text) {
      scanStep2Text.textContent = currentEngine === "groq"
        ? "2. Groq LPU Cloud Inference (Qwen 3.8 27B)..."
        : "2. NLP Entity & Claim Extraction...";
    }
    progressBarFill.style.width = "40%";

    // Run inference concurrently with progress animation
    let result = null;
    const inferencePromise = (async () => {
      // 1. Try Flask REST API & MySQL Backend if available
      if (window.apiClient && window.apiClient.isBackendOnline) {
        try {
          const apiRes = await window.apiClient.verifyContent(inputText, inputUrl, "message");
          if (apiRes && apiRes.success && apiRes.data) {
            return apiRes.data;
          }
        } catch (apiErr) {
          console.warn("Backend API verification error, falling back:", apiErr);
        }
      }

      // 2. Groq LPU Cloud Inference
      if (currentEngine === "groq" && groqService) {
        try {
          return await groqService.analyze(inputText, inputUrl, analyzer);
        } catch (err) {
          console.warn("Groq inference error, fallback to local:", err);
          const fallback = analyzer.analyze(inputText, inputUrl);
          fallback.fallbackReason = "Groq Cloud unreachable. Processed via Local Engine.";
          return fallback;
        }
      } else {
        return analyzer.analyze(inputText, inputUrl);
      }
    })();

    await delay(300);
    scanStep2.classList.remove("step-active");
    scanStep2.classList.add("step-done");

    // Step 3: Scam Indicators & Red Flags
    scanStep3.classList.add("step-active");
    progressBarFill.style.width = "65%";
    await delay(300);
    scanStep3.classList.remove("step-active");
    scanStep3.classList.add("step-done");

    // Step 4: Official DB Cross-referencing
    scanStep4.classList.add("step-active");
    progressBarFill.style.width = "85%";
    await delay(300);
    scanStep4.classList.remove("step-active");
    scanStep4.classList.add("step-done");

    // Step 5: Verdict Synthesis
    scanStep5.classList.add("step-active");
    progressBarFill.style.width = "100%";

    // Await completion of inference
    result = await inferencePromise;

    await delay(200);
    scanStep5.classList.remove("step-active");
    scanStep5.classList.add("step-done");

    lastAnalysisResult = result;
    await delay(200);
    scannerModal.classList.add("hidden");

    // Render results
    renderResults(result);

    // Audio feedback based on verdict
    if (result.verdict === "LIKELY_GENUINE") {
      playTone("genuine");
    } else if (result.verdict === "POTENTIALLY_FAKE") {
      playTone("fake");
    } else {
      playTone("scan");
    }

    resultsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetProgressSteps() {
    [scanStep1, scanStep2, scanStep3, scanStep4, scanStep5].forEach(step => {
      step.classList.remove("step-active", "step-done");
    });
    progressBarFill.style.width = "5%";
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --------------------------------------------------------------------------
  // Render Verification Results
  // --------------------------------------------------------------------------
  function renderResults(res) {
    resultsContainer.classList.remove("hidden");

    // 1. Verdict Card
    verdictCard.className = `verdict-card ${res.verdictClass}`;

    let iconSvg = "";
    if (res.verdict === "LIKELY_GENUINE") {
      iconSvg = `
        <svg class="verdict-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      `;
      verdictTitle.textContent = getTranslation("verdictGenuine");
      verdictDescription.textContent = res.primaryTrigger || getTranslation("verdictGenuineDesc");
      verdictBadge.textContent = getTranslation("verdictGenuineBadge");
      verdictBadge.className = "verdict-badge-pill badge-green";
    } else if (res.verdict === "POTENTIALLY_FAKE") {
      iconSvg = `
        <svg class="verdict-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      `;
      verdictTitle.textContent = getTranslation("verdictFake");
      verdictDescription.textContent = res.primaryTrigger || getTranslation("verdictFakeDesc");
      verdictBadge.textContent = getTranslation("verdictFakeBadge");
      verdictBadge.className = "verdict-badge-pill badge-red";
    } else {
      iconSvg = `
        <svg class="verdict-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      `;
      verdictTitle.textContent = getTranslation("verdictUncertain");
      verdictDescription.textContent = res.primaryTrigger || getTranslation("verdictUncertainDesc");
      verdictBadge.textContent = getTranslation("verdictUncertainBadge");
      verdictBadge.className = "verdict-badge-pill badge-amber";
    }

    const iconWrapper = document.getElementById("verdictIconWrapper");
    if (iconWrapper) iconWrapper.innerHTML = iconSvg;

    // High-Impact Verified Result: Is this information True or False?
    const truthBanner = document.getElementById("truthVerdictBanner");
    const truthStamp = document.getElementById("truthStampBadge");
    const truthAnswer = document.getElementById("truthAnswerHighlight");
    const truthDesc = document.getElementById("truthSubDesc");

    if (truthBanner) {
      if (res.verdict === "POTENTIALLY_FAKE" || res.riskScore > 50) {
        truthBanner.className = "truth-verdict-banner is-false";
        if (truthStamp) truthStamp.textContent = "❌ FALSE / SCAM";
        if (truthAnswer) truthAnswer.innerHTML = `➔ <strong style="color: #ef4444;">FALSE (Scam Detected)</strong>`;
        if (truthDesc) truthDesc.textContent = "This message is FALSE. It does not exist in any official Government of India database and contains malicious/fraudulent triggers.";
      } else if (res.verdict === "LIKELY_GENUINE" || res.riskScore <= 20) {
        truthBanner.className = "truth-verdict-banner is-true";
        if (truthStamp) truthStamp.textContent = "✅ TRUE / GENUINE";
        if (truthAnswer) truthAnswer.innerHTML = `➔ <strong style="color: #10b981;">TRUE (Official Government Scheme)</strong>`;
        if (truthDesc) truthDesc.textContent = "This message is TRUE. It matches authentic welfare program records published by the Government of India.";
      } else {
        truthBanner.className = "truth-verdict-banner is-caution";
        if (truthStamp) truthStamp.textContent = "⚠️ UNCONFIRMED / CAUTION";
        if (truthAnswer) truthAnswer.innerHTML = `➔ <strong style="color: #f59e0b;">UNVERIFIED (Proceed With Caution)</strong>`;
        if (truthDesc) truthDesc.textContent = "This information cannot be confirmed. Key details are missing or third-party claims are involved. Always verify directly on official portals.";
      }
    }

    const verdictCategoryBadge = document.getElementById("verdictCategoryBadge");
    if (verdictCategoryBadge) {
      verdictCategoryBadge.textContent = res.categoryDetected || "🏛️ Welfare Scheme";
    }

    const verdictEngineBadge = document.getElementById("verdictEngineBadge");
    if (verdictEngineBadge) {
      if (res.isGroqPowered) {
        verdictEngineBadge.className = "verdict-engine-pill";
        verdictEngineBadge.innerHTML = `⚡ ${res.modelName || "Groq Cloud AI (Qwen 3.8)"}`;
        verdictEngineBadge.title = "Verified using Groq LPU Ultra-Fast Cloud AI Inference";
      } else {
        verdictEngineBadge.className = "verdict-engine-pill local";
        verdictEngineBadge.innerHTML = `🛡️ Local Civic Engine (Offline)`;
        verdictEngineBadge.title = "Verified using Local Heuristic & Knowledge Engine";
      }
    }

    // 2. Risk Gauge Dial
    riskGaugeFill.style.width = `${res.riskScore}%`;
    riskGaugeScore.textContent = `${res.riskScore}% ${getTranslation("chartRisk")}`;

    if (res.riskScore > 50) {
      riskGaugeFill.style.backgroundColor = "var(--color-danger)";
    } else if (res.riskScore > 20) {
      riskGaugeFill.style.backgroundColor = "var(--color-warning)";
    } else {
      riskGaugeFill.style.backgroundColor = "var(--color-success)";
    }

    // 3. Pillar 1: Detected Indicators & Red Flags
    const pillarEvidenceBody = document.getElementById("pillarEvidenceBody");
    const pillarEvidenceCountBadge = document.getElementById("pillarEvidenceCountBadge");

    if (pillarEvidenceBody) {
      let evidenceHtml = "";
      if (res.redFlags && res.redFlags.length > 0) {
        if (pillarEvidenceCountBadge) {
          pillarEvidenceCountBadge.textContent = `${res.redFlags.length} ${getTranslation("redFlagsBadge")}`;
          pillarEvidenceCountBadge.className = "pillar-count-badge badge-red";
        }

        evidenceHtml += res.redFlags.map(rf => `
          <div class="indicator-item indicator-danger">
            <div class="indicator-header">
              <span class="indicator-badge badge-${(rf.severity || 'high').toLowerCase()}">${rf.severity || getTranslation("redFlagBadge")}</span>
              <span class="indicator-title">${rf.label}</span>
              ${rf.riskContribution ? `<span class="indicator-contrib-tag">${rf.riskContribution}</span>` : ''}
            </div>
            ${rf.exactPhrase ? `<div class="indicator-phrase-box"><span>${getTranslation("exactTriggerLabel")}</span> <code>"${rf.exactPhrase}"</code></div>` : ''}
            <p class="indicator-desc">${rf.description}</p>
          </div>
        `).join("");

        if (res.greenFlags && res.greenFlags.length > 0) {
          evidenceHtml += res.greenFlags.map(gf => `
            <div class="indicator-item indicator-success" style="opacity: 0.85;">
              <div class="indicator-header">
                <span class="indicator-badge badge-green">${getTranslation("trustSignalBadge")}</span>
                <span class="indicator-title">${gf.label}</span>
              </div>
              <p class="indicator-desc">${gf.description}</p>
            </div>
          `).join("");
        }
      } else if (res.greenFlags && res.greenFlags.length > 0) {
        if (pillarEvidenceCountBadge) {
          pillarEvidenceCountBadge.textContent = `${res.greenFlags.length} ${getTranslation("trustSignalsBadge")}`;
          pillarEvidenceCountBadge.className = "pillar-count-badge badge-green";
        }

        evidenceHtml += res.greenFlags.map(gf => `
          <div class="indicator-item indicator-success">
            <div class="indicator-header">
              <span class="indicator-badge badge-green">${getTranslation("trustSignalBadge")}</span>
              <span class="indicator-title">${gf.label}</span>
            </div>
            <p class="indicator-desc">${gf.description}</p>
          </div>
        `).join("");
      } else {
        if (pillarEvidenceCountBadge) {
          pillarEvidenceCountBadge.textContent = getTranslation("zeroTriggers");
          pillarEvidenceCountBadge.className = "pillar-count-badge badge-amber";
        }
        evidenceHtml = `
          <div class="indicator-item indicator-neutral">
            <p class="indicator-desc">${getTranslation("noIndicators")}</p>
          </div>
        `;
      }
      pillarEvidenceBody.innerHTML = evidenceHtml;
    }

    // 4. Benefit Mismatch Banner Rendering
    const benefitMismatchCard = document.getElementById("benefitMismatchCard");
    if (benefitMismatchCard) {
      if (res.benefitMismatch && res.benefitMismatch.hasMismatch) {
        benefitMismatchCard.classList.remove("hidden");
        const m = res.benefitMismatch;
        const mismatchTitle = document.getElementById("mismatchTitle");
        const mismatchDetails = document.getElementById("mismatchDetails");
        const mismatchMultiplierBadge = document.getElementById("mismatchMultiplierBadge");
        const mismatchClaimedVal = document.getElementById("mismatchClaimedVal");
        const mismatchOfficialVal = document.getElementById("mismatchOfficialVal");

        if (mismatchTitle) mismatchTitle.textContent = getTranslation("mismatchTitle");
        if (mismatchDetails) mismatchDetails.textContent = m.details;
        if (mismatchMultiplierBadge) mismatchMultiplierBadge.textContent = `${m.diffMultiplier}x Higher Than Official Limit`;
        if (mismatchClaimedVal) mismatchClaimedVal.textContent = `₹${m.claimedAmount.toLocaleString("en-IN")}`;
        if (mismatchOfficialVal) mismatchOfficialVal.textContent = `₹${m.officialMax.toLocaleString("en-IN")} / year max`;
      } else {
        benefitMismatchCard.classList.add("hidden");
      }
    }

    // 5. Interactive Highlighting Box (Original Text with Flagged Phrases)
    const highlightedTextDisplay = document.getElementById("highlightedTextDisplay");
    if (highlightedTextDisplay) {
      highlightedTextDisplay.innerHTML = res.highlightedHtml || (res.rawInput ? res.rawInput.replace(/\n/g, "<br>") : "");
    }

    // 6. Pillar 2: Government Portal Ground Truth
    const pillarGroundTruthBody = document.getElementById("pillarGroundTruthBody");
    const pillarGroundTruthBadge = document.getElementById("pillarGroundTruthBadge");

    if (pillarGroundTruthBody) {
      let gtHtml = "";
      if (res.matchedPibScam) {
        if (pillarGroundTruthBadge) {
          pillarGroundTruthBadge.textContent = getTranslation("gtBadgePib");
          pillarGroundTruthBadge.className = "pillar-status-badge badge-red";
        }
        gtHtml = `
          <div class="groundtruth-box gt-debunk">
            <div class="gt-debunk-tag">${getTranslation("pibDebunkTag")}</div>
            <h5 class="gt-debunk-title">${res.matchedPibScam.title}</h5>
            <p class="gt-debunk-summary"><strong>${getTranslation("pibInvest")}</strong> ${res.matchedPibScam.pibSummary}</p>
            <div class="gt-official-proof">
              <strong>${getTranslation("officialFact")}</strong> ${res.matchedPibScam.debunkProof}
            </div>
            <div class="gt-portal-link">
              <span>${getTranslation("srcLabel")}</span>
              <a href="${res.matchedPibScam.refUrl}" target="_blank" rel="noopener noreferrer" class="link-official">
                factcheck.pib.gov.in ↗
              </a>
            </div>
          </div>
        `;
      } else if (res.matchedScheme) {
        if (pillarGroundTruthBadge) {
          pillarGroundTruthBadge.textContent = getTranslation("gtBadgeOfficial");
          pillarGroundTruthBadge.className = "pillar-status-badge badge-green";
        }
        gtHtml = `
          <div class="groundtruth-box gt-verified">
            <div class="gt-verified-tag">${getTranslation("matchedSchemeTag")}</div>
            <h5 class="gt-scheme-title">${res.matchedScheme.name}</h5>
            <p class="gt-meta-item">🏛️ <strong>${getTranslation("authorityLabel")}</strong> ${res.matchedScheme.ministry}</p>
            <p class="gt-meta-item">🎁 <strong>${getTranslation("benefitLabel")}</strong> ${res.matchedScheme.benefitSummary}</p>
            <p class="gt-meta-item">👥 <strong>${getTranslation("targetAudienceLabel")}</strong> ${res.matchedScheme.targetAudience}</p>
            <p class="gt-meta-item">💳 <strong>${getTranslation("feePolicyLabel")}</strong> ${res.matchedScheme.officialFee || getTranslation("freeFee")}</p>
            <div class="gt-portal-link">
              <span>${getTranslation("officialPortalLabel")}</span>
              <a href="${res.matchedScheme.officialUrl}" target="_blank" rel="noopener noreferrer" class="link-official">
                ${res.matchedScheme.officialDomain} ↗
              </a>
            </div>
            <div class="gt-official-notice">
              <strong>⚠️ ${getTranslation("officialRuleLabel")}</strong> ${res.matchedScheme.verifiedNotice}
            </div>
          </div>
        `;
      } else {
        if (pillarGroundTruthBadge) {
          pillarGroundTruthBadge.textContent = getTranslation("gtBadgeUnverified");
          pillarGroundTruthBadge.className = "pillar-status-badge badge-amber";
        }
        gtHtml = `
          <div class="groundtruth-box gt-unverified">
            <div class="gt-unverified-tag">${getTranslation("unverifiedNoticeTag")}</div>
            <h5 class="gt-scheme-title">${getTranslation("unregTitle")}</h5>
            <p class="gt-meta-item">${getTranslation("unregDesc")}</p>
            <div class="gt-portal-link">
              <span>${getTranslation("searchDir")}</span>
              <a href="https://www.myscheme.gov.in" target="_blank" rel="noopener noreferrer" class="link-official">
                myScheme.gov.in ↗
              </a>
            </div>
            <div class="gt-official-notice">
              <strong>⚠️ ${getTranslation("citizenWarn")}</strong> ${getTranslation("citizenWarnText")}
            </div>
          </div>
        `;
      }
      pillarGroundTruthBody.innerHTML = gtHtml;
    }

    // 7. Pillar 3: Citizen Action Checklist & Buttons
    if (safetyAdvisoryList) {
      safetyAdvisoryList.innerHTML = res.advisory.actionPoints.map((point, idx) => `
        <li class="safety-advisory-item">
          <span class="safety-item-num">${idx + 1}</span>
          <span>${point}</span>
        </li>
      `).join("");
    }

    // Update buttons
    const btnVisitOfficial = document.getElementById("btnVisitOfficial");
    const btnReportScam = document.getElementById("btnReportScam");
    const btnShareCard = document.getElementById("btnShareCard");

    if (btnVisitOfficial) {
      btnVisitOfficial.href = res.advisory.officialPortalUrl;
      btnVisitOfficial.onclick = (e) => {
        e.preventDefault();
        window.open(res.advisory.officialPortalUrl, "_blank");
      };
    }

    if (btnReportScam) {
      btnReportScam.onclick = () => {
        openCyberModal(res);
      };
    }

    if (btnShareCard) {
      btnShareCard.onclick = () => {
        openShareCardModal(res);
      };
    }

    renderInsights(res);
  }

  // --------------------------------------------------------------------------
  // Palindrome Graph (Symmetric Evidence Spectrum) & Official Gateway Card
  // --------------------------------------------------------------------------
  function renderInsights(res) {
    if (!res) return;
    const risk = Math.max(0, Math.min(100, Math.round(res.riskScore || 0)));

    // Palindrome Graph calculations
    // Center is 50% risk (Equilibrium, 0 tilt).
    // Left wing (Genuine Trust): tilts up to 100% when risk approaches 0%
    // Right wing (Scam Risk): tilts up to 100% when risk approaches 100%
    const genuineTilt = risk <= 50 ? Math.round((50 - risk) * 2) : 0;
    const scamTilt = risk >= 50 ? Math.round((risk - 50) * 2) : 0;

    // Pointer position: 0% to 100%, clamped between 4% and 96% so needle is completely visible
    const pointerPct = Math.max(4, Math.min(96, risk));

    const palBadge = document.getElementById("palEquilibriumBadge");
    const wingGenScore = document.getElementById("wingGenuineScore");
    const wingScamScoreEl = document.getElementById("wingScamScore");
    const fillGen = document.getElementById("palindromeFillGenuine");
    const fillScam = document.getElementById("palindromeFillScam");
    const pointer = document.getElementById("palindromePointer");
    const bubble = document.getElementById("pointerBubble");
    const trustCol = document.getElementById("palindromeTrustCol");
    const threatCol = document.getElementById("palindromeThreatCol");
    const summaryBox = document.getElementById("palindromeSummaryBox");

    if (wingGenScore) wingGenScore.textContent = `${genuineTilt}%`;
    if (wingScamScoreEl) wingScamScoreEl.textContent = `${scamTilt}%`;

    if (fillGen) {
      fillGen.style.width = "0%";
      requestAnimationFrame(() => {
        fillGen.style.width = `${genuineTilt}%`;
      });
    }
    if (fillScam) {
      fillScam.style.width = "0%";
      requestAnimationFrame(() => {
        fillScam.style.width = `${scamTilt}%`;
      });
    }

    if (pointer) {
      pointer.style.left = `${pointerPct}%`;
    }

    if (bubble) {
      if (risk > 50) {
        bubble.textContent = `+${scamTilt}% ${getTranslation("chartLegendRisk") || "Scam"}`;
      } else if (risk < 50) {
        bubble.textContent = `-${genuineTilt}% ${getTranslation("chartLegendSafe") || "Genuine"}`;
      } else {
        bubble.textContent = getTranslation("axisNeutral") || "0 (Neutral)";
      }
    }

    if (palBadge) {
      const badgeCls = risk > 50 ? "is-scam" : risk < 40 ? "is-genuine" : "is-neutral";
      palBadge.className = `palindrome-equilibrium-badge ${badgeCls}`;
      if (risk > 50) {
        palBadge.innerHTML = `🚨 ${getTranslation("wingScamTitle") || "Scam Risk"} (+${scamTilt}%)`;
      } else if (risk < 40) {
        palBadge.innerHTML = `✅ ${getTranslation("wingGenuineTitle") || "Genuine Govt Program"} (-${genuineTilt}%)`;
      } else {
        palBadge.innerHTML = `⚖️ ${getTranslation("axisEquilibrium") || "Neutral Equilibrium (0)"}`;
      }
    }

    // Summary Box
    if (summaryBox) {
      const boxCls = risk > 50 ? "is-scam" : risk < 40 ? "" : "is-caution";
      summaryBox.className = `palindrome-summary-box ${boxCls}`;
      let summaryText = "";
      let verdictTitle = "";
      if (risk > 50) {
        verdictTitle = getTranslation("plainDanger") || "⛔ DANGER — Fraudulent Scam Detected";
        summaryText = getTranslation("palScamWarning") || "🚨 Symmetric Equilibrium tilts heavily into Scam Threat. High risk of financial fraud or phishing.";
      } else if (risk < 40) {
        verdictTitle = getTranslation("plainSafe") || "✅ SAFE — Verified Authentic Program";
        summaryText = getTranslation("palGenuineConfirmed") || "✅ Symmetric Equilibrium tilts completely to Genuine. Information matches official Government records.";
      } else {
        verdictTitle = getTranslation("plainCaution") || "⚠️ CAUTION — Unconfirmed Claim";
        summaryText = getTranslation("palCautionWarning") || "⚠️ Symmetric Equilibrium is near neutral. Incomplete details; verify on official portal before proceeding.";
      }
      summaryBox.innerHTML = `<div><strong style="display:block; margin-bottom: 6px;">${verdictTitle}</strong><span style="font-size:0.86rem; font-weight:normal; opacity:0.95;">${summaryText}</span></div>`;
    }

    // Evidence Breakdown Columns
    if (trustCol) {
      const trustSignals = [];
      if (res.matchedScheme && res.matchedScheme.schemeName) {
        trustSignals.push(`🏛️ ${res.matchedScheme.schemeName}`);
      }
      if (res.matchedScheme && (res.matchedScheme.officialDomain || res.matchedScheme.officialUrl)) {
        const domain = res.matchedScheme.officialDomain || res.matchedScheme.officialUrl.replace(/^https?:\/\//, "").split("/")[0];
        trustSignals.push(`🌐 Official Domain: ${domain}`);
      }
      if (res.greenFlags && res.greenFlags.length > 0) {
        res.greenFlags.slice(0, 3).forEach(g => trustSignals.push(`✓ ${g}`));
      }
      if (trustSignals.length === 0) {
        trustSignals.push(`ℹ️ ${getTranslation("chartNotFound") || "No government database match"}`);
      }
      trustCol.innerHTML = trustSignals.map(t => `<div class="evidence-pill-item is-trust">${t}</div>`).join("");
    }

    if (threatCol) {
      const threatSignals = [];
      if (res.matchedPibScam && res.matchedPibScam.fakeClaim) {
        threatSignals.push(`🚨 PIB Flagged: ${res.matchedPibScam.fakeClaim.substring(0, 48)}...`);
      }
      if (res.redFlags && res.redFlags.length > 0) {
        res.redFlags.slice(0, 3).forEach(r => threatSignals.push(`⚠️ ${r}`));
      }
      if (res.urlAnalysis && res.urlAnalysis.isPhishing) {
        threatSignals.push(`⛔ Phishing / Unverified URL`);
      }
      if (threatSignals.length === 0) {
        threatSignals.push(`✓ ${getTranslation("zeroTriggers") || "0 Detected Threats"}`);
      }
      threatCol.innerHTML = threatSignals.map(t => `<div class="evidence-pill-item is-threat">${t}</div>`).join("");
    }

    // Visual Comparison Metrics Bar Charts
    const scamCount = (res.redFlags || []).length;
    const trustCount = (res.greenFlags || []).length;
    const hasOfficialMatch = !!(res.matchedScheme || res.matchedPibScam);

    const elScamCount = document.getElementById("metricScamCount");
    const elScamBar = document.getElementById("metricScamBar");
    const elTrustCount = document.getElementById("metricTrustCount");
    const elTrustBar = document.getElementById("metricTrustBar");
    const elOfficialStatus = document.getElementById("metricOfficialStatus");
    const elOfficialBar = document.getElementById("metricOfficialBar");

    if (elScamCount) elScamCount.textContent = `${scamCount} ${getTranslation("redFlagsBadge") || "Found"}`;
    if (elScamBar) {
      const pct = Math.min(100, Math.max(10, scamCount * 25));
      elScamBar.style.width = scamCount > 0 ? `${pct}%` : "0%";
    }

    if (elTrustCount) elTrustCount.textContent = `${trustCount} ${getTranslation("trustSignalsBadge") || "Found"}`;
    if (elTrustBar) {
      const pct = Math.min(100, Math.max(15, trustCount * 33));
      elTrustBar.style.width = trustCount > 0 ? `${pct}%` : "0%";
    }

    if (elOfficialStatus) {
      if (hasOfficialMatch) {
        elOfficialStatus.textContent = res.matchedPibScam ? (getTranslation("gtBadgePib") || "PIB Debunked") : (getTranslation("gtBadgeOfficial") || "Verified Match");
        elOfficialStatus.className = "metric-val text-green";
      } else {
        elOfficialStatus.textContent = getTranslation("chartNotFound") || "No Match";
        elOfficialStatus.className = "metric-val text-secondary";
      }
    }
    if (elOfficialBar) {
      elOfficialBar.style.width = hasOfficialMatch ? "100%" : "15%";
      elOfficialBar.style.backgroundColor = hasOfficialMatch ? "#10b981" : "#64748b";
    }

    // Official Government Verification Gateway
    const ovgName = document.getElementById("ovgPortalName");
    const ovgUrl = document.getElementById("ovgPortalUrl");
    const ovgBtn = document.getElementById("ovgActionBtn");

    let officialTargetUrl = "https://www.myscheme.gov.in";
    let officialTargetName = "myScheme National Central Portal";

    if (res.matchedScheme && res.matchedScheme.officialUrl) {
      officialTargetUrl = res.matchedScheme.officialUrl;
      officialTargetName = res.matchedScheme.schemeName || "Official Scheme Portal";
    } else if (res.advisory && res.advisory.officialPortalUrl && /\.(gov|nic)\.in/i.test(res.advisory.officialPortalUrl)) {
      officialTargetUrl = res.advisory.officialPortalUrl;
      officialTargetName = res.schemeName || "Official Government Portal";
    } else if (res.matchedPibScam && res.matchedPibScam.refUrl) {
      officialTargetUrl = res.matchedPibScam.refUrl;
      officialTargetName = "PIB Fact Check Official Notice";
    }

    if (ovgName) {
      ovgName.textContent = `${getTranslation("verifyScheme") || "Official Portal"}: ${officialTargetName}`;
    }
    if (ovgUrl) {
      ovgUrl.textContent = officialTargetUrl;
      ovgUrl.href = officialTargetUrl;
    }
    if (ovgBtn) {
      ovgBtn.href = officialTargetUrl;
      ovgBtn.textContent = getTranslation("btnOpenOfficial") || "🌐 Open Official Portal (.gov.in) ↗";
    }
  }

  // --------------------------------------------------------------------------
  // Shareable "Fake Alert" Graphic Card Generator (HTML5 Canvas 1200x630)
  // --------------------------------------------------------------------------
  const shareCardModal = document.getElementById("shareCardModal");
  const btnCloseShareCardModal = document.getElementById("btnCloseShareCardModal");
  const btnDownloadAlertImage = document.getElementById("btnDownloadAlertImage");
  const btnWhatsAppShareModal = document.getElementById("btnWhatsAppShareModal");
  const btnCopyAlertText = document.getElementById("btnCopyAlertText");
  const shareAlertCanvas = document.getElementById("shareAlertCanvas");

  function openShareCardModal(res) {
    if (!shareCardModal) return;
    shareCardModal.classList.remove("hidden");
    renderShareAlertCanvas(res);
  }

  if (btnCloseShareCardModal) {
    btnCloseShareCardModal.addEventListener("click", () => {
      shareCardModal.classList.add("hidden");
    });
  }

  function renderShareAlertCanvas(res) {
    if (!shareAlertCanvas) return;
    const ctx = shareAlertCanvas.getContext("2d");
    const w = shareAlertCanvas.width;
    const h = shareAlertCanvas.height;

    // 1. Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#081120");
    bgGrad.addColorStop(0.5, "#0d2137");
    bgGrad.addColorStop(1, "#050b14");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle cyber grid
    ctx.strokeStyle = "rgba(14, 165, 233, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 2. Indian National Tiranga Ribbon at Top
    ctx.fillStyle = "#ff9933";
    ctx.fillRect(0, 0, w, 12);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 12, w, 12);
    ctx.fillStyle = "#138808";
    ctx.fillRect(0, 24, w, 12);

    // 3. InfoShield Header Emblem & Title
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 26px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("🛡️ INFOSHIELD • NATIONAL CITIZEN MISINFORMATION DEFENSE", 50, 78);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("सत्यमेव जयते • Digital India • Verified Government Scheme Intelligence", 50, 105);

    // 4. Alert Banner Box (Dynamic Red or Green)
    const isFake = res.verdict === "POTENTIALLY_FAKE";
    const isGenuine = res.verdict === "LIKELY_GENUINE";

    const bannerY = 125;
    const bannerH = 75;
    const bannerGrad = ctx.createLinearGradient(50, bannerY, w - 100, bannerY);

    if (isFake) {
      bannerGrad.addColorStop(0, "#dc2626");
      bannerGrad.addColorStop(1, "#991b1b");
    } else if (isGenuine) {
      bannerGrad.addColorStop(0, "#059669");
      bannerGrad.addColorStop(1, "#047857");
    } else {
      bannerGrad.addColorStop(0, "#d97706");
      bannerGrad.addColorStop(1, "#b45309");
    }

    ctx.fillStyle = bannerGrad;
    ctx.beginPath();
    ctx.roundRect(50, bannerY, w - 100, bannerH, 12);
    ctx.fill();

    // Banner Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px 'Segoe UI', Arial, sans-serif";
    const bannerTitle = isFake
      ? "🚨 PIB & INFOSHIELD FACT CHECK: FAKE SCHEME ALERT"
      : (isGenuine ? "✅ VERIFIED OFFICIAL GOVERNMENT SCHEME ADVISORY" : "⚠️ UNVERIFIED CLAIM: NEEDS OFFICIAL VERIFICATION");
    ctx.fillText(bannerTitle, 75, bannerY + 48);

    // 5. Claimed Message Snippet Box
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.roundRect(50, 220, w - 100, 110, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 18px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("📌 CLAIM RECEIVED BY CITIZENS (WHATSAPP / SMS):", 75, 250);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "italic 17px 'Segoe UI', Arial, sans-serif";
    const rawSnippet = (res.rawInput || "").replace(/\n/g, " ").substring(0, 140) + "...";
    ctx.fillText(`"${rawSnippet}"`, 75, 282);

    // Risk Meter & Multiplier Pill
    ctx.fillStyle = isFake ? "#ef4444" : "#10b981";
    ctx.font = "bold 20px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(`Calculated Fraud Risk Index: ${res.riskScore}% (${res.verdictTitle})`, 75, 312);

    // 6. Two-Column Evidence and Ground Truth Section
    // Left Box: Red Flags Caught
    const colW = (w - 120) / 2;
    ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
    ctx.strokeStyle = isFake ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)";
    ctx.beginPath();
    ctx.roundRect(50, 345, colW, 195, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isFake ? "#f87171" : "#34d399";
    ctx.font = "bold 20px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(isFake ? "🚨 Red Flags Identified:" : "✅ Trust Signals Verified:", 70, 380);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "16px 'Segoe UI', Arial, sans-serif";
    let flagsY = 415;
    const reasons = res.explainabilityReasons.slice(0, 3);
    for (const r of reasons) {
      const truncated = r.length > 55 ? r.substring(0, 52) + "..." : r;
      ctx.fillText(`• ${truncated}`, 75, flagsY);
      flagsY += 32;
    }

    // Right Box: Official Ground Truth & Safe Protocol
    ctx.fillStyle = "rgba(14, 165, 233, 0.08)";
    ctx.strokeStyle = "rgba(14, 165, 233, 0.4)";
    ctx.beginPath();
    ctx.roundRect(50 + colW + 20, 345, colW, 195, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 20px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("🏛️ Official Government Ground Truth:", 50 + colW + 40, 380);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "16px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(`• Verified Portal: ${res.advisory.officialPortalUrl}`, 50 + colW + 45, 415);
    ctx.fillText("• Authentic central welfare NEVER demands registration fees via UPI.", 50 + colW + 45, 447);
    ctx.fillText("• Subsidies are credited straight to bank accounts via Direct Benefit Transfer.", 50 + colW + 45, 479);
    ctx.fillText("• Never share OTPs or install APK files from unknown senders.", 50 + colW + 45, 511);

    // 7. Footer Bar: National Helplines & Watermark
    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.fillRect(0, 555, w, 75);

    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 18px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("📞 Report Fraud Immediately: National Cyber Helpline 1930  |  cybercrime.gov.in", 50, 595);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "15px 'Segoe UI', Arial, sans-serif";
    ctx.fillText("Generated by InfoShield AI • ABESIT Ideathon 2026", w - 420, 595);
  }

  // Download Alert Image PNG
  if (btnDownloadAlertImage) {
    btnDownloadAlertImage.addEventListener("click", () => {
      if (!shareAlertCanvas) return;
      const link = document.createElement("a");
      link.download = `InfoShield_Fake_Alert_${Date.now()}.png`;
      link.href = shareAlertCanvas.toDataURL("image/png");
      link.click();
    });
  }

  // WhatsApp Share Modal Button
  if (btnWhatsAppShareModal) {
    btnWhatsAppShareModal.addEventListener("click", () => {
      if (!lastAnalysisResult) return;
      const res = lastAnalysisResult;
      const msg = `🚨 *InfoShield Fact-Check Warning Alert* 🚨\n\n⚠️ *Claim:* "${res.rawInput.substring(0, 100).replace(/\n/g, ' ')}..."\n\n🛡️ *Verdict:* ${res.verdictTitle} (${res.riskScore}% Risk)\n\n🏛️ *Official Portal:* ${res.advisory.officialPortalUrl}\n📞 *Cyber Helpline:* 1930 | cybercrime.gov.in\n\n_Do not share or pay money! Verified via InfoShield AI._`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
    });
  }

  // Copy Alert Text
  if (btnCopyAlertText) {
    btnCopyAlertText.addEventListener("click", () => {
      if (lastAnalysisResult) copyShareableFactCheck(lastAnalysisResult);
    });
  }

  // --------------------------------------------------------------------------
  // Copy Shareable Fact-Check Message for WhatsApp / Social Media
  // --------------------------------------------------------------------------
  function copyShareableFactCheck(res) {
    const schemeName = res.matchedScheme ? res.matchedScheme.name : "Government Scheme Claim";
    let statusEmoji = res.verdict === "LIKELY_GENUINE" ? "✅ [GENUINE]" : (res.verdict === "POTENTIALLY_FAKE" ? "🚨 [FAKE / SCAM ALERT]" : "⚠️ [UNVERIFIED CLAIM]");

    const factCheckText = `
${statusEmoji} InfoShield Fact-Check Advisory:
━━━━━━━━━━━━━━━━━━━━
📌 Claim: ${res.rawInput.substring(0, 100).replace(/\n/g, ' ')}...
🛡️ Verdict: ${res.verdictTitle} (Risk Score: ${res.riskScore}%)

🔍 Key Findings:
${res.explainabilityReasons.slice(0, 3).map(r => `• ${r}`).join('\n')}

🏛️ Official Verified Guidance:
${res.advisory.actionPoints.slice(0, 3).join('\n')}

🌐 Official Scheme Portal: ${res.advisory.officialPortalUrl}
📞 Cyber Fraud Helpline: 1930 | cybercrime.gov.in
━━━━━━━━━━━━━━━━━━━━
Verified via InfoShield (AI Citizen Safety Platform)
`.trim();

    navigator.clipboard.writeText(factCheckText).then(() => {
      alert("Fact-Check Advisory copied to clipboard! You can now paste and share this in WhatsApp groups to warn others.");
    }).catch(() => {
      alert(factCheckText);
    });
  }

  // --------------------------------------------------------------------------
  // Real URL Auditor Implementation
  // --------------------------------------------------------------------------
  function auditUrlInput(inputUrl) {
    if (!inputUrl || !inputUrl.trim()) {
      alert("Please enter a website URL to audit.");
      return;
    }

    const cleanUrl = inputUrl.trim();
    let parsedHost = "";
    let parsedProto = "http:";
    try {
      const parsed = new URL(cleanUrl.startsWith("http") ? cleanUrl : "https://" + cleanUrl);
      parsedHost = parsed.hostname.toLowerCase();
      parsedProto = parsed.protocol;
    } catch (e) {
      parsedHost = cleanUrl.replace(/https?:\/\//i, "").split("/")[0].toLowerCase();
    }

    // Call analyzer's real URL auditor
    const audits = analyzer.analyzeUrls([{ fullUrl: cleanUrl, hostname: parsedHost, protocol: parsedProto, isOfficialGov: analyzer.isGovDomain(parsedHost) }]);
    const audit = audits[0];

    // Cross-reference official schemes
    let matchedScheme = null;
    for (const scheme of OFFICIAL_SCHEMES_DB) {
      if (parsedHost.includes(scheme.officialDomain) || scheme.keywords.some(k => cleanUrl.toLowerCase().includes(k))) {
        matchedScheme = scheme;
        break;
      }
    }

    const resultBox = document.getElementById("urlAuditResult");
    if (!resultBox) return;

    resultBox.classList.remove("hidden");
    const isCritical = audit.riskLevel === "CRITICAL";
    const isGov = audit.isGov;

    resultBox.innerHTML = `
      <div class="url-audit-card ${isGov ? 'is-gov-safe' : (isCritical ? 'is-danger-trap' : 'is-warning-unverified')}">
        <div class="audit-card-top">
          <div class="audit-badge-pill ${isGov ? 'badge-green' : (isCritical ? 'badge-red' : 'badge-amber')}">
            ${audit.badge}
          </div>
          <span class="audit-host-name">${audit.hostname}</span>
          <span class="audit-proto-pill ${audit.isInsecureHttp ? 'proto-insecure' : 'proto-secure'}">
            ${audit.isInsecureHttp ? '⚠️ Insecure HTTP' : '🔒 Secure HTTPS'}
          </span>
        </div>

        <div class="audit-checklist-grid">
          <div class="audit-check-item ${isGov ? 'check-pass' : 'check-fail'}">
            <span class="check-icon">${isGov ? '✅' : '❌'}</span>
            <div class="check-text">
              <strong>Official .gov.in / .nic.in TLD:</strong>
              <span>${isGov ? 'Verified authentic Government of India namespace' : 'Not an official government domain'}</span>
            </div>
          </div>

          <div class="audit-check-item ${audit.isSubdomainSpoofing ? 'check-fail' : 'check-pass'}">
            <span class="check-icon">${audit.isSubdomainSpoofing ? '🚨' : '✅'}</span>
            <div class="check-text">
              <strong>Subdomain Spoofing Audit:</strong>
              <span>${audit.isSubdomainSpoofing ? 'High deception! Uses "gov.in" as subdomain on unauthorized host' : 'No subdomain deception detected'}</span>
            </div>
          </div>

          <div class="audit-check-item ${audit.isShortened ? 'check-fail' : 'check-pass'}">
            <span class="check-icon">${audit.isShortened ? '⚠️' : '✅'}</span>
            <div class="check-text">
              <strong>URL Shortener Cloaking:</strong>
              <span>${audit.isShortened ? 'Concealed destination link (bit.ly / tinyurl)' : 'Direct destination URL'}</span>
            </div>
          </div>

          <div class="audit-check-item ${audit.isSuspiciousTld ? 'check-fail' : 'check-pass'}">
            <span class="check-icon">${audit.isSuspiciousTld ? '🚨' : '✅'}</span>
            <div class="check-text">
              <strong>Disposable / Phishing TLD Check:</strong>
              <span>${audit.isSuspiciousTld ? 'Uses suspicious TLD (.online, .xyz, .top) commonly used in fraud' : 'Standard top-level domain'}</span>
            </div>
          </div>
        </div>

        <div class="audit-details-callout">
          <strong>Security Assessment:</strong>
          <ul>
            ${audit.details.map(d => `<li>${d}</li>`).join('')}
          </ul>
        </div>

        ${matchedScheme ? `
          <div class="audit-groundtruth-match">
            <span>Official Government Portal for this Scheme:</span>
            <a href="${matchedScheme.officialUrl}" target="_blank" rel="noopener noreferrer" class="link-official">
              ${matchedScheme.officialDomain} (${matchedScheme.name}) ↗
            </a>
          </div>
        ` : ''}

        <div class="audit-actions-row">
          <button type="button" class="btn btn-primary btn-sm" id="btnAuditRunScan">
            ⚡ Run Full AI Message Scan with this Link
          </button>
          <button type="button" class="btn btn-danger btn-sm" onclick="triggerCyberModalForDomain('${audit.hostname}')">
            🚨 Report Suspicious Domain on 1930
          </button>
        </div>
      </div>
    `;

    // Wire scan button inside audit result
    const btnAuditRunScan = document.getElementById("btnAuditRunScan");
    if (btnAuditRunScan) {
      btnAuditRunScan.onclick = () => {
        // Switch to Message tab and set content
        const tabMsgBtn = document.getElementById("tab-message-btn");
        if (tabMsgBtn) tabMsgBtn.click();
        if (messageInput) {
          messageInput.value = `Official Scheme Verification Request: Apply for government scheme benefits at ${cleanUrl}. Check status and submit application.`;
        }
        runFullScan(messageInput.value);
      };
    }

    resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  if (btnAuditUrl) {
    btnAuditUrl.addEventListener("click", () => {
      if (urlInput) auditUrlInput(urlInput.value);
    });
  }

  if (urlInput) {
    urlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        auditUrlInput(urlInput.value);
      }
    });
  }

  // Wire preset chips in URL Auditor tab
  document.querySelectorAll(".url-chip[data-url]").forEach(chip => {
    chip.addEventListener("click", () => {
      const url = chip.getAttribute("data-url");
      if (urlInput) urlInput.value = url;
      auditUrlInput(url);
    });
  });

  // --------------------------------------------------------------------------
  // Interactive WhatsApp Bot Simulator
  // --------------------------------------------------------------------------
  const waChatBody = document.getElementById("waChatBody");
  const waInputText = document.getElementById("waInputText");
  const btnWaSend = document.getElementById("btnWaSend");

  function sendWaMessage(text) {
    if (!text || !text.trim() || !waChatBody) return;
    const clean = text.trim();

    // 1. Append User Outgoing Message Bubble
    const userRow = document.createElement("div");
    userRow.className = "wa-message-row outgoing";
    userRow.innerHTML = `
      <div class="wa-bubble wa-bubble-outgoing">
        <p>${clean.replace(/\n/g, '<br>')}</p>
        <span class="wa-msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓</span>
      </div>
    `;
    waChatBody.appendChild(userRow);
    if (waInputText) waInputText.value = "";
    waChatBody.scrollTop = waChatBody.scrollHeight;

    // 2. Append Typing Indicator Bubble
    const typingRow = document.createElement("div");
    typingRow.className = "wa-message-row incoming";
    typingRow.id = "waTypingIndicator";
    typingRow.innerHTML = `
      <div class="wa-bubble wa-bubble-incoming wa-typing-bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span style="font-size: 0.8rem; margin-left: 8px; color: var(--text-muted);">InfoShield AI is cross-referencing official GoI databases...</span>
      </div>
    `;
    waChatBody.appendChild(typingRow);
    waChatBody.scrollTop = waChatBody.scrollHeight;

    // 3. Run Analysis Pipeline (Using Backend API when connected)
    (async () => {
      let res = null;
      if (window.apiClient && window.apiClient.isBackendOnline) {
        try {
          const apiRes = await window.apiClient.botChat(clean);
          if (apiRes && apiRes.success && apiRes.analysis) {
            res = apiRes.analysis;
          }
        } catch (e) {
          console.warn("Backend bot chat error, fallback to local:", e);
        }
      }

      if (!res) {
        res = analyzer.analyze(clean);
      }

      const typingEl = document.getElementById("waTypingIndicator");
      if (typingEl) typingEl.remove();

      const isFake = res.verdict === "POTENTIALLY_FAKE";
      const isGenuine = res.verdict === "LIKELY_GENUINE";

      const botRow = document.createElement("div");
      botRow.className = "wa-message-row incoming";
      botRow.innerHTML = `
        <div class="wa-bubble wa-bubble-incoming wa-bubble-verdict ${isFake ? 'wa-verdict-fake' : (isGenuine ? 'wa-verdict-genuine' : 'wa-verdict-warning')}">
          <div class="wa-verdict-header">
            <span class="wa-shield-icon">${isFake ? '🚨' : (isGenuine ? '✅' : '⚠️')}</span>
            <div class="wa-verdict-title-box">
              <strong class="wa-verdict-main-title">${isFake ? 'FAKE SCHEME / SCAM ALERT' : (isGenuine ? 'VERIFIED OFFICIAL SCHEME' : 'UNVERIFIED NOTICE')}</strong>
              <span class="wa-risk-pill ${isFake ? 'pill-red' : (isGenuine ? 'pill-green' : 'pill-amber')}">Fraud Risk: ${res.riskScore}%</span>
            </div>
          </div>

          ${res.benefitMismatch ? `
            <div class="wa-mismatch-callout">
              ⚖️ <strong>Benefit Mismatch Caught:</strong> Message claims ₹${res.benefitMismatch.claimedAmount.toLocaleString("en-IN")}, but authentic ${res.benefitMismatch.schemeName} limit is ₹${res.benefitMismatch.officialMax.toLocaleString("en-IN")}.
            </div>
          ` : ''}

          <p class="wa-verdict-summary">
            <strong>Key Finding:</strong> ${res.primaryTrigger}
          </p>

          <div class="wa-groundtruth-row">
            <span>🏛️ Official Portal:</span>
            <a href="${res.advisory.officialPortalUrl}" target="_blank" rel="noopener noreferrer">${res.advisory.officialPortalUrl}</a>
          </div>

          <div class="wa-actions-button-row">
            <button type="button" class="wa-btn-action wa-btn-share" onclick="window.shareFromWaBot('${encodeURIComponent(clean)}')">
              📱 Forward Alert to Group
            </button>
            <button type="button" class="wa-btn-action wa-btn-inspect" onclick="window.viewInVerifierFromWa('${encodeURIComponent(clean)}')">
              🔍 Open Full Audit
            </button>
          </div>

          <span class="wa-msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • InfoShield AI</span>
        </div>
      `;
      waChatBody.appendChild(botRow);
      waChatBody.scrollTop = waChatBody.scrollHeight;
      playTone(isFake ? "fake" : (isGenuine ? "genuine" : "scan"));
    })();
  }

  window.shareFromWaBot = function(encodedText) {
    const raw = decodeURIComponent(encodedText);
    const res = analyzer.analyze(raw);
    copyShareableFactCheck(res);
  };

  window.viewInVerifierFromWa = function(encodedText) {
    const raw = decodeURIComponent(encodedText);
    const tabMsgBtn = document.getElementById("tab-message-btn");
    if (tabMsgBtn) tabMsgBtn.click();
    if (messageInput) messageInput.value = raw;
    runFullScan(raw);
  };

  if (btnWaSend) {
    btnWaSend.addEventListener("click", () => {
      if (waInputText) sendWaMessage(waInputText.value);
    });
  }

  if (waInputText) {
    waInputText.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendWaMessage(waInputText.value);
      }
    });
  }

  // Quick Prompt Chips in WhatsApp Simulator
  document.querySelectorAll(".wa-chip-btn[data-text]").forEach(chip => {
    chip.addEventListener("click", () => {
      const text = chip.getAttribute("data-text");
      sendWaMessage(text);
    });
  });

  // --------------------------------------------------------------------------
  // Cyber Crime Report Modal & Auto-Generated Template
  // --------------------------------------------------------------------------
  function openCyberModal(res) {
    cyberReportModal.classList.remove("hidden");
    cyberReportText.value = res.cyberReportText || analyzer.generateCyberReport(
      res.rawInput,
      res.entities,
      res,
      { matchedScheme: res.matchedScheme, matchedPibScam: res.matchedPibScam },
      { redFlags: res.redFlags }
    );
  }

  window.triggerCyberModalForDomain = function(domain) {
    cyberReportModal.classList.remove("hidden");
    cyberReportText.value = `
INCIDENT DETAILS FOR NATIONAL CYBER CRIME REPORTING PORTAL (cybercrime.gov.in / Helpline: 1930)
=========================================================================================
Incident Category: Phishing & Fraudulent Government Impersonation Domain
Reported Domain: ${domain}
Details: This unauthorized third-party domain is falsely impersonating Government of India welfare schemes.
Date: ${new Date().toLocaleString("en-IN")}
Investigated By: InfoShield AI Citizen Security Platform
=========================================================================================
`.trim();
  };

  if (btnCloseCyberModal) {
    btnCloseCyberModal.addEventListener("click", () => {
      cyberReportModal.classList.add("hidden");
    });
  }

  if (btnCopyCyberReport) {
    btnCopyCyberReport.addEventListener("click", () => {
      navigator.clipboard.writeText(cyberReportText.value).then(() => {
        alert("Cyber Crime incident complaint template copied! Paste directly into cybercrime.gov.in or read aloud to 1930 Helpline operator.");
      });
    });
  }

  // --------------------------------------------------------------------------
  // Project & Academic Modal Listeners
  // --------------------------------------------------------------------------
  if (btnNavProjectInfo) {
    btnNavProjectInfo.addEventListener("click", (e) => {
      e.preventDefault();
      projectInfoModal.classList.remove("hidden");
    });
  }

  if (btnCloseProjectModal) {
    btnCloseProjectModal.addEventListener("click", () => {
      projectInfoModal.classList.add("hidden");
    });
  }

  // --------------------------------------------------------------------------
  // Schemes Directory Rendering & Search
  // --------------------------------------------------------------------------
  function renderSchemesDirectory(filterText = "", category = "all") {
    if (!schemesListContainer) return;

    const lowerQuery = filterText.toLowerCase();
    const filtered = OFFICIAL_SCHEMES_DB.filter(scheme => {
      const matchesCategory = category === "all" || scheme.category.toLowerCase().includes(category.toLowerCase());
      const matchesSearch = !lowerQuery ||
        scheme.name.toLowerCase().includes(lowerQuery) ||
        scheme.shortName.toLowerCase().includes(lowerQuery) ||
        scheme.category.toLowerCase().includes(lowerQuery) ||
        scheme.keywords.some(k => k.toLowerCase().includes(lowerQuery));

      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      schemesListContainer.innerHTML = `
        <div class="no-schemes-found">
          <p>${getTranslation("noSchemesFound")}</p>
        </div>
      `;
      return;
    }

    schemesListContainer.innerHTML = filtered.map(scheme => `
      <div class="scheme-directory-card">
        <div class="scheme-directory-badge">${scheme.category}</div>
        <h4 class="scheme-directory-title">${scheme.name}</h4>
        <p class="scheme-directory-ministry">🏛️ ${scheme.ministry}</p>
        <p class="scheme-directory-benefit">${scheme.benefitSummary}</p>
        <div class="scheme-directory-footer">
          <span class="official-domain-tag">🛡️ ${scheme.officialDomain}</span>
          <a href="${scheme.officialUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">
            ${getTranslation("visitPortalBtn")}
          </a>
        </div>
      </div>
    `).join("");
  }

  if (schemeSearchInput) {
    schemeSearchInput.addEventListener("input", (e) => {
      renderSchemesDirectory(e.target.value, schemeCategoryFilter ? schemeCategoryFilter.value : "all");
    });
  }

  if (schemeCategoryFilter) {
    schemeCategoryFilter.addEventListener("change", (e) => {
      renderSchemesDirectory(schemeSearchInput ? schemeSearchInput.value : "", e.target.value);
    });
  }

  // --------------------------------------------------------------------------
  // PIB Debunked Scams Rendering
  // --------------------------------------------------------------------------
  function renderPibAlerts() {
    if (!pibAlertsContainer) return;

    pibAlertsContainer.innerHTML = PIB_FACT_CHECKS.map(pib => `
      <div class="pib-card">
        <div class="pib-badge badge-red">🚨 ${pib.pibVerdict}</div>
        <h4 class="pib-title">${pib.title}</h4>
        <p class="pib-summary">${pib.pibSummary}</p>
        <div class="pib-proof">
          <strong>${getTranslation("pibFactCheckLabel")}</strong> ${pib.debunkProof}
        </div>
        <div class="pib-footer">
          <span class="pib-type">${getTranslation("pibScamTypeLabel")} ${pib.scamType}</span>
          <a href="${pib.refUrl}" target="_blank" rel="noopener noreferrer" class="link-pib">${getTranslation("pibPortalLink")}</a>
        </div>
      </div>
    `).join("");
  }

  // --------------------------------------------------------------------------
  // Multilingual Handler
  // --------------------------------------------------------------------------
  function getTranslation(key) {
    const dict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  }

  function applyTranslations(lang) {
    currentLanguage = lang;
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    document.documentElement.lang = lang === "hi-latn" ? "hi-Latn" : lang;
    try { localStorage.setItem("infoshield-lang", lang); } catch (e) { /* storage unavailable */ }

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.innerHTML = dict[key];
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key]) {
        el.placeholder = dict[key];
      }
    });

    document.querySelectorAll("[data-i18n-title]").forEach(el => {
      const key = el.getAttribute("data-i18n-title");
      if (dict[key]) {
        el.title = dict[key];
        el.setAttribute("aria-label", dict[key]);
      }
    });

    // Re-render dynamic, JS-generated sections in the new language
    renderSchemesDirectory(schemeSearchInput ? schemeSearchInput.value : "", schemeCategoryFilter ? schemeCategoryFilter.value : "all");
    renderPibAlerts();
    if (typeof updateAuthUI === "function") updateAuthUI();
    if (lastAnalysisResult) {
      renderResults(lastAnalysisResult);
    }
  }

  if (langSelect) {
    langSelect.addEventListener("change", (e) => {
      applyTranslations(e.target.value);
    });
  }

  // Restore the citizen's last chosen language (deferred until the whole UI is initialised)
  setTimeout(() => {
    try {
      const savedLang = localStorage.getItem("infoshield-lang");
      if (savedLang && TRANSLATIONS[savedLang] && langSelect) {
        langSelect.value = savedLang;
        applyTranslations(savedLang);
      }
    } catch (e) { /* storage unavailable */ }
  }, 0);

  // --------------------------------------------------------------------------
  // Dark / Light theme switch (persisted)
  // --------------------------------------------------------------------------
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("infoshield-theme", theme); } catch (e) { /* storage unavailable */ }
    document.querySelectorAll(".theme-opt").forEach(btn => {
      const active = btn.dataset.themeChoice === theme;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  document.querySelectorAll(".theme-opt").forEach(btn => {
    btn.addEventListener("click", () => setTheme(btn.dataset.themeChoice));
  });
  setTheme(document.documentElement.getAttribute("data-theme") || "dark");

  // --------------------------------------------------------------------------
  // Backend API Integration: Health Check, Citizen Auth & Database Incident Filing
  // --------------------------------------------------------------------------
  const backendStatusPill = document.getElementById("backendStatusPill");
  const backendStatusText = document.getElementById("backendStatusText");
  const backendStatusDot = document.getElementById("backendStatusDot");
  const btnCitizenAuth = document.getElementById("btnCitizenAuth");
  const navAuthLabel = document.getElementById("navAuthLabel");
  const citizenAuthModal = document.getElementById("citizenAuthModal");
  const btnCloseAuthModal = document.getElementById("btnCloseAuthModal");

  // Check backend health
  if (window.apiClient) {
    window.apiClient.checkHealth().then(res => {
      if (res.online && backendStatusPill) {
        backendStatusPill.classList.remove("offline");
        if (backendStatusText) backendStatusText.textContent = "Flask & MySQL Online";
        if (backendStatusDot) backendStatusDot.style.background = "#10b981";
      } else if (backendStatusPill) {
        backendStatusPill.classList.add("offline");
        if (backendStatusText) backendStatusText.textContent = "Offline (Local Engine)";
        if (backendStatusDot) backendStatusDot.style.background = "#ef4444";
      }
    });
  }

  // --------------------------------------------------------------------------
  // Citizen Authentication & Profile Management
  // --------------------------------------------------------------------------
  const navAuthAvatar = document.getElementById("navAuthAvatar");
  const navAuthSub = document.getElementById("navAuthSub");
  const userProfileAvatar = document.getElementById("userProfileAvatar");
  const authComplaintCount = document.getElementById("authComplaintCount");

  // Auth UI state
  function updateAuthUI() {
    const user = window.apiClient ? window.apiClient.getCurrentUser() : null;
    const authGuestView = document.getElementById("authGuestView");
    const authUserView = document.getElementById("authUserView");

    if (user) {
      const initials = (user.name || "Citizen").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
      if (navAuthAvatar) navAuthAvatar.textContent = initials;
      if (navAuthLabel) navAuthLabel.textContent = user.name.split(" ")[0];
      if (navAuthSub) navAuthSub.textContent = getTranslation("userRoleBadge");

      if (authGuestView) authGuestView.classList.add("hidden");
      if (authUserView) {
        authUserView.classList.remove("hidden");
        const nameEl = document.getElementById("userProfileName");
        const emailEl = document.getElementById("userProfileEmail");
        const roleEl = document.getElementById("userProfileRole");
        if (nameEl) nameEl.textContent = user.name;
        if (emailEl) emailEl.textContent = user.email;
        if (roleEl) roleEl.textContent = user.role || "Citizen";
        if (userProfileAvatar) userProfileAvatar.textContent = initials;
        loadUserComplaints();
      }
    } else {
      if (navAuthAvatar) navAuthAvatar.textContent = "👤";
      if (navAuthLabel) navAuthLabel.textContent = getTranslation("navSignIn");
      if (navAuthSub) navAuthSub.textContent = getTranslation("navCitizenPortal");
      if (authGuestView) authGuestView.classList.remove("hidden");
      if (authUserView) authUserView.classList.add("hidden");
    }
  }

  async function loadUserComplaints() {
    const listEl = document.getElementById("userComplaintsList");
    if (!listEl) return;
    try {
      let reports = [];
      if (window.apiClient) {
        const res = await window.apiClient.getReports(20);
        if (res.success && res.data) reports = res.data;
      }
      if (authComplaintCount) {
        authComplaintCount.textContent = reports.length > 0 ? `${reports.length} Filed` : "0 Filed";
      }
      if (reports.length > 0) {
        listEl.innerHTML = reports.map(r => `
          <div class="complaint-card-item">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span class="complaint-ack-tag">${r.cyber_ack_number || 'PENDING-ACK'}</span>
              <span style="font-size: 0.75rem; color: #f59e0b; font-weight: 700;">${r.status || 'UNDER_REVIEW'}</span>
            </div>
            <strong style="color: #fff; font-size: 0.88rem; display: block;">${r.scam_title}</strong>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${r.category} • ${r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent'}</span>
          </div>
        `).join("");
      } else {
        listEl.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; padding: 12px 0;">No scam complaints filed under this account yet. Verify a scam and click "Log Incident to Database" to track here!</p>`;
      }
    } catch (e) {
      listEl.innerHTML = `<p style="color: #f87171; font-size: 0.85rem;">Could not load complaints from server.</p>`;
    }
  }

  if (btnCitizenAuth) {
    btnCitizenAuth.addEventListener("click", () => {
      if (citizenAuthModal) {
        citizenAuthModal.classList.remove("hidden");
        updateAuthUI();
      }
    });
  }

  if (btnCloseAuthModal) {
    btnCloseAuthModal.addEventListener("click", () => {
      if (citizenAuthModal) citizenAuthModal.classList.add("hidden");
    });
  }

  // Password Visibility Toggles
  const btnToggleLoginPass = document.getElementById("btnToggleLoginPass");
  if (btnToggleLoginPass) {
    btnToggleLoginPass.addEventListener("click", () => {
      const input = document.getElementById("loginPassword");
      if (!input) return;
      const isPass = input.type === "password";
      input.type = isPass ? "text" : "password";
      btnToggleLoginPass.textContent = isPass ? "🙈" : "👁️";
    });
  }

  const btnToggleRegPass = document.getElementById("btnToggleRegPass");
  if (btnToggleRegPass) {
    btnToggleRegPass.addEventListener("click", () => {
      const input = document.getElementById("regPassword");
      if (!input) return;
      const isPass = input.type === "password";
      input.type = isPass ? "text" : "password";
      btnToggleRegPass.textContent = isPass ? "🙈" : "👁️";
    });
  }

  // 1-Click Demo Citizen Login
  const btnDemoLogin = document.getElementById("btnDemoLogin");
  if (btnDemoLogin) {
    btnDemoLogin.addEventListener("click", () => {
      const emailInput = document.getElementById("loginEmail");
      const passInput = document.getElementById("loginPassword");
      if (emailInput) emailInput.value = "demo@infoshield.gov.in";
      if (passInput) passInput.value = "DemoCitizen123!";
      if (btnSubmitLogin) btnSubmitLogin.click();
    });
  }

  // Auth tabs (Login vs Register)
  const tabAuthLogin = document.getElementById("tabAuthLogin");
  const tabAuthRegister = document.getElementById("tabAuthRegister");
  const formLogin = document.getElementById("formLogin");
  const formRegister = document.getElementById("formRegister");
  const authStatusAlert = document.getElementById("authStatusAlert");

  if (tabAuthLogin && tabAuthRegister) {
    tabAuthLogin.addEventListener("click", () => {
      tabAuthLogin.classList.add("active");
      tabAuthRegister.classList.remove("active");
      if (formLogin) formLogin.classList.remove("hidden");
      if (formRegister) formRegister.classList.add("hidden");
      if (authStatusAlert) authStatusAlert.classList.add("hidden");
    });

    tabAuthRegister.addEventListener("click", () => {
      tabAuthRegister.classList.add("active");
      tabAuthLogin.classList.remove("active");
      if (formRegister) formRegister.classList.remove("hidden");
      if (formLogin) formLogin.classList.add("hidden");
      if (authStatusAlert) authStatusAlert.classList.add("hidden");
    });
  }

  // Submit Login
  const btnSubmitLogin = document.getElementById("btnSubmitLogin");
  if (btnSubmitLogin) {
    btnSubmitLogin.addEventListener("click", async () => {
      const email = (document.getElementById("loginEmail").value || "").trim();
      const password = (document.getElementById("loginPassword").value || "").trim();
      if (!email || !password) {
        showAuthAlert("Please provide both email and password.", "error");
        return;
      }
      try {
        btnSubmitLogin.disabled = true;
        btnSubmitLogin.textContent = "Signing In...";
        const res = await window.apiClient.login(email, password);
        if (res.success) {
          showAuthAlert("Login successful! Welcome back to Citizen Portal.", "success");
          setTimeout(() => {
            updateAuthUI();
          }, 500);
        }
      } catch (err) {
        // Fallback for offline / network issues to ensure smooth demonstration
        if (err.message && (err.message.includes("Failed to fetch") || err.message.includes("Network") || err.message.includes("Offline"))) {
          const fallbackUser = { id: 1, name: "Aakansha Sharma", email: email, role: "citizen" };
          localStorage.setItem("infoshield_token", "mock_demo_jwt_token");
          localStorage.setItem("infoshield_user", JSON.stringify(fallbackUser));
          showAuthAlert("Signed in successfully (Offline Citizen Mode)", "success");
          setTimeout(() => updateAuthUI(), 500);
        } else {
          showAuthAlert(err.message || "Login failed. Check your email & password.", "error");
        }
      } finally {
        btnSubmitLogin.disabled = false;
        btnSubmitLogin.innerHTML = `<span>⚡</span> Sign In to Citizen Portal`;
      }
    });
  }

  // Submit Register
  const btnSubmitRegister = document.getElementById("btnSubmitRegister");
  if (btnSubmitRegister) {
    btnSubmitRegister.addEventListener("click", async () => {
      const name = (document.getElementById("regName").value || "").trim();
      const email = (document.getElementById("regEmail").value || "").trim();
      const password = (document.getElementById("regPassword").value || "").trim();
      if (!name || !email || !password) {
        showAuthAlert("All fields are required.", "error");
        return;
      }
      if (password.length < 8) {
        showAuthAlert("Password must be at least 8 characters.", "error");
        return;
      }
      try {
        btnSubmitRegister.disabled = true;
        btnSubmitRegister.textContent = "Creating Account...";
        const res = await window.apiClient.register(name, email, password);
        if (res.success) {
          showAuthAlert("Account created successfully! Welcome.", "success");
          setTimeout(() => {
            updateAuthUI();
          }, 500);
        }
      } catch (err) {
        // Fallback for demo
        if (err.message && (err.message.includes("Failed to fetch") || err.message.includes("Network"))) {
          const fallbackUser = { id: Date.now(), name: name, email: email, role: "citizen" };
          localStorage.setItem("infoshield_token", "mock_demo_jwt_token");
          localStorage.setItem("infoshield_user", JSON.stringify(fallbackUser));
          showAuthAlert("Account registered (Offline Citizen Mode)", "success");
          setTimeout(() => updateAuthUI(), 500);
        } else {
          showAuthAlert(err.message || "Registration failed.", "error");
        }
      } finally {
        btnSubmitRegister.disabled = false;
        btnSubmitRegister.innerHTML = `<span>🛡️</span> Create Citizen Account & Sign In`;
      }
    });
  }

  // Logout
  const btnAuthLogout = document.getElementById("btnAuthLogout");
  if (btnAuthLogout) {
    btnAuthLogout.addEventListener("click", () => {
      if (window.apiClient) window.apiClient.logout();
      updateAuthUI();
    });
  }

  // Refresh user reports
  const btnRefreshUserReports = document.getElementById("btnRefreshUserReports");
  if (btnRefreshUserReports) {
    btnRefreshUserReports.addEventListener("click", loadUserComplaints);
  }

  function showAuthAlert(msg, type) {
    if (!authStatusAlert) return;
    authStatusAlert.textContent = msg;
    authStatusAlert.className = `auth-status-msg ${type}`;
    authStatusAlert.classList.remove("hidden");
  }

  // Submit Report Directly to MySQL Database
  const btnSubmitDbReport = document.getElementById("btnSubmitDbReport");
  const reportCitizenName = document.getElementById("reportCitizenName");
  const reportCitizenContact = document.getElementById("reportCitizenContact");
  const dbReportAckBox = document.getElementById("dbReportAckBox");

  if (btnSubmitDbReport) {
    btnSubmitDbReport.addEventListener("click", async () => {
      if (!lastAnalysisResult) {
        alert("Please run a verification scan first.");
        return;
      }

      const res = lastAnalysisResult;
      const reporterName = (reportCitizenName && reportCitizenName.value.trim()) || "Concerned Citizen";
      const reporterContact = (reportCitizenContact && reportCitizenContact.value.trim()) || "Helpline-1930";

      const payload = {
        reporter_name: reporterName,
        reporter_contact: reporterContact,
        category: res.categoryDetected || "Public Welfare",
        scam_title: res.verdictTitle || "Suspicious Welfare Claim",
        evidence_text: res.rawInput || "No text provided",
        claimed_amount: res.benefitMismatch ? `₹${res.benefitMismatch.claimedAmount}` : (res.entities && res.entities.amounts && res.entities.amounts[0] ? `₹${res.entities.amounts[0]}` : null),
        demanded_fee: res.entities && res.entities.feeDemands && res.entities.feeDemands[0] ? res.entities.feeDemands[0] : null,
        suspicious_url: res.entities && res.entities.urls && res.entities.urls[0] ? res.entities.urls[0] : null,
        suspicious_phone: res.entities && res.entities.phones && res.entities.phones[0] ? res.entities.phones[0] : null
      };

      try {
        btnSubmitDbReport.disabled = true;
        btnSubmitDbReport.textContent = "Submitting to Database...";

        const dbRes = await window.apiClient.submitReport(payload);
        if (dbRes.success && dbRes.data) {
          const ack = dbRes.data.cyber_ack_number;
          if (dbReportAckBox) {
            dbReportAckBox.innerHTML = `
              <div style="color: #10b981; font-weight: 700; margin-bottom: 4px;">✅ Incident Complaint Logged in Database!</div>
              <div style="font-size: 0.85rem; color: #cbd5e1;">Official Cyber Tracking Ack Number: <span class="complaint-ack-tag">${ack}</span></div>
              <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 4px;">Status: <strong>PENDING REVIEW</strong> • Forwardable to Cybercrime Helpline 1930.</div>
            `;
            dbReportAckBox.classList.remove("hidden");
          }
        }
      } catch (err) {
        alert("Failed to save report to database: " + err.message);
      } finally {
        btnSubmitDbReport.disabled = false;
        btnSubmitDbReport.textContent = "💾 Log Incident to Database & Generate Ack No.";
      }
    });
  }

  updateAuthUI();

  // Initial Renders
  renderSchemesDirectory();
  renderPibAlerts();
  applyTranslations("en");
});
