import axios from 'axios';

export class GoogleSheetsService {
  constructor(sheetUrl) {
    this.sheetUrl = sheetUrl;
  }

  /**
   * Parses CSV text into a 2D array
   */
  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    const data = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      data.push(this.parseCSVLine(line));
    }

    return data;
  }

  /**
   * Parses a single CSV line, handling quoted values with commas
   */
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim().replace(/^"|"$/g, ''));
    return values;
  }

  /**
   * Maps raw sheet data (horizontal format) to creator format
   * Expected format: Row 1 = names, Row 2 = cost/post, Row 4 = num posts, Row 6 = cost individual
   */
  mapToCreators(rawData) {
    if (rawData.length < 6) {
      console.error('Invalid sheet format: not enough rows');
      return [];
    }

    const creatorNames = rawData[0]; // First row: Champion, Joshua Jake, Crypto Wendy, etc.
    const costPerPost = rawData[1]; // Second row: Cost/post values
    const numPosts = rawData[3]; // Fourth row: Number of Posts
    const totalCost = rawData[5]; // Sixth row: Cost Individual

    const creators = [];

    // Start from index 1 to skip the label column
    for (let i = 1; i < creatorNames.length; i++) {
      const name = creatorNames[i]?.trim();
      if (!name || name === '') continue;

      const posts = numPosts[i] || '0';
      const cost = totalCost[i] || '$0.00';

      creators.push({
        id: i,
        name: name,
        handle: `@${name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`,
        notes: `${posts} posts, ${cost} total`,
        costPerPost: costPerPost[i] || '',
        posts: [] // Initialize empty posts array
      });
    }

    return creators;
  }

  /**
   * Fetches and parses creator data from Google Sheets
   */
  async fetchCreators() {
    try {
      const response = await axios.get(this.sheetUrl);
      const csvText = response.data;
      const rawData = this.parseCSV(csvText);
      const creators = this.mapToCreators(rawData);

      console.log(`Loaded ${creators.length} creators from Google Sheets`);
      return creators;
    } catch (error) {
      console.error('Error fetching Google Sheets data:', error);
      throw error;
    }
  }
}
