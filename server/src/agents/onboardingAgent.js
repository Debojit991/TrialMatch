const { GoogleGenAI, Type } = require('@google/genai');

class OnboardingAgentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OnboardingAgentError';
    this.isAiError = true;
  }
}

/**
 * Base64 & Buffer Ingestion Helper
 */
function prepareMediaContent(buffer, mimeType) {
  if (!buffer) return null;
  const base64Data = buffer.toString('base64');
  return {
    inlineData: {
      data: base64Data,
      mimeType: mimeType || 'image/png',
    },
  };
}

/**
 * Document MIME Inspector Tool
 */
function inspectMimeType(mimeType) {
  const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const isSupported = allowed.includes(mimeType?.toLowerCase());
  return {
    mimeType: mimeType || 'application/octet-stream',
    isSupported,
    category: mimeType?.includes('pdf') ? 'document' : 'image',
  };
}

/**
 * JSON Structural Normalizer Tool
 */
function normalizeClinicalExtraction(parsedData) {
  const sanitizeStr = (v, fallback = 'Not specified') => (v && typeof v === 'string' && v.trim() ? v.trim() : fallback);

  let medications = [];
  if (Array.isArray(parsedData.medications_listed)) {
    medications = parsedData.medications_listed.map((m) => String(m).trim());
  } else if (parsedData.medications_listed) {
    medications = [String(parsedData.medications_listed).trim()];
  } else {
    medications = ['None listed'];
  }

  let labValues = 'None listed';
  if (typeof parsedData.key_lab_values === 'object' && parsedData.key_lab_values !== null) {
    labValues = JSON.stringify(parsedData.key_lab_values);
  } else if (parsedData.key_lab_values) {
    labValues = String(parsedData.key_lab_values).trim();
  }

  return {
    suspected_condition: sanitizeStr(parsedData.suspected_condition, 'Not specified'),
    disease_stage: sanitizeStr(parsedData.disease_stage, 'Not specified'),
    diagnosis_date: sanitizeStr(parsedData.diagnosis_date, 'Not specified'),
    medications_listed: JSON.stringify(medications.length > 0 ? medications : ['None listed']),
    key_lab_values: labValues || 'None listed',
    raw_summary: sanitizeStr(parsedData.raw_summary, 'Document text parsed and clinical parameters normalized.'),
  };
}

/**
 * AGENT 1: Multi-Modal Patient Onboarding & Clinical Extraction Agent
 */
async function extractAndNormalizeDoc(concatenatedOcrText, buffer = null, mimeType = 'image/png') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new OnboardingAgentError('GEMINI_API_KEY is not configured in environment variables.');
  }

  const mimeInfo = inspectMimeType(mimeType);
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are Agent 1: Patient Onboarding & Extraction Agent.
Your role is clinical OCR parsing, vision report analysis, and structural data normalization.
Analyze the provided medical report / prescription text and images carefully.

Extracted OCR / Report Text:
"""
${concatenatedOcrText || 'Image / Scan document provided for vision extraction.'}
"""

Extract and normalize the following clinical details strictly:
- suspected_condition: Primary medical condition or diagnosis identified (e.g. Bacterial Pneumonia, Type 2 Diabetes) (string)
- disease_stage: Stage or severity if mentioned, or "Not specified" (string)
- diagnosis_date: Date of diagnosis if mentioned, or "Not specified" (string)
- medications_listed: List of all active medications, normalized dosages, and treatments (array of strings)
- key_lab_values: Summary of key laboratory parameters, test findings, or vital signs (string)
- raw_summary: Comprehensive concise summary of patient clinical report findings (string)
`;

  try {
    const contents = [];
    const mediaPart = prepareMediaContent(buffer, mimeInfo.mimeType);
    if (mediaPart) {
      contents.push(mediaPart);
    }
    contents.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suspected_condition: { type: Type.STRING },
            disease_stage: { type: Type.STRING },
            diagnosis_date: { type: Type.STRING },
            medications_listed: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            key_lab_values: { type: Type.STRING },
            raw_summary: { type: Type.STRING },
          },
          required: [
            'suspected_condition',
            'disease_stage',
            'diagnosis_date',
            'medications_listed',
            'key_lab_values',
            'raw_summary',
          ],
        },
      },
    });

    let text = response.text;
    if (!text && response.candidates && response.candidates[0]?.content?.parts[0]?.text) {
      text = response.candidates[0].content.parts[0].text;
    }

    const rawParsed = JSON.parse(text || '{}');
    return normalizeClinicalExtraction(rawParsed);
  } catch (error) {
    console.error('Agent 1 (Onboarding) Extraction Error:', error.message);
    // Return fallback normalized extraction if vision API encounters transient issue
    return normalizeClinicalExtraction({
      suspected_condition: 'Not specified',
      disease_stage: 'Not specified',
      diagnosis_date: 'Not specified',
      medications_listed: ['None listed'],
      key_lab_values: 'None listed',
      raw_summary: `OCR text parsed: ${concatenatedOcrText ? concatenatedOcrText.substring(0, 100) : 'Document uploaded'}...`,
    });
  }
}

module.exports = {
  OnboardingAgentError,
  extractAndNormalizeDoc,
  inspectMimeType,
  normalizeClinicalExtraction,
};
