window.addEventListener('DOMContentLoaded', () => {
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

    const quillRichEditorInstance = new Quill('#qTextEditor', {
        theme: 'snow',
        placeholder: 'Compose structured questions statements layout here...',
        modules: { toolbar: [['bold', 'italic', 'underline'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['clean']] }
    });

    let localQuestionStack = [];

    const examMetaForm = document.getElementById('examMetaForm');
    const questionForm = document.getElementById('questionForm');
    const questionsPreviewList = document.getElementById('questionsPreviewList');
    const questionCounter = document.getElementById('questionCounter');
    const publishExamBtn = document.getElementById('publishExamBtn');
    const csvFileInput = document.getElementById('csvFileInput');

    const optA = document.getElementById('optA');
    const optB = document.getElementById('optB');
    const optC = document.getElementById('optC');
    const optD = document.getElementById('optD');
    const correctOpt = document.getElementById('correctOpt');
    const qMarks = document.getElementById('qMarks');

    csvFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (evt) {
            const lines = evt.target.result.split(/\r?\n/);
            let successfullyImportedRowsCount = 0;

            for (let i = 1; i < lines.length; i++) {
                const currentLineTextRow = lines[i].trim();
                if (!currentLineTextRow) continue;

                const columns = currentLineTextRow.split(',');
                if (columns.length >= 7) {
                    localQuestionStack.push({
                        id: "Q_" + Date.now() + "_" + Math.floor(Math.random() * 10000) + "_" + i,
                        text: columns[0].trim(),
                        options: { A: columns[1].trim(), B: columns[2].trim(), C: columns[3].trim(), D: columns[4].trim() },
                        correct: columns[5].trim().toUpperCase(),
                        marks: parseInt(columns[6].trim()) || 1
                    });
                    successfullyImportedRowsCount++;
                }
            }
            alert(`Bulk Upload Finished! Loaded ${successfullyImportedRowsCount} items.`);
            csvFileInput.value = "";
            refreshPreviewMatrix();
        };
        reader.readAsText(file);
    });

    questionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const richHTMLQuestionTextContent = quillRichEditorInstance.getSemanticHTML().trim();
        if (quillRichEditorInstance.getText().trim().length === 0) {
            alert("Error: Question content cannot be left empty.");
            return;
        }

        localQuestionStack.push({
            id: "Q_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            text: richHTMLQuestionTextContent,
            options: { A: optA.value.trim(), B: optB.value.trim(), C: optC.value.trim(), D: optD.value.trim() },
            correct: correctOpt.value,
            marks: parseInt(qMarks.value) || 1
        });
        questionForm.reset();
        quillRichEditorInstance.setText('');
        refreshPreviewMatrix();
    });

    function refreshPreviewMatrix() {
        questionCounter.textContent = `Queued Questions: ${localQuestionStack.length}`;
        if(localQuestionStack.length === 0) {
            questionsPreviewList.innerHTML = `<p class="text-sm text-gray-500 py-4 text-center">No structural components queued inside the current scope stack framework.</p>`;
            return;
        }

        questionsPreviewList.innerHTML = "";
        localQuestionStack.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = "py-4 first:pt-0 text-sm space-y-1.5";
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
                localQuestionStack.splice(parseInt(ev.target.getAttribute('data-idx')), 1);
                refreshPreviewMatrix();
            });
        });
    }

    publishExamBtn.addEventListener('click', async () => {
        if(!examMetaForm.checkValidity()) {
            examMetaForm.reportValidity();
            return;
        }

        // NEW FILTER: Extract checked standard nodes out from layout checkboxes group
        const targetStandardsArray = [];
        document.querySelectorAll('.std-checkbox:checked').forEach(cb => {
            targetStandardsArray.push(cb.value);
        });

        if(targetStandardsArray.length === 0) {
            alert("Configuration Error: Please select at least 1 Target Standard checkbox allocation alignment row.");
            return;
        }

        if(localQuestionStack.length === 0) {
            alert("MCQ Array payload document contains zero objects.");
            return;
        }

        if(!confirm("Publish assessment live to Firestore?")) return;

        publishExamBtn.disabled = true;
        publishExamBtn.textContent = "Uploading Exam Schema...";

        const totalCalculatedMarks = localQuestionStack.reduce((acc, obj) => acc + obj.marks, 0);

        const examPayloadSchema = {
            title: document.getElementById('examTitle').value.trim(),
            standards: targetStandardsArray, // NEW COMPATIBILITY RULE: Saved as a string array array format
            standard: targetStandardsArray[0], // Backwards compatibility hook for individual student view fallback lookups
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
            alert("Success! Examination compiled across targeted standards.");
            examMetaForm.reset();
            document.querySelectorAll('.std-checkbox').forEach(cb => cb.checked = false);
            localQuestionStack = [];
            refreshPreviewMatrix();
        } catch (error) { alert("Error committing schema files."); }
        finally {
            publishExamBtn.disabled = false;
            publishExamBtn.textContent = "Commit & Publish Final Exam";
        }
    });
});
