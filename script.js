  document.addEventListener('DOMContentLoaded', () => {
   
     // --- Chatbot Toggle and Close (Final) ---
const chatbotToggle = document.getElementById('chatbot-toggle');
const chatbotWidget = document.getElementById('chatbot-widget');
const chatbotClose  = document.getElementById('chatbot-close');
const chatbotInput  = document.getElementById('chatbot-input');

function openChat() {
  chatbotWidget.classList.remove('d-none');
  if (chatbotInput) chatbotInput.focus();
}
function closeChat(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  chatbotWidget.classList.add('d-none');
}

if (chatbotToggle) {
  chatbotToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    openChat();
  });
}

if (chatbotClose) {
  chatbotClose.addEventListener('click', closeChat);
}

// close when clicking outside
document.addEventListener('click', (e) => {
  if (!chatbotWidget.classList.contains('d-none') &&
      !e.target.closest('#chatbot-widget') &&
      !e.target.closest('#chatbot-toggle')) {
    closeChat();
  }
});

// prevent clicks inside widget from closing it
chatbotWidget.addEventListener('click', (e) => e.stopPropagation());
// --- REPLACE THE ENTIRE CHATBOT SECTION WITH THIS VOICE-ENABLED VERSION ---

const chatbotMessages = document.getElementById('chatbot-messages');
const chatbotSendBtn = document.getElementById('chatbot-send');
const chatbotMicBtn = document.getElementById('chatbot-mic'); // New Mic Button


// 1. Multilingual Data
const chatbotData = {
    en: {
        greeting: "Hello! How can I help you find a trial today?",
        definition: "A clinical trial studies new medical treatments in people to see if they are safe and effective.",
        find: "Use the filters on the main page. If you complete your profile, we will match you automatically.",
        phases: "Phases:\n- I: Safety (small group).\n- II: Effectiveness.\n- III: Comparison (large group).",
        thanks: "You're welcome! Stay healthy.",
        unknown: "I didn't understand. Ask about 'clinical trials', 'how to find', or 'phases'."
    },
    bn: {
        greeting: "নমস্কার! আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
        definition: "ক্লিনিকাল ট্রায়াল হল মানুষের উপর নতুন চিকিৎসার গবেষণা যা এর নিরাপত্তা ও কার্যকারিতা যাচাই করে।",
        find: "আপনি মূল পেজে ফিল্টার ব্যবহার করুন। প্রোফাইল সম্পূর্ণ করলে আমরা আপনার জন্য ট্রায়াল খুঁজে দেব।",
        phases: "ধাপ:\n- ১: নিরাপত্তা (ছোট দল)।\n- ২: কার্যকারিতা।\n- ৩: তুলনা (বড় দল)।",
        thanks: "আপনাকে স্বাগতম! সুস্থ থাকুন।",
        unknown: "বুঝতে পারিনি। 'ক্লিনিকাল ট্রায়াল কি' বা 'কিভাবে খুঁজব' জিজ্ঞাসা করুন।"
    },
    mr: {
        greeting: "नमस्कार! मी तुम्हाला कशी मदत करू?",
        definition: "क्लिनिकल ट्रायल म्हणजे नवीन उपचारांचा लोकांवर अभ्यास करणे, जेणेकरून ते सुरक्षित आहेत का हे समजेल.",
        find: "मुख्य पृष्ठावरील फिल्टर वापरा. प्रोफाइल पूर्ण केल्यास आम्ही तुमच्यासाठी चाचण्या शोधू.",
        phases: "टप्पे:\n- १: सुरक्षा (लहान गट).\n- २: परिणामकारकता.\n- ३: तुलना (मोठा गट).",
        thanks: "स्वागत आहे! निरोगी राहा.",
        unknown: "समजले नाही. कृपया 'ट्रायल काय आहे' किंवा 'कसे शोधायचे' याबद्दल विचारा."
    },
    ta: {
        greeting: "வணக்கம்! நான் உங்களுக்கு எப்படி உதவ முடியும்?",
        definition: "மருத்துவ பரிசோதனை என்பது புதிய சிகிச்சைகள் பாதுகாப்பானதா என்பதை அறிய மக்களிடம் நடத்தப்படும் ஆய்வு.",
        find: "முக்கிய பக்கத்தில் வடிப்பான்களைப் பயன்படுத்தவும். சுயவிவரத்தை முடித்தால், உங்களுக்கான சோதனைகளை நாங்கள் காண்பிப்போம்.",
        phases: "நிலைகள்:\n- 1: பாதுகாப்பு.\n- 2: செயல்திறன்.\n- 3: ஒப்பீடு.",
        thanks: "நல்வரவு! ஆரோக்கியமாக இருங்கள்.",
        unknown: "புரியவில்லை. 'சோதனை என்றால் என்ன' அல்லது 'எப்படி கண்டுபிடிப்பது' என்று கேட்கவும்."
    }
};

// 2. Identify Intent (Smart "Context" Matching)
const identifyIntent = (input) => {
    input = input.toLowerCase();
    
    // --- DEBUGGING: Uncomment the next line to see exactly what the bot "hears" in the console ---
    // console.log("Bot heard:", input);

    // 1. PHASES / STAGES (Check this First!)
    // Logic: Look for "Phase" words OR if the user mentions "Trial" + a number (1, 2, 3)
    const mentionsPhaseWord = input.match(/phase|fej|face|page|stage|step|level|ধাপ|ফেজ|পর্যায়|फेज|टप्पा|स्तर|கட்டம்|நிலை/);
    const mentionsNumber = input.match(/1|2|3|one|two|three|i|ii|iii|১|২|৩|एक|दोन|तीन/);
    
    if (mentionsPhaseWord || (input.includes('trial') && mentionsNumber)) {
        return 'phases';
    }

    // 2. FIND / SEARCH
    if (input.match(/find|search|look|get|where|খুঁজব|সন্ধান|পাব|কোথায়|কিভাবে|शोध|कुठे|मिळवा|தேடு|எங்கே|கண்டுபிடி/)) return 'find';

    // 3. GREETINGS
    if (input.match(/hello|hi|hey|namaskar|vanakkam|pranam|হ্যালো|নমস্কার|ওহে|हाय|नमस्ते|வணக்கம்/)) return 'greeting';

    // 4. THANKS
    if (input.match(/thank|dhanyavad|nandri|ধন্যবাদ|आभार|நன்றி/)) return 'thanks';

    // 5. DEFINITION (Check this Last)
    // Logic: Look for "Clinical", "Definition", "Mean", "What is", or just "Trial"
    if (input.match(/clinical|trial|what|mean|defin|ট্রায়াল|কি|কাকে বলে|ट्रायल|काय आहे|म्हणजे|சோதனை|என்றால் என்ன|விளக்கம்/)) return 'definition';

    return 'unknown';
};

// 3. VOICE CONFIGURATION
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synthesis = window.speechSynthesis;
let recognition = null;

// Map Dropdown Values (en, bn) to Speech API Codes (en-US, bn-IN)
const langMap = {
    'en': 'en-US',
    'bn': 'bn-IN',
    'mr': 'mr-IN',
    'ta': 'ta-IN'
};

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after one sentence
    recognition.interimResults = false;
}

// 4. Speak Function (Text-to-Speech)
const speakResponse = (text, langCode) => {
    if (!synthesis) return;
    synthesis.cancel(); // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    // Optional: Adjust speed/pitch if needed
    utterance.rate = 0.9; 
    synthesis.speak(utterance);
};

// 5. Add Message to Chat UI
const addChatMessage = (message, sender) => {
    const messageEl = document.createElement('div');
    messageEl.classList.add('chat-message', sender);
    messageEl.innerHTML = message.replace(/\n/g, '<br>');
    chatbotMessages.appendChild(messageEl);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight; 
};

// 6. Main Handler
const handleSendMessage = (triggeredByVoice = false) => {
    const userInput = chatbotInput.value.trim();
    if (userInput === "") return;

    // A. Add User Message
    addChatMessage(userInput, 'user');
    chatbotInput.value = "";

    // B. Get Current Language Settings
    const langSelect = document.getElementById('language-selector');
    const currentLangKey = langSelect ? langSelect.value : 'en';
    const speechLangCode = langMap[currentLangKey] || 'en-US';

    // C. Get Bot Response
    setTimeout(() => {
        const intent = identifyIntent(userInput);
        const responseSet = chatbotData[currentLangKey] || chatbotData['en'];
        const botResponse = responseSet[intent];

        addChatMessage(botResponse, 'bot');

        // D. Speak the response ONLY if input was voice
        if (triggeredByVoice) {
            speakResponse(botResponse, speechLangCode);
        }
    }, 500);
};

// 7. Event Listeners
chatbotSendBtn.addEventListener('click', () => handleSendMessage(false));
chatbotInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleSendMessage(false);
    }
});

// 8. Microphone Button Logic
if (chatbotMicBtn && recognition) {
    chatbotMicBtn.addEventListener('click', () => {
        // Get selected language for listening
        const langSelect = document.getElementById('language-selector');
        const currentCode = langMap[langSelect ? langSelect.value : 'en'];
        
        recognition.lang = currentCode;
        recognition.start();
        
        // Visual feedback (change icon color)
        chatbotMicBtn.style.color = "red";
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        chatbotInput.value = transcript;
        chatbotMicBtn.style.color = ""; // Reset color
        handleSendMessage(true); // Trigger send with Voice Flag = true
    };

    recognition.onerror = (event) => {
        console.error("Speech Error:", event.error);
        chatbotMicBtn.style.color = ""; // Reset color
        alert("Microphone error. Please allow permissions.");
    };
    
    recognition.onend = () => {
        chatbotMicBtn.style.color = "";
    };
} else if (chatbotMicBtn) {
    chatbotMicBtn.style.display = 'none'; // Hide if browser doesn't support speech
}

        // --- 3. Nav Link Active State ---
    // --- 3. Nav Link Logic (FIXED for Single Page Nav) ---
    const navLinks = document.querySelectorAll('.nav-links a');
    
    // Function to return to main view
    const returnToMainView = () => {
        document.getElementById('trial-details-view').classList.add('d-none');
        document.getElementById('patient-view').classList.remove('d-none');
        document.getElementById('doctor-dashboard').classList.add('d-none');
    };

   // --- 3. REVISED Nav Link Logic (Separate Tabs Fix) ---
    document.getElementById('nav-links').addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        
        const targetId = link.getAttribute('href').substring(1);

        // A. Handle Doctor Logic (Dashboard vs Forum)
        if (userProfile?.role === 'doctor') {
            document.getElementById('trial-details-view').classList.add('d-none');
            document.getElementById('forum-details-view').classList.add('d-none');

            if (targetId === 'forum-section') {
                // Show Forum Only
                document.getElementById('doctor-dashboard').classList.add('d-none');
                document.getElementById('patient-view').classList.remove('d-none');
                // Hide all patient sections, show only forum
                document.querySelectorAll('#patient-view > section').forEach(el => el.classList.add('d-none'));
                document.getElementById('forum-section').classList.remove('d-none');
            } else {
                // Show Dashboard
                document.getElementById('patient-view').classList.add('d-none');
                document.getElementById('doctor-dashboard').classList.remove('d-none');
                const el = document.getElementById(targetId);
                if(el) el.scrollIntoView({ behavior: 'smooth' });
            }
            return; 
        }

        // B. Handle Patient Logic (Landing Page vs Tabs)
        // 1. Ensure basic views are correct
        document.getElementById('doctor-dashboard').classList.add('d-none');
        document.getElementById('patient-view').classList.remove('d-none');
        document.getElementById('trial-details-view').classList.add('d-none');
        document.getElementById('forum-details-view').classList.add('d-none');

        // 2. Identify if we are clicking a "Tab"
        const isTab = ['favorites-section', 'forum-section'].includes(targetId);
        const patientSections = document.querySelectorAll('#patient-view > section');

        // 3. Toggle Visibility
        patientSections.forEach(section => {
            if (isTab) {
                // TAB MODE: If clicking "My Saved" or "Community", hide everything else
                if (section.id === targetId) {
                    section.classList.remove('d-none');
                } else {
                    section.classList.add('d-none');
                }
            } else {
                // LANDING MODE: If clicking "Home" or "Find Trials", show landing content, hide Tabs
                if (section.id === 'favorites-section' || section.id === 'forum-section') {
                    section.classList.add('d-none');
                } else {
                    section.classList.remove('d-none');
                }
            }
        });

        // 4. Smooth Scroll
        setTimeout(() => {
            const target = document.getElementById(targetId);
            if(target) target.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    });
        // --- 3. Glass Card "Shine" Effect Listener ---
    document.body.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.glass-card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
        // --- Scroll-to-Reveal Animation ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Optional: stop observing once visible
            }
        });
    }, { threshold: 0.1 }); // Trigger when 10% of the element is visible

    // Add elements you want to animate
    document.querySelectorAll('.section, .card, .how-it-works-step, .hero h1, .hero p, .hero .btn').forEach(el => {
        el.classList.add('reveal-on-scroll'); // Add this class to set initial state
        observer.observe(el);
    });

    // --- Staggered Scroll Animation ---
    document.querySelectorAll('.grid, .grid-3').forEach(grid => {
        const items = grid.querySelectorAll('.card, .how-it-works-step');
        items.forEach((item, index) => {
            item.style.setProperty('--delay', `${index * 100}ms`);
        });
    });
        // --- Firebase Configuration ---
        const firebaseConfig = {
            apiKey: "AIzaSyDrH9nKJfFKvqurykcRS1x99gYITuxA6RM",
            authDomain: "trialmatch-8d3b9.firebaseapp.com",
            projectId: "trialmatch-8d3b9",
            storageBucket: "trialmatch-8d3b9.appspot.com",
            messagingSenderId: "937500473593",
            appId: "1:937500473593:web:9d495b8e1e0ef184df0a28",
            measurementId: "G-YC016PDQ2Z"
        };

        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.firestore();
        const googleProvider = new firebase.auth.GoogleAuthProvider();
        
        // --- STATE & DOM ---
        const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    let age = new Date().getFullYear() - birthDate.getFullYear();
    const m = new Date().getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && new Date().getDate() < birthDate.getDate())) {
        age--;
    }
    return age > 0 ? age : 0;
};
// --- MULTILINGUAL SUPPORT START ---
  // --- MULTILINGUAL SUPPORT (DYNAMIC HEADER POSITION) ---
    const langSelector = document.getElementById('language-selector');
    const headerElement = document.querySelector('.header');

    // Helper: Read a specific cookie safely
    function getGoogleCookie() {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; googtrans=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    // Helper: Move Header Based on Language
    function adjustHeaderPosition(langCode) {
        if (!headerElement) return;
        
        if (langCode === 'en') {
            // English: Normal clean look
            headerElement.style.top = '20px';
        } else {
            // Other Languages: Move down to make room for Google Bar
            headerElement.style.top = '60px';
        }
    }

    if (langSelector) {
        // 1. SET DROPDOWN & POSITION ON LOAD
        let currentLang = 'en'; // Default
        const currentCookie = getGoogleCookie();
        
        if (currentCookie) {
            const parts = currentCookie.split('/');
            // If cookie is "/en/bn", parts[2] is "bn"
            if (parts.length >= 3) {
                currentLang = parts[2]; 
            }
        }
        
        langSelector.value = currentLang;
        
        // Execute the position check immediately on load
        adjustHeaderPosition(currentLang);

        // 2. HANDLE CHANGE (Write Cookie & Reload)
        langSelector.addEventListener('change', function() {
            const selectedLang = this.value;
            
            // Adjust position immediately for visual feedback before reload
            adjustHeaderPosition(selectedLang);

            // Cookie format: /source_lang/target_lang
            const cookieValue = `/en/${selectedLang}`; 

            // Clear old cookies
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;

            // Set new cookie
            document.cookie = `googtrans=${cookieValue}; path=/`;

            // Reload page
            window.location.reload();
        });
    }
    // --- MULTILINGUAL SUPPORT END ---
       let allTrials = [], favorites = [], favoriteDetails = {}, toCompare = [], currentUser = null, userProfile = null, chartInstance = null, allForumQuestions = [];
        let tempTrialIdToSave = null; // <--- ADD THIS
        const trialsContainer = document.getElementById('trials-container');
        const filterForm = document.getElementById('filter-form');
        const conditionInput = document.getElementById('condition');
        const locationInput = document.getElementById('location');
        const authModal = document.getElementById('auth-modal');
        const profileModal = document.getElementById('profile-modal');
        const themeCheckbox = document.getElementById('theme-checkbox');
        const navLinksContainer = document.getElementById('nav-links');
        
       // REPLACE the old onAuthStateChanged function with this:
auth.onAuthStateChanged(async user => {
    currentUser = user;
    if (user) {
        const userDocRef = db.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
            // Profile exists, just load it
            userProfile = { id: user.uid, ...userDoc.data() };
            if (userProfile.role === 'doctor') {
                setupDoctorView();
            } else {
                setupPatientView();
            }
        } else {
            // Profile does NOT exist, create a new one
            const newUserProfile = {
                email: user.email,
                name: user.displayName || 'New User',
                role: 'patient', // Default to patient
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await userDocRef.set(newUserProfile);
            userProfile = { id: user.uid, ...newUserProfile };

            // Set up the view and open the modal so they can complete their profile
            setupPatientView();
            openProfileModal();
        }
        authModal.style.display = 'none';
    } else {
        resetToLoggedOutState();
    }
});

      const setupPatientView = () => {
            document.getElementById('eligibility-legend').classList.remove('d-none');
          
            document.getElementById('patient-view').classList.remove('d-none');
            document.getElementById('doctor-dashboard').classList.add('d-none');
            document.getElementById('medical-history-section').classList.remove('d-none');
            renderMedicalDocs();
            
            navLinksContainer.innerHTML = `
                <li><a href="#home">Home</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#app-interface">Find Trials</a></li>
                <li><a href="#forum-section">Community</a></li> 
                <li><a href="#favorites-section">My Saved Trials</a></li>
            `;
            
            // --- REMOVED LINE: document.getElementById('favorites-section').classList.remove('d-none'); ---
            // This ensures it stays hidden until you click the tab
            
            updateAuthUI(true, 'patient');
            renderUserProfileCard();
            listenToFavorites();
            if(typeof updateContent === "function") updateContent(document.getElementById('language-selector').value);
        };
      const setupDoctorView = () => {
            document.getElementById('patient-view').classList.add('d-none');
            document.getElementById('doctor-dashboard').classList.remove('d-none');
            navLinksContainer.innerHTML = `
                <li><a href="#add-trial-section">Add Trial</a></li>
                <li><a href="#forum-section">Community</a></li> `;
            document.getElementById('new-trial-location').value = userProfile?.location || "";
            updateAuthUI(true, 'doctor');
            loadManagedTrials();
            loadPatientLeads();
            // loadAllPatients() removed to enforce patient access control
        };
        const resetToLoggedOutState = () => {
            currentUser = null;
            userProfile = null;
            document.getElementById('eligibility-legend').classList.add('d-none');
            document.getElementById('patient-view').classList.remove('d-none');
            document.getElementById('doctor-dashboard').classList.add('d-none');
            navLinksContainer.innerHTML = `
                <li><a href="#home">Home</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
            `;
            document.getElementById('favorites-section').classList.add('d-none');
            document.getElementById('patient-profile-card').classList.add('d-none');
            updateAuthUI(false);
            
            document.getElementById('login-form').reset();
            document.getElementById('signup-form').reset();
            document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');

            favorites = [];
            favoriteDetails = {};
            toCompare = [];
            renderFavorites();
            applyFilters();
            if(typeof updateContent === "function") updateContent(document.getElementById('language-selector').value);
        };

        const updateAuthUI = (isLoggedIn, role = 'patient') => {
            const authContainer = document.getElementById('auth-container');
            const profileIconContainer = document.getElementById('user-profile-icon');
            const loginButton = document.getElementById('login-signup-btn');

            if (isLoggedIn) {
                if(loginButton) loginButton.style.display = 'none';
                
                let iconUrl = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTaPs3UMx8NErg4mkks0cYfrw9yME2pDMpFP_uMy3oZsQ&s=10';
                if (role === 'doctor') {
                    iconUrl = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRymF4Am_crLSm_gi5M_VyYyHDvJ-nhdpaVnw&s';
                }
                
                profileIconContainer.innerHTML = `
                    <img src="${iconUrl}" alt="Profile">
                    <span id="edit-profile-pencil"><i class="fas fa-pencil-alt"></i></span>
                `;
                profileIconContainer.classList.remove('d-none');
                
                if (!document.getElementById('logout-btn')) {
                    const logoutBtn = document.createElement('button');
                    logoutBtn.id = 'logout-btn';
                    logoutBtn.className = 'btn btn-secondary';
                    logoutBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout`;
                    authContainer.appendChild(logoutBtn);
                }
            } else {
                if(loginButton) loginButton.style.display = 'inline-flex';
                profileIconContainer.classList.add('d-none');
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) logoutBtn.remove();
            }
        };

        const handleSignUp = (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const role = document.getElementById('account-type').value;
            const name = document.getElementById('signup-name').value;
            const specialization = document.getElementById('signup-specialization').value;
            const doctorId = document.getElementById('signup-doctor-id').value;
            const location = document.getElementById('signup-location').value;
            const errorEl = document.getElementById('signup-error');
            
            if (password.length < 6) {
                errorEl.textContent = "Password must be at least 6 characters.";
                errorEl.style.display = 'block';
                return;
            }
            errorEl.style.display = 'none';
            
            auth.createUserWithEmailAndPassword(email, password)
                .then(userCredential => {
                    const user = userCredential.user;
                    const userRef = db.collection('users').doc(user.uid);
                    const profileData = {
                        email: user.email, role: role, name: name,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    if (role === 'doctor') {
                        profileData.specialization = specialization;
                        profileData.doctorId = doctorId;
                        profileData.location = location;
                    }
                    return userRef.set(profileData);
                })
                .then(() => {
                    authModal.style.display = 'none';
                    openProfileModal();
                })
                .catch(err => {
                    errorEl.textContent = err.message;
                    errorEl.style.display = 'block';
                });
        };
        
        const handleGoogleSignIn = () => {
            auth.signInWithPopup(googleProvider).catch(err => {
                console.error("Google Sign In Error:", err);
                alert("Could not sign in with Google. Please try again.");
            });
        };
        
        const handleForgotPassword = () => {
            const email = prompt("Please enter your email address to reset your password:");
            if (email) {
                auth.sendPasswordResetEmail(email)
                    .then(() => alert("Password reset email sent! Please check your inbox."))
                    .catch((error) => alert(`Error: ${error.message}`));
            }
        };

        // --- DATA & RENDERING ---
      /* --- REPLACEMENT FOR renderTrials --- */
const renderTrials = (trialsToRender) => {
    trialsContainer.innerHTML = '';
    document.getElementById('no-results').classList.toggle('d-none', trialsToRender.length > 0);

    trialsToRender.forEach(trial => {
        const isFavorite = favorites.includes(trial.id);
        const isComparing = toCompare.includes(trial.id);
        const { eligible: isEligible, reason: eligibilityReason } = checkEligibility(trial, userProfile);
        
        // Create the card element
        const card = document.createElement('div');
        card.className = 'trial-card glass-card'; 
        
        // Fix: Removed duplicate 'div', fixed layout, added 'View Details' button
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <h3 style="margin-right: 10px;">${trial.title}</h3>
                ${userProfile?.role === 'patient' ? `<span class="eligibility-indicator ${isEligible ? 'eligible' : 'ineligible'}" title="${eligibilityReason}" style="flex-shrink: 0;"></span>` : ''}
            </div>
            
            <div class="tags-container">
                <span class="tag tag-condition"><i class="fas fa-notes-medical"></i> ${trial.condition}</span>
                <span class="tag tag-location"><i class="fas fa-map-marker-alt"></i> ${trial.location}</span>
            </div>
            
            ${trial.hospitalName && trial.hospitalName !== 'N/A' ? `<div class="info-item"><i class="fas fa-hospital"></i> ${trial.hospitalName}</div>` : ''}
            <div class="info-item"><i class="fas fa-calendar-alt"></i> ${trial.duration}</div>
            <div class="info-item"><i class="fas fa-wallet"></i> ${trial.compensation}</div>
            
            ${trial.doctorName && trial.doctorName !== 'N/A' ? `
                <div class="info-item" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(156, 163, 175, 0.2);">
                    <i class="fas fa-user-md"></i> <strong>Dr. ${trial.doctorName}</strong>
                </div>
            ` : ''}

            ${trial.doctorWhatsapp && trial.doctorWhatsapp !== 'N/A' ? `
                <div class="info-item">
                    <i class="fab fa-whatsapp"></i> <a href="https://wa.me/${trial.doctorWhatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(`HI I AM ${userProfile?.name || 'a patient'} FROM TRIALMATCH`)}" target="_blank" style="text-decoration: none; color: inherit;">Contact on WhatsApp</a>
                </div>
            ` : ''}
            
            ${trial.simpleExplanation ? `<div class="simple-explanation"><i class="fas fa-brain"></i> <strong>AI Summary:</strong> ${trial.simpleExplanation}</div>` : ''}
            
            <div class="actions">
                <button class="btn ${isFavorite ? 'btn-primary' : 'btn-secondary'} favorite-btn" data-id="${trial.id}">
                    <i class="fas fa-heart"></i> ${isFavorite ? 'Saved' : 'Save'}
                </button>
                <button class="btn ${isComparing ? 'btn-primary' : 'btn-secondary'} compare-btn" data-id="${trial.id}">
                    <i class="fas fa-exchange-alt"></i> ${isComparing ? 'Comparing' : 'Compare'}
                </button>
                <button class="btn btn-secondary view-details-btn" data-id="${trial.id}">
                    View Details
                </button>
            </div>`;
        trialsContainer.appendChild(card);
    });
    updateDynamicChart(trialsToRender);
};
        const renderUserProfileCard = () => {
            const card = document.getElementById('patient-profile-card');
            const detailsContainer = document.getElementById('patient-profile-details');
            if (!currentUser || !userProfile || userProfile.role !== 'patient') {
                card.classList.add('d-none'); return;
            }
            detailsContainer.innerHTML = `
                <div><strong><i class="fas fa-user"></i> Name:</strong> ${userProfile.name || 'N/A'}</div>
                <div><strong><i class="fas fa-birthday-cake"></i> Age:</strong> ${userProfile.age || 'Not Set'}</div>
                <div><strong><i class="fab fa-whatsapp"></i> WhatsApp:</strong> ${userProfile.whatsapp || 'Not Set'}</div>
                <div><strong><i class="fas fa-envelope"></i> Email:</strong> ${userProfile.email || 'N/A'}</div>
            `;
            card.classList.remove('d-none');
        };
        // --- MEDICAL DOCS LOGIC (CLOUDINARY) ---
const handleFileUpload = async (e) => {
    // 1. YOUR KEYS HERE
    const cloudName = "dndzrwnhm"; 
    const uploadPreset = "ml_default"; 

    const files = e.target.files;
    if (!files.length) return;

    const progressBar = document.getElementById('upload-progress-bar');
    const statusText = document.getElementById('upload-status-text');
    document.getElementById('upload-progress-container').classList.remove('d-none');

    let completed = 0;
    const total = files.length;

    for (let i = 0; i < total; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        try {
            statusText.innerText = `Uploading ${i+1}/${total}...`;
            
            // Upload to Cloudinary
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST', body: formData
            });
            const data = await res.json();
            
            if (!data.secure_url) throw new Error("Upload failed");

            // Save Link to Firestore ONLY (The listener will update the UI)
            const docData = { url: data.secure_url, name: file.name };
            await db.collection('users').doc(currentUser.uid).update({
                medicalDocuments: firebase.firestore.FieldValue.arrayUnion(docData)
            });

            // --- REMOVED MANUAL PUSH TO PREVENT DUPLICATES ---
            
            completed++;
            progressBar.style.width = `${(completed / total) * 100}%`;

        } catch (err) {
            console.error(err);
            alert("Upload failed. Check Cloud Name/Preset.");
        }
    }

    setTimeout(() => {
        document.getElementById('upload-progress-container').classList.add('d-none');
        progressBar.style.width = '0%';
        // renderMedicalDocs(); // <-- REMOVED (Listener handles it now)
    }, 1000);
};
const renderMedicalDocs = () => {
    const gallery = document.getElementById('medical-docs-gallery');
    gallery.innerHTML = '';
    
    if (userProfile?.medicalDocuments?.length > 0) {
        userProfile.medicalDocuments.forEach(doc => {
            const div = document.createElement('div');
            div.className = 'doc-item';
            div.innerHTML = `
                <img src="${doc.url}">
                <div class="doc-zoom-btn" onclick="window.open('${doc.url}', '_blank')">View</div>
                <button class="doc-delete-btn" onclick="deleteMedicalDoc('${doc.url}')"><i class="fas fa-trash"></i></button>
            `;
            gallery.appendChild(div);
        });
    } else {
        gallery.innerHTML = '<p style="color:#888; width:100%;">No documents uploaded.</p>';
    }
};

window.deleteMedicalDoc = async (url) => {
    if(!confirm("Delete this document?")) return;
    const docObj = userProfile.medicalDocuments.find(d => d.url === url);
    await db.collection('users').doc(currentUser.uid).update({
        medicalDocuments: firebase.firestore.FieldValue.arrayRemove(docObj)
    });
    userProfile.medicalDocuments = userProfile.medicalDocuments.filter(d => d.url !== url);
    renderMedicalDocs();
};

        const renderFavorites = () => {
            const favoritesContainer = document.getElementById('favorites-container');
            const noFavoritesEl = document.getElementById('no-favorites');
            const favoritesActions = document.getElementById('favorites-actions');
            favoritesContainer.innerHTML = '';
            
            const hasFavorites = favorites && favorites.length > 0;
            noFavoritesEl.style.display = hasFavorites ? 'none' : 'block';
            favoritesActions.classList.toggle('d-none', !hasFavorites);
            document.getElementById('compare-favorites-btn').disabled = favorites.length < 2;

            if (!hasFavorites) return;

            const favoriteTrials = allTrials.filter(t => favorites.includes(t.id));
            favoriteTrials.forEach(trial => {
                // const favData = favoriteDetails[trial.id]; // <-- REMOVED
                // const savedDate = favData?.addedAt?.toDate()... // <-- REMOVED
                
                const card = document.createElement('div');
                card.className = 'trial-card glass-card favorite-card';
                card.dataset.id = trial.id;
                card.innerHTML = `
                    <h3>${trial.title}</h3>
                    <div class="info-item"><i class="fas fa-notes-medical"></i> <strong>Condition:</strong> ${trial.condition}</div>
                    <div class="info-item"><i class="fas fa-map-marker-alt"></i> <strong>Location:</strong> ${trial.location}</div>
                    
                    <div class="actions" style="margin-top: 20px;">
                        <button class="btn btn-secondary favorite-btn" data-id="${trial.id}"><i class="fas fa-trash"></i> Remove</button>
                        <button class="btn btn-secondary calendar-btn" data-id="${trial.id}"><i class="fas fa-calendar-plus"></i> Save to Calendar</button>
                    </div>`;
                favoritesContainer.appendChild(card);
            });
        };

        db.collection('trials').onSnapshot(snapshot => {
            allTrials = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            applyFilters();
            if(currentUser && userProfile?.role === 'doctor') loadManagedTrials();
        }, err => console.error("Error fetching trials:", err));
        // --- NEW HELPER FUNCTION ---
       /* REPLACE with this: */
/* --- REPLACEMENT FOR checkEligibility --- */
const checkEligibility = (trial, profile) => {
    // 1. Safe check: If user is not a patient or has incomplete profile
    if (!profile || profile.role !== 'patient' || !profile.dob) {
        return { eligible: false, reason: 'Complete your profile (including Date of Birth) to check eligibility.' };
    }

    // 2. CRITICAL FIX: Prevent crash if 'age_range' is missing in previous data
    if (!trial.age_range || !Array.isArray(trial.age_range)) {
         return { eligible: false, reason: 'Age requirements not specified for this trial.' };
    }

    // 3. Calculate eligibility
    const userAge = calculateAge(profile.dob);
    const [minAge, maxAge] = trial.age_range;

    if (userAge >= minAge && userAge <= maxAge) {
        return { eligible: true, reason: `Eligible: Your age (${userAge}) is in the required range (${minAge}-${maxAge}).` };
    } else {
        return { eligible: false, reason: `Ineligible: Your age (${userAge}) is outside the required range (${minAge}-${maxAge}).` };
    }
};
      const listenToFavorites = () => {
            if (!currentUser) return;
            
            // --- NEW: Listen to the user document directly ---
            db.collection('users').doc(currentUser.uid).onSnapshot(doc => {
                if (doc.exists) {
                    // Update the userProfile in real-time
                    userProfile = { id: doc.id, ...doc.data() }; 
                    
                    // Get favorites from the array, default to empty array
                    favorites = userProfile.favorites || []; 
                    
                    // Update UI elements automatically
                    renderFavorites();
                    renderMedicalDocs(); // <--- ADDED THIS LINE (Fixes Duplicates)
                    
                    if(document.getElementById('trials-container').innerHTML) applyFilters();
                }
            }, err => console.error("Error listening to user profile:", err));
        };
        // --- CORE LOGIC ---
    const applyFilters = () => {
        let filtered = [...allTrials];
        const conditionTerm = conditionInput.value.toLowerCase();
        const locationTerm = locationInput.value.toLowerCase();
        // The checkbox line is now removed.

        if (conditionTerm) filtered = filtered.filter(t => t.condition.toLowerCase().includes(conditionTerm));
        if (locationTerm) filtered = filtered.filter(t => t.location.toLowerCase().includes(locationTerm));

        renderTrials(filtered);
    };
        // --- EVENT LISTENERS ---
        filterForm.addEventListener('submit', (e) => { e.preventDefault(); applyFilters(); });
        ['input', 'change'].forEach(evt => filterForm.addEventListener(evt, applyFilters));

        document.body.addEventListener('click', async (e) => {
            const target = e.target;
            const closest = (selector) => target.closest(selector);
if (closest('.view-details-btn')) {
        const trialId = closest('.view-details-btn').dataset.id;
        openTrialDetails(trialId);
    }
            if (closest('#login-signup-btn') || closest('#cta-signup-btn')) authModal.style.display = 'block';
            if (closest('#my-profile-btn') || closest('#edit-profile-card-btn') || closest('#user-profile-icon')) openProfileModal();
            if (closest('#logout-btn')) auth.signOut();
      if (target.id === 'chatbot-close') {
    // Close chatbot widget
    document.getElementById('chatbot-widget').classList.add('d-none');
}
else if (closest('.close-btn')) {
    // Close modals normally
    const modal = closest('.modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

            if (closest('.auth-tab')) {
                const tab = closest('.auth-tab').dataset.tab;
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                target.classList.add('active');
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                document.getElementById(`${tab}-form`).classList.add('active');
            }
             if (closest('.tab-btn')) {
                const tabId = closest('.tab-btn').dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                target.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(tabId).classList.add('active');
            }
            if (closest('.favorite-btn')) {
                if (!currentUser) return authModal.style.display = 'block'; // Ask to login
                
                const trialId = closest('.favorite-btn').dataset.id;
                const isAlreadyFavorite = favorites.includes(trialId);

                // If the user is REMOVING a favorite, always allow it.
                if (isAlreadyFavorite) {
                    toggleFavorite(trialId);
                    return;
                }
                
                // --- NEW ELIGIBILITY CHECK ---
                // If the user is ADDING a favorite, check eligibility (for patients only)
                if (userProfile.role === 'patient') {
                    const trial = allTrials.find(t => t.id === trialId);
                    
                    if (trial) { // Make sure we found the trial data
                        const { eligible, reason } = checkEligibility(trial, userProfile);
                        
                        if (!eligible) {
                            // Show the "decline message"
                            alert(`Cannot Save Trial: ${reason}\n\nYou can only save trials you are eligible for at this time.`);
                            return; // Stop and do not save
                        }
                    }
                }
                
                // If eligible, or not a patient, proceed to save the trial
                toggleFavorite(trialId);
            }
             if (closest('.compare-btn')) {
                if (!currentUser) return authModal.style.display = 'block';
                toggleCompare(closest('.compare-btn').dataset.id);
            }
            if (closest('.calendar-btn')) {
                const trialId = closest('.calendar-btn').dataset.id;
                const trial = allTrials.find(t => t.id === trialId);
                if (trial) generateCalendarLink(trial);
            }
            if (closest('#compare-favorites-btn')) {
                toCompare = [...favorites];
                if (toCompare.length < 2) {
                    alert("Please save at least 2 trials to compare.");
                } else {
                    showComparison();
                }
            }
            if (closest('#google-signin-btn')) handleGoogleSignIn();
            if (closest('#forgot-password-link')) handleForgotPassword();
            if (closest('#export-pdf-btn')) exportFavoritesToPDF();
          if (closest('#detect-location-btn') || closest('#detect-location-filter-btn')) autoDetectLocation(closest('#detect-location-filter-btn'));
          // --- NEW: Handle Trial Deletion ---
            if (closest('.delete-trial-btn')) {
                const trialId = closest('.delete-trial-btn').dataset.id;
                if (confirm('Are you sure you want to delete this trial? This action cannot be undone.')) {
                    try {
                        await db.collection('trials').doc(trialId).delete();
                        alert('Trial deleted successfully.');
                        // The 'onSnapshot' listener for 'trials' will auto-refresh the list
                    } catch (err) {
                        console.error("Error deleting trial: ", err);
                        alert('Could not delete trial. Please try again.');
                    }
                }
            }

            // --- NEW: Handle Trial Editing (Populate Form) ---
            // --- FIX: Handle Trial Editing (Populate Form correctly) ---
            if (closest('.edit-trial-btn')) {
                const trialId = closest('.edit-trial-btn').dataset.id;
                const trial = allTrials.find(t => t.id === trialId);
                if (trial) {
                    const form = document.getElementById('add-trial-form');
                    form.dataset.editingId = trial.id; // Store ID for update logic

                    // Populate form fields
                    document.getElementById('new-trial-title').value = trial.title;
                    document.getElementById('new-trial-condition').value = trial.condition;
                    document.getElementById('new-trial-hospital').value = trial.hospitalName;
                    document.getElementById('new-trial-location').value = trial.location;
                    document.getElementById('new-trial-age-min').value = trial.age_range ? trial.age_range[0] : '';
                    document.getElementById('new-trial-age-max').value = trial.age_range ? trial.age_range[1] : '';
                    document.getElementById('new-trial-duration').value = trial.duration;
                    document.getElementById('new-trial-compensation').value = trial.compensation;
                    document.getElementById('new-trial-explanation').value = trial.explanation;

                    document.getElementById('new-trial-objective').value = trial.objective || '';
                    document.getElementById('new-trial-eligibility').value = trial.eligibilityCriteria || '';
                    document.getElementById('new-trial-success').value = trial.successRate || '';
                    document.getElementById('new-trial-time').value = trial.timeToOutcome || '';
                    document.getElementById('new-trial-side-effects').value = Array.isArray(trial.sideEffects) ? trial.sideEffects.join(', ') : (trial.sideEffects || '');
                    
                    // --- KEY FIX: Target the button OUTSIDE the form using the 'form' attribute ---
                    const submitBtn = document.querySelector('button[form="add-trial-form"]');
                    if(submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Trial';
                    
                    // Scroll to form
                    document.getElementById('add-trial-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });

        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorEl = document.getElementById('login-error');
            errorEl.style.display = 'none';
            auth.signInWithEmailAndPassword(email, password).catch(err => {
                errorEl.textContent = err.message;
                errorEl.style.display = 'block';
            });
        });

        document.getElementById('signup-form').addEventListener('submit', handleSignUp);
        
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const submitBtn = document.getElementById('save-profile-btn');
    const successEl = document.getElementById('profile-success');
    const errorEl = document.getElementById('profile-error');
    successEl.style.display = 'none';
    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    let profileData = {
        name: document.getElementById('profile-name').value
    };

    // --- FIX START ---
    // This block correctly handles patient-specific fields
    if (userProfile.role === 'patient') {
        const newDob = document.getElementById('profile-dob').value;
        
        // Save the date of birth
        profileData.dob = newDob; 
        
        // Calculate and save the new age using the helper function
        profileData.age = calculateAge(newDob); 

        // Combine country code and phone number for WhatsApp
        const countryCode = document.getElementById('profile-country-code').value;
        const phoneNumber = document.getElementById('profile-phone-number').value;
        if (phoneNumber) {
            profileData.whatsapp = `${countryCode}${phoneNumber}`;
        }
    }
    // --- FIX END ---
    else { // Doctor
        profileData.specialization = document.getElementById('profile-specialization').value;
        profileData.location = document.getElementById('profile-location').value;
        profileData.whatsapp = document.getElementById('profile-doctor-whatsapp').value;
    }

    try {
        await db.collection('users').doc(currentUser.uid).set(profileData, {
            merge: true
        });
        userProfile = { ...userProfile, ...profileData };
        successEl.style.display = 'block';
        if (userProfile.role === 'patient') renderUserProfileCard();

        setTimeout(() => {
            profileModal.style.display = 'none';
            successEl.style.display = 'none';
        }, 1500);
    } catch (err) {
        console.error("Error saving profile:", err);
        errorEl.textContent = "Could not save profile. Please try again.";
        errorEl.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Save Profile';
    }
});
        document.getElementById('account-type').addEventListener('change', (e) => {
            const isDoctor = e.target.value === 'doctor';
            document.querySelectorAll('.signup-doctor-fields').forEach(el => {
                el.classList.toggle('d-none', !isDoctor);
                el.querySelectorAll('input').forEach(input => input.required = isDoctor);
            });
        });
        
        themeCheckbox.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode', themeCheckbox.checked);
            localStorage.setItem('theme', themeCheckbox.checked ? 'dark' : 'light');
        });

        // --- FEATURE LOGIC ---
       const openProfileModal = () => {
            if (!userProfile) return;
            const isDoctor = userProfile.role === 'doctor';
            
            // Get references to the input fields
            const patientDob = document.getElementById('profile-dob');
            const patientPhone = document.getElementById('profile-phone-number');
            const doctorSpec = document.getElementById('profile-specialization');
            const doctorLoc = document.getElementById('profile-location');

            // Toggle visibility
            document.querySelector('#profile-modal .patient-fields').classList.toggle('d-none', isDoctor);
            document.querySelector('#profile-modal .doctor-fields').classList.toggle('d-none', !isDoctor);

            document.getElementById('profile-name').value = userProfile.name || '';
            
            if (isDoctor) {
                document.getElementById('profile-modal-title').textContent = 'Edit Doctor Profile';
                doctorSpec.value = userProfile.specialization || '';
                doctorLoc.value = userProfile.location || '';
                
                // --- FIX ---
                // Make doctor fields required, patient fields not required
                doctorSpec.required = true;
                doctorLoc.required = true;
                patientDob.required = false;
                patientPhone.required = false;

            } else {
                document.getElementById('profile-modal-title').textContent = 'Edit Patient Profile';
                patientDob.value = userProfile.dob || '';
                
                // --- FIX ---
                // Make patient fields required, doctor fields not required
                patientDob.required = true;
                patientPhone.required = true;
                doctorSpec.required = false;
                doctorLoc.required = false;

                // (The rest of your existing phone number logic is fine)
                const fullNumber = userProfile.whatsapp || '';
                const countryCodeEl = document.getElementById('profile-country-code');
                const phoneNumberEl = document.getElementById('profile-phone-number');
                let foundCode = false;
                for (let option of countryCodeEl.options) {
                    if (fullNumber.startsWith(option.value)) {
                        countryCodeEl.value = option.value;
                        phoneNumberEl.value = fullNumber.substring(option.value.length);
                        foundCode = true;
                        break;
                    }
                }
                if (!foundCode) {
                    phoneNumberEl.value = fullNumber;
                }
            }
            // Clear any previous error/success messages
            document.getElementById('profile-error').style.display = 'none';
            document.getElementById('profile-success').style.display = 'none';
            
            profileModal.style.display = 'block';
        };
       // --- CORRECTED TOGGLE FAVORITE FUNCTION ---
// --- UPDATED SAVE/FAVORITE LOGIC ---
// --- UPDATED SAVE/FAVORITE LOGIC ---
const toggleFavorite = (trialId) => {
    if (!currentUser) {
        authModal.style.display = 'block'; 
        return;
    }

    // If removing, just remove immediately
    if (favorites.includes(trialId)) {
        processFavoriteToggle(trialId, false, []);
        return;
    }

    // CHECK DOCUMENTS
    const docs = userProfile.medicalDocuments || [];
    tempTrialIdToSave = trialId; // Store ID globally

    if (docs.length === 0) {
        // SCENARIO 1: No Docs -> Prompt to Upload
        document.getElementById('no-docs-modal').style.display = 'block';
    } else {
        // SCENARIO 2: Has Docs -> Let user select
        showDocSelectionModal(docs);
    }
};

// Helper to render the selection modal
const showDocSelectionModal = (docs) => {
    const list = document.getElementById('doc-selection-list');
    list.innerHTML = '';

    docs.forEach((doc, index) => {
        const item = document.createElement('div');
        item.className = 'doc-checkbox-item';
        // Check all by default
        item.innerHTML = `
            <input type="checkbox" id="doc-check-${index}" value="${doc.url}" checked>
            <label for="doc-check-${index}">${doc.name || 'Untitled Document'}</label>
        `;
        list.appendChild(item);
    });

    document.getElementById('permission-modal').style.display = 'block';
};
// --- MISSING FUNCTION: PROCESS FAVORITE TOGGLE ---
const processFavoriteToggle = (trialId, shareDocs, sharedUrls = []) => {
    const userDocRef = db.collection('users').doc(currentUser.uid);
    const trial = allTrials.find(t => t.id === trialId);

    if (favorites.includes(trialId)) {
        // REMOVE logic (Unsave)
        userDocRef.update({ favorites: firebase.firestore.FieldValue.arrayRemove(trialId) });
        db.collection('users').doc(currentUser.uid).collection('favorites').doc(trialId).delete().catch(()=>{});
        
        favorites = favorites.filter(id => id !== trialId);
        renderTrials(allTrials);
        renderFavorites(); 
    } else {
        // ADD logic (Save)
        userDocRef.update({ favorites: firebase.firestore.FieldValue.arrayUnion(trialId) });
        
        // Save to subcollection with SELECTIVE DOCS
        const favoriteRef = db.collection('users').doc(currentUser.uid).collection('favorites').doc(trialId);
        
        favoriteRef.set({ 
            addedAt: firebase.firestore.FieldValue.serverTimestamp(),
            trialTitle: trial.title,
            doctorId: trial.doctorId || 'N/A',
            shareDocs: shareDocs,       // Boolean (Yes/No)
            sharedDocUrls: sharedUrls   // Array (List of specific file URLs)
        });
        
        let msg = "Trial saved!";
        if(shareDocs) msg += ` Shared ${sharedUrls.length} document(s) with the doctor.`;
        alert(msg);

        favorites.push(trialId);
        renderTrials(allTrials);
        renderFavorites();
    }
    
    // Cleanup (Close modals)
    if(tempTrialIdToSave) tempTrialIdToSave = null;
    const permModal = document.getElementById('permission-modal');
    if(permModal) permModal.style.display = 'none';
    const noDocsModal = document.getElementById('no-docs-modal');
    if(noDocsModal) noDocsModal.style.display = 'none';
};
        const toggleCompare = (trialId) => {
            const index = toCompare.indexOf(trialId);
            if (index > -1) toCompare.splice(index, 1);
            else if (toCompare.length < 5) toCompare.push(trialId);
            else alert("You can only compare up to 5 trials at a time.");
            
            applyFilters(); 
            if (toCompare.length > 1) {
                 showComparison();
            } else if (toCompare.length < 2 && document.getElementById('comparison-modal').style.display === 'block') {
                 document.getElementById('comparison-modal').style.display = 'none';
            }
        };

        const showComparison = () => {
            const trials = allTrials.filter(t => toCompare.includes(t.id));
            const table = document.getElementById('comparison-table');
            const comparisonModal = document.getElementById('comparison-modal');
            table.innerHTML = '';
            let header = '<thead><tr><th>Feature</th>' + trials.map(t => `<th>${t.title}</th>`).join('') + '</tr></thead>';
            let body = '<tbody>';
            const features = ['condition', 'hospitalName', 'location', 'duration', 'compensation', 'age_range'];
            features.forEach(feature => {
                body += `<tr><td><strong>${feature.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/\b\w/g, c => c.toUpperCase())}</strong></td>`;
                body += trials.map(t => `<td>${Array.isArray(t[feature]) ? t[feature].join(' - ') : (t[feature] || 'N/A')}</td>`).join('');
                body += '</tr>';
            });
            body += '</tbody>';
            table.innerHTML = header + body;
            comparisonModal.style.display = 'block';
        };
        
        const generateCalendarLink = (trial) => {
            const title = encodeURIComponent(`Clinical Trial: ${trial.title}`);
            const details = encodeURIComponent(`Discussion for clinical trial: ${trial.title}. Condition: ${trial.condition}.`);
            const location = encodeURIComponent(`${trial.hospitalName}, ${trial.location}`);
            // Creates an event for the next day at 10 AM, since we don't have specific dates
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + 1);
            startDate.setHours(10, 0, 0, 0);
            const endDate = new Date(startDate.getTime());
            endDate.setHours(11, 0, 0, 0);
            const formatISO = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');
            const dates = `${formatISO(startDate)}/${formatISO(endDate)}`;

            const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
            window.open(url, '_blank');
        };

        const exportFavoritesToPDF = () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const favoriteTrials = allTrials.filter(t => favorites.includes(t.id));

            if (favoriteTrials.length === 0) {
                alert("No saved trials to export."); return;
            }

            doc.text("My Saved Clinical Trials", 14, 16);
            
            const tableColumn = ["Title", "Condition", "Hospital", "Location"];
            const tableRows = [];

            favoriteTrials.forEach(trial => {
                const trialData = [ trial.title, trial.condition, trial.hospitalName || 'N/A', trial.location ];
                tableRows.push(trialData);
            });

            doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
            doc.save('TrialMatch_Favorites.pdf');
        };

        const autoDetectLocation = (isFilter = false) => {
            const updateField = (city) => {
                if (isFilter) {
                    document.getElementById('location').value = city;
                    applyFilters(); // Apply filters right away
                } else {
                    document.getElementById('profile-location').value = city;
                }
            };
            
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await response.json();
                        const city = data.address.city || data.address.town || data.address.village || 'Unknown Location';
                        updateField(city);
                    } catch (error) {
                        console.error("Error fetching city name:", error);
                        alert("Could not automatically detect your city. Please enter it manually.");
                    }
                }, () => alert("Unable to retrieve your location. Please ensure location services are enabled."));
            } else {
                alert("Geolocation is not supported by your browser.");
            }
        };

     document.getElementById('add-trial-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser || userProfile.role !== 'doctor') return;

            const form = e.target;
            const editingId = form.dataset.editingId; // Check if we are editing

            const fullExplanation = document.getElementById('new-trial-explanation').value;
           
            const trialData = {
                title: document.getElementById('new-trial-title').value,
                objective: document.getElementById('new-trial-objective').value,
                condition: document.getElementById('new-trial-condition').value,
                hospitalName: document.getElementById('new-trial-hospital').value,
                location: document.getElementById('new-trial-location').value,
                eligibilityCriteria: document.getElementById('new-trial-eligibility').value,
                age_range: [
                    parseInt(document.getElementById('new-trial-age-min').value, 10),
                    parseInt(document.getElementById('new-trial-age-max').value, 10)
                ],
                successRate: document.getElementById('new-trial-success').value,
                timeToOutcome: document.getElementById('new-trial-time').value,
                sideEffects: document.getElementById('new-trial-side-effects').value.split(',').map(s => s.trim()),
                duration: document.getElementById('new-trial-duration').value,
                compensation: document.getElementById('new-trial-compensation').value,
                explanation: fullExplanation,
                simpleExplanation: fullExplanation, 
            };
            
            trialData.doctorName = userProfile.name || 'N/A';
            trialData.doctorSpecialization = userProfile.specialization || 'N/A';
            trialData.doctorWhatsapp = userProfile.whatsapp || 'N/A';
            
            try {
                if (editingId) {
                    // --- UPDATE EXISTING TRIAL ---
                    trialData.lastUpdated = firebase.firestore.FieldValue.serverTimestamp();
                    await db.collection('trials').doc(editingId).update(trialData);
                    alert("Trial updated successfully!");
                    
                    // Clear editing state
                    delete form.dataset.editingId; 
                    
                    // --- FIX: Reset Button Text Back to 'Save Trial' ---
                    const submitBtn = document.querySelector('button[form="add-trial-form"]');
                    if(submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Save Trial';

                } else {
                    // --- ADD NEW TRIAL ---
                    trialData.doctorId = userProfile.doctorId || currentUser.uid;
                    trialData.postedBy = currentUser.uid;
                    trialData.postedAt = firebase.firestore.FieldValue.serverTimestamp();
                    await db.collection('trials').add(trialData);
                    alert("Trial added successfully!");
                }
                
                form.reset(); 
                document.getElementById('new-trial-location').value = userProfile?.location || "";
            } catch (err) {
                console.error("Error saving trial:", err);
                alert(`Could not ${editingId ? 'update' : 'add'} trial. Please try again.`);
            }
        });

        // --- DOCTOR DASHBOARD ---
      const loadManagedTrials = () => {
            const container = document.getElementById('managed-trials-container');
            const managed = allTrials.filter(t => t.postedBy === currentUser.uid);
            container.innerHTML = managed.length > 0
                ? managed.map(t => `
                    <div class="list-item">
                        <p style="flex-grow: 1; margin-right: 10px;"><strong>${t.title}</strong><br><small>${t.location}</small></p>
                        <div style="display: flex; gap: 10px; flex-shrink: 0;">
                            <button class="btn btn-secondary edit-trial-btn" data-id="${t.id}" style="padding: 5px 10px;" title="Edit Trial"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-secondary delete-trial-btn" data-id="${t.id}" style="padding: 5px 10px; background-color: var(--accent-red); color: white; border: none;" title="Delete Trial"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`).join('')
                : `<p>You haven't added any trials yet.</p>`;
        };
        
       // --- UPDATED DOCTOR LEADS (Step 3E) ---
// --- UPDATED DOCTOR LEADS (Step C) ---
// --- UPDATED DOCTOR LEADS ---
const loadPatientLeads = () => {
    const container = document.getElementById('patient-leads-container');
    container.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> Loading leads...</p>`;
    
    const doctorId = userProfile.doctorId || currentUser.uid;
    
    db.collectionGroup('favorites').where('doctorId', '==', doctorId)
      .onSnapshot(async (snap) => {
       if (snap.empty) { 
            container.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #9ca3af;">
                    <i class="fas fa-user-slash" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No patient leads yet.
                </div>`; 
            return; 
        }

        const leads = {};
        const userDocs = await Promise.all(snap.docs.map(d => d.ref.parent.parent.get()));

        userDocs.forEach((uDoc, i) => {
            if(uDoc.exists) {
                const uData = uDoc.data();
                const favData = snap.docs[i].data();
                const pid = uDoc.id;

                if(!leads[pid]) {
                    // PREPARE DOC DATA FOR BUTTON (Store in dataset)
                    // We only enable the button if shareDocs is true AND there are URLs
                    const sharedUrls = favData.sharedDocUrls || [];
                    const hasShared = favData.shareDocs && sharedUrls.length > 0;
                    
                    // Safe stringify for the dataset
                    const urlsString = encodeURIComponent(JSON.stringify(sharedUrls));

                    let docsBtn = hasShared
                        ? `<button class="btn btn-sm" onclick="openDocViewer('${pid}', '${uData.name}', '${urlsString}')" style="background:var(--primary-color); color:white; padding:5px 10px; font-size:0.8rem; border:none; border-radius:4px; margin-left:5px; cursor:pointer;">View Docs</button>`
                        : `<span style="font-size:0.8rem; color:#888;">(Private)</span>`;
                    
                    let whatsappBtn = uData.whatsapp 
                        ? `<a href="https://wa.me/${uData.whatsapp}" target="_blank" class="btn btn-sm" style="background:var(--accent-green); color:white; padding:5px 10px; font-size:0.8rem;">Chat</a>` 
                        : '';

                   leads[pid] = {
                        html: `<div class="list-item">
                                <div style="flex-grow: 1;">
                                    <strong>${uData.name}</strong><br>
                                    <span style="font-size: 0.9rem; color: #666;">Age: ${uData.age || 'N/A'}</span>
                                </div>
                                
                                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end;">
                                    ${whatsappBtn} 
                                    ${docsBtn}
                                </div>
                               </div>`,
                        trials: []
                    };
                }
                leads[pid].trials.push(favData.trialTitle);
            }
        });

        container.innerHTML = Object.values(leads).map(l => l.html).join('');
    });
};

// --- UPDATED VIEWER (Uses Shared List + Live Profile Check) ---
window.openDocViewer = async (pid, pname, encodedUrls) => {
    const nameLabel = document.getElementById('doc-viewer-patient-name');
    const gallery = document.getElementById('doc-viewer-gallery');
    
    if(nameLabel) nameLabel.textContent = `Shared Docs: ${pname}`;
    if(gallery) gallery.innerHTML = '<p>Verifying access...</p>';
    
    document.getElementById('doc-viewer-modal').style.display = 'block';

    try {
        // 1. Decode the allowed list from the button
        const allowedUrls = JSON.parse(decodeURIComponent(encodedUrls));

        // 2. Fetch LIVE profile to ensure images weren't deleted by patient
        const doc = await db.collection('users').doc(pid).get();
        if(!doc.exists) { gallery.innerHTML = 'User not found.'; return; }
        
        const userData = doc.data();
        const currentDocs = userData.medicalDocuments || [];

        // 3. FILTER: Only show docs that are BOTH in the shared list AND currently exist
        const docsToShow = currentDocs.filter(d => allowedUrls.includes(d.url));

        if(gallery) {
            gallery.innerHTML = docsToShow.length 
                ? docsToShow.map(d => `
                    <div class="doc-item">
                        <img src="${d.url}" onclick="window.open('${d.url}')">
                        <div style="text-align:center; font-size:0.8rem; padding:5px;">${d.name}</div>
                    </div>`).join('') 
                : '<p>No shared documents found (Patient may have deleted them).</p>';
        }

    } catch(e) {
        console.error(e);
        gallery.innerHTML = '<p>Error loading documents.</p>';
    }
};

        // --- ANALYTICS ---
        const updateDynamicChart = (data) => {
            const ctx = document.getElementById('trialsChart').getContext('2d');
            const conditions = [...new Set(data.map(t => t.condition))];
            const trialCounts = conditions.map(c => data.filter(t => t.condition === c).length);
            if (chartInstance) chartInstance.destroy();
            if (data.length === 0) return;

            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: { labels: conditions, datasets: [{ label: '# of Trials in View', data: trialCounts, backgroundColor: 'rgba(139, 92, 246, 0.5)', borderColor: 'rgba(139, 92, 246, 1)', borderWidth: 1 }] },
                options: { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
            });
        };
        
        // ... (your analytics code is here) ...

// --- Chatbot Logic ---
// (Chatbot variables and logic already declared above, so this duplicate block is removed.)

// --- END Chatbot Logic ---

// --- Force Chatbot Close to Work ---
document.getElementById('chatbot-close')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation(); // stop modal handler from catching it
    document.getElementById('chatbot-widget').classList.add('d-none');
});

// --- FIX: Trial Details View Logic (Moved Inside Scope) ---
const openTrialDetails = (trialId) => {
            // Now this function can access 'allTrials'
            const trial = allTrials.find(t => t.id === trialId);
            if (!trial) return;

            // 1. Hide List, Show Details
            document.getElementById('patient-view').classList.add('d-none');
            document.getElementById('trial-details-view').classList.remove('d-none');
            window.scrollTo(0, 0);

            // 2. Populate Data
            document.getElementById('detail-title').textContent = trial.title;
            document.getElementById('detail-objective').textContent = trial.objective || "Objective not specified.";
            // --- FIX: VISUAL DIFFERENTIATION FOR ELIGIBILITY ---
          // ... inside openTrialDetails ...

            // --- FIX: Formatted Criteria + Added Age Range Display ---
            const rawCriteria = trial.eligibilityCriteria || "Contact for details.";
            
            let formattedCriteria = rawCriteria
                .replace(/\n/g, '<br>')
                .replace(/(Inclusion[:\s-]*)/gi, '</div><div class="criteria-inc"><i class="fas fa-check-circle"></i> <strong>$1</strong> ')
                .replace(/(Exclusion[:\s-]*)/gi, '</div><div class="criteria-exc"><i class="fas fa-times-circle"></i> <strong>$1</strong> ');

            // Calculate Age String
            const ageDisplay = (trial.age_range && trial.age_range.length === 2) 
                ? `${trial.age_range[0]} - ${trial.age_range[1]} Years` 
                : 'Not specified';

            // Append Age Range to the Eligibility Box
            document.getElementById('detail-eligibility').innerHTML = `
                <div>${formattedCriteria}</div>
                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.1); font-weight: 500; color: var(--primary-color);">
                    <i class="fas fa-birthday-cake"></i> Required Age: <span style="color: #333;">${ageDisplay}</span>
                </div>
            `;
            
            // ... continue with detail-success-rate ...
            document.getElementById('detail-success-rate').textContent = trial.successRate ? `${trial.successRate}%` : 'N/A';
            document.getElementById('detail-time').textContent = trial.timeToOutcome || trial.duration || 'N/A';

            // 3. Populate Side Effects
            const sideEffectsContainer = document.getElementById('detail-side-effects');
            sideEffectsContainer.innerHTML = '';
            if (trial.sideEffects && trial.sideEffects.length > 0) {
                const effects = Array.isArray(trial.sideEffects) ? trial.sideEffects : trial.sideEffects.split(',');
                effects.forEach(effect => {
                    const span = document.createElement('span');
                    span.className = 'side-effect-tag';
                    span.innerHTML = `<i class="fas fa-allergies"></i> ${effect.trim()}`;
                    sideEffectsContainer.appendChild(span);
                });
            } else {
                sideEffectsContainer.innerHTML = '<span>None reported</span>';
            }

            // 4. Generate Random Mock Testimonials
           // 4. Generate Random Mock Testimonials
            const mockTestimonials = [
                // Added 'gender' property to decide which icon to show
                { text: "The simplified explanation really helped me understand what I was getting into.", author: "Rahul S.", gender: "male" },
                { text: "Grateful for the clear eligibility criteria. Saved me so much time.", author: "Priya M.", gender: "female" },
                { text: "The doctor was very responsive via the WhatsApp link provided.", author: "Amit K.", gender: "male" },
                { text: "I felt safe knowing the success rates beforehand.", author: "Sneha D.", gender: "female" }
            ];
            
            // Randomly pick 2 testimonials
            const selectedTestimonials = mockTestimonials.sort(() => 0.5 - Math.random()).slice(0, 2);
            
            const testimonialsContainer = document.getElementById('detail-testimonials');
            testimonialsContainer.innerHTML = selectedTestimonials.map(t => {
                // Logic: Choose icon and color based on gender
                // Male = Tie Icon (Blue), Female = User Icon (Purple/Pink)
                const iconClass = t.gender === 'male' ? 'fa-user-tie' : 'fa-user'; 
                const iconColor = t.gender === 'male' ? '#3b82f6' : '#8b5cf6'; 

                return `
                <div class="card glass-card" style="padding: 25px; text-align: center; display: flex; flex-direction: column; align-items: center;">
                    <div style="font-size: 2.5rem; color: ${iconColor}; margin-bottom: 12px; background: rgba(255,255,255,0.5); width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    
                    <div style="color: #fbbf24; margin-bottom: 12px; font-size: 0.9rem;">
                        <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                    </div>

                    <p style="font-style: italic; font-size: 0.95rem; color: #4b5563; margin-bottom: 15px; line-height: 1.5;">"${t.text}"</p>
                    
                    <div style="font-weight: 700; font-size: 0.9rem; color: var(--primary-color); border-top: 1px solid rgba(0,0,0,0.05); padding-top: 10px; width: 100%;">
                        - ${t.author}
                    </div>
                </div>
            `}).join('');
        };

        // Handle Back Button
       
        document.getElementById('back-to-trials-btn').addEventListener('click', () => {
            document.getElementById('trial-details-view').classList.add('d-none');
            document.getElementById('patient-view').classList.remove('d-none');
            // Scroll back to the trials list so user doesn't lose their place
            document.getElementById('trials-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        // --- INITIALIZATION ---
        const init = () => {
            if (localStorage.getItem('theme') === 'dark') {
                document.body.classList.add('dark-mode');
                themeCheckbox.checked = true;
            }
            resetToLoggedOutState();
        };
// A. Seed Mock Data if Empty
    const seedForumData = async () => {
        const snap = await db.collection('forum_questions').get();
        if (snap.empty) {
            const batch = db.batch();
            const mockQs = [
                {
                    title: "Is it safe to join a Phase I trial for Diabetes?",
                    body: "I have been diagnosed with Type 2 Diabetes recently and saw a Phase I trial listed. I'm worried about safety since it's the first phase. Has anyone done this?",
                    category: "Safety",
                    authorName: "Rohan G.",
                    authorRole: "patient",
                    createdAt: firebase.firestore.Timestamp.now(),
                    answerCount: 2
                },
                {
                    title: "How long does it take to get reimbursed for travel?",
                    body: "Many trials mention compensation for travel. Does anyone know if this is paid upfront or do we have to submit bills later?",
                    category: "General",
                    authorName: "Sarah L.",
                    authorRole: "patient",
                    createdAt: firebase.firestore.Timestamp.now(),
                    answerCount: 1
                },
                {
                    title: "Any experience with Dr. Sharma's Cardiology trials?",
                    body: "I am considering the new Heart Failure trial at City Hospital. The doctor seems nice. Any reviews?",
                    category: "Success Stories",
                    authorName: "Mike T.",
                    authorRole: "patient",
                    createdAt: firebase.firestore.Timestamp.now(),
                    answerCount: 0
                }
            ];

            mockQs.forEach(q => {
                const docRef = db.collection('forum_questions').doc();
                batch.set(docRef, q);
                
                // Add a mock answer to the first one
                if(q.answerCount > 0 && q.title.includes("Phase I")) {
                    const ansRef = docRef.collection('answers').doc();
                    batch.set(ansRef, {
                        text: "Phase I is primarily for safety, so they monitor you very closely. It is risky but the supervision is 24/7. I participated last year and felt very safe.",
                        authorName: "Dr. A. Verma",
                        authorRole: "doctor",
                        createdAt: firebase.firestore.Timestamp.now()
                    });
                     const ansRef2 = docRef.collection('answers').doc();
                    batch.set(ansRef2, {
                        text: "Agreed. It was a good experience for me.",
                        authorName: "Priya K.",
                        authorRole: "patient",
                        createdAt: firebase.firestore.Timestamp.now()
                    });
                }
                 if(q.answerCount > 0 && q.title.includes("reimbursed")) {
                    const ansRef = docRef.collection('answers').doc();
                    batch.set(ansRef, {
                        text: "Usually it is reimbursement. You keep the bills and submit them at your monthly visit.",
                        authorName: "TrialMatch Admin",
                        authorRole: "admin",
                        createdAt: firebase.firestore.Timestamp.now()
                    });
                 }
            });
            await batch.commit();
            console.log("Mock Forum Data Seeded");
        }
    };
    seedForumData();

    // B. Render Forum Questions List
    const renderForumQuestions = (questions) => {
        const container = document.getElementById('forum-questions-container');
        container.innerHTML = '';
        
        if (questions.length === 0) {
            container.innerHTML = '<p>No questions yet. Be the first to ask!</p>';
            return;
        }

        questions.forEach(q => {
            const card = document.createElement('div');
            card.className = 'forum-card-item';
            card.innerHTML = `
                <div class="forum-card-title">${q.title}</div>
                <div class="forum-card-snippet">${q.body}</div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="forum-meta">
                        <span><i class="fas fa-user-circle"></i> ${q.authorName}</span>
                        <span class="tag tag-condition" style="font-size:0.75rem; padding: 2px 6px;">${q.category}</span>
                    </div>
                    <span class="answer-count"><i class="fas fa-comment-alt"></i> ${q.answerCount || 0} Answers</span>
                </div>
            `;
            card.addEventListener('click', () => openForumDetails(q.id));
            container.appendChild(card);
        });
    };

    // C. Listen for Questions
   // C. Listen for Questions (FIXED: Global Variable + Search Listener)
    db.collection('forum_questions').orderBy('createdAt', 'desc').onSnapshot(snap => {
        // 1. Store data in the GLOBAL variable so Search and Details can use it
        allForumQuestions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderForumQuestions(allForumQuestions);
    });

    // --- NEW: Search Functionality ---
    document.getElementById('forum-search').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        
        // Filter the global list based on Title OR Body
        const filtered = allForumQuestions.filter(q => 
            q.title.toLowerCase().includes(term) || 
            q.body.toLowerCase().includes(term)
        );
        
        renderForumQuestions(filtered);
    });
    // D. View Question Details
    let currentQuestionId = null;
    const openForumDetails = (qId) => {
        currentQuestionId = qId;
        const qData = allForumQuestions.find(q => q.id === qId); // Need to store them or fetch
        
        // Fetch fresh to be sure
        db.collection('forum_questions').doc(qId).get().then(doc => {
            if(!doc.exists) return;
            const data = doc.data();
            
            // Switch Views
            document.getElementById('patient-view').classList.add('d-none');
            document.getElementById('doctor-dashboard').classList.add('d-none');
            document.getElementById('forum-details-view').classList.remove('d-none');
            window.scrollTo(0,0);

            // Populate UI
            document.getElementById('forum-detail-title').textContent = data.title;
            document.getElementById('forum-detail-body').textContent = data.body;
            document.getElementById('forum-detail-author').innerHTML = `<i class="fas fa-user"></i> ${data.authorName} (${data.authorRole})`;
            document.getElementById('forum-detail-date').textContent = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'Just now';
            document.getElementById('forum-detail-category').textContent = data.category;

            // Load Answers
            loadAnswers(qId);
        });
    };
    
    // E. Load Answers Real-time
    const loadAnswers = (qId) => {
        db.collection('forum_questions').doc(qId).collection('answers')
          .orderBy('createdAt', 'asc')
          .onSnapshot(snap => {
              const container = document.getElementById('forum-answers-container');
              container.innerHTML = '';
              
              if(snap.empty) {
                  container.innerHTML = '<p style="color:#666; font-style:italic;">No answers yet. Be the first!</p>';
                  return;
              }

              snap.forEach(doc => {
                  const ans = doc.data();
                  const div = document.createElement('div');
                  div.className = 'answer-card';
                  div.innerHTML = `
                    <div class="answer-header">
                        <strong>${ans.authorName} <span style="font-weight:normal; font-size:0.8rem;">(${ans.authorRole})</span></strong>
                        <span>${ans.createdAt ? new Date(ans.createdAt.toDate()).toLocaleDateString() : ''}</span>
                    </div>
                    <div class="answer-body">${ans.text}</div>
                  `;
                  container.appendChild(div);
              });
          });
    };

    // F. Handle Back Button
// F. Handle Back Button (FIXED: Stays on Community Tab)
    document.getElementById('back-to-forum-btn').addEventListener('click', () => {
        // 1. Hide the Details View
        document.getElementById('forum-details-view').classList.add('d-none');

        // 2. Show the Parent View Container (for both Doctor and Patient)
        document.getElementById('patient-view').classList.remove('d-none');
        document.getElementById('doctor-dashboard').classList.add('d-none');

        // 3. FORCE TAB STATE: Hide ALL sections first
        // (This stops Home, Features, and My Saved from popping up)
        document.querySelectorAll('#patient-view > section').forEach(sec => {
            sec.classList.add('d-none');
        });

        // 4. Show ONLY the Forum Section
        document.getElementById('forum-section').classList.remove('d-none');

        // 5. Scroll to top
        window.scrollTo(0, 0);
    });

    // G. Modal Logic (Ask Question)
    const askModal = document.getElementById('ask-question-modal');
    document.getElementById('open-ask-modal-btn').addEventListener('click', () => {
        if(!currentUser) { authModal.style.display = 'block'; return; }
        askModal.style.display = 'block';
    });
    document.getElementById('close-ask-modal').addEventListener('click', () => askModal.style.display = 'none');

    // H. Submit New Question
    document.getElementById('ask-question-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('ask-title').value;
        const category = document.getElementById('ask-category').value;
        const body = document.getElementById('ask-body').value;

        try {
            await db.collection('forum_questions').add({
                title, category, body,
                authorName: userProfile.name,
                authorRole: userProfile.role,
                authorId: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                answerCount: 0
            });
            alert('Question posted successfully!');
            askModal.style.display = 'none';
            e.target.reset();
        } catch(err) {
            console.error(err);
            alert('Error posting question.');
        }
    });

    // I. Submit Answer
    document.getElementById('post-answer-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!currentUser) { authModal.style.display = 'block'; return; }
        if(!currentQuestionId) return;

        const text = document.getElementById('new-answer-text').value;
        try {
            // 1. Add Answer
            await db.collection('forum_questions').doc(currentQuestionId).collection('answers').add({
                text,
                authorName: userProfile.name,
                authorRole: userProfile.role,
                authorId: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // 2. Increment Counter
            await db.collection('forum_questions').doc(currentQuestionId).update({
                answerCount: firebase.firestore.FieldValue.increment(1)
            });

            document.getElementById('new-answer-text').value = '';
        } catch(err) {
            console.error(err);
            alert('Error posting answer.');
        }
    });
       // Upload Listener
const uploadArea = document.getElementById('upload-dropzone');
if(uploadArea) {
    uploadArea.addEventListener('click', () => document.getElementById('medical-file-input').click());
    document.getElementById('medical-file-input').addEventListener('change', handleFileUpload);
}

// --- STEP D: NEW EVENT LISTENERS (For Selective Sharing & No Docs) ---

// 1. Permission Modal (Select Docs) - Note: ID changed to perm-share-btn in HTML
const permShareBtn = document.getElementById('perm-share-btn');
const permDenyBtn = document.getElementById('perm-deny-btn');

if(permShareBtn) {
    permShareBtn.addEventListener('click', () => {
        // Gather all checked URLs
        const checkboxes = document.querySelectorAll('#doc-selection-list input[type="checkbox"]:checked');
        const selectedUrls = Array.from(checkboxes).map(cb => cb.value);
        
        // Save with shareDocs = true AND the list of specific files
        processFavoriteToggle(tempTrialIdToSave, true, selectedUrls);
    });
}

if(permDenyBtn) {
    permDenyBtn.addEventListener('click', () => {
        // Save with shareDocs = false (Share nothing)
        processFavoriteToggle(tempTrialIdToSave, false, []);
    });
}

// 2. "No Docs Found" Modal Buttons
const noDocsYes = document.getElementById('no-docs-yes-btn');
const noDocsNo = document.getElementById('no-docs-no-btn');

if(noDocsYes) {
    noDocsYes.addEventListener('click', () => {
        // Close modal
        document.getElementById('no-docs-modal').style.display = 'none';
        
        // Redirect/Scroll to upload section
        const section = document.getElementById('medical-history-section');
        section.classList.remove('d-none');
        section.scrollIntoView({ behavior: 'smooth' });
        
        // Highlight it briefly
        section.style.border = "2px solid var(--accent-green)";
        setTimeout(() => section.style.border = "none", 2000);
        
        tempTrialIdToSave = null; // Reset
    });
}

if(noDocsNo) {
    noDocsNo.addEventListener('click', () => {
        // Just save without docs
        processFavoriteToggle(tempTrialIdToSave, false, []);
    });
}
// Close Doc Viewer
document.getElementById('close-doc-viewer').addEventListener('click', () => {
    document.getElementById('doc-viewer-modal').style.display = 'none';
});

    init();
    }); // --- END DOMContentLoaded ---