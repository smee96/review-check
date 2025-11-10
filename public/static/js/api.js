// API Service Layer

class API {
  constructor() {
    this.baseURL = '/api';
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) return {};
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  }

  // Auth APIs
  async register(email, nickname, password, role) {
    return axios.post(`${this.baseURL}/auth/register`, {
      email,
      nickname,
      password,
      role
    });
  }

  async login(email, password) {
    return axios.post(`${this.baseURL}/auth/login`, {
      email,
      password
    });
  }

  async forgotPassword(email) {
    return axios.post(`${this.baseURL}/auth/forgot-password`, { email });
  }

  async resetPassword(token, newPassword) {
    return axios.post(`${this.baseURL}/auth/reset-password`, {
      token,
      newPassword
    });
  }

  async getMe() {
    return axios.get(`${this.baseURL}/auth/me`, this.getAuthHeaders());
  }

  // Campaign APIs
  async createCampaign(data) {
    return axios.post(`${this.baseURL}/campaigns`, data, this.getAuthHeaders());
  }

  async getMyCampaigns() {
    return axios.get(`${this.baseURL}/campaigns/my`, this.getAuthHeaders());
  }

  async getApprovedCampaigns() {
    return axios.get(`${this.baseURL}/campaigns`, this.getAuthHeaders());
  }

  async getCampaign(id) {
    return axios.get(`${this.baseURL}/campaigns/${id}`, this.getAuthHeaders());
  }

  async updateCampaign(id, data) {
    return axios.put(`${this.baseURL}/campaigns/${id}`, data, this.getAuthHeaders());
  }

  async applyCampaign(id, message) {
    return axios.post(`${this.baseURL}/campaigns/${id}/apply`, { message }, this.getAuthHeaders());
  }

  async getCampaignApplications(id) {
    return axios.get(`${this.baseURL}/campaigns/${id}/applications`, this.getAuthHeaders());
  }

  // Application APIs
  async getMyApplications() {
    return axios.get(`${this.baseURL}/applications/my`, this.getAuthHeaders());
  }

  async updateApplicationStatus(id, status) {
    return axios.put(`${this.baseURL}/applications/${id}/status`, { status }, this.getAuthHeaders());
  }

  async submitReview(id, postUrl) {
    return axios.post(`${this.baseURL}/applications/${id}/review`, { post_url: postUrl }, this.getAuthHeaders());
  }

  // Profile APIs
  async getInfluencerProfile() {
    return axios.get(`${this.baseURL}/profile/influencer`, this.getAuthHeaders());
  }

  async updateInfluencerProfile(data) {
    return axios.put(`${this.baseURL}/profile/influencer`, data, this.getAuthHeaders());
  }

  async getAdvertiserProfile() {
    return axios.get(`${this.baseURL}/profile/advertiser`, this.getAuthHeaders());
  }

  async updateAdvertiserProfile(data) {
    return axios.put(`${this.baseURL}/profile/advertiser`, data, this.getAuthHeaders());
  }

  // Admin APIs
  async getAllCampaigns() {
    return axios.get(`${this.baseURL}/admin/campaigns`, this.getAuthHeaders());
  }

  async updateCampaignStatus(id, status) {
    return axios.put(`${this.baseURL}/admin/campaigns/${id}/status`, { status }, this.getAuthHeaders());
  }

  async getSettlements() {
    return axios.get(`${this.baseURL}/admin/settlements`, this.getAuthHeaders());
  }

  // Notification APIs
  async getNotifications() {
    return axios.get(`${this.baseURL}/notifications`, this.getAuthHeaders());
  }

  async markNotificationRead(id) {
    return axios.put(`${this.baseURL}/notifications/${id}/read`, {}, this.getAuthHeaders());
  }
}

// Export singleton instance
const api = new API();
