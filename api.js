/**
 * TrialMatch+ Frontend API Service Client
 * Handles HTTP requests to the RESTful backend API for patient registration and document ingestion.
 */

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = isLocal ? 'http://localhost:5000/api' : 'https://trial-match-inky.vercel.app/api';

class TrialMatchAPI {
  /**
   * Register a new patient profile
   * @param {Object} patientData - { full_name, age, gender, location }
   * @returns {Promise<Object>} Response object containing created patient profile
   */
  static async registerPatient(patientData) {
    try {
      const response = await fetch(`${API_BASE_URL}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to register patient');
      }
      return data;
    } catch (error) {
      console.error('API registerPatient error:', error);
      throw error;
    }
  }

  /**
   * Update existing patient profile attributes
   * @param {string} patientId 
   * @param {Object} patientData - { full_name, age, gender, location }
   * @returns {Promise<Object>} Response object containing updated patient profile
   */
  static async updatePatient(patientId, patientData) {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update patient profile');
      }
      return data;
    } catch (error) {
      console.error('API updatePatient error:', error);
      throw error;
    }
  }

  /**
   * Fetch patient profile by ID
   * @param {string} patientId 
   * @returns {Promise<Object>}
   */
  static async getPatient(patientId) {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch patient');
      }
      return data;
    } catch (error) {
      console.error('API getPatient error:', error);
      throw error;
    }
  }

  /**
   * Securely upload a medical document (.pdf, .jpg, .jpeg, .png <= 10MB) for a patient
   * @param {string} patientId 
   * @param {File} file 
   * @returns {Promise<Object>}
   */
  static async uploadPatientDocument(patientId, file) {
    try {
      // Validate file size client-side prior to network request
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds the 10MB limit per document.');
      }

      // Validate extension client-side
      const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      if (!allowedExts.includes(fileExt)) {
        throw new Error('Invalid file type. Only .pdf, .jpg, .jpeg, and .png files are supported.');
      }

      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/documents`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Document upload failed');
      }
      return data;
    } catch (error) {
      console.error('API uploadPatientDocument error:', error);
      throw error;
    }
  }

  /**
   * Fetch all documents for a patient
   * @param {string} patientId 
   * @returns {Promise<Object>}
   */
  static async getPatientDocuments(patientId) {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/documents`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch documents');
      }
      return data;
    } catch (error) {
      console.error('API getPatientDocuments error:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Trigger Gemini document assessment & Groq dynamic questionnaire generation
   * @param {string} patientId 
   * @returns {Promise<Object>}
   */
  static async assessPatientDocuments(patientId) {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/assess-documents`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to assess patient documents');
      }
      return data;
    } catch (error) {
      console.error('API assessPatientDocuments error:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Fetch latest questionnaire for patient
   * @param {string} patientId 
   * @returns {Promise<Object>}
   */
  static async getPatientQuestionnaire(patientId) {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/questionnaire`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch questionnaire');
      }
      return data;
    } catch (error) {
      console.error('API getPatientQuestionnaire error:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Submit answers to questionnaire (strict non-skipping validation)
   * @param {string} patientId 
   * @param {Object} answers - { "Question 1": "Answer 1", ... }
   * @returns {Promise<Object>}
   */
  static async submitQuestionnaire(patientId, answers) {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/submit-questionnaire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit questionnaire');
      }
      return data;
    } catch (error) {
      console.error('API submitQuestionnaire error:', error);
      throw error;
    }
  }

  /**
   * Phase 3: Run AI cross-validation between medical files and questionnaire answers
   * @param {string} patientId 
   * @returns {Promise<Object>}
   */
  static async crossValidate(patientId) {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/cross-validate`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to run cross-validation');
      }
      return data;
    } catch (error) {
      console.error('API crossValidate error:', error);
      throw error;
    }
  }

  /**
   * Phase 3: Run Two-Stage Clinical Trial Matching Engine (SQL Prescreening + AI Deep Ranking)
   * @param {string} patientId 
   * @returns {Promise<Object>}
   */
  static async findTrials(patientId) {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/find-trials`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to find matching trials');
      }
      return data;
    } catch (error) {
      console.error('API findTrials error:', error);
      throw error;
    }
  }

  /**
   * Phase 3: Fetch stored trial match results for patient
   * @param {string} patientId 
   * @returns {Promise<Object>}
   */
  static async getPatientMatches(patientId) {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/matches`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trial matches');
      }
      return data;
    } catch (error) {
      console.error('API getPatientMatches error:', error);
      throw error;
    }
  }

  /**
   * Phase 4: Fetch doctor review queue applications
   * @returns {Promise<Object>}
   */
  static async getDoctorApplications() {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/applications`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch doctor applications queue');
      }
      return data;
    } catch (error) {
      console.error('API getDoctorApplications error:', error);
      throw error;
    }
  }

  /**
   * Phase 4: Submit clinician decision (APPROVED, REJECTED, MORE_INFO_NEEDED)
   * @param {Object} reviewData - { match_result_id, doctor_decision, doctor_notes }
   * @returns {Promise<Object>}
   */
  static async submitDoctorReview(reviewData) {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit doctor review');
      }
      return data;
    } catch (error) {
      console.error('API submitDoctorReview error:', error);
      throw error;
    }
  }

  /**
   * Phase 5: Delete patient profile & cascade wipe all associated data (Right to be Forgotten)
   * @param {string} patientId 
   * @returns {Promise<Object>}
   */
  static async deletePatient(patientId) {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete patient profile');
      }
      return data;
    } catch (error) {
      console.error('API deletePatient error:', error);
      throw error;
    }
  }

  /**
   * Check Backend API status
   * @returns {Promise<boolean>}
   */
  static async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return data.status === 'OK';
    } catch (error) {
      return false;
    }
  }
}

// Export for ES modules and attach to window for script tags
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TrialMatchAPI;
} else if (typeof window !== 'undefined') {
  window.TrialMatchAPI = TrialMatchAPI;
}
