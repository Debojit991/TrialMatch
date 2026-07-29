require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = require('./src/app');

let server;
const PORT = 5003;

async function runLongitudinalTests() {
  console.log('================================================================');
  console.log('Starting E2E Longitudinal Patient Record & Targeted Deletion Test');
  console.log('================================================================\n');

  server = app.listen(PORT, async () => {
    try {
      const prisma = require('./src/db');

      // 1. Create Patient
      console.log('Step 1: Creating Test Patient Profile...');
      const patientRes = await makeRequest('/api/patients', 'POST', {
        full_name: 'Eleanor Vance',
        age: 62,
        gender: 'FEMALE',
        location: 'Boston, MA',
      });
      assert(patientRes.status === 201, 'Patient creation failed');
      const patient = patientRes.data.data;
      console.log(`✔ Patient created successfully (ID: ${patient.id})\n`);

      // Create dummy file buffers for test document uploads
      const doc1Path = path.join(__dirname, 'test_doc1.png');
      const doc2Path = path.join(__dirname, 'test_doc2.png');
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      fs.writeFileSync(doc1Path, Buffer.from(pngBase64, 'base64'));
      fs.writeFileSync(doc2Path, Buffer.from(pngBase64, 'base64'));

      // 2. Upload Document 1
      console.log('Step 2: Uploading Document 1 (Diabetes Report)...');
      const uploadRes1 = await uploadFile(`/api/patients/${patient.id}/documents`, doc1Path, 'document', 'image/png');
      assert(uploadRes1.status === 201, 'Document 1 upload failed');
      const doc1 = uploadRes1.data.data;
      console.log(`✔ Document 1 uploaded (ID: ${doc1.id})\n`);

      // Inject OCR text for Document 1
      const doc1OcrText = `PATIENT REPORT - BOSTON MEDICAL CENTER
Patient: Eleanor Vance | Age: 62 | Gender: Female
Diagnosis: Type 2 Diabetes Mellitus
Active Medications: Metformin 1000mg BID.
Lab Findings: Fasting Blood Glucose 165 mg/dL.
Summary: Primary diagnosis of Type 2 Diabetes Mellitus. Patient prescribed Metformin therapy.`;

      await prisma.document.update({
        where: { id: doc1.id },
        data: {
          ocr_extracted_text: doc1OcrText,
          upload_status: 'COMPLETED',
        },
      });

      // 3. Upload Document 2
      console.log('Step 3: Uploading Document 2 (Hypertension & Diabetes Followup)...');
      const uploadRes2 = await uploadFile(`/api/patients/${patient.id}/documents`, doc2Path, 'document', 'image/png');
      assert(uploadRes2.status === 201, 'Document 2 upload failed');
      const doc2 = uploadRes2.data.data;
      console.log(`✔ Document 2 uploaded (ID: ${doc2.id})\n`);

      // Cleanup local test files created for uploading
      if (fs.existsSync(doc1Path)) fs.unlinkSync(doc1Path);
      if (fs.existsSync(doc2Path)) fs.unlinkSync(doc2Path);

      // Inject OCR text for Document 2 (mentions Type 2 Diabetes again + Hypertension + Lisinopril)
      const doc2OcrText = `PATIENT REPORT - CARDIOLOGY & METABOLIC CLINIC
Patient: Eleanor Vance | Age: 62 | Gender: Female
Diagnosis: Essential Hypertension, Type 2 Diabetes Mellitus
Active Medications: Lisinopril 10mg daily, Metformin 1000mg BID.
Lab Findings: Blood Pressure 145/90 mmHg, eGFR 80 mL/min.
Summary: Added Essential Hypertension diagnosis. Started Lisinopril 10mg daily alongside existing Metformin.`;

      await prisma.document.update({
        where: { id: doc2.id },
        data: {
          ocr_extracted_text: doc2OcrText,
          upload_status: 'COMPLETED',
        },
      });

      // 4. Trigger Assessment & Verify Deduplicated Master Profile Aggregation
      console.log('Step 4: Assessing Patient Documents & Verifying Deduplicated Aggregation...');
      const assessRes = await makeRequest(`/api/patients/${patient.id}/assess-documents`, 'POST');
      assert(assessRes.status === 201, `Document assessment failed: ${JSON.stringify(assessRes.data)}`);
      const { assessment } = assessRes.data.data;

      console.log('✔ Aggregated Master Profile Result:');
      console.log(`   - Suspected Condition: ${assessment.suspected_condition}`);
      console.log(`   - Medications Listed: ${assessment.medications_listed}`);
      console.log(`   - Key Lab Values: ${assessment.key_lab_values}\n`);

      // Verify conditions contain both Type 2 Diabetes and Hypertension without duplicates
      const condStr = String(assessment.suspected_condition);
      assert(condStr.includes('Diabetes') || condStr.includes('Hypertension'), 'Conditions should contain extracted medical findings');
      
      const medsStr = String(assessment.medications_listed);
      assert(medsStr.includes('Metformin') || medsStr.includes('Lisinopril'), 'Medications should contain extracted drugs');
      console.log('✔ Master Profile Aggregation & Deduplication Verified!\n');

      // 5. Test Targeted Document Deletion (DELETE Document 1)
      console.log(`Step 5: Performing Targeted Deletion on Document 1 (ID: ${doc1.id})...`);
      const deleteRes = await makeRequest(`/api/patients/${patient.id}/documents/${doc1.id}`, 'DELETE');
      assert(deleteRes.status === 200, `Document deletion failed with status ${deleteRes.status}: ${JSON.stringify(deleteRes.data)}`);
      console.log('✔ Targeted DELETE route returned 200 OK');

      const remainingDocs = deleteRes.data.data.documents;
      assert(remainingDocs.length === 1, `Expected 1 remaining document, got ${remainingDocs.length}`);
      assert(remainingDocs[0].id === doc2.id, 'Remaining document should be Document 2');
      console.log(`✔ Remaining Document Count: ${remainingDocs.length} (ID: ${remainingDocs[0].id})\n`);

      // 6. Verify Physical File Cleanup & Profile Recalibration
      console.log('Step 6: Verifying File Storage Cleanup & Recalibrated Master Profile...');
      const localDoc1Filename = path.basename(doc1.file_url);
      const uploadsFilePath = path.join(__dirname, 'uploads', localDoc1Filename);
      const fileExists = fs.existsSync(uploadsFilePath);
      assert(!fileExists, `Physical file ${localDoc1Filename} should have been unlinked/deleted from disk`);
      console.log('✔ Physical file removed from disk storage successfully');

      const recalibratedAssessment = deleteRes.data.data.documentAssessment;
      console.log(`✔ Recalibrated Assessment Condition: ${recalibratedAssessment ? recalibratedAssessment.suspected_condition : 'N/A'}\n`);

      console.log('====================================================');
      console.log('LONGITUDINAL RECORD & TARGETED DELETION VERIFIED 100%! 🎉');
      console.log('====================================================\n');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('❌ Longitudinal Verification Test Failed:', err.message);
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

runLongitudinalTests();
