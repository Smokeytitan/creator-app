/**
 * Translation API Proxy
 *
 * This serverless function proxies requests to translation APIs to:
 * 1. Avoid CORS issues
 * 2. Keep API keys secure
 * 3. Translate tweet content for key phrase matching
 *
 * Supports:
 * - DeepL API (preferred - simpler setup, free tier: 500k chars/month)
 * - Google Cloud Translation API v2 (fallback)
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for translation API keys (DeepL first, then Google Cloud)
  const deeplApiKey = process.env.DEEPL_API_KEY;
  const googleApiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

  if (!deeplApiKey && !googleApiKey) {
    console.warn('No translation API key configured - translation unavailable');
    return res.status(503).json({
      error: 'Translation API not configured',
      message: 'Neither DEEPL_API_KEY nor GOOGLE_TRANSLATE_API_KEY is set. Translation is optional - tweets will be matched against key phrases using original text only.'
    });
  }

  try {
    const { text, targetLang = 'en', sourceLang = null } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text parameter is required' });
    }

    console.log(`Translating text to ${targetLang}${sourceLang ? ` from ${sourceLang}` : ''}`);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Try DeepL first (preferred)
    if (deeplApiKey) {
      console.log('Using DeepL API for translation');

      // DeepL uses different endpoint for free vs pro tier
      // Free tier API keys end with ':fx'
      const baseUrl = deeplApiKey.endsWith(':fx')
        ? 'https://api-free.deepl.com/v2/translate'
        : 'https://api.deepl.com/v2/translate';

      const deeplParams = new URLSearchParams({
        auth_key: deeplApiKey,
        text: text,
        target_lang: targetLang.toUpperCase()
      });

      // Add source language if provided
      if (sourceLang) {
        deeplParams.append('source_lang', sourceLang.toUpperCase());
      }

      const deeplResponse = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: deeplParams.toString()
      });

      if (deeplResponse.ok) {
        const deeplData = await deeplResponse.json();
        const translatedText = deeplData.translations?.[0]?.text;
        const detectedSourceLanguage = deeplData.translations?.[0]?.detected_source_language?.toLowerCase();

        if (translatedText) {
          console.log(`DeepL translation successful (detected language: ${detectedSourceLanguage})`);
          return res.status(200).json({
            translatedText,
            detectedSourceLanguage,
            targetLanguage: targetLang,
            provider: 'deepl'
          });
        }
      } else {
        console.warn('DeepL API error:', deeplResponse.status, await deeplResponse.text());
        // Fall through to try Google Cloud if available
      }
    }

    // Fall back to Google Cloud Translation API
    if (googleApiKey) {
      console.log('Using Google Cloud Translation API');

      const baseUrl = 'https://translation.googleapis.com/language/translate/v2';
      const params = new URLSearchParams({
        key: googleApiKey,
        q: text,
        target: targetLang,
        format: 'text'
      });

      if (sourceLang) {
        params.append('source', sourceLang);
      }

      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Google Translation API error:', response.status, errorData);

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
      const translatedText = data.data?.translations?.[0]?.translatedText;
      const detectedSourceLanguage = data.data?.translations?.[0]?.detectedSourceLanguage;

      if (!translatedText) {
        throw new Error('No translation returned from API');
      }

      console.log(`Google translation successful (detected language: ${detectedSourceLanguage})`);

      return res.status(200).json({
        translatedText,
        detectedSourceLanguage,
        targetLanguage: targetLang,
        provider: 'google'
      });
    }

    // Should never reach here due to earlier check
    throw new Error('No translation provider available');

  } catch (error) {
    console.error('Error in Translation API proxy:', error);
    return res.status(500).json({
      error: 'Failed to translate text',
      message: error.message
    });
  }
}
