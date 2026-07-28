const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { generateSignedUrl } = require('../services/storage.service');
const path = require('path');

// GET /api/doctors/applications - Fetch all patient applications for clinician review queue
router.get('/applications', async (req, res, next) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        documents: true,
        documentAssessment: true,
        questionnaires: {
          orderBy: { created_at: 'desc' },
        },
        discrepancyFlags: {
          orderBy: { created_at: 'desc' },
        },
        matchResults: {
          include: {
            trial: true,
            doctorReview: true,
          },
          orderBy: { rank_score: 'desc' },
        },
      },
    });

    // Format queue response
    const formattedApplications = patients.map((p) => {
      const activeQuestionnaire = p.questionnaires.find((q) => q.is_completed) || p.questionnaires[0] || null;
      let parsedAnswers = null;
      if (activeQuestionnaire && activeQuestionnaire.verbatim_answers) {
        try {
          parsedAnswers = JSON.parse(activeQuestionnaire.verbatim_answers);
        } catch (e) {
          parsedAnswers = activeQuestionnaire.verbatim_answers;
        }
      }

      return {
        patient_id: p.id,
        full_name: p.full_name,
        age: p.age,
        gender: p.gender,
        location: p.location,
        created_at: p.created_at,
        documents: p.documents.map((d) => ({
          ...d,
          signed_url: generateSignedUrl(path.basename(d.file_url), req.get('host')),
        })),
        document_assessment: p.documentAssessment,
        questionnaire: activeQuestionnaire
          ? {
              id: activeQuestionnaire.id,
              questions: JSON.parse(activeQuestionnaire.questions || '[]'),
              verbatim_answers: parsedAnswers,
              is_completed: activeQuestionnaire.is_completed,
            }
          : null,
        discrepancy_flags: p.discrepancyFlags,
        discrepancy_count: p.discrepancyFlags.length,
        high_severity_count: p.discrepancyFlags.filter((f) => f.severity_level === 'HIGH').length,
        match_results: p.matchResults,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedApplications.length,
      data: formattedApplications,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/doctors/reviews - Submit/update clinician review decision
router.post('/reviews', async (req, res, next) => {
  try {
    const { match_result_id, doctor_decision, doctor_notes } = req.body;

    if (!match_result_id) {
      return res.status(400).json({
        success: false,
        error: '"match_result_id" is required.',
      });
    }

    const validDecisions = ['APPROVED', 'REJECTED', 'MORE_INFO_NEEDED'];
    if (!doctor_decision || !validDecisions.includes(doctor_decision)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid "doctor_decision". Must be APPROVED, REJECTED, or MORE_INFO_NEEDED.',
      });
    }

    // Verify match result exists
    const matchResult = await prisma.patientMatchResult.findUnique({
      where: { id: match_result_id },
    });

    if (!matchResult) {
      return res.status(404).json({
        success: false,
        error: 'Patient match result not found.',
      });
    }

    // Upsert DoctorReview record
    const review = await prisma.doctorReview.upsert({
      where: { match_result_id },
      update: {
        doctor_decision,
        doctor_notes: doctor_notes || null,
        reviewed_at: new Date(),
      },
      create: {
        match_result_id,
        doctor_decision,
        doctor_notes: doctor_notes || null,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Doctor review updated to ${doctor_decision}.`,
      data: review,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
