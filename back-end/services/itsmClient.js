const axios = require('axios');

class ITSMClient {
  constructor() {
    this.baseURL = process.env.ITSM_URL || 'http://localhost:5002';
    this.apiKey  = process.env.ITSM_API_KEY;

    if (!this.apiKey) {
      console.warn('[ITSMClient] WARNING: ITSM_API_KEY not set in .env');
    }

    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };
  }

  async createTicket({ title, description, category = 'other', priority = 'P3', externalRef = null }) {
    const res = await axios.post(
      `${this.baseURL}/api/gateway/incidents`,
      { title, description, category, priority, source: 'user-dashboard', externalTicketRef: externalRef },
      { headers: this.headers }
    );
    return res.data; // { success, ticketId, ticketNumber, status }
  }

  async getTicketStatus(ticketId) {
    const res = await axios.get(
      `${this.baseURL}/api/gateway/incidents/${ticketId}/status`,
      { headers: this.headers }
    );
    return res.data;
  }

  async escalateTicket(ticketId, reason) {
    const res = await axios.post(
      `${this.baseURL}/api/gateway/incidents/${ticketId}/escalate`,
      { reason },
      { headers: this.headers }
    );
    return res.data;
  }

  async searchKnowledge(query) {
    const res = await axios.get(
      `${this.baseURL}/api/gateway/knowledge`,
      { params: { search: query }, headers: this.headers }
    );
    return res.data;
  }

  async syncStatus(itsmTicketId, status) {
    const res = await axios.patch(
      `${this.baseURL}/api/gateway/incidents/${itsmTicketId}/status`,
      { status },
      { headers: this.headers }
    );
    return res.data;
  }

  async addWorknote(itsmTicketId, message, source) {
    try {
      const res = await axios.post(
        `${this.baseURL}/api/gateway/incidents/${itsmTicketId}/worknote`,
        { content: message, source: source || 'user-dashboard' },
        { headers: this.headers }
      );
      return res.data;
    } catch (err) {
      console.warn('[itsmClient] addWorknote failed:', err.message);
      return null; // non-blocking
    }
  }
}

module.exports = new ITSMClient();
