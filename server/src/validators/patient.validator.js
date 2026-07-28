const { z } = require('zod');

const patientRegistrationSchema = z.object({
  full_name: z.string({
    required_error: 'Full name is required',
  }).min(1, 'Full name cannot be empty').trim(),
  
  age: z.number({
    required_error: 'Age is required',
    invalid_type_error: 'Age must be a number',
  }).int('Age must be an integer').gt(0, 'Age must be greater than 0'),
  
  gender: z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase() : val),
    z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'], {
      required_error: 'Gender is required',
      invalid_type_error: 'Gender must be MALE, FEMALE, OTHER, or PREFER_NOT_TO_SAY',
    })
  ),
  
  location: z.string({
    required_error: 'Location is required',
  }).min(1, 'Location cannot be empty').trim(),
});

function validatePatientRegistration(data) {
  return patientRegistrationSchema.parse(data);
}

module.exports = {
  patientRegistrationSchema,
  validatePatientRegistration,
};
