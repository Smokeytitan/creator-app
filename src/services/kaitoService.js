import axios from 'axios';

export class KaitoService {
  constructor() {
    // Always use the Vercel serverless function proxy to avoid CORS issues
    this.baseUrl = '/api/kaito';
  }

  /**
   * Fetch top community members from Kaito community mindshare
   * @param {Object} params - Parameters for the leaderboard query
   * @param {number} params.limit - Optional limit for number of creators (default: 115)
   * @returns {Promise<Array>} - Array of top community members (limited to 115 by default)
   */
  async fetchLeaderboard(params = {}) {
    const defaultParams = {
      ticker: 'POL',
      start_date: '2025-12-01',
      end_date: '2025-12-31',
      user_type: 'creator'
    };

    const queryParams = { ...defaultParams, ...params };

    // Extract limit if provided (for local filtering)
    const localLimit = params.limit;
    delete queryParams.limit; // Don't send limit to API as it may not support it

    try {
      console.log('Kaito API: Fetching community mindshare data...', queryParams);

      // Call the Vercel serverless function which proxies to Kaito API
      const response = await axios.get(this.baseUrl, {
        params: queryParams,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = response.data;
      console.log(`Kaito API: Successfully fetched community mindshare data`);
      console.log('Kaito API Response:', data);

      let results = [];

      // Extract creators from community_mindshare response
      if (data.community_mindshare && data.community_mindshare.top_100_creators) {
        results = data.community_mindshare.top_100_creators;
      } else if (Array.isArray(data)) {
        results = data;
      } else if (data.results && Array.isArray(data.results)) {
        results = data.results;
      } else if (data.data && Array.isArray(data.data)) {
        results = data.data;
      } else {
        results = data;
      }

      console.log(`Kaito API: Received ${Array.isArray(results) ? results.length : 'unknown'} creators`);

      // Apply local limit if specified, otherwise default to top 115
      if (Array.isArray(results)) {
        const limit = localLimit || 115;
        const slicedResults = results.slice(0, limit);
        console.log(`Kaito API: Returning top ${slicedResults.length} creators`);
        return slicedResults;
      }

      return results;
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
