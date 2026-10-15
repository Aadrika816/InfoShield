"""
Verifier API Test Suite
Validates AI heuristic scam analysis, ground-truth matching, and URL security auditing.
"""


def test_verify_scam_message(client):
    """Test verification correctly detects fake scheme demanding registration fee."""
    scam_text = (
        "PM Free Laptop Scheme 2024: Under Digital India, free HP laptops to all students. "
        "Pay ₹299 delivery charge at http://pm-laptop-yojana.online and forward to 5 groups."
    )
    res = client.post("/api/verify", json={"text": scam_text, "input_type": "message"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    analysis = data["data"]
    assert analysis["verdict"] == "POTENTIALLY_FAKE"
    assert analysis["riskScore"] >= 65
    assert len(analysis["redFlags"]) >= 2
    assert "scanId" in analysis
    assert "cyberReportText" in analysis


def test_verify_genuine_notice(client):
    """Test verification confirms genuine official notice without fees."""
    genuine_text = (
        "National Health Authority Official Notice: Ayushman Bharat ABHA Health Account "
        "creation is 100% FREE. Never pay fee or share OTP. Visit https://beneficiary.nha.gov.in"
    )
    res = client.post("/api/verify", json={"text": genuine_text, "input_type": "message"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    analysis = data["data"]
    assert analysis["verdict"] == "LIKELY_GENUINE"
    assert analysis["riskScore"] <= 35
    assert len(analysis["greenFlags"]) >= 1


def test_verify_benefit_mismatch(client):
    """Test verification catches exaggerated claims against official ground truth."""
    mismatch_text = (
        "Bhai suno! PM Kisan Samman Nidhi me ₹25,000 ka special bonus mil raha hai! "
        "Bas ₹500 registration fee pay karo."
    )
    res = client.post("/api/verify", json={"text": mismatch_text, "input_type": "message"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    analysis = data["data"]
    assert analysis["benefitMismatch"] is not None
    assert analysis["benefitMismatch"]["claimedAmount"] == 25000
    assert analysis["benefitMismatch"]["officialMax"] == 6000


def test_audit_url_phishing_tld(client):
    """Test URL auditor catches suspicious phishing top-level domain."""
    res = client.post("/api/verify/url", json={"url": "http://ayushman-card-free.xyz/apply"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    audit = data["data"]
    assert audit["isGov"] is False
    assert audit["isSuspiciousTld"] is True
    assert audit["riskLevel"] == "CRITICAL"


def test_audit_url_official_gov(client):
    """Test URL auditor verifies genuine .gov.in domain."""
    res = client.post("/api/verify/url", json={"url": "https://pmkisan.gov.in"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    audit = data["data"]
    assert audit["isGov"] is True
    assert audit["riskLevel"] == "LOW"


def test_scan_history(client):
    """Test retrieving scan history from database."""
    client.post("/api/verify", json={"text": "Test scheme verification scan 1"})
    client.post("/api/verify", json={"text": "Test scheme verification scan 2"})

    res = client.get("/api/verify/history?limit=10")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert len(data["data"]) >= 2
