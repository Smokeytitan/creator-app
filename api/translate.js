/**
 * Google Cloud Translation API Proxy
 *
 * This serverless function proxies requests to Google Cloud Translation API to:
 * 1. Avoid CORS issues
 * 2. Keep API keys secure
 * 3. Translate tweet content for key phrase matching
 *
 * Uses Google Cloud Translation API v2 (Basic)
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get Google Cloud Translation API key from environment
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

  if (!apiKey) {
    console.error('Google Translation API key not configured');
    return res.status(500).json({
      error: 'Translation API not configured',
      message: 'Please add GOOGLE_TRANSLATE_API_KEY to environment variables'
    });
  }

  try {
    const { text, targetLang = 'en', sourceLang = null } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text parameter is required' });
    }

    console.log(`Translating text to ${targetLang}${sourceLang ? ` from ${sourceLang}` : ''}`);

    // Build Google Cloud Translation API URL
    const baseUrl = 'https://translation.googleapis.com/language/translate/v2';
    const params = new URLSearchParams({
      key: apiKey,
      q: text,
      target: targetLang,
      format: 'text'
    });

    // Add source language if provided (otherwise API will auto-detect)
    if (sourceLang) {
      params.append('source', sourceLang);
    }

    // Make request to Google Translation API
    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Translation API error:', response.status, errorData);

      // Handle rate limiting
      if (response.status === 429) {
        return res.status(429).json({
          error: 'Translation API rate limit exceeded',
          details: errorData
        });
      }

      return res.status(response.status).json({
        error: 'Translation API error',
        details: errorData
      });
    }

    const data = await response.json();

    // Extract translated text from response
    const translatedText = data.data?.translations?.[0]?.translatedText;
    const detectedSourceLanguage = data.data?.translations?.[0]?.detectedSourceLanguage;

    if (!translatedText) {
      throw new Error('No translation returned from API');
    }

    console.log(`Translation successful (detected language: ${detectedSourceLanguage})`);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Return translated text
    return res.status(200).json({
      translatedText,
      detectedSourceLanguage,
      targetLanguage: targetLang
    });

  } catch (error) {
    console.error('Error in Translation API proxy:', error);
    return res.status(500).json({
      error: 'Failed to translate text',
      message: error.message
    });
  }
}
