require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = require('./src/app');

let server;
const PORT = 5002;

async function runPhase2Tests() {
  console.log('Starting Phase 2 End-to-End Multi-Model AI Verification...\n');

  server = app.listen(PORT, async () => {
    try {
      // 1. Create Patient
      console.log('Step 1: Creating Test Patient Profile...');
      const patientRes = await makeRequest('/api/patients', 'POST', {
        full_name: 'Robert Miller',
        age: 58,
        gender: 'MALE',
        location: 'Chicago, IL',
      });
      assert(patientRes.status === 201, 'Patient creation failed');
      const patient = patientRes.data.data;
      console.log(`✔ Patient created successfully (ID: ${patient.id})\n`);

      // 2. Upload Sample Medical Document with Detailed Medical Text for OCR
      console.log('Step 2: Uploading Sample Medical Document...');
      const sampleDocPath = path.join(__dirname, 'test_report.png');
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      fs.writeFileSync(sampleDocPath, Buffer.from(pngBase64, 'base64'));

      const uploadRes = await uploadFile(`/api/patients/${patient.id}/documents`, sampleDocPath, 'document', 'image/png');
      fs.unlinkSync(sampleDocPath);
      assert(uploadRes.status === 201, 'Document upload failed');
      const uploadedDoc = uploadRes.data.data;
      console.log(`✔ Document uploaded (ID: ${uploadedDoc.id})\n`);

      // Manually set medical report OCR text directly in DB to simulate high-quality OCR report
      const prisma = require('./src/db');
      const sampleOcrReport = `PATIENT REPORT - METROPOLITAN HOSPITAL
Patient: Robert Miller | Age: 58 | Gender: Male
Diagnosis: Type 2 Diabetes Mellitus with Peripheral Neuropathy
Stage: Moderate, HbA1c 8.8%
Diagnosis Date: October 14, 2021
Active Medications: Metformin 1000mg BID, Glipizide 5mg daily, Lisinopril 10mg daily.
Lab Findings: Fasting Blood Glucose 185 mg/dL, eGFR 72 mL/min/1.73m2, LDL Cholesterol 130 mg/dL.
Summary: Patient presents with persistent numbness in bilateral lower extremities and fatigue. Uncontrolled hyperglycemia despite dual oral anti-diabetic therapy.`;

      await prisma.document.update({
        where: { id: uploadedDoc.id },
        data: {
          ocr_extracted_text: sampleOcrReport,
          upload_status: 'COMPLETED',
        },
      });
      console.log('✔ Simulated rich OCR text injected into patient document\n');

      // 3. Trigger Gemini Document Assessment & Groq Dynamic Questionnaire
      console.log('Step 3: Triggering Gemini Document Assessment & Groq Questionnaire Generation...');
      console.log('Calling Google Gemini (gemini-3.6-flash) & Groq (llama-3.3-70b-versatile)...');
      const assessRes = await makeRequest(`/api/patients/${patient.id}/assess-documents`, 'POST');
      
      assert(assessRes.status === 201, `Document assessment failed with status ${assessRes.status}: ${JSON.stringify(assessRes.data)}`);
      const { assessment, questionnaire } = assessRes.data.data;

      console.log('✔ Gemini Deep Extraction Result:');
      console.log(`   - Suspected Condition: ${assessment.suspected_condition}`);
      console.log(`   - Disease Stage: ${assessment.disease_stage}`);
      console.log(`   - Diagnosis Date: ${assessment.diagnosis_date}`);
      console.log(`   - Medications Listed: ${assessment.medications_listed}`);
      console.log(`   - Lab Values: ${assessment.key_lab_values}`);
      console.log(`   - Summary: ${assessment.raw_summary.substring(0, 80)}...\n`);

      assert(questionnaire.questions && questionnaire.questions.length >= 5 && questionnaire.questions.length <= 7, 
        `Expected 5-7 questions from Groq, got ${questionnaire.questions ? questionnaire.questions.length : 0}`);
      
      console.log(`✔ Groq Dynamic Questionnaire Generated (${questionnaire.questions.length} questions):`);
      questionnaire.questions.forEach((q, idx) => console.log(`   Q${idx + 1}: ${q}`));
      console.log('');

      // Rule 1 Assertion: Q1 must be "What condition do you believe you have?"
      assert(questionnaire.questions[0] === 'What condition do you believe you have?', 'Q1 MUST be "What condition do you believe you have?"');
      console.log('✔ Rule 1 verified: Q1 matches mandatory string\n');

      // 4. Test Incomplete Questionnaire Submission Rejection (400 Bad Request)
      console.log('Step 4: Testing Incomplete Questionnaire Submission Rejection...');
      const incompleteAnswers = {
        [questionnaire.questions[0]]: 'Type 2 Diabetes',
        // Omitting other questions
      };
      const incompleteRes = await makeRequest(`/api/patients/${patient.id}/submit-questionnaire`, 'POST', { answers: incompleteAnswers });
      assert(incompleteRes.status === 400, 'Incomplete questionnaire should return 400 Bad Request');
      assert(incompleteRes.data.error.includes('incomplete'), 'Should report incomplete questionnaire');
      console.log('✔ Incomplete submission correctly rejected with 400 Bad Request\n');

      // 5. Test Valid Full Questionnaire Submission
      console.log('Step 5: Testing Valid Full Questionnaire Submission...');
      const completeAnswers = {};
      questionnaire.questions.forEach((q, idx) => {
        completeAnswers[q] = `Test response answer for Q${idx + 1} (${q.substring(0, 20)}...)`;
      });

      const completeRes = await makeRequest(`/api/patients/${patient.id}/submit-questionnaire`, 'POST', { answers: completeAnswers });
      assert(completeRes.status === 200, `Full questionnaire submission failed: ${JSON.stringify(completeRes.data)}`);
      assert(completeRes.data.data.is_completed === true, 'Questionnaire should be marked as completed');
      console.log('✔ Valid questionnaire submission succeeded and updated is_completed: true\n');

      console.log('====================================================');
      console.log('PHASE 2 MULTI-MODEL AI VERIFICATION PASSED 100%! 🎉');
      console.log('====================================================\n');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('❌ Verification Test Failed:', err.message);
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

runPhase2Tests();
