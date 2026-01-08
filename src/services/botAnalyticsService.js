import axios from 'axios';

export class BotAnalyticsService {
  constructor() {
    // In development, uses Vite proxy. In production, uses environment variable
    this.baseUrl = '/api/bot-analytics';
    this.apiKey = 'dev_secret_key_change_in_production';
  }

  /**
   * Fetch summary statistics
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   */
  async fetchSummary({ startDate, endDate } = {}) {
    try {
      const response = await axios.get(`${this.baseUrl}/summary`, {
        params: { startDate, endDate },
        headers: { 'X-API-Key': this.apiKey },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch bot analytics summary:', error);
      throw error;
    }
  }

  /**
   * Fetch posts with optional filters
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @param {string} params.creatorId - Filter by creator ID
   */
  async fetchPosts({ startDate, endDate, creatorId } = {}) {
    try {
      const response = await axios.get(`${this.baseUrl}/posts`, {
        params: { startDate, endDate, creatorId },
        headers: { 'X-API-Key': this.apiKey },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch bot analytics posts:', error);
      throw error;
    }
  }

  /**
   * Fetch all creators
   */
  async fetchCreators() {
    try {
      const response = await axios.get(`${this.baseUrl}/creators`, {
        headers: { 'X-API-Key': this.apiKey },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch creators:', error);
      throw error;
    }
  }

  /**
   * Fetch timeline data grouped by day or week
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @param {string} params.groupBy - 'day' or 'week'
   */
  async fetchTimeline({ startDate, endDate, groupBy = 'day' } = {}) {
    try {
      const response = await axios.get(`${this.baseUrl}/timeline`, {
        params: { startDate, endDate, groupBy },
        headers: { 'X-API-Key': this.apiKey },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
      throw error;
    }
  }
}
