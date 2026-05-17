let examState = null;
let examQuestions = [];
let examTimerInterval = null;
let warningCount = 0;
let autoSaveInterval = null;

window.addEventListener('load', () => {
  initFirebase();
  document.getElementById('logoutBtn').addEventListener('click', signOutUser);
  monitorAuthState([CONFIG.studentRoleValue], async (profileDoc) => {
    const profile = profileDoc.data();
    const examId = getQueryParam('examId');
    if (!examId) {
      window.location.href = 'dashboard.html';
      return;
    }
    await loadExamPage(profile, examId);
  });
});

async function loadExamPage(profile, examId) {
  const examDoc = await db.collection(CONFIG.examsCollection).doc(examId).get();
  if (!examDoc.exists) {
    return showError('Exam not found.');
  }
  const exam = examDoc.data();
  if (normalizeStandard(exam[CONFIG.standardField]) !== normalizeStandard(profile[CONFIG.standardField])) {
    return showError('You are not allowed to access this exam.');
  }
  const now = Date.now();
  const startTime = new Date(exam.startTime).getTime();
  const endTime = new Date(exam.endTime).getTime();

  const submissionDoc = await db.collection(CONFIG.submissionsCollection)
    .where('examId', '==', examId)
    .where(CONFIG.emailField, '==', profile[CONFIG.emailField])
    .limit(1)
    .get();
  const alreadySubmitted = submissionDoc.docs.length > 0;

  renderExamBanner(exam, profile, alreadySubmitted, startTime, endTime, now);
  if (alreadySubmitted) {
    renderAlreadySubmitted(submissionDoc.docs[0].data());
    return;
  }
  if (now < startTime) {
    renderStatus('Exam Not Started Yet');
    return;
  }
  if (now > endTime) {
    renderStatus('Exam Closed');
    return;
  }

  examQuestions = await loadQuestions(examId);
  examQuestions = shuffleArray(examQuestions).map((question) => ({
    ...question,
    options: shuffleArray([...question.options || []]),
  }));

  examState = loadExamState(examId);
  if (examState && examState.started && !examState.submitted) {
    renderExamForm(exam, profile, examId);
    startTimer(examId, examState.endAt);
    restoreAnswers(examId);
    startAutoSave(examId);
    attachAntiCheat();
  } else {
    renderStartButton(exam, profile, examId);
  }
}

function renderExamBanner(exam, profile, alreadySubmitted, startTime, endTime, now) {
  const banner = document.getElementById('examBanner');
  banner.innerHTML = `
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm uppercase tracking-[0.3em] text-slate-400">${escapeHtml(exam.subject)}</p>
        <h1 class="text-2xl font-semibold text-slate-900">${escapeHtml(exam.title)}</h1>
        <p class="mt-3 text-sm text-slate-600">${escapeHtml(exam.instructions || 'Follow the instructions and submit when finished.')}</p>
      </div>
      <div class="rounded-3xl bg-slate-50 p-4 text-center">
        <p class="text-sm text-slate-500">Duration</p>
        <p class="mt-2 text-3xl font-semibold text-slate-900">${escapeHtml(exam.durationMinutes)}m</p>
      </div>
    </div>
  `;
}

function renderStartButton(exam, profile, examId) {
  const container = document.getElementById('examContainer');
  const button = document.createElement('button');
  button.className = 'btn-primary rounded-3xl px-6 py-4 text-white';
  button.textContent = 'Start Exam';
  button.addEventListener('click', () => startExamSession(exam, profile, examId));
  container.innerHTML = '';
  container.appendChild(button);
}

function renderStatus(message) {
  const container = document.getElementById('examContainer');
  document.getElementById('examStatus').textContent = message;
  container.innerHTML = `<div class="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">${escapeHtml(message)}</div>`;
}

function renderAlreadySubmitted(result) {
  const container = document.getElementById('examContainer');
  container.innerHTML = `
    <div class="rounded-3xl border border-slate-200 bg-white p-6 text-slate-700">
      <h2 class="text-xl font-semibold text-slate-900">Already Submitted</h2>
      <p class="mt-3">Your score: <strong>${result.score}</strong> / <strong>${result.maxScore}</strong></p>
      <p class="mt-2">Submitted at: ${new Date(result.submittedAt).toLocaleString()}</p>
      <a href="result.html?examId=${result.examId}" class="mt-4 inline-flex rounded-2xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">View result</a>
    </div>
  `;
}

async function loadQuestions(examId) {
  const snapshot = await db.collection(CONFIG.questionsCollection)
    .where('examId', '==', examId)
    .orderBy('createdAt', 'asc')
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

function startExamSession(exam, profile, examId) {
  const endAt = Date.now() + ((exam.durationMinutes || 10) * 60000);
  examState = {
    examId,
    started: true,
    submitted: false,
    endAt,
    startedAt: Date.now(),
  };
  saveExamState(examId, examState);
  renderExamForm(exam, profile, examId);
  startTimer(examId, endAt);
  startAutoSave(examId);
  attachAntiCheat();
}

function renderExamForm(exam, profile, examId) {
  const container = document.getElementById('examContainer');
  container.innerHTML = '';
  const form = document.createElement('form');
  form.className = 'space-y-6';
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submitExam(exam, profile, examId);
  });

  examQuestions.forEach((question, index) => {
    const questionCard = document.createElement('div');
    questionCard.className = 'rounded-3xl border border-slate-200 bg-white p-5';
    const label = escapeHtml(question.questionText || `Question ${index + 1}`);
    questionCard.innerHTML = `
      <div class="flex items-center justify-between gap-3">
        <p class="text-base font-semibold text-slate-900">Q${index + 1}. ${label}</p>
        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">${escapeHtml(question.questionType || 'single')}</span>
      </div>
      <p class="mt-3 text-sm text-slate-600">Marks: ${escapeHtml(question.marks || 1)}</p>
      <div class="mt-4 space-y-3" id="question-${index}"></div>
    `;
    const optionsContainer = questionCard.querySelector(`#question-${index}`);
    const inputType = question.questionType === 'multiple' ? 'checkbox' : 'radio';

    question.options.forEach((option, optionIndex) => {
      const checkedName = `${examId}-${index}-${optionIndex}`;
      const inputId = `question-${index}-option-${optionIndex}`;
      const optionField = document.createElement('label');
      optionField.className = 'flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition hover:border-slate-300';
      optionField.innerHTML = `
        <input type="${inputType}" name="question-${index}" value="${escapeHtml(option)}" id="${inputId}" class="h-4 w-4 text-blue-600 focus:ring-blue-500" />
        <span>${escapeHtml(option)}</span>
      `;
      optionsContainer.appendChild(optionField);
    });

    form.appendChild(questionCard);
  });

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.className = 'btn-primary rounded-3xl px-6 py-4 text-white';
  submitButton.textContent = 'Submit Exam';
  form.appendChild(submitButton);

  const saveHint = document.createElement('p');
  saveHint.className = 'text-sm text-slate-500';
  saveHint.textContent = 'Answers save automatically. Do not refresh after submitting.';
  form.appendChild(saveHint);

  container.appendChild(form);
}

function startTimer(examId, endAt) {
  const timerLabel = document.getElementById('timerValue');
  if (examTimerInterval) {
    clearInterval(examTimerInterval);
  }
  examTimerInterval = createCountdown(endAt, (seconds) => {
    timerLabel.textContent = formatTime(seconds);
  }, async () => {
    timerLabel.textContent = '00:00';
    await autoSubmitExamOnTimeout(examId);
  });
}

function loadExamState(examId) {
  try {
    const state = JSON.parse(localStorage.getItem(STORAGE_KEYS.examState) || '{}');
    return state[examId] || null;
  } catch {
    return null;
  }
}

function saveExamState(examId, state) {
  try {
    const allState = JSON.parse(localStorage.getItem(STORAGE_KEYS.examState) || '{}');
    allState[examId] = state;
    localStorage.setItem(STORAGE_KEYS.examState, JSON.stringify(allState));
  } catch {
    // ignore storage errors
  }
}

function saveExamAnswers(examId) {
  const answers = {};
  examQuestions.forEach((question, index) => {
    const inputs = document.querySelectorAll(`[name="question-${index}"]`);
    answers[`q${index}`] = [];
    inputs.forEach((input) => {
      if (input.checked) {
        answers[`q${index}`].push(input.value);
      }
    });
  });
  localStorage.setItem(`${STORAGE_KEYS.examAnswers}_${examId}`, JSON.stringify(answers));
}

function restoreAnswers(examId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.examAnswers}_${examId}`);
    if (!raw) return;
    const saved = JSON.parse(raw);
    Object.keys(saved).forEach((key) => {
      const values = saved[key];
      values.forEach((value) => {
        const selector = `input[name="${key}"][value="${CSS.escape(value)}"]`;
        const input = document.querySelector(selector);
        if (input) input.checked = true;
      });
    });
  } catch {
    // ignore restore failures
  }
}

function startAutoSave(examId) {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
  }
  autoSaveInterval = setInterval(() => {
    saveExamAnswers(examId);
  }, 10000);
  document.addEventListener('change', () => saveExamAnswers(examId));
}

async function submitExam(exam, profile, examId) {
  const now = Date.now();
  if (!examState || examState.submitted) return;
  saveExamAnswers(examId);
  const storedAnswers = JSON.parse(localStorage.getItem(`${STORAGE_KEYS.examAnswers}_${examId}`) || '{}');

  let score = 0;
  let maxScore = 0;
  let totalCorrect = 0;
  let totalWrong = 0;

  examQuestions.forEach((question, index) => {
    const expected = question.correctAnswers || [];
    const answers = storedAnswers[`q${index}`] || [];
    maxScore += Number(question.marks || 1);
    const correctSet = new Set(expected.map((answer) => String(answer)));
    const studentSet = new Set(answers.map((answer) => String(answer)));
    const isCorrect = expected.length === studentSet.size && expected.every((answer) => studentSet.has(answer));
    if (isCorrect) {
      score += Number(question.marks || 1);
      totalCorrect += 1;
    } else if (answers.length) {
      totalWrong += 1;
    }
  });

  const submissionData = {
    examId,
    email: profile[CONFIG.emailField],
    admissionNumber: profile[CONFIG.admissionField],
    standard: profile[CONFIG.standardField],
    score,
    maxScore,
    answers: storedAnswers,
    startedAt: examState.startedAt,
    submittedAt: now,
    timeTaken: Math.round((now - examState.startedAt) / 1000),
    totalCorrect,
    totalWrong,
  };

  const docId = `${examId}_${profile[CONFIG.admissionField]}`;
  await Promise.all([
    db.collection(CONFIG.submissionsCollection).doc(docId).set(submissionData),
    db.collection(CONFIG.resultsCollection).doc(docId).set({
      ...submissionData,
      examTitle: exam.title,
      subject: exam.subject,
      published: exam.published,
    }),
  ]);

  examState.submitted = true;
  saveExamState(examId, examState);
  localStorage.removeItem(`${STORAGE_KEYS.examAnswers}_${examId}`);
  lockExamAfterSubmission();
  document.getElementById('examStatus').textContent = 'Exam submitted successfully.';
  window.location.href = `result.html?examId=${examId}`;
}

async function autoSubmitExamOnTimeout(examId) {
  if (!examState || examState.submitted) {
    return;
  }
  const examDoc = await db.collection(CONFIG.examsCollection).doc(examId).get();
  if (!examDoc.exists) {
    return;
  }
  const exam = examDoc.data();
  const profileDoc = await getCurrentUserProfile();
  if (!profileDoc) return;
  await submitExam(exam, profileDoc.data(), examId);
}

function lockExamAfterSubmission() {
  const inputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"], button[type="submit"]');
  inputs.forEach((input) => input.disabled = true);
  if (examTimerInterval) {
    clearInterval(examTimerInterval);
  }
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
  }
}

function attachAntiCheat() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      registerViolation('Tab switched or hidden. Please remain on the exam page.');
    }
  });
  window.addEventListener('blur', () => {
    registerViolation('Window lost focus. Exam progress is monitored.');
  });
  document.addEventListener('contextmenu', (event) => event.preventDefault());
  document.addEventListener('copy', (event) => event.preventDefault());
  document.addEventListener('cut', (event) => event.preventDefault());
  document.addEventListener('paste', (event) => event.preventDefault());
}

function registerViolation(message) {
  warningCount += 1;
  const warningBox = document.getElementById('cheatWarning');
  warningBox.classList.remove('hidden');
  warningBox.textContent = `${message} Warning ${warningCount}/3. Excessive violations will auto-submit.`;
  if (warningCount >= 3) {
    warningBox.textContent = 'Exam auto-submitted due to repeated violations.';
    const examId = getQueryParam('examId');
    setTimeout(() => autoSubmitExamOnTimeout(examId), 500);
  }
}

function normalizeStandard(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/std\.?/g, '')
    .replace(/standard\.?/g, '')
    .replace(/class\.?/g, '')
    .replace(/[\s\-\._]/g, '')
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function showError(message) {
  const container = document.getElementById('examContainer');
  container.innerHTML = `<div class="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">${escapeHtml(message)}</div>`;
}
