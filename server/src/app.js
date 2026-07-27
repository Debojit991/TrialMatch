const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const multer = require('multer');
const { ZodError } = require('zod');
const logger = require('./utils/logger');

const patientRoutes = require('./routes/patient.routes');
const documentRoutes = require('./routes/document.routes');
const aiRoutes = require('./routes/ai.routes');
const doctorRoutes = require('./routes/doctor.routes');

const app = express();

// 1. Security Headers (Helmet)
app.use(helmet());

// 2. HTTP Request Logging (Morgan)
app.use(morgan('combined'));

// 3. Global Rate Limiting (100 requests per 15 minutes per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});
app.use('/api', globalLimiter);

// 4. Stricter AI Rate Limiter for Heavy AI Endpoints (10 requests per 1 minute per IP)
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many AI processing requests. Please wait a minute before trying again.',
  },
});
app.use('/api/patients/:patientId/assess-documents', aiLimiter);
app.use('/api/patients/:patientId/find-trials', aiLimiter);
app.use('/api/patients/:patientId/cross-validate', aiLimiter);

// 5. Body Parsing & XSS Sanitization
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(xss());

// Root Endpoint
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'TrialMatch+ API Service is live.' });
});

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'TrialMatch API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api', documentRoutes);
app.use('/api', aiRoutes);

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(err.message || 'Server Error', err);

  // Zod Schema Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: formattedErrors,
    });
  }

  // Multer File Size Exceeded Error
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size limit exceeded. Maximum allowed size is 10MB per document.',
      });
    }
    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`,
    });
  }

  // Custom File Type Error
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  // Custom AI Service Error -> 502 Bad Gateway
  if (err.name === 'DocumentAssessmentError' || err.isAiError) {
    return res.status(502).json({
      success: false,
      error: 'Our AI engine is currently experiencing high load while analyzing your request. Please try again in a moment.',
    });
  }

  // Generic 500 Server Error
  return res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

module.exports = app;
