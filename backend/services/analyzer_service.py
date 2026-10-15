"""
InfoShield Python Verification Engine & Scam Detection Service
Implements NLP claim extraction, heuristic scam detection, domain auditing,
and cross-referencing against official Government of India ground-truth databases.
"""
import re
import json
import logging
from urllib.parse import urlparse
from database import query_db

logger = logging.getLogger("infoshield.analyzer")

# Red-flag indicators & social engineering patterns
SUSPICIOUS_TLDS = [
    ".online", ".xyz", ".top", ".site", ".club", ".buzz", ".work",
    ".vip", ".icu", ".cam", ".shop", ".link", ".apk"
]

OFFICIAL_GOV_TLDS = [".gov.in", ".nic.in", ".ac.in", ".res.in"]

FEE_DEMAND_PATTERNS = [
    r"(?:pay|deposit|send|transfer|charge|fee|fees|charges)\s*(?:of|is|rs\.?|inr|₹)?\s*(\d+[\d,]*)",
    r"(\d+[\d,]*)\s*(?:rs\.?|inr|₹|rupees)?\s*(?:stamp|duty|registration|processing|form|activation|delivery|courier)?\s*fee[s]?",
    r"(?:registration|processing|form|activation|delivery|courier|stamp\s*duty|security)\s*fee[s]?",
    r"stamp\s*(?:fee[s]?|duty|charge[s]?)",
    r"(?:₹|rs\.?|inr)\s*(\d+[\d,]*)\s*(?:registration|fee|advance|stamp)",
    r"(?:bhejo|jama\s*karein|shulk|charges\s*dena)"
]

URGENCY_PATTERNS = [
    r"last\s*(?:date|day|chance|hour)",
    r"(?:aaj\s*raat|jaldi\s*karein|turant|hurry|urgent|immediate|limited\s*time|expires\s*tonight)",
    r"before\s*(?:midnight|12\s*pm|12\s*am|\d+\s*(?:hours|mins))",
    r"offer\s*valid\s*till",
    r"account\s*(?:suspended|blocked|deactivated)"
]

PYRAMID_SHARING_PATTERNS = [
    r"(?:forward|share|bhejo|send)\s*(?:to|in)?\s*(\d+)?\s*(?:groups?|friends?|contacts?|dosto|whatsapp)",
    r"share\s*with\s*\d+\s*people",
    r"5\s*(?:groups?|dosto|logo)"
]


class AnalyzerService:
    """Core verification service for text messages and scheme URLs."""

    @staticmethod
    def is_gov_domain(domain: str) -> bool:
        """Check whether a domain officially ends with a legitimate GoI TLD."""
        clean = (domain or "").lower().strip()
        return any(clean.endswith(tld) for tld in OFFICIAL_GOV_TLDS)

    @classmethod
    def audit_url(cls, raw_url: str) -> dict:
        """Analyze a web address for phishing patterns and impersonation."""
        if not raw_url.startswith(("http://", "https://")):
            test_url = "http://" + raw_url
        else:
            test_url = raw_url

        try:
            parsed = urlparse(test_url)
            hostname = (parsed.netloc or "").lower()
            protocol = parsed.scheme.lower()
        except Exception:
            hostname = raw_url.lower()
            protocol = "http"

        is_gov = cls.is_gov_domain(hostname)
        is_suspicious_tld = any(hostname.endswith(tld) for tld in SUSPICIOUS_TLDS)
        is_subdomain_spoof = ("gov.in" in hostname or "nic.in" in hostname) and not is_gov
        is_insecure = protocol == "http"

        details = []
        if is_gov:
            details.append("Official Government of India verified namespace (.gov.in / .nic.in).")
            risk_level = "LOW"
            badge = "✅ Official Government Domain"
            risk_score = 5
        elif is_suspicious_tld:
            details.append(f"Uses high-risk top-level domain frequently associated with phishing.")
            risk_level = "CRITICAL"
            badge = "🚨 Phishing Risk TLD"
            risk_score = 92
        elif is_subdomain_spoof:
            details.append("Deceptive hostname: uses 'gov.in' inside an unauthorized subdomain.")
            risk_level = "CRITICAL"
            badge = "🚨 Domain Impersonation Spoof"
            risk_score = 98
        else:
            details.append("Unofficial third-party domain. Not managed by Government of India.")
            risk_level = "MEDIUM"
            badge = "⚠️ Unofficial Domain"
            risk_score = 55

        if is_insecure:
            details.append("Insecure transmission protocol (HTTP without TLS encryption).")
            risk_score = min(100, risk_score + 10)

        return {
            "rawUrl": raw_url,
            "hostname": hostname,
            "protocol": protocol,
            "isGov": is_gov,
            "isSuspiciousTld": is_suspicious_tld,
            "isSubdomainSpoofing": is_subdomain_spoof,
            "isInsecureHttp": is_insecure,
            "riskLevel": risk_level,
            "riskScore": risk_score,
            "badge": badge,
            "details": details
        }

    @classmethod
    def extract_entities(cls, text: str) -> dict:
        """Extract URLs, monetary numbers, phones, and scam signals from text."""
        raw = text or ""
        lower = raw.lower()

        # URLs
        url_matches = re.findall(r"https?://[^\s<>\"']+|www\.[^\s<>\"']+|[a-zA-Z0-9-]+\.(?:online|xyz|top|site|club|gov\.in|nic\.in)[^\s<>\"']*", raw)

        # Monetary figures
        amounts = []
        for m in re.finditer(r"(?:₹|rs\.?|inr)\s*([\d,]+)", raw, re.IGNORECASE):
            try:
                num = int(m.group(1).replace(",", ""))
                amounts.append(num)
            except ValueError:
                pass

        # Phones
        phones = re.findall(r"(?:\+91[\-\s]?)?[6-9]\d{9}", raw)

        # Urgency
        urgency_found = [p for p in URGENCY_PATTERNS if re.search(p, lower)]

        # Fee demands
        fee_found = [p for p in FEE_DEMAND_PATTERNS if re.search(p, lower)]

        # Pyramid forward
        pyramid_found = [p for p in PYRAMID_SHARING_PATTERNS if re.search(p, lower)]

        return {
            "urls": url_matches,
            "amounts": amounts,
            "phones": phones,
            "urgencySignals": urgency_found,
            "feeDemands": fee_found,
            "pyramidSharing": pyramid_found
        }

    @classmethod
    def cross_reference(cls, text: str, entities: dict) -> dict:
        """Match against official schemes and PIB fact-check debunks in database."""
        lower = text.lower()
        matched_scheme = None
        matched_pib = None

        # Fetch schemes from DB
        schemes = query_db("SELECT * FROM official_schemes")
        for s in schemes:
            keywords = json.loads(s["keywords_json"]) if isinstance(s.get("keywords_json"), str) else s.get("keywords_json", [])
            if any(k.lower() in lower for k in keywords):
                matched_scheme = dict(s)
                matched_scheme["officialUrl"] = matched_scheme.get("official_url", "")
                matched_scheme["officialDomain"] = matched_scheme.get("official_domain", "")
                matched_scheme["shortName"] = matched_scheme.get("short_name", "")
                matched_scheme["benefitSummary"] = matched_scheme.get("benefit_summary", "")
                matched_scheme["targetAudience"] = matched_scheme.get("target_audience", "")
                matched_scheme["verifiedNotice"] = matched_scheme.get("verified_notice", "")
                break

        # Fetch PIB fact-checks from DB
        pib_checks = query_db("SELECT * FROM pib_fact_checks")
        for p in pib_checks:
            keywords = json.loads(p["keywords_json"]) if isinstance(p.get("keywords_json"), str) else p.get("keywords_json", [])
            if any(k.lower() in lower for k in keywords):
                matched_pib = dict(p)
                matched_pib["scamType"] = matched_pib.get("scam_type", "")
                matched_pib["pibVerdict"] = matched_pib.get("pib_verdict", "")
                matched_pib["pibSummary"] = matched_pib.get("pib_summary", "")
                matched_pib["debunkProof"] = matched_pib.get("debunk_proof", "")
                matched_pib["refUrl"] = matched_pib.get("ref_url", "")
                break

        return {
            "matchedScheme": matched_scheme,
            "matchedPibScam": matched_pib
        }

    @classmethod
    def analyze(cls, text: str, url: str = "") -> dict:
        """
        Run the complete verification pipeline and return explainable verdict.
        """
        full_text = (text or "").strip()
        if url and url not in full_text:
            full_text = f"{full_text}\nLink: {url}".strip()

        entities = cls.extract_entities(full_text)
        db_match = cls.cross_reference(full_text, entities)
        matched_scheme = db_match["matchedScheme"]
        matched_pib = db_match["matchedPibScam"]

        # Calculate Red Flags
        red_flags = []
        green_flags = []
        risk_score = 15

        # 1. PIB Match
        if matched_pib:
            red_flags.append({
                "severity": "CRITICAL",
                "label": f"PIB Fact Check Debunk: {matched_pib['title']}",
                "description": matched_pib["debunkProof"]
            })
            risk_score += 65

        # 2. Advance Fee Demand
        if entities["feeDemands"]:
            red_flags.append({
                "severity": "CRITICAL",
                "label": "Upfront Registration or Processing Fee Demanded",
                "description": "Government welfare schemes never demand upfront registration or courier fees via UPI, WhatsApp, or cash."
            })
            risk_score += 55

        # 3. Urgency and Threat
        if entities["urgencySignals"]:
            red_flags.append({
                "severity": "HIGH",
                "label": "Artificial Urgency & Fear Tactic",
                "description": "Scammers enforce tight deadlines ('last date tonight', 'power cut at 9:30 PM') to bypass critical reasoning."
            })
            risk_score += 20

        # 4. Pyramid Sharing
        if entities["pyramidSharing"]:
            red_flags.append({
                "severity": "HIGH",
                "label": "Viral Pyramid Sharing Trap",
                "description": "Demanding users forward messages to multiple groups or friends is a hallmark tactic of viral clickbait fraud."
            })
            risk_score += 25

        # 5. URL Audit
        url_audits = []
        for u in entities["urls"]:
            audit = cls.audit_url(u)
            url_audits.append(audit)
            if audit["isSuspiciousTld"] or audit["isSubdomainSpoofing"]:
                red_flags.append({
                    "severity": "CRITICAL",
                    "label": f"Fraudulent Phishing Link ({audit['hostname']})",
                    "description": audit["details"][0]
                })
                risk_score += 40
            elif audit["isGov"]:
                green_flags.append({
                    "label": f"Verified Official Domain ({audit['hostname']})",
                    "description": "Links directly to an authentic Government of India service portal."
                })
                risk_score -= 25

        # 6. Benefit Limit Discrepancy Mismatch
        benefit_mismatch = None
        if matched_scheme and entities["amounts"]:
            max_official = float(matched_scheme.get("max_benefit_numeric", 0))
            claimed_max = max(entities["amounts"])
            if max_official > 0 and claimed_max > (max_official * 1.5):
                multiplier = round(claimed_max / max_official, 1)
                benefit_mismatch = {
                    "schemeName": matched_scheme["short_name"],
                    "claimedAmount": claimed_max,
                    "officialMax": max_official,
                    "multiplier": multiplier
                }
                red_flags.append({
                    "severity": "HIGH",
                    "label": f"Exaggerated Benefit Claim ({multiplier}x Official Cap)",
                    "description": f"Claims ₹{claimed_max:,}, whereas official {matched_scheme['short_name']} maximum limit is ₹{max_official:,.0f}."
                })
                risk_score += 30

        # 7. Trust Signals
        if "dbt" in full_text.lower() or "direct benefit transfer" in full_text.lower():
            green_flags.append({
                "label": "Direct Benefit Transfer (DBT) Reference",
                "description": "Mentions official PFMS/Aadhaar linked direct bank transfer."
            })
            risk_score -= 10

        if "1930" in full_text or "cybercrime.gov.in" in full_text:
            green_flags.append({
                "label": "Official Cyber Crime Helpline (1930) Cited",
                "description": "Advises citizen safety and reporting."
            })
            risk_score -= 15

        # Normalize score
        risk_score = max(5, min(99, risk_score))

        # Synthesize Verdict
        if risk_score >= 65:
            verdict = "POTENTIALLY_FAKE"
            verdict_title = "High Risk: Fraudulent Government Scheme Scam"
            status_color = "red"
        elif risk_score <= 35:
            verdict = "LIKELY_GENUINE"
            verdict_title = "Likely Genuine: Matches Authentic Government Information"
            status_color = "green"
        else:
            verdict = "NEEDS_VERIFICATION"
            verdict_title = "Needs Caution: Unverified Claims & Missing Ground Truth"
            status_color = "amber"

        # Primary trigger explanation
        if red_flags:
            primary_trigger = f"Flagged due to {len(red_flags)} high-risk indicators: {red_flags[0]['label']}."
        elif green_flags:
            primary_trigger = "Content aligns with verified official announcements from authenticated government portals."
        else:
            primary_trigger = "Notice does not reference recognized official portals or verified PIB publications."

        # Actionable Citizen Advisory
        official_url = (matched_scheme.get("officialUrl") or matched_scheme.get("official_url") or "https://www.myscheme.gov.in") if matched_scheme else "https://www.myscheme.gov.in"
        action_points = [
            f"Cross-reference this scheme directly on the authentic Government portal ({official_url}).",
            "Never deposit upfront registration fees, stamp duty charges, or courier fees.",
            "Never share one-time passwords (OTPs) or bank PINs on WhatsApp or private links."
        ]
        if verdict == "POTENTIALLY_FAKE":
            action_points.append("Report this fraud immediately on the National Cyber Crime Reporting Portal (Helpline 1930).")

        # Cyber Crime Incident Report Template
        cyber_report_text = f"""INCIDENT DETAILS FOR NATIONAL CYBER CRIME REPORTING PORTAL (cybercrime.gov.in / Helpline: 1930)
=========================================================================================
Incident Category: Online Financial Fraud / Fake Government Scheme Impersonation
Suspected Scheme: {matched_scheme['name'] if matched_scheme else 'Unregistered Welfare Claim'}
Calculated Fraud Risk: {risk_score}% ({verdict_title})
Flagged Link(s): {', '.join(entities['urls']) if entities['urls'] else 'None directly linked'}
Reported Contact(s): {', '.join(entities['phones']) if entities['phones'] else 'Not specified'}

EVIDENCE CONTENT RECEIVED BY CITIZEN:
\"\"\"
{full_text}
\"\"\"

DETECTED RED FLAGS:
{chr(10).join(f"- {rf['label']}: {rf['description']}" for rf in red_flags)}

Generated By: InfoShield AI Citizen Security Platform
Date: {query_db('SELECT CURRENT_TIMESTAMP as now', one=True)['now'] if query_db('SELECT CURRENT_TIMESTAMP as now', one=True) else 'Current Date'}
========================================================================================="""

        return {
            "verdict": verdict,
            "verdictTitle": verdict_title,
            "statusColor": status_color,
            "riskScore": risk_score,
            "categoryDetected": matched_scheme["category"] if matched_scheme else "Public Welfare",
            "primaryTrigger": primary_trigger,
            "rawInput": full_text,
            "entities": entities,
            "redFlags": red_flags,
            "greenFlags": green_flags,
            "benefitMismatch": benefit_mismatch,
            "matchedScheme": matched_scheme,
            "matchedPibScam": matched_pib,
            "urlAudits": url_audits,
            "advisory": {
                "actionPoints": action_points,
                "officialPortalUrl": official_url
            },
            "cyberReportText": cyber_report_text
        }
