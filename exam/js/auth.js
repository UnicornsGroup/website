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

        const rawUsername = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!rawUsername || !password) {
            showError("Please enter both admission number and password.");
            return;
        }

        const derivedEmail = `${rawUsername.toUpperCase()}@surajenglishacademy.in`;

        const executeLogin = setInterval(async () => {
            if (window.auth && window.signInWithEmailAndPassword) {
                clearInterval(executeLogin);

                try {
                    // Try normal login first
                    const userCredential = await window.signInWithEmailAndPassword(window.auth, derivedEmail, password);
                    await routeAuthenticatedUser(userCredential.user.uid);
                } catch (error) {
                    // NEW UPDATE: Catch if account is missing in Auth tab but present in CSV/Firestore
                    if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found") {
                        await attemptLazyAuthenticationProvisioning(rawUsername.toUpperCase(), derivedEmail, password);
                    } else if (error.code === "auth/network-request-failed") {
                        showError("Network latency breakdown. Connect to internet.");
                    } else {
                        showError("Invalid admission number or password.");
                    }
                }
            }
        }, 50);
    });

    // Dynamic provisioner logic for bulk CSV imported users
    async function attemptLazyAuthenticationProvisioning(username, email, password) {
        try {
            // 1. Verify if the student records exist inside Firestore from the CSV upload
            const customDocId = username + "_UID";
            const userDocRef = window.doc(window.db, "users", customDocId);
            const userDocSnapshot = await window.getDoc(userDocRef);

            if (userDocSnapshot.exists()) {
                const userData = userDocSnapshot.data();

                // Safety: Only run this trick if password matches username (default rule for fresh imports)
                if (password === username) {
                    // 2. Dynamically build the missing Auth tab record on the fly!
                    const newAuthCredential = await window.createUserWithEmailAndPassword(window.auth, email, password);
                    
                    // 3. Link old CSV data to the newly created user UID to avoid duplicates
                    await window.setDoc(window.doc(window.db, "users", newAuthCredential.user.uid), userData);
                    
                    // 4. Clean up the placeholder fallback document
                    await window.deleteDoc(userDocRef);

                    // 5. Success! Route straight into system
                    window.location.replace("dashboard.html");
                } else {
                    showError("Invalid password for this imported admission profile.");
                }
            } else {
                showError("Admission Number not registered in the school system registry.");
            }
        } catch (provisionError) {
            console.error("Lazy provisioning error:", provisionError);
            showError("Authentication access system fault. Contact administration.");
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
            showError("Profile documentation record missing from system index.");
        }
    }
});
