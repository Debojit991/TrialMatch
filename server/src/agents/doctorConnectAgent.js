const prisma = require('../db');

class DoctorConnectAgentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DoctorConnectAgentError';
    this.isAiError = true;
  }
}

/**
 * Standard City Coordinate Lookup Table for Geospatial Matching
 */
const CITY_COORDINATES = {
  'new york, ny': { lat: 40.7128, lon: -74.006 },
  'chicago, il': { lat: 41.8781, lon: -87.6298 },
  'boston, ma': { lat: 42.3601, lon: -71.0589 },
  'seattle, wa': { lat: 47.6062, lon: -122.3321 },
  'houston, tx': { lat: 29.7604, lon: -95.3698 },
  'los angeles, ca': { lat: 34.0522, lon: -118.2437 },
  mumbai: { lat: 19.076, lon: 72.8777 },
  bangalore: { lat: 12.9716, lon: 77.5946 },
  delhi: { lat: 28.6139, lon: 77.209 },
};

/**
 * AGENT 3 TOOL 1: Haversine Formula Distance Calculator Tool
 * Calculates great-circle distance between two geographic coordinates in kilometers.
 * Includes explicit fallback for missing coordinates.
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null; // Fallback signal for missing coordinates
  }
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Resolve lat/lon coordinates from city string or explicit coords
 */
function resolveCoordinates(locationStr) {
  if (!locationStr || typeof locationStr !== 'string') return null;
  const normalized = locationStr.trim().toLowerCase();
  for (const [cityKey, coords] of Object.entries(CITY_COORDINATES)) {
    if (normalized.includes(cityKey) || cityKey.includes(normalized)) {
      return coords;
    }
  }
  return null;
}

/**
 * AGENT 3 TOOL 2: Doctor Consultation Budget & Fee Filter Tool
 */
function filterByBudget(consultationFee, maxBudget) {
  if (!maxBudget || maxBudget <= 0) return true;
  if (!consultationFee) return true;
  return consultationFee <= maxBudget;
}

/**
 * AGENT 3: Doctor Match & Connect Agent
 * Ranks nearby principal investigators / doctors based on geospatial distance & budget logistics
 */
async function matchDoctorsForPatient(patientId, maxBudget = null) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      matchResults: {
        include: {
          trial: true,
        },
      },
    },
  });

  if (!patient) {
    throw new DoctorConnectAgentError('Patient profile not found for doctor matching.');
  }

  const patientCoords = resolveCoordinates(patient.location);

  // Fetch candidate trials or matched trial site locations
  const matchedTrials = patient.matchResults.map((r) => r.trial);

  const doctorRecommendations = matchedTrials.map((trial) => {
    const siteCoords = resolveCoordinates(trial.location);
    const distanceKm = calculateHaversineDistance(
      patientCoords?.lat,
      patientCoords?.lon,
      siteCoords?.lat,
      siteCoords?.lon
    );

    // Safeguard 2 Fallback: Graceful handling if distance cannot be computed
    const distanceDisplay = distanceKm !== null 
      ? `${distanceKm} km away` 
      : 'Distance unavailable (Location not specified)';

    const isSameCity = patient.location && trial.location && 
      patient.location.toLowerCase().includes(trial.location.toLowerCase().split(',')[0]);

    const logisticsScore = distanceKm !== null 
      ? Math.max(10, Math.round(100 - distanceKm * 0.5))
      : isSameCity ? 90 : 50;

    return {
      trial_id: trial.id,
      trial_code: trial.trial_code,
      trial_title: trial.title,
      trial_location: trial.location,
      patient_location: patient.location,
      distance_km: distanceKm,
      distance_display: distanceDisplay,
      logistics_score: logisticsScore,
      doctor_contact_protocol: `Principal Investigator at ${trial.location} trial site`,
    };
  });

  // Sort by geospatial proximity / logistics score descending
  doctorRecommendations.sort((a, b) => b.logistics_score - a.logistics_score);

  return {
    patient_id: patientId,
    patient_location: patient.location,
    recommendations: doctorRecommendations,
  };
}

module.exports = {
  DoctorConnectAgentError,
  calculateHaversineDistance,
  resolveCoordinates,
  filterByBudget,
  matchDoctorsForPatient,
};
