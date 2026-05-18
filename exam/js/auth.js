window.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');

    function showError(message) {
        errorMessage.textContent = message;
        errorAlert.classList.remove('hidden');
        submitBtn.disabled = false;
        btnText.textContent = "Sign In Securely";
        btnSpinner.classList.add('hidden');
    }

    // Intercept Form Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // UI Loading Feedback state
        errorAlert.classList.add('hidden');
        submitBtn.disabled = true;
        btnText.textContent = "Authenticating...";
        btnSpinner.classList.remove('hidden');

        const rawUsername = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!rawUsername || !password) {
            showError("Please enter both admission number and password.");
            return;
        }

        // Rule-Based Mapping: Translate clean entry string to corporate auth email format
        const derivedEmail = `${rawUsername.toUpperCase()}@surajenglishacademy.in`;

        // Wait explicitly until the Firebase library object attachments process on the global window context
        const executeLogin = setInterval(async () => {
            if (window.auth && window.signInWithEmailAndPassword) {
                clearInterval(executeLogin);

                try {
                    // Firebase Authenticator Module Execution
                    const userCredential = await window.signInWithEmailAndPassword(window.auth, derivedEmail, password);
                    const user = userCredential.user;

                    // Fetch associated structural metadata permissions rule maps from Firestore Engine
                    const userDoc = await window.getDoc(window.doc(window.db, "users", user.uid));

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        
                        // Enforce Role Hierarchy Engine Routing Definitions
                        if (userData.role === "ADMIN") {
                            window.location.replace("admin/admin-dashboard.html");
                        } else if (userData.role === "STUDENT") {
                            window.location.replace("dashboard.html");
                        } else {
                            showError("Unauthorized role profile identifier assigned.");
                        }
                    } else {
                        showError("Profile documentation record missing from system inventory index mapping.");
                    }
                } catch (error) {
                    console.error("Auth Failure Exception:", error);
                    let displayMsg = "Invalid admission number or password.";
                    if (error.code === "auth/network-request-failed") {
                        displayMsg = "Network latency breakdown. Connect to functional internet service provider infrastructure.";
                    }
                    showError(displayMsg);
                }
            }
        }, 50);
    });
});
