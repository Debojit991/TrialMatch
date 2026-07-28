const express = require('express');
const path = require('path');
const router = express.Router();
const prisma = require('../db');
const { validatePatientRegistration } = require('../validators/patient.validator');
const { generateSignedUrl } = require('../services/storage.service');

// POST /api/patients - Register new patient
router.post('/', async (req, res, next) => {
  try {
    const validatedData = validatePatientRegistration(req.body);

    const patient = await prisma.patient.create({
      data: {
        full_name: validatedData.full_name,
        age: validatedData.age,
        gender: validatedData.gender,
        location: validatedData.location,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Patient profile created successfully',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/patients/:id - Update existing patient profile
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = validatePatientRegistration(req.body);

    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found',
      });
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        full_name: validatedData.full_name,
        age: validatedData.age,
        gender: validatedData.gender,
        location: validatedData.location,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Patient profile updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/patients/:id - Retrieve patient profile by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        documents: true,
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found',
      });
    }

    // Attach signed URLs to patient documents
    const reqHost = req.get('host');
    const documentsWithSignedUrls = patient.documents.map((doc) => ({
      ...doc,
      signed_url: generateSignedUrl(path.basename(doc.file_url), reqHost),
    }));

    return res.status(200).json({
      success: true,
      data: {
        ...patient,
        documents: documentsWithSignedUrls,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/patients - List all patients
router.get('/', async (req, res, next) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        documents: true,
      },
    });

    return res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/patients/:id - Complete patient data deletion (Right to be Forgotten)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found',
      });
    }

    // Cascade delete patient and all linked records
    await prisma.patient.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Patient profile and all associated data permanently deleted.',
      patient_id: id,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
