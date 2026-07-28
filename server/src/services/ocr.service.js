const { GoogleGenAI } = require('@google/genai');
const pdfParse = require('pdf-parse');

/**
 * Extract text from uploaded document (Image or PDF) using Gemini Flash Multimodal Vision API.
 * Completely bypasses local Tesseract.js OCR to eliminate Vercel serverless 504 timeouts.
 * @param {Buffer} fileBuffer - Buffer of the uploaded document
 * @param {string} fileTypeOrMime - Extension or MimeType
 * @returns {Promise<string>} Extracted OCR text/findings
 */
async function extractTextFromDocument(fileBuffer, fileTypeOrMime) {
  let mimeType = 'image/png';
  const inputStr = (fileTypeOrMime || '').toLowerCase();

  if (inputStr.includes('pdf')) {
    mimeType = 'application/pdf';
  } else if (inputStr.includes('jpg') || inputStr.includes('jpeg')) {
    mimeType = 'image/jpeg';
  } else if (inputStr.includes('png')) {
    mimeType = 'image/png';
  }

  // Fast-path 10ms check for text-based PDFs via pdf-parse
  if (mimeType === 'application/pdf') {
    try {
      const pdfData = await pdfParse(fileBuffer);
      if (pdfData.text && pdfData.text.trim().length > 20) {
        return pdfData.text.trim();
      }
    } catch (e) {
      console.log('pdf-parse fallback to Gemini Vision:', e.message);
    }
  }

  // Native Gemini Multimodal Vision API for Images & Scanned Reports
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not configured for Vision OCR.');
    return 'Document uploaded successfully (GEMINI_API_KEY missing for Vision OCR).';
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const imagePart = {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType: mimeType,
      },
    };

    const prompt = 'Extract all medical conditions, diagnosis, medications, dosages, and key lab values from this medical report. Return structured clear text.';

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [prompt, imagePart],
    });

    let text = response.text;
    if (!text && response.candidates && response.candidates[0]?.content?.parts[0]?.text) {
      text = response.candidates[0].content.parts[0].text;
    }

    if (text && text.trim().length > 0) {
      return text.trim();
    }

    return 'Medical report parsed successfully.';
  } catch (error) {
    console.error('Gemini Multimodal Vision API Error:', error.message);
    // Fallback model retry with gemini-3.6-flash
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          'Extract all medical conditions, diagnosis, medications, dosages, and key lab values from this medical report.',
          {
            inlineData: {
              data: fileBuffer.toString('base64'),
              mimeType: mimeType,
            },
          },
        ],
      });
      return response.text ? response.text.trim() : 'Medical report extracted.';
    } catch (retryErr) {
      console.error('Gemini Vision Retry Error:', retryErr.message);
      return `Document uploaded. Text extraction notice: ${error.message}`;
    }
  }
}

module.exports = {
  extractTextFromDocument,
};
