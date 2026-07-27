require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = require('./src/app');
const prisma = require('./src/db');

let server;
const PORT = 5003;

async function runPhase3Tests() {
  console.log('Starting Phase 3 AI Cross-Validation & Trial Matching Engine Verification...\n');

  server = app.listen(PORT, async () => {
    try {
      // 1. Seed clinical trial database
      console.log('Step 1: Running Database Seeder...');
      const seedScript = require('./prisma/seed'); // runs seed script
      const trialCount = await prisma.clinicalTrial.count();
      console.log(`✔ Database contains ${trialCount} clinical trials\n`);

      // 2. Create Test Patient Profile
      console.log('Step 2: Creating Test Patient Profile...');
      const patientRes = await makeRequest('/api/patients', 'POST', {
        full_name: 'David Evans',
        age: 52,
        gender: 'MALE',
        location: 'Chicago, IL',
      });
      assert(patientRes.status === 201, 'Patient creation failed');
      const patient = patientRes.data.data;
      console.log(`✔ Patient created successfully (ID: ${patient.id})\n`);

      // 3. Inject Document Assessment (Document findings: Type 2 Diabetes, HbA1c 9.2%, Metformin 1000mg)
      console.log('Step 3: Creating Document Assessment (Official Medical Report Data)...');
      const docAssessment = await prisma.documentAssessment.create({
        data: {
          patient_id: patient.id,
          suspected_condition: 'Type 2 Diabetes Mellitus',
          disease_stage: 'Uncontrolled Glycemia (HbA1c 9.2%)',
          diagnosis_date: 'March 2022',
          medications_listed: JSON.stringify(['Metformin 1000mg BID', 'Lisinopril 10mg daily']),
          key_lab_values: 'HbA1c 9.2%, Fasting Blood Glucose 190 mg/dL, eGFR 85 mL/min/1.73m2',
          raw_summary: '52-year-old male with persistent hyperglycemia. Currently on dual oral therapy.',
        },
      });
      console.log('✔ Document Assessment stored in DB\n');

      // 4. Inject Patient Questionnaire Answers with Intentional Discrepancies
      // (Patient claims "I believe I have asthma", "No current medications", "Severe wheezing")
      console.log('Step 4: Submitting Patient Questionnaire with Intentional Discrepancies...');
      const sampleQuestions = [
        'What condition do you believe you have?',
        'What active physical symptoms are you currently experiencing?',
        'What medications are you currently taking daily?',
        'Do you have any history of kidney disease or high blood pressure?',
      ];

      const contradictoryAnswers = {
        'What condition do you believe you have?': 'I believe I have severe asthma',
        'What active physical symptoms are you currently experiencing?': 'Frequent shortness of breath and wheezing at night',
        'What medications are you currently taking daily?': 'None, I do not take any daily prescription drugs',
        'Do you have any history of kidney disease or high blood pressure?': 'No history of high blood pressure or kidney issues',
      };

      const questionnaire = await prisma.patientQuestionnaire.create({
        data: {
          patient_id: patient.id,
          questions: JSON.stringify(sampleQuestions),
          verbatim_answers: JSON.stringify(contradictoryAnswers),
          is_completed: true,
          completed_at: new Date(),
        },
      });
      console.log('✔ Questionnaire with contradictory answers stored in DB\n');

      // 5. Trigger AI Cross-Validation (POST /api/patients/:patientId/cross-validate)
      console.log('Step 5: Triggering AI Cross-Validation...');
      console.log('Calling Groq AI to audit document findings vs self-reported answers...');
      const crossValRes = await makeRequest(`/api/patients/${patient.id}/cross-validate`, 'POST');
      assert(crossValRes.status === 200, `Cross-validation failed: ${JSON.stringify(crossValRes.data)}`);

      const flags = crossValRes.data.data;
      assert(Array.isArray(flags) && flags.length > 0, 'Expected discrepancy flags to be detected and saved');
      console.log(`✔ Cross-Validation complete! ${flags.length} Discrepancy Flags Detected:`);
      flags.forEach((f, idx) => {
        console.log(`   Flag ${idx + 1} [${f.severity_level}]: ${f.conflict_topic}`);
        console.log(`      Document Evidence: ${f.document_evidence}`);
        console.log(`      Patient Claim: ${f.patient_claim}`);
      });
      console.log('');

      // 6. Trigger Two-Stage Clinical Trial Matching Engine (POST /api/patients/:patientId/find-trials)
      console.log('Step 6: Triggering Two-Stage Clinical Trial Matching Engine...');
      console.log('Executing Stage 1 SQL Prescreening + Stage 2 AI Criterion Evaluation...');
      const matchRes = await makeRequest(`/api/patients/${patient.id}/find-trials`, 'POST');
      assert(matchRes.status === 200, `Matching engine failed: ${JSON.stringify(matchRes.data)}`);

      const { eligible, less_eligible } = matchRes.data.data;
      console.log(`✔ Matching Engine Complete! Results:`);
      console.log(`   - ELIGIBLE Trials Count: ${eligible ? eligible.length : 0}`);
      console.log(`   - LESS_ELIGIBLE Trials Count: ${less_eligible ? less_eligible.length : 0}\n`);

      if (eligible && eligible.length > 0) {
        console.log('Top ELIGIBLE Trial Match:');
        console.log(`   - Code: ${eligible[0].trial.trial_code}`);
        console.log(`   - Title: ${eligible[0].trial.title}`);
        console.log(`   - Rank Score: ${eligible[0].rank_score}/100`);
        console.log(`   - Explanation: ${eligible[0].criterion_explanation.substring(0, 120)}...\n`);
      }

      if (less_eligible && less_eligible.length > 0) {
        console.log('Sample LESS_ELIGIBLE Trial Match:');
        console.log(`   - Code: ${less_eligible[0].trial.trial_code}`);
        console.log(`   - Title: ${less_eligible[0].trial.title}`);
        console.log(`   - Rank Score: ${less_eligible[0].rank_score}/100`);
        console.log(`   - Explanation: ${less_eligible[0].criterion_explanation.substring(0, 120)}...\n`);
      }

      // 7. Verify GET /api/patients/:patientId/matches
      console.log('Step 7: Verifying GET /api/patients/:patientId/matches Retrieval...');
      const getMatchesRes = await makeRequest(`/api/patients/${patient.id}/matches`, 'GET');
      assert(getMatchesRes.status === 200, 'Fetching stored match results failed');
      assert(getMatchesRes.data.data.eligible !== undefined, 'Response must include eligible array');
      console.log('✔ GET /api/patients/:patientId/matches verified successfully\n');

      console.log('====================================================');
      console.log('PHASE 3 TRIAL MATCHING & CROSS-VALIDATION PASSED! 🎉');
      console.log('====================================================\n');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('❌ Verification Test Failed:', err.message);
      if (server) server.close(() => process.exit(1));
    }
  });
}

function makeRequest(urlPath, method, body = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path: urlPath,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(dataString ? { 'Content-Length': Buffer.byteLength(dataString) } : {}),
        },
      },
      (res) => {
        let responseData = '';
        res.on('data', (chunk) => (responseData += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, data: responseData });
          }
        });
      }
    );

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

runPhase3Tests();
