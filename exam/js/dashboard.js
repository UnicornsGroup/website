window.addEventListener('DOMContentLoaded', () => {
    let globalUserPayload = null;
    let databaseRetryAttemptsCount = 0;

    const runtimeVerification = setInterval(() => {
        if (window.auth && window.onAuthStateChanged) {
            clearInterval(runtimeVerification);
            window.onAuthStateChanged(window.auth, async (user) => {
                if (user) {
                    await verifyAndFetchProfileWithRetry(user);
                } else { 
                    window.location.replace("login.html"); 
                }
            });
        }
    }, 50);

    // DYNAMIC TOLERANCE FILTER LOOP: Wait gracefully for background cloud account linking processes
    async function verifyAndFetchProfileWithRetry(user) {
        try {
            const profileDoc = await window.getDoc(window.doc(window.db, "users", user.uid));
            
            if (profileDoc.exists()) {
                globalUserPayload = profileDoc.data();
                if (globalUserPayload.role === "ADMIN") {
                    window.location.replace("admin/admin-dashboard.html");
                    return;
                }
                
                // Clear and render classic desktop navigation properties hooks cleanly
                document.getElementById('studentNameDisplay').textContent = globalUserPayload.studentName;
                document.getElementById('studentStdDisplay').textContent = globalUserPayload.standard;
                
                executeDashboardQueryEngine();
            } else {
                // If the profile document doesn't exist yet, retry 3 times (spaced 1 second apart) 
                // to give lazy authentication background account creations time to finish writing data!
                if (databaseRetryAttemptsCount < 3) {
                    databaseRetryAttemptsCount++;
                    console.log(`Profile doc not ready yet. Retrying transaction attempt row: ${databaseRetryAttemptsCount}`);
                    setTimeout(() => verifyAndFetchProfileWithRetry(user), 1000);
                } else {
                    console.log("Max retries exceeded. Routing player back to gateway shield login.");
                    window.location.replace("login.html");
                }
            }
        } catch (err) { 
            console.error("Session verification crash loop:", err);
            window.location.replace("login.html"); 
        }
    }

    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        if(confirm("Terminate assessment session profile safely?")) {
            await window.signOut(window.auth);
            window.location.replace("login.html");
        }
    });

    const activeExamsContainer = document.getElementById('activeExamsContainer');
    const historyContainer = document.getElementById('historyContainer');

    async function executeDashboardQueryEngine() {
        if (!globalUserPayload || !window.db) return;

        try {
            const historyQuery = window.query(window.collection(window.db, "results"), window.where("admissionNumber", "==", globalUserPayload.admissionNumber));
            const historySnapshot = await window.getDocs(historyQuery);
            const verifiedSubmissionsArray = [];

            historySnapshot.forEach(doc => { verifiedSubmissionsArray.push(doc.data().examId); });

            if(!historySnapshot.empty) {
                historyContainer.innerHTML = "";
                historySnapshot.forEach(doc => {
                    const data = doc.data();
                    const card = document.createElement('div');
                    card.className = "bg-gray-700/40 p-3.5 rounded-lg border border-gray-600/50 text-xs space-y-1";
                    card.innerHTML = `
                        <div class="flex justify-between font-semibold text-white"><span class="truncate pr-2">${data.examTitle}</span><span class="text-emerald-400 font-mono">${data.scorePoints} / ${data.totalWeightMarks} M</span></div>
                        <div class="text-gray-400 flex justify-between"><span>Percentage: ${data.percentageScore}%</span><span class="text-gray-500 font-mono">${new Date(data.submittedAt).toLocaleDateString()}</span></div>
                    `;
                    historyContainer.appendChild(card);
                });
            }

            const examsQuery = window.query(window.collection(window.db, "exams"), window.where("published", "==", true));
            const examsSnapshot = await window.getDocs(examsQuery);
            activeExamsContainer.innerHTML = "";

            let matchingExamsFoundCount = 0;
            const currentTimestampISO = new Date().getTime();

            examsSnapshot.forEach(doc => {
                const data = doc.data();
                const hasStandardPermission = (data.standard === globalUserPayload.standard || (data.standards && data.standards.includes(globalUserPayload.standard)));
                
                if (!hasStandardPermission) return;

                matchingExamsFoundCount++;
                const startEpoch = new Date(data.startTime).getTime();
                const endEpoch = new Date(data.endTime).getTime();
                const isAlreadySubmitted = verifiedSubmissionsArray.includes(doc.id);
                
                let isWindowActive = (currentTimestampISO >= startEpoch && currentTimestampISO <= endEpoch);
                let isUpcoming = (currentTimestampISO < startEpoch);

                const cardElement = document.createElement('div');
                cardElement.className = "bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg flex flex-col justify-between";
                
                let systemStatusBadgeHTML = "";
                let operationalButtonHTML = "";

                if(isAlreadySubmitted) {
                    systemStatusBadgeHTML = `<span class="bg-emerald-950 text-emerald-400 border border-emerald-900 text-xs px-2.5 py-0.5 rounded-full font-semibold">Completed</span>`;
                    operationalButtonHTML = `<button disabled class="w-full mt-4 bg-gray-700 text-gray-500 font-medium py-2 rounded-lg cursor-not-allowed text-sm">Exam Already Attempted</button>`;
                } else if (isUpcoming) {
                    systemStatusBadgeHTML = `<span class="bg-amber-950 text-amber-400 border border-amber-900 text-xs px-2.5 py-0.5 rounded-full font-semibold">Upcoming</span>`;
                    operationalButtonHTML = `<button disabled class="w-full mt-4 bg-gray-700/50 text-gray-500 font-medium py-2 rounded-lg cursor-not-allowed text-sm text-center">Locked Until ${new Date(data.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</button>`;
                } else if (isWindowActive) {
                    systemStatusBadgeHTML = `<span class="bg-red-950 text-red-400 border border-red-900 text-xs px-2.5 py-0.5 rounded-full font-semibold animate-pulse">LIVE NOW</span>`;
                    operationalButtonHTML = `<button class="start-exam-btn w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm transition-all shadow-md transform active:scale-95" data-id="${doc.id}">Initialize Examination</button>`;
                } else {
                    systemStatusBadgeHTML = `<span class="bg-gray-900 text-gray-500 border border-gray-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">Closed</span>`;
                    operationalButtonHTML = `<button disabled class="w-full mt-4 bg-gray-800 text-gray-600 font-medium py-2 rounded-lg cursor-not-allowed text-sm">Window Terminated</button>`;
                }

                cardElement.innerHTML = `
                    <div class="space-y-2">
                        <div class="flex items-center justify-between"><span class="text-xs font-bold font-mono tracking-wider text-blue-400 uppercase">${data.subject}</span>${systemStatusBadgeHTML}</div>
                        <h3 class="text-lg font-bold text-white line-clamp-1">${data.title}</h3>
                        <p class="text-xs text-gray-400 font-medium">Duration Allocation: <span class="text-white font-semibold">${data.duration} Minutes</span></p>
                        <div class="text-xs text-gray-500 bg-gray-900/40 p-2.5 rounded border border-gray-700/40 space-y-0.5 font-mono">
                            <div>Opens: ${new Date(data.startTime).toLocaleString()}</div>
                            <div>Closes: ${new Date(data.endTime).toLocaleString()}</div>
                        </div>
                    </div>${operationalButtonHTML}
                `;
                activeExamsContainer.appendChild(cardElement);
            });

            if(matchingExamsFoundCount === 0) {
                activeExamsContainer.innerHTML = `<div class="bg-gray-800 p-6 rounded-xl border border-gray-700 col-span-2 text-center py-12 text-gray-500">No exams configured for your standard at this moment.</div>`;
            }

            document.querySelectorAll('.start-exam-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    window.location.href = `exam.html?id=${e.target.getAttribute('data-id')}`;
                });
            });
        } catch (error) { console.error(error); }
    }
});
