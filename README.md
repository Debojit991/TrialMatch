<div align="center">

# 🏥 TrialMatch+
### From confusion to clarity—your clinical trial companion.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=flat&logo=firebase&logoColor=white)](https://firebase.google.com/)
[![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=flat&logo=javascript&logoColor=%23F7DF1E)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

<a href="https://trialmatch-plus.netlify.app/">
  <img src="https://img.shields.io/badge/View_Live_Demo-3b82f6?style=for-the-badge&logo=google-chrome&logoColor=white" alt="View Live Demo" />
</a>

</div>

---

## 📖 About
**TrialMatch+** is a dual-interface platform bridging the gap between patients and medical research. It features a **Patient Portal** for discovering trials with AI-simplified summaries and a **Doctor Dashboard** for managing listings and patient leads.

---

## ✨ Key Features

### 🧑‍🤝‍🧑 For Patients
| Feature | Description |
| :--- | :--- |
| **🔍 Discovery** | Filter clinical trials by condition and location instantly. |
| **🧠 AI Summaries** | Complex medical jargon translated into simple language. |
| **📂 Profile** | Manage medical history and securely upload documents. |
| **🗣️ Assistant** | Multilingual voice chatbot (English, Bengali, Marathi, Tamil). |

### 👨‍⚕️ For Doctors
| Feature | Description |
| :--- | :--- |
| **📋 Management** | Create, edit, and track clinical trials effortlessly. |
| **📈 Leads** | View real-time interest from patients for specific trials. |
| **🔒 Security** | Access patient-shared documents via a secure viewer. |

---

## 🛠️ Tech Stack
* **Frontend:** ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
* **Backend:** ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black) (Auth & Firestore)
* **Tools:** `Chart.js`, `jsPDF`, `Cloudinary API`, `Font Awesome`

---

## 📂 Project Structure

```bash
TrialMatch/
├── index.html      # 🏗️ Main entry point (DOM structure)
├── style.css       # 🎨 Global styles & glassmorphism UI
├── script.js       # ⚙️ App logic, Firebase & Events
├── README.md       # 📄 Documentation
└── LICENSE         # ⚖️ MIT License
🚀 Getting Started
1. Clone the Repository
git clone [https://github.com/Debojit991/TrialMatch.git](https://github.com/Debojit991/TrialMatch.git)
2. Configuration
You must configure the external services in script.js before running:

Firebase: Locate const firebaseConfig = { ... } and paste your API keys.

Cloudinary: Find handleFileUpload and update your cloudName and uploadPreset.

3. Run the App
Since this is a static app, you can:

Open index.html directly in your browser.

Recommended: Use the Live Server extension in VS Code for best performance.

🔮 Roadmap
[ ] Backend-based AI for dynamic trial summarization.

[ ] Integration with ClinicalTrials.gov API.

[ ] Enhanced document encryption.

🤝 Contributing
Contributions are welcome! Please fork the repo and submit a PR.

📄 License
Distributed under the MIT License.
