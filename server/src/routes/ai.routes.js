const express = require('express');
const router = express.Router();
const prisma = require('../db');
const {
  assessPatientDocuments,
  generateDynamicQuestionnaire,
  crossValidatePatientData,
  matchPatientToTrials,
} = require('../services/ai.service');

// POST /api/patients/:patientId/assess-documents
router.post('/patients/:patientId/assess-documents', async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        documents: {
          where: { upload_status: 'COMPLETED' },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found',
      });
    }

    if (!patient.documents || patient.documents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No completed medical documents found for this patient. Please upload at least one report.',
      });
    }

    const concatenatedOcrText = patient.documents
      .map((doc, idx) => `--- Document ${idx + 1}: ${doc.file_name} ---\n${doc.ocr_extracted_text || ''}`)
      .join('\n\n');

    if (!concatenatedOcrText.trim()) {
      return res.status(400).json({
        success: false,
        error: 'No text content extracted from patient documents to assess.',
      });
    }

    const extractedData = await assessPatientDocuments(concatenatedOcrText);

    const documentAssessment = await prisma.documentAssessment.upsert({
      where: { patient_id: patientId },
      update: {
        suspected_condition: extractedData.suspected_condition,
        disease_stage: extractedData.disease_stage,
        diagnosis_date: extractedData.diagnosis_date,
        medications_listed: extractedData.medications_listed,
        key_lab_values: extractedData.key_lab_values,
        raw_summary: extractedData.raw_summary,
      },
      create: {
        patient_id: patientId,
        suspected_condition: extractedData.suspected_condition,
        disease_stage: extractedData.disease_stage,
        diagnosis_date: extractedData.diagnosis_date,
        medications_listed: extractedData.medications_listed,
        key_lab_values: extractedData.key_lab_values,
        raw_summary: extractedData.raw_summary,
      },
    });

    const questionsArray = await generateDynamicQuestionnaire(
      documentAssessment,
      patient.age,
      patient.gender
    );

    const questionnaire = await prisma.patientQuestionnaire.create({
      data: {
        patient_id: patientId,
        questions: JSON.stringify(questionsArray),
        is_completed: false,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Document assessment completed and dynamic questionnaire generated.',
      data: {
        assessment: documentAssessment,
        questionnaire: {
          id: questionnaire.id,
          patient_id: questionnaire.patient_id,
          questions: questionsArray,
          is_completed: questionnaire.is_completed,
          created_at: questionnaire.created_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/patients/:patientId/questionnaire
router.get('/patients/:patientId/questionnaire', async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const questionnaire = await prisma.patientQuestionnaire.findFirst({
      where: { patient_id: patientId },
      orderBy: { created_at: 'desc' },
    });

    if (!questionnaire) {
      return res.status(404).json({
        success: false,
        error: 'No questionnaire found for this patient. Please trigger document assessment first.',
      });
    }

    let parsedQuestions = [];
    try {
      parsedQuestions = JSON.parse(questionnaire.questions);
    } catch (e) {
      parsedQuestions = [];
    }

    let parsedAnswers = null;
    if (questionnaire.verbatim_answers) {
      try {
        parsedAnswers = JSON.parse(questionnaire.verbatim_answers);
      } catch (e) {
        parsedAnswers = questionnaire.verbatim_answers;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        id: questionnaire.id,
        patient_id: questionnaire.patient_id,
        questions: parsedQuestions,
        verbatim_answers: parsedAnswers,
        is_completed: questionnaire.is_completed,
        created_at: questionnaire.created_at,
        completed_at: questionnaire.completed_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/patients/:patientId/submit-questionnaire
router.post('/patients/:patientId/submit-questionnaire', async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body. "answers" object is required.',
      });
    }

    const questionnaire = await prisma.patientQuestionnaire.findFirst({
      where: { patient_id: patientId },
      orderBy: { created_at: 'desc' },
    });

    if (!questionnaire) {
      return res.status(404).json({
        success: false,
        error: 'No active questionnaire found to submit answers for.',
      });
    }

    let questionsArray = [];
    try {
      questionsArray = JSON.parse(questionnaire.questions);
    } catch (e) {
      questionsArray = [];
    }

    const missingQuestions = [];
    for (const q of questionsArray) {
      const answer = answers[q];
      if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
        missingQuestions.push(q);
      }
    }

    if (missingQuestions.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Questionnaire submission incomplete. Every question requires a valid non-empty answer.',
        missing_questions: missingQuestions,
      });
    }

    const updatedQuestionnaire = await prisma.patientQuestionnaire.update({
      where: { id: questionnaire.id },
      data: {
        verbatim_answers: JSON.stringify(answers),
        is_completed: true,
        completed_at: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Questionnaire submitted successfully.',
      data: {
        id: updatedQuestionnaire.id,
        patient_id: updatedQuestionnaire.patient_id,
        questions: questionsArray,
        verbatim_answers: answers,
        is_completed: updatedQuestionnaire.is_completed,
        completed_at: updatedQuestionnaire.completed_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Phase 3: POST /api/patients/:patientId/cross-validate
router.post('/patients/:patientId/cross-validate', async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const flags = await crossValidatePatientData(patientId);

    return res.status(200).json({
      success: true,
      message: 'AI Cross-validation completed.',
      count: flags.length,
      data: flags,
    });
  } catch (error) {
    next(error);
  }
});

// Phase 3: POST /api/patients/:patientId/find-trials
router.post('/patients/:patientId/find-trials', async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // 1. Automatically run cross-validation if not already run
    const existingFlags = await prisma.discrepancyFlag.findMany({ where: { patient_id: patientId } });
    if (existingFlags.length === 0) {
      try {
        await crossValidatePatientData(patientId);
      } catch (cvErr) {
        console.warn('Auto cross-validation skipped/warning:', cvErr.message);
      }
    }

    // 2. Run Stage 1 & Stage 2 Clinical Trial Matching Engine
    const results = await matchPatientToTrials(patientId);

    return res.status(200).json({
      success: true,
      message: 'Clinical trial matching engine evaluation completed.',
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

// Phase 3: GET /api/patients/:patientId/matches
router.get('/patients/:patientId/matches', async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const matchResults = await prisma.patientMatchResult.findMany({
      where: { patient_id: patientId },
      include: {
        trial: true,
      },
      orderBy: { rank_score: 'desc' },
    });

    const eligible = matchResults.filter((r) => r.eligibility_category === 'ELIGIBLE');
    const lessEligible = matchResults.filter((r) => r.eligibility_category === 'LESS_ELIGIBLE');

    return res.status(200).json({
      success: true,
      data: {
        eligible,
        less_eligible: lessEligible,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
