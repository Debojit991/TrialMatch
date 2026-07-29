const prisma = require('../db');
const onboardingAgent = require('../agents/onboardingAgent');
const recommendationAgent = require('../agents/recommendationAgent');
const doctorConnectAgent = require('../agents/doctorConnectAgent');

class DocumentAssessmentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DocumentAssessmentError';
    this.isAiError = true;
  }
}

/**
 * Merge newly extracted medical assessment with existing Master Patient Profile
 * Ensures unique condition and medication deduplication.
 */
function mergeAssessmentData(existing, newData) {
  if (!existing) return newData;

  const extractConditions = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    val = String(val).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return val.split(/[,;\n]+/).map((s) => s.trim());
  };

  const existingConds = extractConditions(existing.suspected_condition);
  const newConds = extractConditions(newData.suspected_condition);
  const seenConds = new Set();
  const mergedConds = [];

  [...existingConds, ...newConds].forEach((c) => {
    const trimmed = String(c || '').trim();
    const lower = trimmed.toLowerCase();
    if (trimmed && lower !== 'not specified' && lower !== 'unknown' && lower !== 'none listed' && !seenConds.has(lower)) {
      seenConds.add(lower);
      mergedConds.push(trimmed);
    }
  });

  const finalCondition = mergedConds.length === 0
    ? (newData.suspected_condition || existing.suspected_condition || 'Not specified')
    : mergedConds.length === 1
      ? mergedConds[0]
      : JSON.stringify(mergedConds);

  const extractMedications = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    val = String(val).trim();
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    return val.split(/[,;\n]+/).map((s) => s.trim());
  };

  const existingMeds = extractMedications(existing.medications_listed);
  const newMeds = extractMedications(newData.medications_listed);
  const seenMeds = new Set();
  const mergedMeds = [];

  [...existingMeds, ...newMeds].forEach((m) => {
    const trimmed = String(m || '').trim();
    const lower = trimmed.toLowerCase();
    if (trimmed && lower !== 'none listed' && lower !== 'not specified' && !seenMeds.has(lower)) {
      seenMeds.add(lower);
      mergedMeds.push(trimmed);
    }
  });

  const finalMedications = JSON.stringify(mergedMeds.length > 0 ? mergedMeds : ['None listed']);

  let finalLabValues = existing.key_lab_values || 'None listed';
  const newLab = newData.key_lab_values || '';
  if (newLab && newLab !== 'None listed' && newLab !== 'Not specified') {
    if (!finalLabValues || finalLabValues === 'None listed' || finalLabValues === 'Not specified') {
      finalLabValues = newLab;
    } else if (!finalLabValues.includes(newLab)) {
      finalLabValues = `${finalLabValues} | ${newLab}`;
    }
  }

  const finalStage = (newData.disease_stage && newData.disease_stage !== 'Not specified')
    ? newData.disease_stage
    : (existing.disease_stage || 'Not specified');

  const finalDate = (newData.diagnosis_date && newData.diagnosis_date !== 'Not specified')
    ? newData.diagnosis_date
    : (existing.diagnosis_date || 'Not specified');

  let finalSummary = existing.raw_summary || '';
  const newSummary = newData.raw_summary || '';
  if (newSummary && !finalSummary.includes(newSummary)) {
    finalSummary = finalSummary ? `${finalSummary}\n\n[Updated Report Summary]: ${newSummary}` : newSummary;
  }

  return {
    suspected_condition: finalCondition,
    disease_stage: finalStage,
    diagnosis_date: finalDate,
    medications_listed: finalMedications,
    key_lab_values: finalLabValues,
    raw_summary: finalSummary,
  };
}

/**
 * Delegate document extraction to AGENT 1 (Patient Onboarding & Extraction Agent)
 */
async function assessPatientDocuments(concatenatedOcrText, buffer = null, mimeType = 'image/png') {
  return await onboardingAgent.extractAndNormalizeDoc(concatenatedOcrText, buffer, mimeType);
}

/**
 * Delegate dynamic questionnaire generation to AGENT 2 (Clinical Trial Recommendation & Matching Agent)
 */
async function generateDynamicQuestionnaire(documentAssessment, patientAge, patientGender) {
  return await recommendationAgent.generateDynamicQuestionnaire(documentAssessment, patientAge, patientGender);
}

/**
 * Delegate AI cross-validation to AGENT 2
 */
async function crossValidatePatientData(patientId) {
  return await recommendationAgent.crossValidatePatientData(patientId);
}

/**
 * Delegate clinical trial matching engine evaluation to AGENT 2
 */
async function matchPatientToTrials(patientId) {
  return await recommendationAgent.matchPatientToTrials(patientId);
}

/**
 * Delegate doctor logistics matching to AGENT 3 (Doctor Match & Connect Agent)
 */
async function matchDoctorsForPatient(patientId, maxBudget = null) {
  return await doctorConnectAgent.matchDoctorsForPatient(patientId, maxBudget);
}

/**
 * Orchestrated Agentic Workflow:
 * Agent 1 (Extract) -> Agent 2 (Match & Screen) -> Agent 3 (Doctor Connect)
 */
async function runAgenticWorkflow(patientId, concatenatedOcrText, buffer = null, mimeType = 'image/png') {
  // Agent 1: Extraction & Normalization
  const extractedData = await assessPatientDocuments(concatenatedOcrText, buffer, mimeType);

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { documentAssessment: true },
  });

  const mergedData = mergeAssessmentData(patient?.documentAssessment, extractedData);
  const documentAssessment = await prisma.documentAssessment.upsert({
    where: { patient_id: patientId },
    update: mergedData,
    create: { patient_id: patientId, ...mergedData },
  });

  // Agent 2: Dynamic Questionnaire Generation
  const questionsArray = await generateDynamicQuestionnaire(
    documentAssessment,
    patient?.age || 45,
    patient?.gender || 'MALE'
  );

  const questionnaire = await prisma.patientQuestionnaire.create({
    data: {
      patient_id: patientId,
      questions: JSON.stringify(questionsArray),
      is_completed: false,
    },
  });

  // Agent 3: Doctor Proximity & Budget Matchmaker
  let doctorConnections = null;
  try {
    doctorConnections = await matchDoctorsForPatient(patientId);
  } catch (drErr) {
    console.warn('Agent 3 doctor connection warning:', drErr.message);
  }

  return {
    assessment: documentAssessment,
    questionnaire: {
      id: questionnaire.id,
      patient_id: questionnaire.patient_id,
      questions: questionsArray,
      is_completed: questionnaire.is_completed,
      created_at: questionnaire.created_at,
    },
    doctor_connections: doctorConnections,
  };
}

module.exports = {
  DocumentAssessmentError,
  assessPatientDocuments,
  generateDynamicQuestionnaire,
  crossValidatePatientData,
  matchPatientToTrials,
  matchDoctorsForPatient,
  mergeAssessmentData,
  runAgenticWorkflow,
  onboardingAgent,
  recommendationAgent,
  doctorConnectAgent,
};
