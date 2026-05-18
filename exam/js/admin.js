window.addEventListener('DOMContentLoaded', () => {
    const verifySession = setInterval(() => {
        if (window.auth && window.onAuthStateChanged) {
            clearInterval(verifySession);
            window.onAuthStateChanged(window.auth, async (user) => {
                if (user) {
                    const userDoc = await window.getDoc(window.doc(window.db, "users", user.uid));
                    if (!userDoc.exists() || userDoc.data().role !== "ADMIN") {
                        window.location.replace("../login.html");
                    } else {
                        loadStudentDirectory();
                    }
                } else {
                    window.location.replace("../login.html");
                }
            });
        }
    }, 50);

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
    const studentCsvFileInput = document.getElementById('studentCsvFileInput');

    // NEW UPDATE: Parse Student Bulk Imports from CSV Spreadsheet
    studentCsvFileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function (evt) {
            const lines = evt.target.result.split(/\r?\n/);
            let addedCount = 0;

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const columns = line.split(',');
                if (columns.length >= 4) {
                    const admissionNumber = columns[0].trim().toUpperCase();
                    const studentName = columns[1].trim();
                    const standard = columns[2].trim();
                    const mobileNumber = columns[3].trim();
                    const email = `${admissionNumber}@surajenglishacademy.in`;
                    const fallbackDocId = admissionNumber + "_UID";

                    try {
                        await window.setDoc(window.doc(window.db, "users", fallbackDocId), {
                            admissionNumber,
                            studentName,
                            standard,
                            role: "STUDENT",
                            email,
                            mobileNumber
                        });
                        addedCount++;
                    } catch (err) { console.error("Line creation failed:", err); }
                }
            }
            alert(`Bulk Registration Process Complete!\nSuccessfully provisioned ${addedCount} student accounts in Firestore.`);
            studentCsvFileInput.value = "";
            loadStudentDirectory();
        };
        reader.readAsText(file);
    });

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
                            data-id="${doc.id}" data-adm="${data.admissionNumber}" data-name="${data.studentName}" data-std="${data.standard}" data-mob="${data.mobileNumber}">Edit</button>
                        <button class="delete-btn bg-red-950/40 hover:bg-red-800 text-red-400 font-bold px-2 py-1 rounded text-xs border border-red-900/50" 
                            data-id="${doc.id}" data-adm="${data.admissionNumber}">Delete</button>
                    </td>
                `;
                studentTableBody.appendChild(tr);
            });

            document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', prepUpdateForm));
            document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', executeDeleteRecord));
        } catch (error) { console.error("Failed loading directory index:", error); }
    }

    function prepUpdateForm(e) {
        const btn = e.target;
        studentDocIdInput.value = btn.getAttribute('data-id');
        admNumInput.value = btn.getAttribute('data-adm');
        admNumInput.disabled = true;
        studNameInput.value = btn.getAttribute('data-name');
        studStdSelect.value = btn.getAttribute('data-std');
        studMobInput.value = btn.getAttribute('data-mob');
        formTitle.textContent = "Modify Student Profile";
        saveBtn.textContent = "Update Records";
        cancelEditBtn.classList.remove('hidden');
    }

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
                await window.updateDoc(window.doc(window.db, "users", docId), { studentName, standard, mobileNumber });
                alert("Profile modifications committed successfully.");
            } else {
                const collisionCheck = window.query(window.collection(window.db, "users"), window.where("admissionNumber", "==", admissionNumber));
                const collisionSnapshot = await window.getDocs(collisionCheck);
                if (!collisionSnapshot.empty) {
                    alert("System Collision Error: Admission entry code already registered.");
                    return;
                }
                const fallbackDocId = admissionNumber + "_UID";
                await window.setDoc(window.doc(window.db, "users", fallbackDocId), { admissionNumber, studentName, standard, role: "STUDENT", email, mobileNumber });
                alert("Student account successfully provisioned!");
            }
            resetFormState();
            loadStudentDirectory();
        } catch (err) { alert("Error updating dataset."); }
    });

    async function executeDeleteRecord(e) {
        const id = e.target.getAttribute('data-id');
        const adm = e.target.getAttribute('data-adm');
        if (confirm(`Purge admission identity tracking key [${adm}] completely?`)) {
            try {
                await window.deleteDoc(window.doc(window.doc(window.db, "users", id)));
                alert("Record structure purged.");
                loadStudentDirectory();
            } catch (err) { console.error(err); }
        }
    }
});
