require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sampleTrials = [
  {
    trial_code: 'NCT08877665',
    title: 'Phase III Trial of Novel Oral Antibiotic for Community-Acquired Bacterial Pneumonia',
    disease_category: 'Bacterial Pneumonia',
    phase: 'Phase III',
    min_age: 18,
    max_age: 80,
    gender_requirement: 'ALL',
    location: 'New York, NY',
    inclusion_criteria: JSON.stringify([
      'Confirmed diagnosis of mild-to-moderate Community-Acquired Bacterial Pneumonia (CAP)',
      'Prescribed Amoxicillin or similar first-line antibiotic',
      'Outpatient treatment status',
    ]),
    exclusion_criteria: JSON.stringify([
      'Known allergy to penicillin',
      'Severe pneumonia requiring ICU admission or mechanical ventilation',
      'Atypical pneumonia features',
    ]),
    status: 'RECRUITING',
  },
  {
    trial_code: 'NCT05112233',
    title: 'Phase III Study of Novel GLP-1/GIP Receptor Agonist in Uncontrolled Type 2 Diabetes',
    disease_category: 'Type 2 Diabetes',
    phase: 'Phase III',
    min_age: 18,
    max_age: 75,
    gender_requirement: 'ALL',
    location: 'Chicago, IL',
    inclusion_criteria: JSON.stringify([
      'Diagnosed with Type 2 Diabetes Mellitus for >= 6 months',
      'HbA1c between 7.5% and 11.0%',
      'Currently taking stable dose of Metformin (>= 1000mg/day)',
      'Age between 18 and 75 years',
    ]),
    exclusion_criteria: JSON.stringify([
      'Diagnosis of Type 1 Diabetes Mellitus',
      'History of severe renal impairment (eGFR < 30 mL/min/1.73m2)',
      'History of acute pancreatitis within the past 12 months',
    ]),
    status: 'RECRUITING',
  },
  {
    trial_code: 'NCT05223344',
    title: 'Phase II Trial of Targeted EGFR Kinase Inhibitor in Non-Small Cell Lung Cancer (NSCLC)',
    disease_category: 'Oncology',
    phase: 'Phase II',
    min_age: 21,
    max_age: 80,
    gender_requirement: 'ALL',
    location: 'Boston, MA',
    inclusion_criteria: JSON.stringify([
      'Confirmed histological diagnosis of Stage III or IV NSCLC',
      'Documented EGFR exon 19 deletion or L858R mutation',
      'Measurable disease per RECIST 1.1 criteria',
    ]),
    exclusion_criteria: JSON.stringify([
      'Uncontrolled brain metastases',
      'Prior treatment with 3 or more lines of systemic chemotherapy',
      'Severe cardiac dysfunction (LVEF < 45%)',
    ]),
    status: 'RECRUITING',
  },
  {
    trial_code: 'NCT05334455',
    title: 'Phase III Trial evaluating SGLT2 Inhibitors in Patients with Heart Failure (HFpEF)',
    disease_category: 'Cardiology',
    phase: 'Phase III',
    min_age: 40,
    max_age: 85,
    gender_requirement: 'ALL',
    location: 'New York, NY',
    inclusion_criteria: JSON.stringify([
      'Symptomatic Heart Failure with preserved ejection fraction (LVEF > 40%)',
      'Elevated NT-proBNP levels (> 300 pg/mL)',
      'NYHA Class II-IV functional status',
    ]),
    exclusion_criteria: JSON.stringify([
      'Systolic blood pressure < 100 mmHg',
      'End-stage renal disease requiring hemodialysis',
      'Type 1 Diabetes Mellitus',
    ]),
    status: 'RECRUITING',
  },
  {
    trial_code: 'NCT05445566',
    title: 'Phase II Monoclonal Antibody Study in Severe Uncontrolled Asthma',
    disease_category: 'Asthma',
    phase: 'Phase II',
    min_age: 12,
    max_age: 65,
    gender_requirement: 'ALL',
    location: 'Seattle, WA',
    inclusion_criteria: JSON.stringify([
      'Documented severe persistent asthma for >= 12 months',
      'Blood eosinophil count >= 300 cells/mcL',
      'At least 2 severe asthma exacerbations in the preceding year requiring systemic corticosteroids',
    ]),
    exclusion_criteria: JSON.stringify([
      'Current smoker or past history of > 10 pack-years smoking',
      'Diagnosis of COPD or cystic fibrosis',
    ]),
    status: 'RECRUITING',
  },
  {
    trial_code: 'NCT05556677',
    title: 'Phase III Study of Oral Neuropathy Pain Agent in Diabetic Peripheral Neuropathy',
    disease_category: 'Type 2 Diabetes',
    phase: 'Phase III',
    min_age: 30,
    max_age: 70,
    gender_requirement: 'ALL',
    location: 'Chicago, IL',
    inclusion_criteria: JSON.stringify([
      'Confirmed Type 2 Diabetes with symptomatic distal symmetric polyneuropathy',
      'Daily pain score >= 4 on Likert 0-10 numerical scale',
      'Stable glycemic control (HbA1c <= 10.0%)',
    ]),
    exclusion_criteria: JSON.stringify([
      'Peripheral neuropathy due to non-diabetic causes (e.g., B12 deficiency, chemotherapy)',
      'History of substance abuse within 2 years',
    ]),
    status: 'RECRUITING',
  },
  {
    trial_code: 'NCT05667788',
    title: 'Phase II Immunotherapy Trial for HER2-Positive Advanced Breast Cancer',
    disease_category: 'Oncology',
    phase: 'Phase II',
    min_age: 18,
    max_age: 75,
    gender_requirement: 'FEMALE',
    location: 'Houston, TX',
    inclusion_criteria: JSON.stringify([
      'Histologically proven HER2-positive locally advanced or metastatic breast cancer',
      'Prior treatment with Trastuzumab and Pertuzumab',
      'ECOG Performance Status 0-1',
    ]),
    exclusion_criteria: JSON.stringify([
      'Male patients',
      'Active symptomatic brain metastasis',
      'History of interstitial lung disease',
    ]),
    status: 'RECRUITING',
  },
  {
    trial_code: 'NCT05778899',
    title: 'Phase III Study of Novel ARB Combination in Resistant Essential Hypertension',
    disease_category: 'Cardiology',
    phase: 'Phase III',
    min_age: 35,
    max_age: 80,
    gender_requirement: 'ALL',
    location: 'Los Angeles, CA',
    inclusion_criteria: JSON.stringify([
      'Mean seated systolic blood pressure >= 140 mmHg despite 3 antihypertensive agents',
      'Confirmed essential hypertension',
    ]),
    exclusion_criteria: JSON.stringify([
      'Secondary hypertension (e.g., renovascular disease, pheochromocytoma)',
      'Serum potassium > 5.5 mEq/L',
    ]),
    status: 'RECRUITING',
  },
];

async function seedDatabase() {
  console.log('Seeding clinical trial data into database...');
  for (const trial of sampleTrials) {
    await prisma.clinicalTrial.upsert({
      where: { trial_code: trial.trial_code },
      update: trial,
      create: trial,
    });
  }
  console.log(`Successfully seeded ${sampleTrials.length} clinical trials!`);
}

seedDatabase()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
