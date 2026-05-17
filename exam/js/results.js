window.addEventListener('load', () => {
  initFirebase();
  monitorAuthState([CONFIG.studentRoleValue, ...CONFIG.teacherRoleValues], async (profileDoc) => {
    const profile = profileDoc.data();
    await renderResultPage(profile);
  });
});

async function renderResultPage(profile) {
  const examId = getQueryParam('examId');
  if (!examId) {
    document.getElementById('resultContainer').innerHTML = '<div class="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">Exam not specified.</div>';
    return;
  }
  const query = db.collection(CONFIG.resultsCollection)
    .where('examId', '==', examId)
    .where(CONFIG.emailField, '==', profile[CONFIG.emailField])
    .limit(1);
  const snapshot = await query.get();
  if (!snapshot.docs.length) {
    document.getElementById('resultContainer').innerHTML = '<div class="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-700">Result not found yet.</div>';
    return;
  }

  const result = snapshot.docs[0].data();
  const percentage = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;
  const rank = await calculateRank(result.examId, result.score);

  document.getElementById('resultContainer').innerHTML = `
    <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div class="rounded-3xl bg-white p-6 card-shadow">
        <h2 class="text-2xl font-semibold text-slate-900">${escapeHtml(result.examTitle)}</h2>
        <p class="mt-2 text-sm text-slate-500">${escapeHtml(result.subject)} • ${escapeHtml(result.standard)}</p>
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <div class="rounded-3xl bg-slate-50 p-5">
            <p class="text-sm text-slate-500">Score</p>
            <p class="mt-3 text-3xl font-semibold text-slate-900">${result.score} / ${result.maxScore}</p>
          </div>
          <div class="rounded-3xl bg-slate-50 p-5">
            <p class="text-sm text-slate-500">Percentage</p>
            <p class="mt-3 text-3xl font-semibold text-slate-900">${percentage}%</p>
          </div>
          <div class="rounded-3xl bg-slate-50 p-5">
            <p class="text-sm text-slate-500">Rank</p>
            <p class="mt-3 text-3xl font-semibold text-slate-900">${rank}</p>
          </div>
          <div class="rounded-3xl bg-slate-50 p-5">
            <p class="text-sm text-slate-500">Time Taken</p>
            <p class="mt-3 text-3xl font-semibold text-slate-900">${formatTime(result.timeTaken)}</p>
          </div>
        </div>
      </div>
      <div class="rounded-3xl bg-white p-6 card-shadow">
        <h3 class="text-lg font-semibold text-slate-900">Answer Summary</h3>
        <div class="mt-4 space-y-3 text-sm text-slate-600">
          <p>Correct Answers: ${result.totalCorrect}</p>
          <p>Wrong Answers: ${result.totalWrong}</p>
          <p>Submitted At: ${new Date(result.submittedAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  `;
}

async function calculateRank(examId, score) {
  const snapshot = await db.collection(CONFIG.resultsCollection)
    .where('examId', '==', examId)
    .orderBy('score', 'desc')
    .get();
  if (!snapshot.docs.length) return 0;
  return snapshot.docs.findIndex((doc) => doc.data().score === score) + 1;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"]/g, (match) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[match]));
}
