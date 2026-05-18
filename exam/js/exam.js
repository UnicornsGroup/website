window.addEventListener('DOMContentLoaded', () => {
    // Structural Intercept Protection Shield Routing Loop
    const verificationLoop = setInterval(() => {
        if (window.auth && window.onAuthStateChanged) {
            clearInterval(verificationLoop);
            window.onAuthStateChanged(window.auth, async (user) => {
                if (user) {
                    const profileCheck = await window.getDoc(window.doc(window.db, "users", user.uid));
                    if (!profileCheck.exists() || profileCheck.data().role !== "ADMIN") {
                        window.location.replace("../login.html");
                    }
                } else {
                    window.location.replace("../login.html");
                }
            });
        }
    }, 50);

    // Initialize Quill rich text engine matching dark aesthetic configurations
    const quillRichEditorInstance = new Quill('#qTextEditor', {
        theme: 'snow',
        placeholder: 'Compose structured questions statements layout here (Use formatting options above)...',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['clean']
            ]
        }
    });

    let localQuestionStack = [];

    const examMetaForm = document.getElementById('examMetaForm');
    const questionForm = document.getElementById('questionForm');
    const questionsPreviewList = document.getElementById('questionsPreviewList');
    const questionCounter = document.getElementById('questionCounter');
    const publishExamBtn = document.getElementById('publishExamBtn');
    const csvFileInput = document.getElementById('csvFileInput');

    // UI Interactive Input References
    const optA = document.getElementById('optA');
    const optB = document.getElementById('optB');
    const optC = document.getElementById('optC');
    const optD = document.getElementById('optD');
    const correctOpt = document.getElementById('correctOpt');
    const qMarks = document.getElementById('qMarks');

    // Process Bulk CSV Files Selection Elements
    csvFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (evt) {
            const fileContents = evt.target.result;
            const lines = fileContents.split(/\r?\n/);
            let successfullyImportedRowsCount = 0;

            for (let i = 1; i < lines.length; i++) {
                const currentLineTextRow = lines[i].trim();
                if (!currentLineTextRow) continue;

                const columns = currentLineTextRow.split(',');
                
                if (columns.length >= 7) {
                    const compiledCSVQuestionItem = {
                        id: "Q_" + Date.now() + "_" + Math.floor(Math.random() * 10000) + "_" + i,
                        text: columns[0].trim(), // Standard plaintext fallback configuration mapping
                        options: {
                            A: columns[1].trim(),
                            B: columns[2].trim(),
                            C: columns[3].trim(),
                            D: columns[4].trim()
                        },
                        correct: columns[5].trim().toUpperCase(),
                        marks: parseInt(columns[6].trim()) || 1
                    };

                    localQuestionStack.push(compiledCSVQuestionItem);
                    successfullyImportedRowsCount++;
                }
            }

            alert(`Bulk Upload Execution Finished!\nSuccessfully parsed and queued ${successfullyImportedRowsCount} items.`);
            csvFileInput.value = "";
            refreshPreviewMatrix();
        };
        reader.readAsText(file);
    });

    // Manage Queue Stack Push Array Operations Interceptor
    questionForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Extract stylized semantic rich text HTML content out from active editor module container context
        const richHTMLQuestionTextContent = quillRichEditorInstance.getSemanticHTML().trim();

        // Enforce validation to verify editor structure isn't entirely void
        if (quillRichEditorInstance.getText().trim().length === 0) {
            alert("Error: Question content cannot be left completely empty.");
            return;
        }

        const questionItem = {
            id: "Q_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            text: richHTMLQuestionTextContent, // Rich Styled Text Layer Included!
            options: {
                A: optA.value.trim(),
                B: optB.value.trim(),
                C: optC.value.trim(),
                D: optD.value.trim()
            },
            correct: correctOpt.value,
            marks: parseInt(qMarks.value) || 1
        };

        localQuestionStack.push(questionItem);
        questionForm.reset();
        quillRichEditorInstance.setText(''); // Wipe editor buffer workspace panel cleaner layout elements
        refreshPreviewMatrix();
    });

    // Render Local Question Array Changes UI Engine
    function refreshPreviewMatrix() {
        questionCounter.textContent = `Queued Questions: ${localQuestionStack.length}`;
        if(localQuestionStack.length === 0) {
            questionsPreviewList.innerHTML = `<p class="text-sm text-gray-500 py-4 text-center">No structural components queued inside the current scope stack framework.</p>`;
            return;
        }

        questionsPreviewList.innerHTML = "";
        localQuestionStack.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = "py-4 first:pt-0 class-wrapper text-sm space-y-1.5";
            div.innerHTML = `
                <div class="flex items-start justify-between">
                    <span class="font-semibold text-white">Q${index + 1}: <div class="inline-block border-l border-gray-700 pl-1 text-gray-200">${item.text}</div> <span class="text-blue-400 ml-1">(${item.marks} M)</span></span>
                    <button class="remove-stack-btn text-red-400 hover:text-red-500 font-medium text-xs bg-red-950/40 px-2 py-0.5 rounded border border-red-900/50" data-idx="${index}">Remove</button>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs text-gray-400 font-mono pl-2">
                    <div class="${item.correct==='A'?'text-green-400 font-bold':''}">A: ${item.options.A}</div>
                    <div class="${item.correct==='B'?'text-green-400 font-bold':''}">B: ${item.options.B}</div>
                    <div class="${item.correct==='C'?'text-green-400 font-bold':''}">C: ${item.options.C}</div>
                    <div class="${item.correct==='D'?'text-green-400 font-bold':''}">D: ${item.options.D}</div>
                </div>
            `;
            questionsPreviewList.appendChild(div);
        });

        document.querySelectorAll('.remove-stack-btn').forEach(btn => {
            btn.addEventListener('click', (ev) => {
                const indexToRemove = parseInt(ev.target.getAttribute('data-idx'));
                localQuestionStack.splice(indexToRemove, 1);
                refreshPreviewMatrix();
            });
        });
    }

    // Core Shipping Execution Loop to Remote Storage Node Cluster
    publishExamBtn.addEventListener('click', async () => {
        if(!examMetaForm.checkValidity()) {
            alert("Error: Missing fundamental meta documentation criteria variables on form profile panel.");
            examMetaForm.reportValidity();
            return;
        }

        if(localQuestionStack.length === 0) {
            alert("Invalid Action: Assessment questionnaire payload document contains zero objects. Append elements first.");
            return;
        }

        if(!confirm(`Verify Payload Shipment Configuration: Commit assessment structure live to Firestore clusters?`)) return;

        publishExamBtn.disabled = true;
        publishExamBtn.textContent = "Uploading Exam Schema...";

        const totalCalculatedMarks = localQuestionStack.reduce((acc, obj) => acc + obj.marks, 0);

        const examPayloadSchema = {
            title: document.getElementById('examTitle').value.trim(),
            standard: document.getElementById('examStd').value,
            subject: document.getElementById('examSubject').value.trim(),
            duration: parseInt(document.getElementById('examDuration').value) || 15,
            startTime: new Date(document.getElementById('examStart').value).toISOString(),
            endTime: new Date(document.getElementById('examEnd').value).toISOString(),
            instructions: document.getElementById('examInstructions').value.trim(),
            totalMarks: totalCalculatedMarks,
            questions: localQuestionStack, 
            published: true,
            createdAt: new Date().toISOString()
        };

        try {
            await window.addDoc(window.collection(window.db, "exams"), examPayloadSchema);
            alert("Success! Examination schema is now compiled and public inside active indexing collections.");
            examMetaForm.reset();
            localQuestionStack = [];
            refreshPreviewMatrix();
        } catch (error) {
            console.error("Firestore Upload Error Exception dropped:", error);
            alert("Error committing schema files to persistent cloud network matrix targets.");
        } finally {
            publishExamBtn.disabled = false;
            publishExamBtn.textContent = "Commit & Publish Final Exam";
        }
    });
});
