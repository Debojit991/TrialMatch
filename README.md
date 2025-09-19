# TrialMatch+: Your Clinical Trial Companion 🩺

**TrialMatch+** is a modern, responsive web application designed to bridge the gap between patients seeking medical advancements and the clinical trials that offer them. It simplifies complex medical jargon using AI-powered summaries and provides a seamless experience for both patients and healthcare professionals.

🚀 View Live Demo » https://trialmatch-plus.netlify.app/




## ✨ Features

The platform is divided into two main user experiences: one for patients and one for doctors.

### 🧍 For Patients
* **AI-Powered Explanations:** Complex clinical trial descriptions are simplified into easy-to-understand language.
* **Personalized Matching:** Users can create a profile with their age and medical conditions to see dynamically filtered trials they are eligible for.
* **Smart Filtering:** Search and filter trials by medical condition and location.
* **Save & Compare:** Bookmark interesting trials to a personal "Saved" list and compare them side-by-side in a detailed table view.
* **PDF Export:** Export a list of saved trials to a PDF for offline viewing or sharing with a doctor.
* **Interactive Chatbot:** An integrated assistant to answer common questions about clinical trials.
* **Dark Mode:** A sleek, eye-friendly dark theme for comfortable browsing.

### 👨‍⚕️ For Doctors
* **Doctor Dashboard:** A dedicated portal for managing clinical trials.
* **CRUD for Trials:** Doctors can **C**reate, **R**ead, **U**pdate, and **D**elete the clinical trials they manage.
* **Patient Leads:** Securely view a list of patients who have saved one of their trials, along with their age and contact information (WhatsApp).
* **Secure Authentication:** Separate sign-up and profile management for doctors.



## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, JavaScript (ES6+)
* **Database & Auth:** Google Firebase (Firestore for database, Firebase Authentication for users)
* **Libraries:**
    * **Chart.js:** For rendering the trial analytics dashboard.
    * **jsPDF & jsPDF-AutoTable:** For exporting saved trials to PDF.
    * **Font Awesome:** For icons.
* **APIs:**
    * **Geolocation API:** For auto-detecting user location.
    * **OpenStreetMap Nominatim:** For reverse geocoding to get city names from coordinates.

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You need a web browser and a code editor. No complex setup is required to run the frontend.

### Installation

1.  Clone the repo:
    ```sh
    git clone [https://github.com/Debojit991/TrialMatch.git]
    ```
2.  Navigate to the project directory:
    ```sh
    cd TrialMatch-Plus
    ```
3.  Configure Firebase:
This project uses Firebase for its backend. You'll need to create your own Firebase project to run it.

Go to the Firebase Console and create a new project.

Add a new "Web App" to your project.

Find your Firebase configuration keys (apiKey, authDomain, etc.).

In the project's root directory, create a new file named firebase-config.js.

Paste your configuration into this file like so:

JavaScript
```sh
// firebase-config.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```
Finally, make sure your index.html file has a script tag pointing to this new file before the main script.js file:

HTML
```sh
<script src="firebase-config.js"></script>
<script src="script.js"></script>
```
Launch the App:
Simply open the index.html file in your web browser. You're all set

---

## 📖 How to Use

1.  **Open the Application:** Launch `index.html`.
2.  **Sign Up:** Create an account as either a "Patient" or a "Doctor".
3.  **Complete Your Profile:**
    * **Patients:** Fill in your Date of Birth to enable age-based eligibility checks.
    * **Doctors:** Fill in your specialization and location to provide context for your trials.
4.  **Explore:**
    * **Patients:** Use the filters to find trials. Save trials to your list and compare them.
    * **Doctors:** Navigate to your dashboard to add a new trial or manage existing ones. View patient leads who have shown interest.

---

## 📂 Project Structure

The code is organized into three main files for clarity and maintainability:

* **`index.html`**: Contains the complete HTML structure and all UI elements for the application, including modals and both patient/doctor views.
* **`style.css`**: Holds all the styling rules, including variables for themes (light/dark mode), animations, glassmorphism effects, and responsive design media queries.
* **`script.js`**: The core of the application's logic. It handles:
    * Firebase initialization and all backend communication (Auth & Firestore).
    * DOM manipulation and event handling.
    * State management for users, trials, and favorites.
    * All feature logic (filtering, saving, comparing, PDF export, etc.).

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
