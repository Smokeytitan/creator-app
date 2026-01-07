import axios from 'axios';

export class KaitoService {
  constructor() {
    this.apiKey = 'l5WWSDoert2mCtOH7dfDz5Ni5l7eGJMk4OCJZKXi';
    // Use proxy in development, direct API in production
    this.baseUrl = import.meta.env.DEV ? '/api/kaito' : 'https://api.kaito.ai/api/v1';
  }

  /**
   * Fetch top 100 community members from Kaito community mindshare
   * @param {Object} params - Parameters for the leaderboard query
   * @returns {Promise<Array>} - Array of top community members
   */
  async fetchLeaderboard(params = {}) {
    const defaultParams = {
      ticker: 'POL',
      start_date: '2025-12-01',
      end_date: '2025-12-31',
      user_type: 'creator'
    };

    const queryParams = { ...defaultParams, ...params };

    try {
      console.log('Kaito API: Fetching community mindshare data...', queryParams);

      const response = await axios.get(`${this.baseUrl}/community_mindshare`, {
        params: queryParams,
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br'
        },
        decompress: true
      });

      const data = response.data;
      console.log(`Kaito API: Successfully fetched community mindshare data`);
      console.log('Kaito API Response:', data);

      // Extract top_100_creators from community_mindshare response
      if (data.community_mindshare && data.community_mindshare.top_100_creators) {
        return data.community_mindshare.top_100_creators;
      } else if (Array.isArray(data)) {
        return data.slice(0, 100);
      } else if (data.results && Array.isArray(data.results)) {
        return data.results.slice(0, 100);
      } else if (data.data && Array.isArray(data.data)) {
        return data.data.slice(0, 100);
      }

      return data;
    } catch (error) {
      console.error('Kaito API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update creator data with Kaito metrics
   * @param {Array} creators - Current creators list
   * @returns {Promise<Array>} - Updated creators with Kaito data
   */
  async updateCreatorData(creators) {
    console.log(`KaitoService: Pulling data for ${creators.length} creators`);

    try {
      const leaderboardData = await this.fetchLeaderboard();

      // Merge Kaito data with existing creators
      const updatedCreators = creators.map(creator => {
        const kaitoData = leaderboardData.find(
          member => member.username?.toLowerCase() === creator.handle?.toLowerCase().replace('@', '')
        );

        if (kaitoData) {
          return {
            ...creator,
            kaitoMetrics: {
              rank: kaitoData.rank,
              score: kaitoData.score,
              engagement: kaitoData.engagement,
              reach: kaitoData.reach,
              lastUpdated: new Date().toISOString()
            }
          };
        }

        return creator;
      });

      console.log('KaitoService: Successfully updated creator data');
      return updatedCreators;
    } catch (error) {
      console.error('KaitoService: Failed to update creator data', error);
      return creators; // Return original creators if API fails
    }
  }

  /**
   * Get leaderboard with date range
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Array>} - Leaderboard data
   */
  async getLeaderboardByDateRange(startDate, endDate) {
    return this.fetchLeaderboard({
      start_date: startDate,
      end_date: endDate
    });
  }
}
