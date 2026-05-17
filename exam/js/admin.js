window.addEventListener('load', () => {
  initFirebase();
  const logoutButton = document.getElementById('logoutBtn');
  if (logoutButton) {
    logoutButton.addEventListener('click', signOutUser);
  }
  if (document.getElementById('studentCount')) {
    setupAdminDashboard();
  }
  if (document.getElementById('examForm')) {
    setupCreateExamPage();
  }
  if (document.getElementById('studentTable')) {
    setupStudentManagement();
  }
  if (document.getElementById('resultsTable')) {
    setupResultsPage();
  }
});

function setupAdminDashboard() {
  monitorAuthState(CONFIG.teacherRoleValues, async () => {
    const studentCount = await db.collection(CONFIG.studentsCollection)
      .where(CONFIG.roleField, '==', CONFIG.studentRoleValue)
      .get();
    const examCount = await db.collection(CONFIG.examsCollection).get();
    const submissionCount = await db.collection(CONFIG.submissionsCollection).get();
    const resultsSnapshot = await db.collection(CONFIG.resultsCollection).get();

    const averageScore = calculateAverageScore(resultsSnapshot.docs);

    document.getElementById('studentCount').textContent = studentCount.size;
    document.getElementById('examCount').textContent = examCount.size;
    document.getElementById('submissionCount').textContent = submissionCount.size;
    document.getElementById('averageScore').textContent = `${averageScore}%`;
  });
}

function calculateAverageScore(resultsDocs) {
  if (!resultsDocs.length) {
    return 0;
  }
  let totalPercentage = 0;
  resultsDocs.forEach((doc) => {
    const data = doc.data();
    if (data.maxScore > 0) {
      totalPercentage += (data.score / data.maxScore) * 100;
    }
  });
  return Math.round(totalPercentage / resultsDocs.length);
}

function setupCreateExamPage() {
  monitorAuthState(CONFIG.teacherRoleValues, async () => {
    document.getElementById('addQuestionBtn').addEventListener('click', () => addExamQuestion());
    document.getElementById('examForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      await saveExam();
    });
    addExamQuestion();
  });
}

function addExamQuestion(data = {}) {
  const questionList = document.getElementById('questionList');
  const questionIndex = questionList.children.length + 1;
  const questionCard = document.createElement('div');
  questionCard.className = 'space-y-4 rounded-3xl border border-slate-200 bg-white p-5';
  questionCard.innerHTML = `
    <div class="flex items-start justify-between gap-4">
      <div>
        <h3 class="text-base font-semibold text-slate-900">Question ${questionIndex}</h3>
        <p class="text-sm text-slate-500">Add text, 4 options, correct answer, and marks.</p>
      </div>
      <button type="button" class="text-sm font-semibold text-red-600 hover:text-red-800 remove-question">Remove</button>
    </div>
    <div class="grid gap-4 lg:grid-cols-2">
      <div>
        <label class="block text-sm font-medium text-slate-700">Question Text</label>
        <textarea class="question-text mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm" rows="3">${escapeHtml(data.questionText || '')}</textarea>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700">Question Type</label>
        <select class="question-type mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
          <option value="single">Single Correct</option>
          <option value="multiple">Multiple Correct</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700">Marks</label>
        <input type="number" min="1" value="${data.marks || 1}" class="question-marks mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700">Correct Answers (comma separated)</label>
        <input type="text" value="${escapeHtml((data.correctAnswers || []).join(', '))}" class="question-correct mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm" placeholder="Option 1, Option 2" />
      </div>
    </div>
    <div class="grid gap-4 lg:grid-cols-2">
      <div>
        <label class="block text-sm font-medium text-slate-700">Option 1</label>
        <input type="text" value="${escapeHtml(data.options?.[0] || '')}" class="question-option mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm" required />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700">Option 2</label>
        <input type="text" value="${escapeHtml(data.options?.[1] || '')}" class="question-option mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm" required />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700">Option 3</label>
        <input type="text" value="${escapeHtml(data.options?.[2] || '')}" class="question-option mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm" required />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700">Option 4</label>
        <input type="text" value="${escapeHtml(data.options?.[3] || '')}" class="question-option mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm" required />
      </div>
    </div>
  `;
  questionList.appendChild(questionCard);
  questionCard.querySelector('.remove-question').addEventListener('click', () => questionCard.remove());
}

async function saveExam() {
  const title = document.getElementById('examTitle').value.trim();
  const subject = document.getElementById('examSubject').value.trim();
  const standard = document.getElementById('examStandard').value;
  const durationMinutes = Number(document.getElementById('examDuration').value);
  const startTime = document.getElementById('examStart').value;
  const endTime = document.getElementById('examEnd').value;
  const instructions = document.getElementById('examInstructions').value.trim();
  const published = document.getElementById('examPublished').checked;

  if (!title || !subject || !standard || !startTime || !endTime) {
    showExamMessage('Please fill the exam details first.', 'text-red-600');
    return;
  }

  const questions = Array.from(document.querySelectorAll('#questionList > div')).map((card) => {
    const questionText = card.querySelector('.question-text').value.trim();
    const questionType = card.querySelector('.question-type').value;
    const marks = Number(card.querySelector('.question-marks').value) || 1;
    const correctAnswers = card.querySelector('.question-correct').value.split(',').map((value) => value.trim()).filter(Boolean);
    const options = Array.from(card.querySelectorAll('.question-option')).map((input) => input.value.trim()).filter(Boolean);
    return { questionText, questionType, marks, correctAnswers, options, createdAt: Date.now() };
  }).filter((question) => question.questionText && question.options.length === 4);

  if (!questions.length) {
    showExamMessage('Add at least one complete question.', 'text-red-600');
    return;
  }

  const examData = {
    title,
    subject,
    standard,
    durationMinutes,
    startTime,
    endTime,
    instructions,
    published,
    createdBy: auth.currentUser?.email || 'admin',
    createdAt: Date.now(),
  };

  const examRef = await db.collection(CONFIG.examsCollection).add(examData);
  const batch = db.batch();
  questions.forEach((question) => {
    const questionRef = db.collection(CONFIG.questionsCollection).doc();
    batch.set(questionRef, { ...question, examId: examRef.id });
  });
  await batch.commit();

  document.getElementById('examForm').reset();
  document.getElementById('questionList').innerHTML = '';
  addExamQuestion();
  showExamMessage('Exam saved successfully.', 'text-emerald-600');
}

function showExamMessage(message, classes) {
  const messageNode = document.getElementById('examMessage');
  messageNode.textContent = message;
  messageNode.className = classes;
}

function setupStudentManagement() {
  monitorAuthState(CONFIG.teacherRoleValues, async () => {
    await renderStudentTable();
    document.getElementById('studentForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      await saveStudentRecord();
    });
  });
}

async function renderStudentTable() {
  const snapshot = await db.collection(CONFIG.studentsCollection)
    .where(CONFIG.roleField, '==', CONFIG.studentRoleValue)
    .orderBy(CONFIG.admissionField)
    .get();
  const tableContainer = document.getElementById('studentTable');
  if (!snapshot.docs.length) {
    tableContainer.innerHTML = '<p class="p-6 text-sm text-slate-500">No students found.</p>';
    return;
  }

  const rows = snapshot.docs.map((doc) => {
    const student = doc.data();
    return `
      <tr class="border-b border-slate-200 last:border-none">
        <td class="px-4 py-3 text-sm text-slate-700">${escapeHtml(student[CONFIG.admissionField])}</td>
        <td class="px-4 py-3 text-sm text-slate-700">${escapeHtml(student[CONFIG.nameField])}</td>
        <td class="px-4 py-3 text-sm text-slate-700">${escapeHtml(student[CONFIG.standardField])}</td>
        <td class="px-4 py-3 text-sm text-slate-700">${escapeHtml(student[CONFIG.emailField])}</td>
        <td class="px-4 py-3 text-right text-sm">
          <button data-admission="${escapeHtml(student[CONFIG.admissionField])}" class="edit-student text-blue-600 hover:text-blue-800">Edit</button>
          <button data-admission="${escapeHtml(student[CONFIG.admissionField])}" class="delete-student ml-4 text-red-600 hover:text-red-800">Delete</button>
        </td>
      </tr>
    `;
  }).join('');

  tableContainer.innerHTML = `
    <table class="min-w-full text-left text-sm">
      <thead class="bg-slate-50 text-slate-500">
        <tr>
          <th class="px-4 py-3">Admission</th>
          <th class="px-4 py-3">Name</th>
          <th class="px-4 py-3">Standard</th>
          <th class="px-4 py-3">Email</th>
          <th class="px-4 py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  tableContainer.querySelectorAll('.edit-student').forEach((button) => {
    button.addEventListener('click', async () => {
      const admission = button.dataset.admission;
      await loadStudentRecord(admission);
    });
  });
  tableContainer.querySelectorAll('.delete-student').forEach((button) => {
    button.addEventListener('click', async () => {
      const admission = button.dataset.admission;
      if (confirm(`Delete student ${admission}?`)) {
        await deleteStudentRecord(admission);
      }
    });
  });
}

async function loadStudentRecord(admissionNumber) {
  const snapshot = await db.collection(CONFIG.studentsCollection)
    .where(CONFIG.admissionField, '==', admissionNumber)
    .limit(1)
    .get();
  if (!snapshot.docs.length) return;
  const data = snapshot.docs[0].data();
  document.getElementById('studentAdmission').value = data[CONFIG.admissionField] || '';
  document.getElementById('studentName').value = data[CONFIG.nameField] || '';
  document.getElementById('studentStandard').value = data[CONFIG.standardField] || '';
  document.getElementById('studentEmail').value = data[CONFIG.emailField] || '';
  document.getElementById('studentPhone').value = data[CONFIG.phoneField] || '';
}

async function saveStudentRecord() {
  const admissionNumber = document.getElementById('studentAdmission').value.trim();
  const studentName = document.getElementById('studentName').value.trim();
  const standard = document.getElementById('studentStandard').value;
  const email = document.getElementById('studentEmail').value.trim();
  const mobileNumber = document.getElementById('studentPhone').value.trim();

  if (!admissionNumber || !studentName || !standard || !email) {
    showStudentMessage('Complete all required fields.', 'text-red-600');
    return;
  }

  const studentData = {
    [CONFIG.admissionField]: admissionNumber,
    [CONFIG.nameField]: studentName,
    [CONFIG.standardField]: standard,
    [CONFIG.emailField]: email,
    emailLower: email.trim().toLowerCase(),
    [CONFIG.phoneField]: mobileNumber,
    [CONFIG.roleField]: CONFIG.studentRoleValue,
    [CONFIG.photoField]: '',
    updatedAt: Date.now(),
  };

  const snapshot = await db.collection(CONFIG.studentsCollection)
    .where(CONFIG.admissionField, '==', admissionNumber)
    .limit(1)
    .get();

  if (snapshot.docs.length) {
    await db.collection(CONFIG.studentsCollection).doc(snapshot.docs[0].id).update(studentData);
  } else {
    await createFirebaseStudentAuth(email, admissionNumber);
    await db.collection(CONFIG.studentsCollection).add(studentData);
  }

  document.getElementById('studentForm').reset();
  await renderStudentTable();
  showStudentMessage('Student record saved successfully.', 'text-emerald-600');
}

async function createFirebaseStudentAuth(email, password) {
  if (!FIREBASE_API_KEY) {
    throw new Error('Firebase API key is required for user creation.');
  }
  try {
    await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
  } catch (error) {
    console.warn('Unable to create auth account:', error);
  }
}

function showStudentMessage(message, classes) {
  const node = document.getElementById('studentMessage');
  node.textContent = message;
  node.className = classes;
}

async function deleteStudentRecord(admissionNumber) {
  const snapshot = await db.collection(CONFIG.studentsCollection)
    .where(CONFIG.admissionField, '==', admissionNumber)
    .limit(1)
    .get();
  if (snapshot.docs.length) {
    await db.collection(CONFIG.studentsCollection).doc(snapshot.docs[0].id).delete();
    await renderStudentTable();
  }
}

function setupResultsPage() {
  monitorAuthState(CONFIG.teacherRoleValues, async () => {
    const resultsSnapshot = await db.collection(CONFIG.resultsCollection)
      .orderBy('score', 'desc')
      .limit(50)
      .get();

    const rows = resultsSnapshot.docs.map((doc) => {
      const result = doc.data();
      return `
        <tr class="border-b border-slate-200 last:border-none hover:bg-slate-50">
          <td class="px-4 py-3 text-sm text-slate-700">${escapeHtml(result.examTitle)}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${escapeHtml(result[CONFIG.admissionField])}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${escapeHtml(result[CONFIG.nameField] || '')}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${escapeHtml(result.score)} / ${escapeHtml(result.maxScore)}</td>
          <td class="px-4 py-3 text-sm text-slate-700">${Math.round((result.score / result.maxScore) * 100)}%</td>
        </tr>
      `;
    }).join('');
    document.getElementById('resultsTable').innerHTML = `
      <table class="min-w-full text-left text-sm">
        <thead class="bg-slate-50 text-slate-500">
          <tr>
            <th class="px-4 py-3">Exam</th>
            <th class="px-4 py-3">Admission</th>
            <th class="px-4 py-3">Student</th>
            <th class="px-4 py-3">Score</th>
            <th class="px-4 py-3">Percent</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  });
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"]/g, (match) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[match]));
}
