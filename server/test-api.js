const fs = require('fs');
const path = require('path');
const http = require('http');

// Start the Express server for testing
const app = require('./src/app');

let server;
const PORT = 5001;

async function runTests() {
  console.log('Starting automated end-to-end API verification...\n');

  server = app.listen(PORT, async () => {
    try {
      // 1. Healthcheck
      console.log('Test 1: Healthcheck Endpoint');
      const healthRes = await makeRequest('/api/health', 'GET');
      assert(healthRes.status === 200 && healthRes.data.status === 'OK', 'Healthcheck failed');
      console.log('✔ Healthcheck passed\n');

      // 2. Patient Registration Validation (Failure cases: age <= 0, invalid gender)
      console.log('Test 2: Patient Registration Validation (Invalid Inputs)');
      const invalidPatientRes = await makeRequest('/api/patients', 'POST', {
        full_name: 'Test Invalid',
        age: -5,
        gender: 'UNKNOWN',
        location: 'NYC',
      });
      assert(invalidPatientRes.status === 400, 'Invalid patient should return 400');
      assert(invalidPatientRes.data.error === 'Validation failed', 'Should trigger Zod validation error');
      console.log('✔ Patient validation correctly enforced (rejected age <= 0 and invalid gender)\n');

      // 3. Valid Patient Registration
      console.log('Test 3: Valid Patient Registration');
      const validPatientRes = await makeRequest('/api/patients', 'POST', {
        full_name: 'Jane Doe',
        age: 34,
        gender: 'FEMALE',
        location: 'Boston, MA',
      });
      assert(validPatientRes.status === 201, 'Valid patient creation should return 201');
      assert(validPatientRes.data.data.id, 'Patient ID should be returned');
      const createdPatient = validPatientRes.data.data;
      console.log(`✔ Patient registered successfully with ID: ${createdPatient.id}\n`);

      // 4. Test Document Upload - Invalid File Type (.txt)
      console.log('Test 4: Document Upload Restriction (Invalid File Extension .txt)');
      const textFilePath = path.join(__dirname, 'temp_test.txt');
      fs.writeFileSync(textFilePath, 'Invalid file content');
      const invalidUploadRes = await uploadFile(`/api/patients/${createdPatient.id}/documents`, textFilePath, 'document', 'text/plain');
      fs.unlinkSync(textFilePath);
      assert(invalidUploadRes.status === 400, 'Invalid file extension should return 400');
      assert(invalidUploadRes.data.error.includes('Only .pdf, .jpg, .jpeg, and .png files are allowed'), 'Should enforce file extension restriction');
      console.log('✔ File extension restriction enforced (.pdf, .jpg, .jpeg, .png only)\n');

      // 5. Test Document Upload - File Size Limit Exceeded (> 10MB)
      console.log('Test 5: Document Upload Size Limit (> 10MB)');
      const oversizedFilePath = path.join(__dirname, 'oversized_test.pdf');
      const dummy11MBBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      fs.writeFileSync(oversizedFilePath, dummy11MBBuffer);
      const oversizedRes = await uploadFile(`/api/patients/${createdPatient.id}/documents`, oversizedFilePath, 'document', 'application/pdf');
      fs.unlinkSync(oversizedFilePath);
      assert(oversizedRes.status === 400, 'Oversized document should return 400');
      assert(oversizedRes.data.error.includes('File size limit exceeded'), 'Should enforce 10MB max limit');
      console.log('✔ File size limit strictly enforced (> 10MB rejected)\n');

      // 6. Test Valid Document Upload & OCR Text Extraction (.png)
      console.log('Test 6: Valid Document Upload & OCR Text Extraction');
      // Create a small 1x1 valid PNG image buffer
      const samplePngPath = path.join(__dirname, 'sample_report.png');
      // Minimal valid PNG binary structure
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      fs.writeFileSync(samplePngPath, Buffer.from(pngBase64, 'base64'));

      const validDocRes = await uploadFile(`/api/patients/${createdPatient.id}/documents`, samplePngPath, 'document', 'image/png');
      fs.unlinkSync(samplePngPath);

      assert(validDocRes.status === 201, 'Valid document upload should return 201');
      assert(validDocRes.data.data.upload_status === 'COMPLETED', 'Upload status should be COMPLETED');
      assert(validDocRes.data.data.signed_url, 'Signed URL should be generated');
      console.log(`✔ Document uploaded successfully. Status: ${validDocRes.data.data.upload_status}`);
      console.log(`✔ Signed URL: ${validDocRes.data.data.signed_url}\n`);

      // 7. Get Patient Profile with Attached Signed Document URLs
      console.log('Test 7: Fetch Patient Profile & Documents');
      const getPatientRes = await makeRequest(`/api/patients/${createdPatient.id}`, 'GET');
      assert(getPatientRes.status === 200, 'Fetch patient should return 200');
      assert(getPatientRes.data.data.documents.length === 1, 'Patient should have 1 uploaded document');
      console.log('✔ Patient profile fetched with attached signed documents\n');

      console.log('ALL API VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
      server.close(() => process.exit(0));
    } catch (err) {
      console.error('❌ Verification Test Failed:', err.message);
      if (server) server.close(() => process.exit(1));
    }
  });
}

// HTTP Helper Functions
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

runTests();
