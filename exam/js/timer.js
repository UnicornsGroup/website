window.addEventListener('DOMContentLoaded', () => {
    let activeStudentProfile = null;
    let selectedExamPayload = null;
    let evaluationCountdownInterval = null;
    let examSubmittedStatusFlag = false;

    // Fetch URL string targeting hash query variables
    const queryParams = new URLSearchParams(window.location.search);
    const targetExamDocId = queryParams.get('id');

    if(!targetExamDocId) {
        window.location.replace("dashboard.html");
        return;
    }

    // 1. Strict Anti-Cheating Security Locks
    document.addEventListener('contextmenu', e => e.preventDefault()); // Block right-clicks
    document.addEventListener('copy', e => e.preventDefault());         // Block copying text
    document.addEventListener('paste', e => e.preventDefault());        // Block pasting text

    // Anti-Screenshot keyboard listener trick
    document.addEventListener('keyup', (e) => {
        if (e.key === 'PrintScreen') {
            navigator.clipboard.writeText('');
            alert('Screenshots are strictly prohibited. Exam auto-submitting.');
            executeAutomatedExamSubmission();
        }
    });

    // Instant Auto-Submit on App Switch / Tab Switch
    function handleStrictAppSwitchViolation() {
        if(document.getElementById('instructionsGateBlock').classList.contains('hidden')) {
            if(!examSubmittedStatusFlag) {
                examSubmittedStatusFlag = true;
                document.body.innerHTML = "<div class='bg-black h-screen w-screen flex items-center justify-center text-red-500 font-bold text-center p-4 text-lg'>CRITICAL SECURITY VIOLATION: You switched apps, dropped down your notifications panel, or minimized the window. Your exam has been forced locked and submitted.</div>";
                executeAutomatedExamSubmission();
            }
        }
    }

    window.addEventListener('blur', handleStrictAppSwitchViolation);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            handleStrictAppSwitchViolation();
        }
    });

    // Secure Session Validation Engine Loop
    const initialSessionCheck = setInterval(() => {
        if (window.auth && window.onAuthStateChanged) {
            clearInterval(initialSessionCheck);
            window.onAuthStateChanged(window.auth, async (user) => {
                if (user) {
                    const profileSnapshot = await window.getDoc(window.doc(window.db, "users", user.uid));
                    if (profileSnapshot.exists()) {
                        activeStudentProfile = profileSnapshot.data();
                        queryTargetExamDetails();
                    } else {
                        window.location.replace("login.html");
                    }
                } else {
                    window.location.replace("login.html");
                }
            });
        }
    }, 50);

    // Retrieve Exam Data Matrix Profile Configurations from Database Node
    async function queryTargetExamDetails() {
        try {
            const examSnapshot = await window.getDoc(window.doc(window.db, "exams", targetExamDocId));
            if(!examSnapshot.exists()) {
                alert("Target examination document structure not found.");
                window.location.replace("dashboard.html");
                return;
            }

            selectedExamPayload = examSnapshot.data();

            document.getElementById('examHeaderTitle').textContent = selectedExamPayload.title;
            document.getElementById('instExamTitle').textContent = selectedExamPayload.title;
            document.getElementById('instExamDetails').innerHTML = `
                Subject Focus Stream: <span class="text-white font-bold">${selectedExamPayload.subject}</span><br>
                Allocated Testing Timeframe Window: <span class="text-white font-bold">${selectedExamPayload.duration} Minutes</span><br>
                Overall Structural Points Weight: <span class="text-white font-bold">${selectedExamPayload.totalMarks} Marks</span><br><br>
                Guidelines: ${selectedExamPayload.instructions}
            `;

            if(localStorage.getItem(`exam_timer_${targetExamDocId}`)) {
                startAssessmentProcessingPipeline();
            }

        } catch (err) {
            console.error("Exam data pipeline compilation mapping issue:", err);
        }
    }

    // Intercept Initialization Entry Point Button Hook Action Events
    document.getElementById('initializeExamBtn').addEventListener('click', () => {
        // NEW CRITICAL UPDATE: Block opening the exam if system focus is currently compromised (e.g. active system overlay call banner)
        if (!document.hasFocus()) {
            alert("SYSTEM ACCESS DENIED:\n\nAn active phone call overlay, network interruption, or system application pop-up is running on your device.\n\nDisconnect all active cellular/VoIP voice calls and close background banners before attempting to initialize this exam.");
            return;
        }

        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            }
        } catch(e) { console.log("Device interface blocked automatic execution fullscreen locks."); }
        
        startAssessmentProcessingPipeline();
    });

    // Main Engine Processing Core Controller Architecture Loop
    function startAssessmentProcessingPipeline() {
        document.getElementById('instructionsGateBlock').classList.add('hidden');
        document.getElementById('liveExamForm').classList.remove('hidden');

        renderQuestionnaireCanvas();
        initializeClockTrackerEngine();
    }

    // Render Shuffled Item Question Array Structure
    function renderQuestionnaireCanvas() {
        const outlet = document.getElementById('questionnaireRenderOutlet');
        outlet.innerHTML = "";

        let questionsStack = [...selectedExamPayload.questions];
        questionsStack.sort(() => Math.random() - 0.5);

        questionsStack.forEach((q, idx) => {
            const block = document.createElement('div');
            block.className = "bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md space-y-4";
            
            let choicesHTML = "";
            const trackingKeys = ['A', 'B', 'C', 'D'];
            trackingKeys.sort(() => Math.random() - 0.5);

            trackingKeys.forEach(key => {
                choicesHTML += `
                    <label class="flex items-center space-x-3 bg-gray-900/50 hover:bg-gray-700/40 p-3.5 rounded-lg border border-gray-700/60 transition-colors cursor-pointer text-sm font-medium text-gray-300">
                        <input type="radio" name="response_mapping_${q.id}" value="${key}" required
                            class="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-offset-gray-800">
                        <span>${key}: ${q.options[key]}</span>
                    </label>
                `;
            });

            block.innerHTML = `
                <div class="flex justify-between items-start border-b border-gray-700/40 pb-2">
                    <span class="text-sm font-bold text-gray-400 font-mono">QUESTION BLOCK ITEM #${idx + 1}</span>
                    <span class="bg-blue-950 text-blue-400 text-xs px-2 py-0.5 rounded border border-blue-900 font-bold font-mono">${q.marks} Marks</span>
                </div>
                <p class="text-base font-semibold text-white">${q.text}</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    ${choicesHTML}
                </div>
            `;
            outlet.appendChild(block);
        });
    }

    // High Reliability Tracking Countdown Variable Synchronizer Clock Module
    function initializeClockTrackerEngine() {
        const storageKey = `exam_timer_${targetExamDocId}`;
        let remainingSecondsDurationValue = 0;

        if(localStorage.getItem(storageKey)) {
            remainingSecondsDurationValue = parseInt(localStorage.getItem(storageKey));
        } else {
            remainingSecondsDurationValue = selectedExamPayload.duration * 60;
            localStorage.setItem(storageKey, remainingSecondsDurationValue);
        }

        const clockOutletNode = document.getElementById('countdownTimerClock');

        evaluationCountdownInterval = setInterval(() => {
            remainingSecondsDurationValue--;
            localStorage.setItem(storageKey, remainingSecondsDurationValue);

            let calculatedMins = Math.floor(remainingSecondsDurationValue / 60);
            let calculatedSecs = remainingSecondsDurationValue % 60;

            let formattedMins = calculatedMins < 10 ? "0" + calculatedMins : calculatedMins;
            let formattedSecs = calculatedSecs < 10 ? "0" + calculatedSecs : calculatedSecs;

            clockOutletNode.textContent = `${formattedMins}:${formattedSecs}`;

            if(remainingSecondsDurationValue <= 0) {
                clearInterval(evaluationCountdownInterval);
                clockOutletNode.textContent = "00:00";
                examSubmittedStatusFlag = true;
                executeAutomatedExamSubmission();
            }
        }, 1000);
    }

    document.getElementById('liveExamForm').addEventListener('submit', (e) => {
        e.preventDefault();
        if(confirm("Are you sure you want to finalize and submit your answers?")) {
            examSubmittedStatusFlag = true;
            executeAutomatedExamSubmission();
        }
    });

    async function executeAutomatedExamSubmission() {
        clearInterval(evaluationCountdownInterval);
        
        const manualSubmitBtn = document.getElementById('manualSubmitBtn');
        if(manualSubmitBtn) {
            manualSubmitBtn.disabled = true;
            manualSubmitBtn.textContent = "Processing Grade Matrices...";
        }

        let compiledCorrectAnswersCalculations = 0;
        let finalEarnedPointsSummaryScore = 0;
        const trackingResponsesSubmissionMap = {};

        selectedExamPayload.questions.forEach(q => {
            const inputElements = document.getElementsByName(`response_mapping_${q.id}`);
            let selectedValueString = "";

            for(let radio of inputElements) {
                if(radio.checked) {
                    selectedValueString = radio.value;
                    break;
                }
            }

            trackingResponsesSubmissionMap[q.id] = selectedValueString;

            if(selectedValueString === q.correct) {
                compiledCorrectAnswersCalculations++;
                finalEarnedPointsSummaryScore += q.marks;
            }
        });

        const evaluationPercentageScoreValue = Math.round((finalEarnedPointsSummaryScore / selectedExamPayload.totalMarks) * 100) || 0;

        const resultsPayloadSchema = {
            examId: targetExamDocId,
            examTitle: selectedExamPayload.title,
            subject: selectedExamPayload.subject,
            admissionNumber: activeStudentProfile.admissionNumber,
            studentName: activeStudentProfile.studentName,
            standard: activeStudentProfile.standard,
            totalQuestions: selectedExamPayload.questions.length,
            correctCount: compiledCorrectAnswersCalculations,
            scorePoints: finalEarnedPointsSummaryScore,
            totalWeightMarks: selectedExamPayload.totalMarks,
            percentageScore: evaluationPercentageScoreValue,
            submittedAt: new Date().toISOString()
        };

        try {
            await window.addDoc(window.collection(window.db, "results"), resultsPayloadSchema);
            localStorage.removeItem(`exam_timer_${targetExamDocId}`);
            window.location.replace(`result.html?id=${targetExamDocId}`);
        } catch (err) {
            console.error("Critical submission anomaly dropped:", err);
            window.location.replace(`result.html?id=${targetExamDocId}`);
        }
    }
});
