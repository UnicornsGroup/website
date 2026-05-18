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

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        errorAlert.classList.add('hidden');
        submitBtn.disabled = true;
        btnText.textContent = "Authenticating...";
        btnSpinner.classList.remove('hidden');

        // FORCE UPPERCASE AND REMOVE SPACES
        const rawUsername = usernameInput.value.trim().toUpperCase();
        const password = passwordInput.value.trim();

        if (!rawUsername || !password) {
            showError("Please enter both admission number and password.");
            return;
        }

        const derivedEmail = `${rawUsername}@surajenglishacademy.in`;

        const executeLogin = setInterval(async () => {
            if (window.auth && window.signInWithEmailAndPassword) {
                clearInterval(executeLogin);

                try {
                    // Try to log in assuming the Auth profile already exists
                    const userCredential = await window.signInWithEmailAndPassword(window.auth, derivedEmail, password);
                    await routeAuthenticatedUser(userCredential.user.uid);
                } catch (error) {
                    console.log("Initial Auth Failure Code:", error.code);
                    // Catch invalid credentials and check if it's an unprovisioned CSV record
                    if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
                        await attemptLazyAuthenticationProvisioning(rawUsername, derivedEmail, password);
                    } else if (error.code === "auth/network-request-failed") {
                        showError("Network connection fault. Check your internet access.");
                    } else {
                        showError("Invalid admission number or password validation error.");
                    }
                }
            }
        }, 50);
    });

    async function attemptLazyAuthenticationProvisioning(username, email, password) {
        try {
            // Check both standard document ID and _UID format to be safe
            const fallbackDocId = username + "_UID";
            
            let userDocRef = window.doc(window.db, "users", fallbackDocId);
            let userDocSnapshot = await window.getDoc(userDocRef);

            // If not found with _UID, try checking raw username string doc ID
            if (!userDocSnapshot.exists()) {
                userDocRef = window.doc(window.db, "users", username);
                userDocSnapshot = await window.getDoc(userDocRef);
            }

            if (userDocSnapshot.exists()) {
                const userData = userDocSnapshot.data();

                // Validation Rule: For first time login, password must match username string perfectly
                if (password.toUpperCase() === username) {
                    btnText.textContent = "Creating Safe Connection...";
                    
                    // 1. Create account inside Firebase Authentication tab dynamically
                    const newAuthCredential = await window.createUserWithEmailAndPassword(window.auth, email, password);
                    
                    // 2. Clone CSV profile configurations into the newly generated Auth UID reference document
                    await window.setDoc(window.doc(window.db, "users", newAuthCredential.user.uid), {
                        admissionNumber: userData.admissionNumber.trim().toUpperCase(),
                        studentName: userData.studentName.trim(),
                        standard: userData.standard.trim(),
                        role: "STUDENT",
                        email: email,
                        mobileNumber: userData.mobileNumber ? userData.mobileNumber.toString().trim() : "0000000000"
                    });
                    
                    // 3. Clear temporary holding structural index document safely
                    try {
                        await window.deleteDoc(userDocRef);
                    } catch(clearErr) { console.log("Holding cache doc cleanup skipped."); }

                    window.location.replace("dashboard.html");
                } else {
                    showError("Invalid password typed for this registered admission profile.");
                }
            } else {
                // Check if user is already provisioned under their Auth UID but just typed a wrong password
                const fallbackQuery = window.query(window.collection(window.db, "users"), window.where("admissionNumber", "==", username));
                const fallbackSnapshot = await window.getDocs(fallbackQuery);
                
                if (!fallbackSnapshot.empty) {
                    showError("Incorrect password. Type your absolute admission number clearly.");
                } else {
                    showError("Admission Number '" + username + "' not found in the institution database.");
                }
            }
        } catch (provisionError) {
            console.error("Provisioning engine pipeline error:", provisionError);
            showError("Authentication gate timeout issue. Try checking your login fields.");
        }
    }

    async function routeAuthenticatedUser(uid) {
        const userDoc = await window.getDoc(window.doc(window.db, "users", uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === "ADMIN") {
                window.location.replace("admin/admin-dashboard.html");
            } else {
                window.location.replace("dashboard.html");
            }
        } else {
            showError("Profile database configuration record missing for this ID.");
        }
    }
});
