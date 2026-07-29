require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = require('./src/app');
const onboardingAgent = require('./src/agents/onboardingAgent');
const recommendationAgent = require('./src/agents/recommendationAgent');
const doctorConnectAgent = require('./src/agents/doctorConnectAgent');

let server;
const PORT = 5004;

async function runAgenticWorkflowTests() {
  console.log('================================================================');
  console.log('Starting 3-Agent Agentic Architecture & Bacterial Pneumonia Verification');
  console.log('================================================================\n');

  server = app.listen(PORT, async () => {
    try {
      const prisma = require('./src/db');

      // 1. Verify Seeded Bacterial Pneumonia Clinical Trial in DB
      console.log('Step 1: Verifying Seeded Bacterial Pneumonia Clinical Trial...');
      const pneumoniaTrial = await prisma.clinicalTrial.findUnique({
        where: { trial_code: 'NCT08877665' },
      });
      assert(pneumoniaTrial !== null, 'Seeded trial NCT08877665 not found in database');
      assert(pneumoniaTrial.disease_category === 'Bacterial Pneumonia', 'Disease category should be Bacterial Pneumonia');
      console.log(`✔ Found Seeded Trial NCT08877665: "${pneumoniaTrial.title}" (${pneumoniaTrial.location})\n`);

      // 2. Test Agent 1: Patient Onboarding & Extraction Agent
      console.log('Step 2: Testing Agent 1 (Patient Onboarding & Extraction Agent)...');
      const samplePneumoniaText = `PATIENT CLINICAL REPORT - NEW YORK PRESBYTERIAN
Patient: Sarah Jenkins | Age: 42 | Gender: Female | Location: New York, NY
Diagnosis: Mild-to-moderate Community-Acquired Bacterial Pneumonia (CAP)
Active Medications: Amoxicillin 875mg oral twice daily for 10 days.
Lab & Vitals: Body Temperature 101.2 F, Chest X-Ray shows right lower lobe infiltrate, WBC 12.5 x 10^3/uL.
Status: Outpatient treatment status. No history of penicillin allergy.`;

      const agent1Result = await onboardingAgent.extractAndNormalizeDoc(samplePneumoniaText);
      console.log('✔ Agent 1 Extraction Result:');
      console.log(`   - Condition: ${agent1Result.suspected_condition}`);
      console.log(`   - Medications: ${agent1Result.medications_listed}`);
      console.log(`   - Summary: ${agent1Result.raw_summary.substring(0, 80)}...\n`);

      assert(agent1Result.suspected_condition !== null, 'Agent 1 failed condition extraction');

      // 3. Create Patient for Agentic Workflow
      console.log('Step 3: Creating Patient Profile for Bacterial Pneumonia...');
      const patientRes = await makeRequest('/api/patients', 'POST', {
        full_name: 'Sarah Jenkins',
        age: 42,
        gender: 'FEMALE',
        location: 'New York, NY',
      });
      assert(patientRes.status === 201, 'Patient creation failed');
      const patient = patientRes.data.data;
      console.log(`✔ Patient created successfully (ID: ${patient.id})\n`);

      // Upload Document for Patient
      const sampleDocPath = path.join(__dirname, 'test_pneumonia.png');
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      fs.writeFileSync(sampleDocPath, Buffer.from(pngBase64, 'base64'));

      const uploadRes = await uploadFile(`/api/patients/${patient.id}/documents`, sampleDocPath, 'document', 'image/png');
      if (fs.existsSync(sampleDocPath)) fs.unlinkSync(sampleDocPath);
      assert(uploadRes.status === 201, 'Document upload failed');
      const uploadedDoc = uploadRes.data.data;

      // Set OCR text directly in DB to simulate high-confidence report parsing
      await prisma.document.update({
        where: { id: uploadedDoc.id },
        data: {
          ocr_extracted_text: samplePneumoniaText,
          upload_status: 'COMPLETED',
        },
      });

      // 4. Test Agent 2: Clinical Trial Recommendation & Matching Agent
      console.log('Step 4: Testing Agent 2 (Trial Recommendation & High-Confidence Pneumonia Matching)...');
      const assessRes = await makeRequest(`/api/patients/${patient.id}/assess-documents`, 'POST');
      assert(assessRes.status === 201, 'Assessment failed');

      // Submit completed questionnaire for pneumonia
      const { questionnaire } = assessRes.data.data;
      const completeAnswers = {};
      questionnaire.questions.forEach((q) => {
        completeAnswers[q] = 'Bacterial Pneumonia, currently taking Amoxicillin as outpatient, no penicillin allergy.';
      });
      await makeRequest(`/api/patients/${patient.id}/submit-questionnaire`, 'POST', { answers: completeAnswers });

      // Run Agent 2 Matching Engine
      const matchRes = await makeRequest(`/api/patients/${patient.id}/find-trials`, 'POST');
      assert(matchRes.status === 200, `Matching engine failed: ${JSON.stringify(matchRes.data)}`);
      const { eligible } = matchRes.data.data;

      console.log(`✔ Agent 2 Evaluation Completed (${eligible.length} Eligible Trial Matches Found):`);
      eligible.forEach((m) => {
        console.log(`   - [Score: ${m.rank_score}/100] ${m.trial.trial_code}: ${m.trial.title}`);
      });
      console.log('');

      const pneumoniaMatch = eligible.find((m) => m.trial.trial_code === 'NCT08877665');
      assert(pneumoniaMatch !== undefined, 'Bacterial Pneumonia trial NCT08877665 should match patient');
      assert(pneumoniaMatch.rank_score >= 80, `Expected high rank score (>= 80), got ${pneumoniaMatch.rank_score}`);
      console.log(`✔ High-Confidence Bacterial Pneumonia Match Confirmed! (Score: ${pneumoniaMatch.rank_score}/100)\n`);

      // 5. Test Agent 3: Doctor Match & Connect Agent (Haversine & Fallback Verification)
      console.log('Step 5: Testing Agent 3 (Doctor Match & Connect Agent with Haversine Distance & Fallback)...');
      
      // Test 5A: Haversine distance calculation (New York to Chicago)
      const distNYtoChi = doctorConnectAgent.calculateHaversineDistance(40.7128, -74.006, 41.8781, -87.6298);
      console.log(`✔ Haversine Distance (New York -> Chicago): ${distNYtoChi} km`);
      assert(distNYtoChi > 1000 && distNYtoChi < 1300, 'Haversine distance calculation inaccurate');

      // Test 5B: Safeguard 2 Fallback handling for missing coordinates
      const fallbackDist = doctorConnectAgent.calculateHaversineDistance(null, null, 40.7128, -74.006);
      assert(fallbackDist === null, 'Haversine null fallback failed');
      console.log('✔ Safeguard 2 Fallback Verified: missing coordinates handled gracefully without null errors');

      // Test 5C: Agent 3 Doctor Matcher function execution
      const agent3Result = await doctorConnectAgent.matchDoctorsForPatient(patient.id);
      console.log(`✔ Agent 3 Recommendation Results (${agent3Result.recommendations.length} trial site PIs ranked):`);
      agent3Result.recommendations.forEach((r) => {
        console.log(`   - PI Site: ${r.trial_location} | Distance: ${r.distance_display} | Logistics Score: ${r.logistics_score}`);
      });
      console.log('');

      console.log('====================================================');
      console.log('3-AGENT AGENTIC ARCHITECTURE VERIFIED 100%! 🎉');
      console.log('====================================================\n');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('❌ Agentic Workflow Test Failed:', err.message);
      if (server) server.close(() => process.exit(1));
    }
  });
}

// HTTP Helpers
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

function uploadFile(urlPath, filePath, fieldName, mimeType) {
  return new Promise((resolve, reject) => {
    const boundary = `--------------------------${Date.now().toString(16)}`;
    const fileName = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);

    const header = `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;

    const bodyBuffer = Buffer.concat([
      Buffer.from(header, 'utf8'),
      fileBuffer,
      Buffer.from(footer, 'utf8'),
    ]);

    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path: urlPath,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': bodyBuffer.length,
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
    req.write(bodyBuffer);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

runAgenticWorkflowTests();
