# TrialMatch+

TrialMatch+ is a web-based platform designed to connect patients with relevant clinical trials. The application provides a dual-interface system: a patient portal for discovering and understanding trials through simplified summaries, and a doctor dashboard for managing trial listings and reviewing patient leads.

## Features

### Patient Portal
* **Trial Discovery:** Search and filter clinical trials by condition and location.
* **AI-Assisted Summaries:** Simplified trial explanations to reduce medical jargon.
* **Profile Management:** User profiles with medical history and document uploads.
* **Comparisons & Exports:** Compare saved trials side-by-side and export details to PDF.
* **Community Forum:** Q&A section for patients to discuss experiences and safety.
* **Interactive Assistant:** Voice-enabled chatbot with multilingual support (English, Bengali, Marathi, Tamil).

### Doctor Dashboard
* **Trial Management:** Create, edit, and delete clinical trial listings.
* **Lead Tracking:** View patients who have saved specific trials.
* **Document Access:** Securely view medical documents shared by interested patients.

### General
* **Authentication:** Unified login/signup with Email and Google Sign-In via Firebase.
* **Responsive Design:** Mobile-friendly interface with glassmorphism UI.
* **Theming:** Toggleable light and dark modes.

## Tech Stack

* **Frontend:** HTML5, CSS3, JavaScript (ES6+)
* **Backend / Database:** Firebase Authentication, Firestore
* **Libraries:**
    * **Chart.js:** Analytics visualization
    * **jsPDF:** PDF generation and export
    * **Font Awesome:** Iconography
    * **Cloudinary:** Image/Document hosting API

## Project Structure

```text
TrialMatch/
├── index.html      # Main entry point containing DOM structure for all views
├── style.css       # Global styles, themes, and responsive media queries
├── script.js       # Application logic, Firebase config, and event handling
├── README.md       # Project documentation
└── LICENSE         # MIT License
Installation
Clone the repository

Bash

git clone [https://github.com/Debojit991/TrialMatch.git](https://github.com/Debojit991/TrialMatch.git)
cd TrialMatch
Configuration

Open script.js.

Locate the firebaseConfig object.

Ensure the API keys and Project ID match your Firebase project settings.

Locate the Cloudinary configuration in the handleFileUpload function and update the cloud name and upload preset if necessary.

Run the Application

Since this is a static web application, you can open index.html directly in a modern web browser.

For optimal performance (and to avoid CORS issues with some APIs), it is recommended to use a local development server (e.g., Live Server for VS Code).

Usage
For Patients
Sign up as a "Patient".

Complete the profile with date of birth (required for eligibility checks).

Use the "Find Trials" section to filter results.

Click "Save" to add trials to your favorites or "Compare" to view them side-by-side.

For Doctors
Sign up as a "Doctor" (requires specialization and location).

Access the dashboard to "Add New Trial".

Navigate to "Patient Leads" to see users who have interacted with your trials.

Configuration
This project relies on external services which must be configured in script.js:

Firebase: Requires a project with Authentication (Email/Google) and Firestore enabled.

Firestore Rules: Ensure security rules allow read/write access based on user roles (see firebase.rules logic included in project).

Cloudinary: Requires an unsigned upload preset for image handling.

Roadmap
Implementation of backend-based AI for dynamic trial summarization.

Integration with external clinical trial APIs (e.g., ClinicalTrials.gov).

Enhanced document security and encryption.

Contributing
Contributions are welcome. Please fork the repository and submit a pull request for any enhancements or bug fixes. Ensure code follows the existing style conventions.

License
This project is licensed under the MIT License.
