window.addEventListener('DOMContentLoaded', () => {
    let globalActiveProfilePayload = null;

    // Parse specific targeting key tags appended to URL query parameters strings
    const queryParams = new URLSearchParams(window.location.search);
    const selectedExamDocId = queryParams.get('id');

    if(!selectedExamDocId) {
        window.location.replace("dashboard.html");
        return;
    }

    // Secure Session Validation Engine Loop
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

    // Dynamic Parsing Pipeline of Result Score Documents Core Structures 
    async function extractEvaluationScorecardMetrics() {
        if(!globalActiveProfilePayload || !window.db) return;

        try {
            // Query cloud storage repository tables targeting document metadata profiles intersections
            const queryTarget = window.query(
                window.collection(window.db, "results"),
                window.where("examId", "==", selectedExamDocId),
                window.where("admissionNumber", "==", globalActiveProfilePayload.admissionNumber)
            );

            const documentSnapshot = await window.getDocs(queryTarget);

            if(documentSnapshot.empty) {
                alert("Evaluation Profile Records Error: Unable to extract matching completion scorecard keys for this profile identifier.");
                window.location.replace("dashboard.html");
                return;
            }

            // Extract target data structure dictionary node out from response collection maps array
            let finalExtractedDataResult = null;
            documentSnapshot.forEach(doc => { finalExtractedDataResult = doc.data(); });

            // Feed raw metric data profiles values across presentation interface elements targets nodes
            document.getElementById('resExamTitle').textContent = `${finalExtractedDataResult.subject} : ${finalExtractedDataResult.examTitle}`;
            document.getElementById('resScorePoints').textContent = `${finalExtractedDataResult.scorePoints} / ${finalExtractedDataResult.totalWeightMarks} M`;
            document.getElementById('resPercentage').textContent = `${finalExtractedDataResult.percentageScore}%`;
            document.getElementById('resCorrectCount').textContent = `${finalExtractedDataResult.correctCount} / ${finalExtractedDataResult.totalQuestions} Q`;
            
            document.getElementById('resStudentName').textContent = finalExtractedDataResult.studentName;
            document.getElementById('resAdmissionNumber').textContent = finalExtractedDataResult.admissionNumber;
            document.getElementById('resStandard').textContent = finalExtractedDataResult.standard;
            document.getElementById('resTimestamp').textContent = new Date(finalExtractedDataResult.submittedAt).toLocaleString();

            // Construct Dynamic Visualization Badges Layouts and Colour Palette Themes
            const badgeOutletNode = document.getElementById('resVerdictBadge');
            const bannerHeaderNode = document.getElementById('resultBannerHeader');

            if(finalExtractedDataResult.percentageScore >= 35) {
                // Pass Status Configuration Metric Parameters Styles Maps Setups
                badgeOutletNode.textContent = "PASSED";
                badgeOutletNode.className = "text-xs sm:text-sm font-black tracking-wide uppercase px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 shadow-sm";
                bannerHeaderNode.className = "bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-900 px-6 py-8 text-center border-b border-emerald-800 transition-all";
            } else {
                // Fail Status Condition Configurations Parameters Design Values
                badgeOutletNode.textContent = "NEEDS IMPROVEMENT";
                badgeOutletNode.className = "text-xs sm:text-sm font-black tracking-wide uppercase px-3 py-1 rounded-full bg-red-950 text-red-400 border border-red-900 shadow-sm";
                bannerHeaderNode.className = "bg-gradient-to-r from-red-950 via-rose-950 to-red-950 px-6 py-8 text-center border-b border-red-900 transition-all";
            }

        } catch (error) {
            console.error("Critical analytical result evaluation execution block faulted:", error);
        }
    }
});
