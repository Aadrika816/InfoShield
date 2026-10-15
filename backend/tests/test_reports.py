"""
Reports, Schemes, Bot, and Analytics Test Suite
Validates citizen cyber scam filing, directory search, chat bot simulator, and metrics.
"""


def test_submit_scam_report(client):
    """Test filing citizen scam report and receiving cyber acknowledgment number."""
    payload = {
        "reporter_name": "Aadrika",
        "reporter_contact": "9876543210",
        "category": "Healthcare",
        "scam_title": "Fake Ayushman VIP Card ₹450 Fee WhatsApp Link",
        "evidence_text": "Received a WhatsApp message offering VIP Golden Card delivery for ₹450 with OTP demand.",
        "demanded_fee": "₹450",
        "suspicious_url": "http://ayushman-card-free.xyz"
    }
    res = client.post("/api/reports", json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True
    assert "cyber_ack_number" in data["data"]
    assert data["data"]["cyber_ack_number"].startswith("CYBER-INFOSHIELD-")


def test_get_reports_list(client):
    """Test retrieving citizen scam reports list."""
    client.post("/api/reports", json={
        "reporter_name": "Test Citizen",
        "reporter_contact": "citizen@example.com",
        "category": "Jobs",
        "scam_title": "Fake Railway Recruitment Deposit",
        "evidence_text": "Demands ₹750 deposit via UPI for appointment letter."
    })

    res = client.get("/api/reports?limit=10")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert len(data["data"]) >= 1


def test_schemes_directory(client):
    """Test querying official schemes catalog with search and category filters."""
    res = client.get("/api/schemes?search=kisan")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert any("pm-kisan" in s["id"] for s in data["data"])


def test_pib_alerts(client):
    """Test querying PIB fact-checked scams."""
    res = client.get("/api/pib-alerts")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert len(data["data"]) >= 1


def test_whatsapp_bot_chat(client):
    """Test WhatsApp bot simulator returns structured reply and analysis."""
    res = client.post("/api/bot/chat", json={
        "message": "PM Mudra loan approve ho gaya 1250 rs stamp fee bhejo"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "reply" in data
    assert "analysis" in data
    assert data["analysis"]["verdict"] == "POTENTIALLY_FAKE"


def test_system_stats(client):
    """Test system dashboard metrics endpoint."""
    res = client.get("/api/stats")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    stats = data["data"]
    assert "totalScans" in stats
    assert "totalReportsFiled" in stats
    assert "officialSchemesCataloged" in stats
