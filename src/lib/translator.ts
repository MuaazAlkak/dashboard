// MyMemory Translation API Service
// Free tier: 1000 words/day

interface TranslationResponse {
  responseData: {
    translatedText: string;
    match: number;
  };
  responseStatus: number;
}

const TRANSLATION_API = 'https://api.mymemory.translated.net/get';

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  if (!text || text.trim() === '') {
    return '';
  }

  try {
    const url = `${TRANSLATION_API}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Translation API request failed');
    }

    const data: TranslationResponse = await response.json();
    
    if (data.responseStatus !== 200) {
      throw new Error('Translation failed');
    }

    return data.responseData.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error(`Failed to translate to ${targetLang}`);
  }
}

export async function translateToAllLanguages(
  text: string,
  sourceLanguage: 'en' | 'ar' | 'sv'
): Promise<{ en: string; ar: string; sv: string }> {
  const result = {
    en: sourceLanguage === 'en' ? text : '',
    ar: sourceLanguage === 'ar' ? text : '',
    sv: sourceLanguage === 'sv' ? text : '',
  };

  try {
    // Translate to the other two languages
    const targetLanguages = ['en', 'ar', 'sv'].filter(lang => lang !== sourceLanguage) as ('en' | 'ar' | 'sv')[];
    
    const translations = await Promise.all(
      targetLanguages.map(targetLang => translateText(text, sourceLanguage, targetLang))
    );

    targetLanguages.forEach((lang, index) => {
      result[lang] = translations[index];
    });

    return result;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

// Batch translate multiple fields
export async function translateProductFields(
  fields: {
    title?: string;
    description?: string;
  },
  sourceLanguage: 'en' | 'ar' | 'sv'
): Promise<{
  title: { en: string; ar: string; sv: string };
  description: { en: string; ar: string; sv: string };
}> {
  const result = {
    title: { en: '', ar: '', sv: '' },
    description: { en: '', ar: '', sv: '' },
  };

  try {
    // Translate title if provided
    if (fields.title && fields.title.trim()) {
      result.title = await translateToAllLanguages(fields.title, sourceLanguage);
    }

    // Translate description if provided
    if (fields.description && fields.description.trim()) {
      result.description = await translateToAllLanguages(fields.description, sourceLanguage);
    }

    return result;
  } catch (error) {
    console.error('Batch translation error:', error);
    throw error;
  }
}

