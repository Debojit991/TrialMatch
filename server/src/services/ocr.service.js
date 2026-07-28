const path = require('path');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');

/**
 * Extract text from uploaded document (Image or PDF)
 * @param {Buffer} fileBuffer - Buffer of the uploaded document
 * @param {string} fileType - Normalized file extension (e.g., 'pdf', 'jpeg', 'png', 'jpg')
 * @returns {Promise<string>} Extracted OCR text
 */
async function extractTextFromDocument(fileBuffer, fileType) {
  const normalizedExt = fileType.toLowerCase().replace('.', '');

  try {
    if (normalizedExt === 'pdf') {
      const pdfData = await pdfParse(fileBuffer);
      if (pdfData.text && pdfData.text.trim().length > 0) {
        return pdfData.text.trim();
      }
      return 'PDF parsed: No selectable text found (scanned PDF image).';
    }

    if (['jpg', 'jpeg', 'png'].includes(normalizedExt)) {
      const worker = await Tesseract.createWorker('eng');
      const ret = await worker.recognize(fileBuffer);
      await worker.terminate();
      return ret.data.text.trim();
    }

    return null;
  } catch (error) {
    console.error('OCR Extraction Error:', error.message);
    return `OCR extraction failed: ${error.message}`;
  }
}

module.exports = {
  extractTextFromDocument,
};
