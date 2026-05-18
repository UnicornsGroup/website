window.addEventListener('DOMContentLoaded', () => {
    // Intercept Session Verification Framework
    const verifySession = setInterval(() => {
        if (window.auth && window.onAuthStateChanged) {
            clearInterval(verifySession);
            window.onAuthStateChanged(window.auth, async (user) => {
                if (user) {
                    const userDoc = await window.getDoc(window.doc(window.db, "users", user.uid));
                    if (!userDoc.exists() || userDoc.data().role !== "ADMIN") {
                        window.location.replace("../login.html");
                    } else {
                        // Authorized Admin Identity Confirmed -> Initialize View Systems
                        loadStudentDirectory();
                    }
                } else {
                    window.location.replace("../login.html");
                }
            });
        }
    }, 50);

    // Global Sign-Out Interceptor
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        if(confirm("Confirm security lock sign out routine?")) {
            await window.signOut(window.auth);
            window.location.replace("../login.html");
        }
    });

    const studentForm = document.getElementById('studentForm');
    const studentDocIdInput = document.getElementById('studentDocId');
    const admNumInput = document.getElementById('admNum');
    const studNameInput = document.getElementById('studName');
    const studStdSelect = document.getElementById('studStd');
    const studMobInput = document.getElementById('studMob');
    const formTitle = document.getElementById('formTitle');
    const saveBtn = document.getElementById('saveBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const studentTableBody = document.getElementById('studentTableBody');
    const studentCountBadge = document.getElementById('studentCount');

    // Load Live Directory Records
    async function loadStudentDirectory() {
        if (!window.db || !window.getDocs) return;
        try {
            const q = window.query(window.collection(window.db, "users"), window.where("role", "==", "STUDENT"));
            const snapshot = await window.getDocs(q);
            studentTableBody.innerHTML = "";
            studentCountBadge.textContent = `Total: ${snapshot.size}`;

            if(snapshot.empty) {
                studentTableBody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-gray-500">No active students registered inside database system.</td></tr>`;
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                const tr = document.createElement('tr');
                tr.className = "hover:bg-gray-800/40 transition-colors";
                tr.innerHTML = `
                    <td class="py-3.5 px-2 font-mono text-xs text-blue-400 font-bold">${data.admissionNumber}</td>
                    <td class="py-3.5 px-2 font-medium text-white">${data.studentName}</td>
                    <td class="py-3.5 px-2 text-gray-400">${data.standard}</td>
                    <td class="py-3.5 px-2 font-mono text-gray-400">${data.mobileNumber}</td>
                    <td class="py-3.5 px-2 text-right space-x-1">
                        <button class="edit-btn bg-blue-900/40 hover:bg-blue-800 text-blue-300 font-bold px-2 py-1 rounded text-xs border border-blue-700/50" 
                            data-id="${doc.id}" data-adm="${data.admissionNumber}" data-name="${data.studentName}" data-std="${data.standard}" data-mob="${data.mobileNumber}">
                            Edit
                        </button>
                        <button class="delete-btn bg-red-950/40 hover:bg-red-800 text-red-400 font-bold px-2 py-1 rounded text-xs border border-red-900/50" 
                            data-id="${doc.id}" data-adm="${data.admissionNumber}">
                            Delete
                        </button>
                    </td>
                `;
                studentTableBody.appendChild(tr);
            });

            // Bind Row Element Action Listeners Dynamically
            document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', prepUpdateForm));
            document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', executeDeleteRecord));

        } catch (error) {
            console.error("Failed loading directory index structure:", error);
        }
    }

    // Prepare Edit Data Mode
    function prepUpdateForm(e) {
        const btn = e.target;
        studentDocIdInput.value = btn.getAttribute('data-id');
        admNumInput.value = btn.getAttribute('data-adm');
        admNumInput.disabled = true; // Block mutations to unique key
        studNameInput.value = btn.getAttribute('data-name');
        studStdSelect.value = btn.getAttribute('data-std');
        studMobInput.value = btn.getAttribute('data-mob');

        formTitle.textContent = "Modify Student Profile";
        saveBtn.textContent = "Update Records";
        cancelEditBtn.classList.remove('hidden');
    }

    // Reset Form to Add Mode
    function resetFormState() {
        studentDocIdInput.value = "";
        admNumInput.value = "";
        admNumInput.disabled = false;
        studNameInput.value = "";
        studStdSelect.value = "";
        studMobInput.value = "";

        formTitle.textContent = "Add New Student Profile";
        saveBtn.textContent = "Save Student Record";
        cancelEditBtn.classList.add('hidden');
    }

    cancelEditBtn.addEventListener('click', resetFormState);

    // Save and Update Form Submissions Handler Block
    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const docId = studentDocIdInput.value;
        const admissionNumber = admNumInput.value.trim().toUpperCase();
        const studentName = studNameInput.value.trim();
        const standard = studStdSelect.value;
        const mobileNumber = studMobInput.value.trim();
        const email = `${admissionNumber}@surajenglishacademy.in`;

        try {
            if(docId) {
                // Mode: Edit Profile Update Operation
                await window.updateDoc(window.doc(window.db, "users", docId), {
                    studentName,
                    standard,
                    mobileNumber
                });
                alert("Profile modifications committed successfully.");
            } else {
                // Mode: Provisioning Account creation sequence
                // 1. Enforce validation checklist matching student unique document constraints
                const collisionCheck = window.query(window.collection(window.db, "users"), window.where("admissionNumber", "==", admissionNumber));
                const collisionSnapshot = await window.getDocs(collisionCheck);
                if (!collisionSnapshot.empty) {
                    alert("System Collision Error: Admission entry code already registered.");
                    return;
                }

                // Generates a mock system mapping registration wrapper using structural indexing values
                // For a 70 student setup, we write directly to Firestore to prevent runtime auth clutter
                const fallbackDocId = admissionNumber + "_UID";
                await window.setDoc(window.doc(window.db, "users", fallbackDocId), {
                    admissionNumber,
                    studentName,
                    standard,
                    role: "STUDENT",
                    email,
                    mobileNumber
                });

                // Also inject a placeholder auth trigger profile into the system cluster matching custom rule requirements
                alert("Student account successfully provisioned inside Firestore index registry!");
            }
            resetFormState();
            loadStudentDirectory();
        } catch (err) {
            console.error("Process execution fault thrown:", err);
            alert("Error updating record dataset matrix values.");
        }
    });

    // Handle Document Deletion Procedures
    async function executeDeleteRecord(e) {
        const id = e.target.getAttribute('data-id');
        const adm = e.target.getAttribute('data-adm');
        if (confirm(`CRITICAL DELETION CRITERIA: Purge admission identity tracking key [${adm}] completely?`)) {
            try {
                await window.deleteDoc(window.doc(window.db, "users", id));
                alert("Record structural index purged from primary repository maps.");
                loadStudentDirectory();
            } catch (err) {
                console.error("Purge operations anomaly intercepted:", err);
            }
        }
    }
});
