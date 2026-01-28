/**
 * Translation API Proxy
 *
 * This serverless function proxies requests to translation APIs to:
 * 1. Avoid CORS issues
 * 2. Keep API keys secure
 * 3. Translate tweet content for key phrase matching
 *
 * Supports (in order of preference):
 * - MyMemory Translation API (free, no signup required - automatic fallback)
 * - DeepL API (if configured - 500k chars/month free tier)
 * - Google Cloud Translation API v2 (if configured)
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for translation API keys (optional - will use MyMemory as fallback)
  const deeplApiKey = process.env.DEEPL_API_KEY;
  const googleApiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

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

      if (response.ok) {
        const data = await response.json();
        const translatedText = data.data?.translations?.[0]?.translatedText;
        const detectedSourceLanguage = data.data?.translations?.[0]?.detectedSourceLanguage;

        if (translatedText) {
          console.log(`Google translation successful (detected language: ${detectedSourceLanguage})`);

          return res.status(200).json({
            translatedText,
            detectedSourceLanguage,
            targetLanguage: targetLang,
            provider: 'google'
          });
        }
      } else {
        console.warn('Google Cloud API error:', response.status, await response.text());
        // Fall through to MyMemory
      }
    }

    // Final fallback: MyMemory Translation API (free, no signup required)
    console.log('Using MyMemory Translation API (free fallback)');

    // MyMemory uses language pair format (e.g., 'ko|en' for Korean to English)
    const langPair = sourceLang ? `${sourceLang}|${targetLang}` : `|${targetLang}`;
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

    const myMemoryResponse = await fetch(myMemoryUrl);

    if (!myMemoryResponse.ok) {
      throw new Error(`MyMemory API error: ${myMemoryResponse.status}`);
    }

    const myMemoryData = await myMemoryResponse.json();
    const translatedText = myMemoryData.responseData?.translatedText;

    if (!translatedText) {
      throw new Error('No translation returned from MyMemory API');
    }

    // MyMemory sometimes returns the original text if it can't translate
    // Check if translation is different from original
    if (translatedText.toLowerCase() === text.toLowerCase()) {
      console.warn('MyMemory returned same text - no translation available');
    }

    console.log('MyMemory translation successful');

    return res.status(200).json({
      translatedText,
      detectedSourceLanguage: sourceLang || 'unknown',
      targetLanguage: targetLang,
      provider: 'mymemory'
    });

  } catch (error) {
    console.error('Error in Translation API proxy:', error);
    return res.status(500).json({
      error: 'Failed to translate text',
      message: error.message
    });
  }
}
