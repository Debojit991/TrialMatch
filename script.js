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
// --- START: Add this new code for Chatbot functionality ---

const chatbotMessages = document.getElementById('chatbot-messages');
const chatbotSendBtn = document.getElementById('chatbot-send');

// Function to add a message to the chat window
const addChatMessage = (message, sender) => {
    const messageEl = document.createElement('div');
    messageEl.classList.add('chat-message', sender);
    
    // Convert newlines to <br> for proper display
    messageEl.innerHTML = message.replace(/\n/g, '<br>');

    chatbotMessages.appendChild(messageEl);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight; // Auto-scroll to the bottom
};

// Simple logic to generate a bot response based on keywords
const getBotResponse = (userInput) => {
    const input = userInput.toLowerCase();

    if (input.includes("hello") || input.includes("hi")) {
        return "Hello there! How can I assist you with clinical trials today?";
    }
    if (input.includes("clinical trial") || input.includes("what is a trial")) {
        return "A clinical trial is a research study involving human volunteers that aims to evaluate a medical, surgical, or behavioral intervention. It's the primary way researchers find out if a new treatment is safe and effective in people.";
    }
    if (input.includes("find a trial") || input.includes("how to")) {
        return "You can find trials by using the filter form on the main page. If you are logged in as a patient and have completed your profile, we will automatically show you trials you might be eligible for.";
    }
    if (input.includes("phase") || input.includes("phase ii")) {
        return "Clinical trials are conducted in phases:\n- Phase I: Tests safety and dosage in a small group.\n- Phase II: Tests effectiveness and side effects in a larger group.\n- Phase III: Confirms effectiveness, monitors side effects, and compares it to standard treatments in an even larger group.";
    }
    if (input.includes("thank")) {
        return "You're welcome! Is there anything else I can help you with?";
    }

    return "I'm sorry, I'm not sure how to answer that. You can try asking about 'what is a clinical trial?', 'how to find a trial?', or trial 'phases'.";
};

// Handles sending a message
const handleSendMessage = () => {
    const userInput = chatbotInput.value.trim();
    if (userInput === "") return;

    // 1. Display user's message
    addChatMessage(userInput, 'user');
    chatbotInput.value = "";

    // 2. Get and display bot's response after a short delay
    setTimeout(() => {
        const botResponse = getBotResponse(userInput);
        addChatMessage(botResponse, 'bot');
    }, 500);
};

// Event Listeners for sending
chatbotSendBtn.addEventListener('click', handleSendMessage);
chatbotInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleSendMessage();
    }
});

// --- END: New Chatbot code ---
        // --- 3. Nav Link Active State ---
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    // Only run if there are nav links to observe
    if (navLinks.length > 0) {
        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        // Check if the link's href matches the section's id
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, { 
            rootMargin: '-50% 0px -50% 0px' // Triggers when section is in the middle 50% of the viewport
        }); 
        
        sections.forEach(section => {
            // Only observe sections that have a corresponding nav link
            const correspondingLink = document.querySelector(`.nav-links a[href="#${section.id}"]`);
            if (correspondingLink) {
                navObserver.observe(section);
            }
        });
    }
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
        let allTrials = [], favorites = [], favoriteDetails = {}, toCompare = [], currentUser = null, userProfile = null, chartInstance = null;
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
            navLinksContainer.innerHTML = `
                <li><a href="#home">Home</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#app-interface">Find Trials</a></li>
                <li><a href="#favorites-section">My Saved</a></li>
            `;
            document.getElementById('favorites-section').classList.remove('d-none');
            updateAuthUI(true, 'patient');
            renderUserProfileCard();
            listenToFavorites();
        };

      const setupDoctorView = () => {
            document.getElementById('patient-view').classList.add('d-none');
            document.getElementById('doctor-dashboard').classList.remove('d-none');
            navLinksContainer.innerHTML = `
                <li><a href="#add-trial-section">Add Trial</a></li>
            `;
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
      const renderTrials = (trialsToRender) => {
            trialsContainer.innerHTML = '';
            document.getElementById('no-results').classList.toggle('d-none', trialsToRender.length > 0);

            trialsToRender.forEach(trial => {
                const isFavorite = favorites.includes(trial.id);
                const isComparing = toCompare.includes(trial.id);
                const { eligible: isEligible, reason: eligibilityReason } = checkEligibility(trial, userProfile);
                const card = document.createElement('div');
                card.className = 'trial-card glass-card';
                card.dataset.id = trial.id;
                
             // --- MODIFIED card.innerHTML block ---
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <h3 style="margin-right: 10px;">${trial.title}</h3>
                        ${userProfile?.role === 'patient' ? `<span class="eligibility-indicator ${isEligible ? 'eligible' : 'ineligible'}" title="${eligibilityReason}" style="flex-shrink: 0;"></span>` : ''}
                    </div>
                    
                    <div class="tags-container">
                        <span class="tag tag-condition">
                            <i class="fas fa-notes-medical"></i> ${trial.condition}
                        </span>
                        <span class="tag tag-location">
                            <i class="fas fa-map-marker-alt"></i> ${trial.location}
                        </span>
                    </div>
                    
                    ${trial.hospitalName && trial.hospitalName !== 'N/A' ? `
                        <div class="info-item"><i class="fas fa-hospital"></i> ${trial.hospitalName}</div>
                    ` : ''}
                    
                    <div class="info-item"><i class="fas fa-calendar-alt"></i> ${trial.duration}</div>
                    <div class="info-item"><i class="fas fa-wallet"></i> ${trial.compensation}</div>
                    
                    ${trial.doctorName && trial.doctorName !== 'N/A' ? `
                        <div class="info-item" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(156, 163, 175, 0.2);">
                            <i class="fas fa-user-md"></i> <strong>Dr. ${trial.doctorName}</strong> (${trial.doctorSpecialization || ''})
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
const checkEligibility = (trial, profile) => {
    // Default to ineligible if no profile, not a patient, or no date of birth
    if (!profile || profile.role !== 'patient' || !profile.dob) {
        return { eligible: false, reason: 'Complete your profile (including Date of Birth) to check eligibility.' };
    }

    // Calculate age dynamically using our new helper function
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
                    
                    // The rest of the logic remains the same
                    renderFavorites();
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
                    document.getElementById('new-trial-age-min').value = trial.age_range[0];
                    document.getElementById('new-trial-age-max').value = trial.age_range[1];
                    document.getElementById('new-trial-duration').value = trial.duration;
                    document.getElementById('new-trial-compensation').value = trial.compensation;
                    document.getElementById('new-trial-explanation').value = trial.explanation; // Use original explanation

                    // Update button text
                    form.querySelector('button[type="submit"]').textContent = 'Update Trial';
                    
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
        const toggleFavorite = (trialId) => {
            if (!currentUser) return;
            
            // Get the user's doc reference
            const userDocRef = db.collection('users').doc(currentUser.uid);
            
            if (favorites.includes(trialId)) {
                // --- REMOVE from array ---
                userDocRef.update({
                    favorites: firebase.firestore.FieldValue.arrayRemove(trialId)
                });
                
                // --- Also remove the (now unused) subcollection doc if it exists ---
                db.collection('users').doc(currentUser.uid).collection('favorites').doc(trialId).delete().catch(() => {});
                
            } else {
                // --- ADD to array ---
                const trial = allTrials.find(t => t.id === trialId);
                userDocRef.update({
                    favorites: firebase.firestore.FieldValue.arrayUnion(trialId)
                });
                
                // --- STILL write to the subcollection FOR THE DOCTOR'S QUERY ---
                // This is the key: we write to *both* places.
                const favoriteRef = db.collection('users').doc(currentUser.uid).collection('favorites').doc(trialId);
                favoriteRef.set({ 
                    addedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    trialTitle: trial.title,
                    doctorId: trial.doctorId || 'N/A'
                });
            }
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
                condition: document.getElementById('new-trial-condition').value,
                hospitalName: document.getElementById('new-trial-hospital').value,
                location: document.getElementById('new-trial-location').value,
                age_range: [
                    parseInt(document.getElementById('new-trial-age-min').value, 10),
                    parseInt(document.getElementById('new-trial-age-max').value, 10)
                ],
                duration: document.getElementById('new-trial-duration').value,
                compensation: document.getElementById('new-trial-compensation').value,
                explanation: fullExplanation,
                simpleExplanation: fullExplanation, // AI Simulation (as in original)
            };
            trialData.doctorName = userProfile.name || 'N/A';
trialData.doctorSpecialization = userProfile.specialization || 'N/A';
trialData.doctorWhatsapp = userProfile.whatsapp || 'N/A';
            try {
                if (editingId) {
                    // --- UPDATE LOGIC ---
                    trialData.lastUpdated = firebase.firestore.FieldValue.serverTimestamp();
                    
                    await db.collection('trials').doc(editingId).update(trialData);
                    alert("Trial updated successfully!");
                    delete form.dataset.editingId; // Clear editing state
                    form.querySelector('button[type="submit"]').textContent = 'Add Trial';
                } else {
                    // --- ADD LOGIC (Original) ---
                    trialData.doctorId = userProfile.doctorId || currentUser.uid;
                    trialData.postedBy = currentUser.uid;
                    trialData.postedAt = firebase.firestore.FieldValue.serverTimestamp();
                    
                    await db.collection('trials').add(trialData);
                    alert("Trial added successfully!");
                }
                
                form.reset(); // Reset form for both add and update
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
        
       const loadPatientLeads = () => {
             const container = document.getElementById('patient-leads-container');
             container.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> Loading leads...</p>`;
             
             const doctorId = userProfile.doctorId || currentUser.uid;
             
             db.collectionGroup('favorites').where('doctorId', '==', doctorId)
               .onSnapshot(async (favoritesSnapshot) => {
                 
                 if (favoritesSnapshot.empty) {
                     container.innerHTML = `<p>No patients have saved your trials yet.</p>`; return;
                 }

                 // --- FIX START: Logic changed to group trials by patient ---
                 const patientLeads = {}; // Use an object to group trials by patient ID

                 const userPromises = favoritesSnapshot.docs.map(doc => doc.ref.parent.parent.get());
                 const userDocs = await Promise.all(userPromises);

                 userDocs.forEach((userDoc, index) => {
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        const favoriteData = favoritesSnapshot.docs[index].data();
                        
                        // If we haven't seen this patient yet, create an entry for them
                        if (!patientLeads[userDoc.id]) {
                            const whatsappLink = userData.whatsapp 
                                ? `<a href="https://wa.me/${userData.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(`HI I AM DR. ${userProfile?.name || 'Your Doctor'} FROM TRIALMATCH.`)}" target="_blank" class="btn" style="padding: 5px 10px; background-color: var(--accent-green); color: white; border: none;" title="Chat on WhatsApp"><i class="fab fa-whatsapp"></i></a>` 
                                : '';

                            patientLeads[userDoc.id] = {
                                details: `
                                    <strong>Patient:</strong> ${userData.name || 'N/A'} (${userData.email}) <br>
                                    <strong>Age:</strong> ${userData.age || 'N/A'} <br>`,
                                whatsappLink: whatsappLink,
                                trials: [] // An array to hold all their saved trials
                            };
                        }
                        
                        // Add the current trial title to this patient's list of trials
                        patientLeads[userDoc.id].trials.push(favoriteData.trialTitle);
                    }
                 });

                 // Now, build the final HTML from the grouped data
                 const finalHtml = Object.values(patientLeads).map(lead => {
                     return `
                        <div class="list-item">
                            <div>
                                ${lead.details}
                                <strong>Saved Trials:</strong> 
                                <ul>
                                    ${lead.trials.map(title => `<li>${title}</li>`).join('')}
                                </ul>
                            </div>
                            ${lead.whatsappLink}
                        </div>
                     `;
                 }).join('');
                 
                 container.innerHTML = finalHtml || `<p>No patients have saved your trials yet.</p>`;
                 // --- FIX END ---

           }, (error) => {
                console.error("Error listening for patient leads:", error);
                
                let errorMsg = "Could not load patient leads. Please try again.";
                if (error.code === 'failed-precondition' || error.message.toLowerCase().includes('index')) {
                    errorMsg = `<b>Error: Missing Firestore Index.</b><br>
                                This query requires a collection-group index. Please go to your 
                                Firestore 'Indexes' tab and 'Enable' the 'Ascending' index 
                                for 'Collection group scope'.`;
                }

                container.innerHTML = `<p style="color: var(--accent-red);">${errorMsg}</p>`;
             });
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

        // --- INITIALIZATION ---
        const init = () => {
            if (localStorage.getItem('theme') === 'dark') {
                document.body.classList.add('dark-mode');
                themeCheckbox.checked = true;
            }
            resetToLoggedOutState();
        };

        init();
    });
    // --- Force Chatbot Close to Work ---
document.getElementById('chatbot-close')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation(); // stop modal handler from catching it
    document.getElementById('chatbot-widget').classList.add('d-none');
});
