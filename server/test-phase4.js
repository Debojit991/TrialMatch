require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const prisma = require('./src/db');

let server;
const PORT = 5004;

async function runPhase4Tests() {
  console.log('Starting Phase 4 Doctor Dashboard & Human-in-the-Loop Review Verification...\n');

  server = app.listen(PORT, async () => {
    try {
      // 1. Create Patient & Match Result in DB for Doctor Review test
      console.log('Step 1: Setting up Test Patient & Trial Match Result...');
      const patient = await prisma.patient.create({
        data: {
          full_name: 'Sarah Connor',
          age: 44,
          gender: 'FEMALE',
          location: 'San Francisco, CA',
        },
      });

      const trial = await prisma.clinicalTrial.findFirst();
      assert(trial, 'Database must contain clinical trial records');

      const matchResult = await prisma.patientMatchResult.create({
        data: {
          patient_id: patient.id,
          trial_id: trial.id,
          eligibility_category: 'LESS_ELIGIBLE',
          rank_score: 78,
          criterion_explanation: 'Patient meets general criteria but has medication discrepancy flag requiring doctor review.',
        },
      });
      console.log(`✔ Patient & Match Result Created (MatchResult ID: ${matchResult.id})\n`);

      // 2. Fetch Doctor Applications Queue (GET /api/doctors/applications)
      console.log('Step 2: Fetching Doctor Applications Queue (GET /api/doctors/applications)...');
      const appQueueRes = await makeRequest('/api/doctors/applications', 'GET');
      assert(appQueueRes.status === 200, `Fetch applications failed: ${JSON.stringify(appQueueRes.data)}`);
      
      const applications = appQueueRes.data.data;
      assert(Array.isArray(applications) && applications.length > 0, 'Expected queue to contain patient applications');
      console.log(`✔ Doctor Applications Queue retrieved successfully. Total applications: ${applications.length}\n`);

      // 3. Submit Doctor Review Decision (POST /api/doctors/reviews)
      console.log('Step 3: Submitting Clinician Decision (POST /api/doctors/reviews)...');
      const reviewPayload = {
        match_result_id: matchResult.id,
        doctor_decision: 'APPROVED',
        doctor_notes: 'Reviewed patient reports and cross-checked discrepancy. Approved for Phase III screening.',
      };

      const reviewRes = await makeRequest('/api/doctors/reviews', 'POST', reviewPayload);
      assert(reviewRes.status === 200, `Doctor review submission failed: ${JSON.stringify(reviewRes.data)}`);
      assert(reviewRes.data.data.doctor_decision === 'APPROVED', 'Doctor decision should be APPROVED');
      console.log('✔ Doctor Review decision submitted successfully (Decision: APPROVED)\n');

      // 4. Verify Database Persistence
      console.log('Step 4: Verifying Database Persistence...');
      const storedReview = await prisma.doctorReview.findUnique({
        where: { match_result_id: matchResult.id },
      });
      assert(storedReview && storedReview.doctor_decision === 'APPROVED', 'Doctor review not found in DB');
      console.log(`✔ Doctor Review record verified in DB! Notes: "${storedReview.doctor_notes}"\n`);

      console.log('====================================================');
      console.log('PHASE 4 CLINICIAN REVIEW & QUEUE PASSED 100%! 🎉');
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

runPhase4Tests();
