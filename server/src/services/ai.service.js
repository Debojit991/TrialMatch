const { GoogleGenAI, Type } = require('@google/genai');
const Groq = require('groq-sdk');
const prisma = require('../db');

class DocumentAssessmentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DocumentAssessmentError';
    this.isAiError = true;
  }
}

/**
 * Perform deep medical document assessment using Google Gemini (gemini-3.6-flash)
 */
async function assessPatientDocuments(concatenatedOcrText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new DocumentAssessmentError('GEMINI_API_KEY is not configured in environment variables');
    throw err;
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a medical AI assistant specializing in clinical document parsing.
Analyze the following concatenated text extracted from medical reports, prescriptions, and lab results.
Summarize written report text ONLY. Do NOT attempt to interpret unreadable scans.

Report Text:
"""
${concatenatedOcrText}
"""

Extract the following details accurately:
- suspected_condition: Primary medical condition or diagnosis identified (string)
- disease_stage: Stage or severity of the disease if mentioned, or "Not specified" (string)
- diagnosis_date: Date of diagnosis if mentioned, or "Not specified" (string)
- medications_listed: List of all active medications, dosages, and treatments mentioned (array of strings)
- key_lab_values: Summary of key laboratory parameters, test findings, or biomarkers (string)
- raw_summary: Comprehensive concise summary of patient medical history from documents (string)
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
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

    const parsedData = JSON.parse(text);
    return {
      suspected_condition: parsedData.suspected_condition || 'Not specified',
      disease_stage: parsedData.disease_stage || 'Not specified',
      diagnosis_date: parsedData.diagnosis_date || 'Not specified',
      medications_listed: Array.isArray(parsedData.medications_listed)
        ? JSON.stringify(parsedData.medications_listed)
        : JSON.stringify([parsedData.medications_listed || 'None listed']),
      key_lab_values: typeof parsedData.key_lab_values === 'object'
        ? JSON.stringify(parsedData.key_lab_values)
        : String(parsedData.key_lab_values || 'None listed'),
      raw_summary: parsedData.raw_summary || 'Document text parsed.',
    };
  } catch (error) {
    console.error('Gemini document extraction error:', error);
    const err = new DocumentAssessmentError(`Gemini document assessment failed: ${error.message}`);
    throw err;
  }
}

/**
 * Generate dynamic screening questionnaire using Groq (llama-3.3-70b-versatile)
 */
async function generateDynamicQuestionnaire(documentAssessment, patientAge, patientGender) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const err = new Error('GROQ_API_KEY is not configured in environment variables');
    err.isAiError = true;
    throw err;
  }

  const groq = new Groq({ apiKey });

  const systemMessage = `You are a clinical trial matching assistant.
Generate dynamic screening questions for a patient based on their medical document findings and demographic info.

STRICT MANDATORY CONSTRAINTS:
1. Output MUST be a JSON object containing a "questions" key with a JSON array of strings: {"questions": ["Q1", "Q2", ...]}
2. Generate EXACTLY between 5 and 7 questions total.
3. Question 1 MUST BE EXACTLY: "What condition do you believe you have?"
4. Include questions asking about active physical symptoms, symptom severity, and duration.
5. Include questions seeking critical details missing from document findings.
6. Do NOT include markdown codeblocks or extra conversational text.`;

  const userPrompt = `Patient Details:
- Age: ${patientAge}
- Gender: ${patientGender}
- Suspected Condition: ${documentAssessment.suspected_condition || 'Unknown'}
- Disease Stage: ${documentAssessment.disease_stage || 'Unknown'}
- Diagnosis Date: ${documentAssessment.diagnosis_date || 'Unknown'}
- Medications: ${documentAssessment.medications_listed}
- Lab Values: ${documentAssessment.key_lab_values}
- Summary: ${documentAssessment.raw_summary}

Generate the JSON array of 5-7 questions now.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(content);
    let questions = parsed.questions || parsed.questionnaire || parsed;

    if (!Array.isArray(questions)) {
      if (typeof parsed === 'object') {
        questions = Object.values(parsed).find((v) => Array.isArray(v)) || [];
      }
    }

    const mandatoryQ1 = 'What condition do you believe you have?';
    if (!questions || questions.length === 0) {
      questions = [
        mandatoryQ1,
        'What active physical symptoms are you currently experiencing?',
        'How would you rate the severity of your current symptoms on a scale of 1-10?',
        'Have you tried any new medications not listed in your reports?',
        'Have you previously participated in any clinical trials?',
      ];
    } else {
      if (questions[0] !== mandatoryQ1) {
        questions = [mandatoryQ1, ...questions.filter((q) => q !== mandatoryQ1)];
      }
    }

    if (questions.length < 5) {
      const extraFallbackQuestions = [
        'How long have you been experiencing your primary symptoms?',
        'Do you have any known drug allergies or contraindications?',
        'Are you able to travel to a trial location if required?',
      ];
      for (const extraQ of extraFallbackQuestions) {
        if (questions.length >= 5) break;
        if (!questions.includes(extraQ)) questions.push(extraQ);
      }
    } else if (questions.length > 7) {
      questions = questions.slice(0, 7);
    }

    return questions;
  } catch (error) {
    console.error('Groq questionnaire generation error:', error);
    const err = new Error(`Groq questionnaire generation failed: ${error.message}`);
    err.isAiError = true;
    throw err;
  }
}

/**
 * Phase 3: AI Cross-Validation Service
 */
async function crossValidatePatientData(patientId) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      documentAssessment: true,
      questionnaires: {
        where: { is_completed: true },
        orderBy: { completed_at: 'desc' },
      },
    },
  });

  if (!patient || !patient.documentAssessment) {
    throw new Error('Patient or Document Assessment not found. Run document assessment first.');
  }

  const activeQuestionnaire = patient.questionnaires[0];
  if (!activeQuestionnaire || !activeQuestionnaire.verbatim_answers) {
    throw new Error('No completed questionnaire found for patient cross-validation.');
  }

  const assessment = patient.documentAssessment;
  const answers = JSON.parse(activeQuestionnaire.verbatim_answers);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const err = new Error('GROQ_API_KEY is not configured in environment variables');
    err.isAiError = true;
    throw err;
  }

  const groq = new Groq({ apiKey });

  const systemPrompt = `You are a clinical data auditor and cross-validation AI.
Your job is to compare official medical report findings against self-reported patient questionnaire answers.
Detect contradictions, discrepancies, or conflicts between what the medical files state and what the patient typed.

STRICT CONSTRAINTS:
Output MUST be a JSON object containing a "discrepancies" key with an array of discrepancy objects:
{
  "discrepancies": [
    {
      "severity_level": "HIGH" | "MEDIUM" | "LOW",
      "conflict_topic": "Short Topic Title (e.g. Primary Diagnosis Mismatch)",
      "document_evidence": "Exact or summarized statement from official medical reports",
      "patient_claim": "Exact or summarized statement typed by the patient"
    }
  ]
}
If no discrepancies are found, return {"discrepancies": []}.`;

  const userPrompt = `Medical Document Findings:
- Suspected Condition: ${assessment.suspected_condition}
- Stage: ${assessment.disease_stage}
- Diagnosis Date: ${assessment.diagnosis_date}
- Medications Listed: ${assessment.medications_listed}
- Lab Values: ${assessment.key_lab_values}
- Summary: ${assessment.raw_summary}

Patient Questionnaire Self-Reported Answers:
${JSON.stringify(answers, null, 2)}

Analyze for contradictions now.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(content);
    const discrepancies = parsed.discrepancies || [];

    await prisma.discrepancyFlag.deleteMany({
      where: { patient_id: patientId },
    });

    const savedFlags = [];
    for (const d of discrepancies) {
      const createdFlag = await prisma.discrepancyFlag.create({
        data: {
          patient_id: patientId,
          severity_level: d.severity_level || 'MEDIUM',
          conflict_topic: d.conflict_topic || 'Data Discrepancy',
          document_evidence: d.document_evidence || 'Report finding',
          patient_claim: d.patient_claim || 'Patient response',
        },
      });
      savedFlags.push(createdFlag);
    }

    return savedFlags;
  } catch (error) {
    console.error('Cross-validation error:', error);
    const err = new Error(`Cross-validation failed: ${error.message}`);
    err.isAiError = true;
    throw err;
  }
}

/**
 * Phase 3: Two-Stage Clinical Trial Matching Engine
 */
async function matchPatientToTrials(patientId) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      documentAssessment: true,
      questionnaires: {
        where: { is_completed: true },
        orderBy: { completed_at: 'desc' },
      },
      discrepancyFlags: true,
    },
  });

  if (!patient || !patient.documentAssessment) {
    throw new Error('Patient profile or document assessment missing for matching.');
  }

  // Stage 1 SQL Query
  const candidateTrials = await prisma.clinicalTrial.findMany({
    where: {
      status: 'RECRUITING',
      min_age: { lte: patient.age },
      max_age: { gte: patient.age },
      OR: [
        { gender_requirement: 'ALL' },
        { gender_requirement: patient.gender },
      ],
    },
  });

  if (candidateTrials.length === 0) {
    await prisma.patientMatchResult.deleteMany({ where: { patient_id: patientId } });
    return { eligible: [], less_eligible: [] };
  }

  // Stage 2 AI Evaluation
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const err = new Error('GROQ_API_KEY is not configured in environment variables');
    err.isAiError = true;
    throw err;
  }

  const groq = new Groq({ apiKey });

  const activeQuestionnaire = patient.questionnaires[0];
  const verbatimAnswers = activeQuestionnaire ? JSON.parse(activeQuestionnaire.verbatim_answers || '{}') : {};

  const systemPrompt = `You are a Senior Clinical Trial Eligibility Matching AI and Oncologist/Cardiologist.
Evaluate a patient against candidate clinical trials.
For each candidate trial, evaluate inclusion and exclusion criteria against the patient's data.

Categorize each trial into:
- "ELIGIBLE": Patient meets primary inclusion criteria and has no major exclusion criteria breaches.
- "LESS_ELIGIBLE": Patient fails one or more criteria, has age/disease stage borderline status, or has HIGH severity discrepancy flags requiring doctor review.

Assign a rank_score (1 to 100).
Generate a clear, detailed, human-readable "criterion_explanation" listing specifically WHICH criteria PASSED, WHICH FAILED, and any DISCREPANCIES detected.

STRICT CONSTRAINTS:
Output MUST be a JSON object containing an "evaluations" array:
{
  "evaluations": [
    {
      "trial_id": "Exact Trial ID string provided in prompt",
      "eligibility_category": "ELIGIBLE" | "LESS_ELIGIBLE",
      "rank_score": 85,
      "criterion_explanation": "Detailed step-by-step criterion evaluation summary..."
    }
  ]
}`;

  const userPrompt = `Patient Demographic & Medical Profile:
- Age: ${patient.age}
- Gender: ${patient.gender}
- Location: ${patient.location}
- Medical Document Suspected Condition: ${patient.documentAssessment.suspected_condition}
- Disease Stage: ${patient.documentAssessment.disease_stage}
- Diagnosis Date: ${patient.documentAssessment.diagnosis_date}
- Medications: ${patient.documentAssessment.medications_listed}
- Lab Values: ${patient.documentAssessment.key_lab_values}
- Summary: ${patient.documentAssessment.raw_summary}

Patient Self-Reported Questionnaire Answers:
${JSON.stringify(verbatimAnswers, null, 2)}

Audited Discrepancy Flags:
${JSON.stringify(patient.discrepancyFlags, null, 2)}

Candidate Clinical Trials to Evaluate:
${JSON.stringify(
  candidateTrials.map((t) => ({
    id: t.id,
    trial_code: t.trial_code,
    title: t.title,
    disease_category: t.disease_category,
    phase: t.phase,
    inclusion_criteria: JSON.parse(t.inclusion_criteria),
    exclusion_criteria: JSON.parse(t.exclusion_criteria),
  })),
  null,
  2
)}

Perform Stage 2 criterion evaluation now.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(content);
    const evaluations = parsed.evaluations || [];

    await prisma.patientMatchResult.deleteMany({
      where: { patient_id: patientId },
    });

    const createdResults = [];
    for (const evalItem of evaluations) {
      const trialObj = candidateTrials.find((t) => t.id === evalItem.trial_id || t.trial_code === evalItem.trial_id);
      if (!trialObj) continue;

      const created = await prisma.patientMatchResult.create({
        data: {
          patient_id: patientId,
          trial_id: trialObj.id,
          eligibility_category: evalItem.eligibility_category === 'ELIGIBLE' ? 'ELIGIBLE' : 'LESS_ELIGIBLE',
          rank_score: Math.min(100, Math.max(1, parseInt(evalItem.rank_score, 10) || 50)),
          criterion_explanation: evalItem.criterion_explanation || 'Evaluation completed.',
        },
        include: {
          trial: true,
        },
      });
      createdResults.push(created);
    }

    const eligible = createdResults
      .filter((r) => r.eligibility_category === 'ELIGIBLE')
      .sort((a, b) => b.rank_score - a.rank_score);

    const lessEligible = createdResults
      .filter((r) => r.eligibility_category === 'LESS_ELIGIBLE')
      .sort((a, b) => b.rank_score - a.rank_score);

    return {
      eligible,
      less_eligible: lessEligible,
    };
  } catch (error) {
    console.error('Stage 2 Trial Matching error:', error);
    const err = new Error(`Trial matching failed: ${error.message}`);
    err.isAiError = true;
    throw err;
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

module.exports = {
  DocumentAssessmentError,
  assessPatientDocuments,
  generateDynamicQuestionnaire,
  crossValidatePatientData,
  matchPatientToTrials,
  mergeAssessmentData,
};
