window.addEventListener('DOMContentLoaded', () => {
    let globalActiveProfilePayload = null;

    const queryParams = new URLSearchParams(window.location.search);
    const selectedExamDocId = queryParams.get('id');

    if(!selectedExamDocId) {
        window.location.replace("dashboard.html");
        return;
    }

    const databaseVerificationCheck = setInterval(() => {
        if (window.auth && window.onAuthStateChanged) {
            clearInterval(databaseVerificationCheck);
            window.onAuthStateChanged(window.auth, async (user) => {
                if (user) {
                    const profileDocument = await window.getDoc(window.doc(window.db, "users", user.uid));
                    if (profileDocument.exists()) {
                        globalActiveProfilePayload = profileDocument.data();
                        extractEvaluationScorecardMetrics();
                    } else {
                        window.location.replace("login.html");
                    }
                } else {
                    window.location.replace("login.html");
                }
            });
        }
    }, 50);

    async function extractEvaluationScorecardMetrics() {
        if(!globalActiveProfilePayload || !window.db) return;

        try {
            const queryTarget = window.query(
                window.collection(window.db, "results"),
                window.where("examId", "==", selectedExamDocId),
                window.where("admissionNumber", "==", globalActiveProfilePayload.admissionNumber)
            );

            const documentSnapshot = await window.getDocs(queryTarget);

            if(documentSnapshot.empty) {
                alert("Evaluation Profile Records Error: Unable to extract matching completion scorecard keys.");
                window.location.replace("dashboard.html");
                return;
            }

            let finalExtractedDataResult = null;
            documentSnapshot.forEach(doc => { finalExtractedDataResult = doc.data(); });

            document.getElementById('resExamTitle').textContent = `${finalExtractedDataResult.subject} : ${finalExtractedDataResult.examTitle}`;
            document.getElementById('resScorePoints').textContent = `${finalExtractedDataResult.scorePoints} / ${finalExtractedDataResult.totalWeightMarks} M`;
            document.getElementById('resPercentage').textContent = `${finalExtractedDataResult.percentageScore}%`;
            document.getElementById('resCorrectCount').textContent = `${finalExtractedDataResult.correctCount} / ${finalExtractedDataResult.totalQuestions} Q`;
            
            document.getElementById('resStudentName').textContent = finalExtractedDataResult.studentName;
            document.getElementById('resAdmissionNumber').textContent = finalExtractedDataResult.admissionNumber;
            document.getElementById('resStandard').textContent = finalExtractedDataResult.standard;
            document.getElementById('resTimestamp').textContent = new Date(finalExtractedDataResult.submittedAt).toLocaleString();

            const badgeOutletNode = document.getElementById('resVerdictBadge');
            const bannerHeaderNode = document.getElementById('resultBannerHeader');
            const securityViolationBanner = document.getElementById('securityViolationBanner');

            // NEW CRITICAL COUPLING LOGIC: If score is 0 due to an automatic anti-cheating lockout, flash the Violation state
            if (finalExtractedDataResult.percentageScore === 0 && finalExtractedDataResult.correctCount === 0) {
                securityViolationBanner.classList.remove('hidden'); // Show prominent glowing alert text block
                badgeOutletNode.innerHTML = `<span class="text-xs font-black tracking-wide uppercase px-3 py-1 rounded-full bg-red-950 text-red-500 border border-red-600 shadow-sm animate-pulse">VIOLATION LOCKED</span>`;
                bannerHeaderNode.className = "bg-gradient-to-r from-red-950 via-neutral-950 to-red-950 px-6 py-8 text-center border-b border-red-900";
            } else if (finalExtractedDataResult.percentageScore >= 35) {
                badgeOutletNode.innerHTML = `<span class="text-xs font-black tracking-wide uppercase px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 shadow-sm">PASSED</span>`;
                bannerHeaderNode.className = "bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-900 px-6 py-8 text-center border-b border-emerald-800";
            } else {
                badgeOutletNode.innerHTML = `<span class="text-xs font-black tracking-wide uppercase px-3 py-1 rounded-full bg-red-950 text-red-400 border border-red-900 shadow-sm">FAILED</span>`;
                bannerHeaderNode.className = "bg-gradient-to-r from-red-950 via-rose-950 to-red-950 px-6 py-8 text-center border-b border-red-900";
            }

        } catch (error) {
            console.error("Critical analytics parser error:", error);
        }
    }
});
