require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const prisma = require('./src/db');

let server;
const PORT = 5005;

async function runPhase5SecurityAudit() {
  console.log('Starting Phase 5 Security Hardening & System Audit Verification...\n');

  server = app.listen(PORT, async () => {
    try {
      // 1. Verify Helmet Security Headers
      console.log('Test 1: Verifying Helmet Security Headers...');
      const healthRes = await makeRawRequest('/api/health', 'GET');
      assert(healthRes.headers['x-content-type-options'] === 'nosniff', 'Missing X-Content-Type-Options: nosniff header');
      assert(healthRes.headers['x-frame-options'] === 'SAMEORIGIN' || healthRes.headers['x-frame-options'] === 'DENY', 'Missing X-Frame-Options header');
      console.log('✔ Helmet Security Headers Verified (X-Content-Type-Options, X-Frame-Options present)\n');

      // 2. Verify Rate Limiting
      console.log('Test 2: Verifying AI Endpoint Rate Limiter Thresholds...');
      // Create temporary patient for rate limiter test
      const tempPatient = await prisma.patient.create({
        data: {
          full_name: 'RateLimit Test',
          age: 30,
          gender: 'MALE',
          location: 'Test City',
        },
      });

      // Fire 12 rapid requests to trigger 10 req/min limit on AI endpoint
      let blockedCount = 0;
      for (let i = 0; i < 12; i++) {
        const res = await makeRawRequest(`/api/patients/${tempPatient.id}/assess-documents`, 'POST');
        if (res.status === 429) {
          blockedCount++;
        }
      }
      assert(blockedCount > 0, 'Rate limiter should block excessive rapid requests with 429 Too Many Requests');
      console.log(`✔ Rate Limiter Verified! Blocked ${blockedCount} excessive requests with 429 Too Many Requests\n`);

      // Clean up temp patient
      await prisma.patient.delete({ where: { id: tempPatient.id } });

      // 3. Verify Patient Cascade Data Deletion (Right to be Forgotten)
      console.log('Test 3: Verifying Patient Data Wipe & Cascade Deletion (DELETE /api/patients/:id)...');
      const deleteTestPatient = await prisma.patient.create({
        data: {
          full_name: 'Wipe Test Patient',
          age: 40,
          gender: 'FEMALE',
          location: 'Wipe City',
          documentAssessment: {
            create: {
              suspected_condition: 'Test Condition',
              raw_summary: 'Test Summary',
              medications_listed: '[]',
              key_lab_values: 'None',
            },
          },
          questionnaires: {
            create: {
              questions: '[]',
              is_completed: true,
            },
          },
          discrepancyFlags: {
            create: {
              severity_level: 'LOW',
              conflict_topic: 'Test Topic',
              document_evidence: 'Doc Ev',
              patient_claim: 'Pat Claim',
            },
          },
        },
      });

      const delPatientId = deleteTestPatient.id;

      // Execute DELETE request
      const delRes = await makeRawRequest(`/api/patients/${delPatientId}`, 'DELETE');
      assert(delRes.status === 200, 'DELETE patient endpoint should return 200 OK');
      assert(delRes.data.success === true, 'DELETE patient should return success: true');

      // Verify cascading wipe in database
      const deletedPatient = await prisma.patient.findUnique({ where: { id: delPatientId } });
      const deletedAssessment = await prisma.documentAssessment.findUnique({ where: { patient_id: delPatientId } });
      const remainingFlags = await prisma.discrepancyFlag.findMany({ where: { patient_id: delPatientId } });

      assert(deletedPatient === null, 'Patient record should be permanently deleted');
      assert(deletedAssessment === null, 'DocumentAssessment record should be cascade wiped');
      assert(remainingFlags.length === 0, 'DiscrepancyFlags should be cascade wiped');

      console.log('✔ Patient Data Deletion & Cascade Wipe Verified! All child records permanently purged from SQLite DB\n');

      console.log('====================================================');
      console.log('PHASE 5 SECURITY HARDENING & AUDIT PASSED 100%! 🎉');
      console.log('====================================================\n');

      server.close(() => process.exit(0));
    } catch (err) {
      console.error('❌ Phase 5 Verification Test Failed:', err.message);
      if (server) server.close(() => process.exit(1));
    }
  });
}

function makeRawRequest(urlPath, method, body = null) {
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
            resolve({ status: res.statusCode, headers: res.headers, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, data: responseData });
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

runPhase5SecurityAudit();
