"""
Authentication API Test Suite
Validates registration, password security, login, and JWT access control.
"""


def test_register_success(client):
    """Test successful citizen registration."""
    res = client.post("/api/auth/register", json={
        "name": "Aakansha Sharma",
        "email": "aakansha@example.com",
        "password": "SecurePassword123!"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True
    assert "token" in data
    assert data["user"]["email"] == "aakansha@example.com"
    assert data["user"]["role"] == "citizen"


def test_register_invalid_email(client):
    """Test rejection of malformed email address."""
    res = client.post("/api/auth/register", json={
        "name": "Invalid User",
        "email": "not-an-email",
        "password": "ValidPassword123!"
    })
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert any("valid email" in m.lower() for m in data["messages"])


def test_register_short_password(client):
    """Test rejection of weak/short password."""
    res = client.post("/api/auth/register", json={
        "name": "Short Password User",
        "email": "shortpw@example.com",
        "password": "short"
    })
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert any("at least 8 characters" in m.lower() for m in data["messages"])


def test_register_duplicate_email(client):
    """Test duplicate registration returns 409 Conflict."""
    payload = {
        "name": "Duplicate User",
        "email": "duplicate@example.com",
        "password": "Password123!"
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 409
    data = res2.get_json()
    assert data["success"] is False


def test_login_success(client):
    """Test login with correct credentials returns valid JWT."""
    client.post("/api/auth/register", json={
        "name": "Login User",
        "email": "loginuser@example.com",
        "password": "Password123!"
    })

    res = client.post("/api/auth/login", json={
        "email": "loginuser@example.com",
        "password": "Password123!"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "token" in data
    assert data["user"]["email"] == "loginuser@example.com"


def test_login_wrong_password(client):
    """Test login rejection when password does not match."""
    client.post("/api/auth/register", json={
        "name": "Wrong Password User",
        "email": "wrongpw@example.com",
        "password": "RealPassword123!"
    })

    res = client.post("/api/auth/login", json={
        "email": "wrongpw@example.com",
        "password": "IncorrectPassword!"
    })
    assert res.status_code == 401
    data = res.get_json()
    assert data["success"] is False


def test_get_me_with_token(client):
    """Test /api/auth/me returns current user identity when token provided."""
    reg = client.post("/api/auth/register", json={
        "name": "Profile User",
        "email": "profile@example.com",
        "password": "Password123!"
    })
    token = reg.get_json()["token"]

    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["user"]["email"] == "profile@example.com"


def test_get_me_unauthorized(client):
    """Test /api/auth/me rejects requests without token with 401."""
    res = client.get("/api/auth/me")
    assert res.status_code == 401
