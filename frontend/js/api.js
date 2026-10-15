/**
 * InfoShield - Frontend Backend API Client Bridge
 * Communicates with Python Flask REST API & MySQL Database.
 * Includes automated fallback to local engine if backend server is not yet started.
 */

class InfoShieldAPI {
  constructor(baseUrl = "") {
    // Use relative "/api" when served by Flask (locally on port 5000 or deployed, e.g. Vercel).
    // Only a standalone local static server or file:// needs the explicit "http://localhost:5000/api".
    if (!baseUrl) {
      const { protocol, hostname, port } = window.location;
      const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
      const isStandaloneFrontend = protocol === "file:" || (isLocalHost && port !== "5000");
      this.baseUrl = isStandaloneFrontend ? "http://localhost:5000/api" : "/api";
    } else {
      this.baseUrl = baseUrl.replace(/\/+$/, "");
    }

    this.tokenKey = "infoshield_auth_token";
    this.userKey = "infoshield_auth_user";
    this.isBackendOnline = false;
  }

  /**
   * Get stored JWT token
   */
  getToken() {
    return localStorage.getItem(this.tokenKey) || null;
  }

  /**
   * Save session token and user profile
   */
  setSession(token, user) {
    if (token) localStorage.setItem(this.tokenKey, token);
    if (user) localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  /**
   * Clear session
   */
  clearSession() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  /**
   * Get current cached user
   */
  getCurrentUser() {
    try {
      const u = localStorage.getItem(this.userKey);
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Low-level fetch wrapper with headers and error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || (data.messages ? data.messages.join(", ") : `HTTP Error ${response.status}`));
      }

      this.isBackendOnline = true;
      return data;
    } catch (err) {
      if (err.message && (err.message.includes("Failed to fetch") || err.message.includes("NetworkError"))) {
        this.isBackendOnline = false;
      }
      throw err;
    }
  }

  /**
   * Check if backend Flask server is reachable
   */
  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/stats`, { method: "GET", headers: { "Content-Type": "application/json" } });
      if (res.ok) {
        this.isBackendOnline = true;
        const data = await res.json();
        return { online: true, stats: data.data };
      }
    } catch (e) {
      this.isBackendOnline = false;
    }
    return { online: false, stats: null };
  }

  // ==========================================================================
  // AUTHENTICATION APIs
  // ==========================================================================

  async register(name, email, password) {
    const res = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
    if (res.token && res.user) {
      this.setSession(res.token, res.user);
    }
    return res;
  }

  async login(email, password) {
    const res = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    if (res.token && res.user) {
      this.setSession(res.token, res.user);
    }
    return res;
  }

  async getMe() {
    return await this.request("/auth/me", { method: "GET" });
  }

  logout() {
    this.clearSession();
  }

  // ==========================================================================
  // VERIFICATION & SCAN APIs
  // ==========================================================================

  async verifyContent(text, url = "", inputType = "message") {
    return await this.request("/verify", {
      method: "POST",
      body: JSON.stringify({ text, url, input_type: inputType })
    });
  }

  async auditUrl(url) {
    return await this.request("/verify/url", {
      method: "POST",
      body: JSON.stringify({ url })
    });
  }

  async getScanHistory(limit = 20) {
    return await this.request(`/verify/history?limit=${limit}`, { method: "GET" });
  }

  // ==========================================================================
  // CITIZEN SCAM REPORTING APIs
  // ==========================================================================

  async submitReport(reportData) {
    return await this.request("/reports", {
      method: "POST",
      body: JSON.stringify(reportData)
    });
  }

  async getReports(limit = 20, status = "") {
    let q = `?limit=${limit}`;
    if (status) q += `&status=${encodeURIComponent(status)}`;
    return await this.request(`/reports${q}`, { method: "GET" });
  }

  // ==========================================================================
  // SCHEMES & PIB FACT CHECKS APIs
  // ==========================================================================

  async getSchemes(search = "", category = "all") {
    let q = `?category=${encodeURIComponent(category)}`;
    if (search) q += `&search=${encodeURIComponent(search)}`;
    return await this.request(`/schemes${q}`, { method: "GET" });
  }

  async getPibAlerts(limit = 50) {
    return await this.request(`/pib-alerts?limit=${limit}`, { method: "GET" });
  }

  // ==========================================================================
  // WHATSAPP BOT CHAT API
  // ==========================================================================

  async botChat(message) {
    return await this.request("/bot/chat", {
      method: "POST",
      body: JSON.stringify({ message })
    });
  }

  // ==========================================================================
  // ANALYTICS & FEEDBACK APIs
  // ==========================================================================

  async getStats() {
    return await this.request("/stats", { method: "GET" });
  }

  async submitFeedback(name, email, message, rating = 5) {
    return await this.request("/feedback", {
      method: "POST",
      body: JSON.stringify({ name, email, message, rating })
    });
  }
}

// Global API instance attached to window
window.apiClient = new InfoShieldAPI();
