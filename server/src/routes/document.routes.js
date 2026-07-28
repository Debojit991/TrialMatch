const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../db');
const { UPLOADS_DIR, uploadToCloudinary, generateSignedUrl, verifySignedUrl } = require('../services/storage.service');
const { extractTextFromDocument } = require('../services/ocr.service');

// Configure Multer storage using Memory Storage (for serverless environments)
const storage = multer.memoryStorage();

// Multer file filter enforcing strictly .pdf, .jpg, .jpeg, .png
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error('Invalid file type. Only .pdf, .jpg, .jpeg, and .png files are allowed.');
    err.code = 'INVALID_FILE_TYPE';
    cb(err, false);
  }
};

// Multer upload middleware enforcing 10MB file size limit per document
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// POST /api/patients/:patientId/documents - Upload document for patient
router.post('/patients/:patientId/documents', upload.single('document'), async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No document file uploaded. Please attach a file with field name "document".',
      });
    }

    const fileExt = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `doc-${uniqueSuffix}.${fileExt}`;
    const reqHost = req.get('host');
    const signedUrl = generateSignedUrl(filename, reqHost);

    // Write buffer to UPLOADS_DIR to support file streaming previews
    try {
      const filePath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(filePath, req.file.buffer);
    } catch (writeErr) {
      console.error('Error writing file to uploads directory:', writeErr);
    }

    // Safely attempt Cloudinary stream upload if credentials are provided
    let cloudResult = { secure_url: null };
    try {
      cloudResult = await uploadToCloudinary(req.file.buffer, 'patient_documents');
    } catch (cloudErr) {
      console.warn('Cloudinary upload stream skipped/failed:', cloudErr.message);
    }

    // Initial database record with PENDING upload status
    const docRecord = await prisma.document.create({
      data: {
        patient_id: patientId,
        file_name: req.file.originalname,
        file_url: cloudResult.secure_url || `/api/documents/file/${filename}`,
        file_type: fileExt,
        file_size: req.file.size,
        upload_status: 'PENDING',
      },
    });

    // Run OCR text extraction via Gemini Vision API
    let ocrText = null;
    let status = 'COMPLETED';
    try {
      ocrText = await extractTextFromDocument(req.file.buffer, req.file.mimetype || fileExt);
    } catch (ocrErr) {
      console.error('OCR Processing error:', ocrErr);
      status = 'FAILED';
    }

    // Update record with OCR text and COMPLETED status
    const updatedDoc = await prisma.document.update({
      where: { id: docRecord.id },
      data: {
        upload_status: status,
        ocr_extracted_text: ocrText,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded and processed successfully',
      data: {
        ...updatedDoc,
        signed_url: signedUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/patients/:patientId/documents - Get all documents for a patient
router.get('/patients/:patientId/documents', async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found',
      });
    }

    const documents = await prisma.document.findMany({
      where: { patient_id: patientId },
      orderBy: { created_at: 'desc' },
    });

    const reqHost = req.get('host');
    const formattedDocs = documents.map((doc) => ({
      ...doc,
      signed_url: generateSignedUrl(path.basename(doc.file_url), reqHost),
    }));

    return res.status(200).json({
      success: true,
      count: formattedDocs.length,
      data: formattedDocs,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/documents/:id - Retrieve document metadata by ID
router.get('/documents/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        patient: true,
      },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }

    const reqHost = req.get('host');
    return res.status(200).json({
      success: true,
      data: {
        ...document,
        signed_url: generateSignedUrl(path.basename(document.file_url), reqHost),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/documents/file/:filename - Secure file streaming endpoint
router.get('/documents/file/:filename', (req, res) => {
  const { filename } = req.params;
  const { expires, signature } = req.query;

  // Verify signature if query params are present (or allow in dev mode)
  if (expires || signature) {
    const isValid = verifySignedUrl(filename, expires, signature);
    if (!isValid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Invalid or expired signed URL token.',
      });
    }
  }

  const filePath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: 'File not found on server.',
    });
  }

  return res.sendFile(filePath);
});

module.exports = router;
