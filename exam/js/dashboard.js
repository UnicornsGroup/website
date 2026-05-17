window.addEventListener('load', () => {
  initFirebase();
  document.getElementById('logoutBtn').addEventListener('click', signOutUser);
  monitorAuthState([CONFIG.studentRoleValue], async (profileDoc) => {
    const user = profileDoc.data();
    document.getElementById('studentStandard').textContent = user[CONFIG.standardField] || 'Unknown';
    await loadStudentExams(user);
  });
});

async function loadStudentExams(user) {
  const now = Date.now();
  const studentStandard = String(user[CONFIG.standardField] || '').trim();
  if (!studentStandard) {
    document.getElementById('activeExams').innerHTML = '<p class="text-sm text-slate-500">Unable to determine your standard.</p>';
    document.getElementById('upcomingExams').innerHTML = '<p class="text-sm text-slate-500">Unable to determine your standard.</p>';
    return;
  }

  const publishedSnapshot = await db.collection(CONFIG.examsCollection)
    .where('published', '==', true)
    .get();

  const submissionsSnapshot = await db.collection(CONFIG.submissionsCollection)
    .where(CONFIG.emailField, '==', user[CONFIG.emailField])
    .get();

  const submittedExams = new Map();
  submissionsSnapshot.docs.forEach((doc) => submittedExams.set(doc.data().examId, doc.data()));

  const activeExams = [];
  const upcomingExams = [];
  const completedExams = [];

  const normalizedStandard = normalizeText(studentStandard);
  publishedSnapshot.docs.forEach((doc) => {
    const exam = { id: doc.id, ...doc.data() };
    if (normalizeText(exam[CONFIG.standardField]) !== normalizedStandard) {
      return;
    }

    const hasSubmitted = submittedExams.has(exam.id);
    if (hasSubmitted) {
      completedExams.push({ exam, submission: submittedExams.get(exam.id) });
      return;
    }

    const start = new Date(exam.startTime).getTime();
    const end = new Date(exam.endTime).getTime();
    if (now < start) {
      upcomingExams.push(exam);
    } else if (now >= start && now <= end) {
      activeExams.push(exam);
    }
  });

  document.getElementById('activeCount').textContent = activeExams.length;
  document.getElementById('upcomingCount').textContent = upcomingExams.length;
  document.getElementById('completedCount').textContent = completedExams.length;

  renderExamCards('activeExams', activeExams, 'Start Exam');
  renderExamCards('upcomingExams', upcomingExams, 'Not Started');
  renderCompletedExams(completedExams);
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function renderExamCards(containerId, exams, buttonText) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  if (!exams.length) {
    container.innerHTML = '<p class="text-sm text-slate-500">No exams found.</p>';
    return;
  }

  exams.forEach((exam) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'rounded-3xl border border-slate-200 bg-slate-50 p-4';
    wrapper.innerHTML = `
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">${escapeHtml(exam.title)}</h3>
          <p class="mt-2 text-sm text-slate-600">${escapeHtml(exam.subject)} • ${escapeHtml(exam.durationMinutes)} min</p>
          <p class="mt-2 text-sm text-slate-500">${formatDateTime(exam.startTime)} - ${formatDateTime(exam.endTime)}</p>
        </div>
      </div>
    `;

    const actionButton = document.createElement('a');
    actionButton.className = 'mt-4 inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800';
    actionButton.textContent = buttonText;
    actionButton.href = buttonText === 'Start Exam' ? `exam.html?examId=${exam.id}` : 'javascript:void(0)';
    wrapper.appendChild(actionButton);
    container.appendChild(wrapper);
  });
}

function renderCompletedExams(completed) {
  const container = document.getElementById('completedExams');
  container.innerHTML = '';
  if (!completed.length) {
    container.innerHTML = '<p class="text-sm text-slate-500">No completed exams yet.</p>';
    return;
  }
  completed.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'rounded-3xl border border-slate-200 bg-slate-50 p-4';
    card.innerHTML = `
      <h3 class="text-lg font-semibold text-slate-900">${escapeHtml(item.exam.title)}</h3>
      <p class="mt-2 text-sm text-slate-600">Score: ${item.submission.score || 0} / ${item.submission.maxScore || 0}</p>
      <p class="mt-2 text-sm text-slate-500">Submitted: ${formatDateTime(item.submission.submittedAt)}</p>
      <a class="mt-4 inline-flex rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" href="result.html?examId=${item.exam.id}">View Result</a>
    `;
    container.appendChild(card);
  });
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"]+/g, (match) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[match]));
}

function formatDateTime(value) {
  const date = new Date(value);
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}
