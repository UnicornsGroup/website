let firebaseApp;
let auth;
let db;

function initFirebase() {
  if (!firebase.apps.length) {
    firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
  }
  auth = firebase.auth();
  db = firebase.firestore();
}

async function queryUserDocument(field, value) {
  const snapshot = await db.collection(CONFIG.studentsCollection)
    .where(field, '==', value)
    .limit(1)
    .get();
  return snapshot.docs.length ? snapshot.docs[0] : null;
}

async function fetchUserByAdmission(admissionNumber) {
  return queryUserDocument(CONFIG.admissionField, admissionNumber);
}

async function fetchUserByEmail(email) {
  return queryUserDocument(CONFIG.emailField, email);
}

async function signInUser(identifier, password) {
  if (!identifier || !password) {
    throw new Error('Please provide both fields.');
  }

  let signInPromise;
  let fallbackProfile = null;
  if (identifier.includes('@')) {
    signInPromise = auth.signInWithEmailAndPassword(identifier, password);
  } else {
    const userDoc = await fetchUserByAdmission(identifier);
    if (!userDoc) {
      throw new Error('Admission number not found.');
    }
    const userEmail = userDoc.data()[CONFIG.emailField];
    if (!userEmail) {
      throw new Error('Student email is missing in database.');
    }
    fallbackProfile = userDoc;
    signInPromise = auth.signInWithEmailAndPassword(userEmail, password);
  }

  const credential = await signInPromise;
  await handlePostSignIn(credential.user, fallbackProfile);
}

async function handlePostSignIn(user, fallbackProfile = null) {
  if (!user || !user.email) {
    throw new Error('Unable to identify user account.');
  }
  const userDoc = await fetchUserByEmail(user.email) || fallbackProfile;
  if (!userDoc) {
    throw new Error('User profile is missing. Contact the administrator.');
  }
  const role = userDoc.data()[CONFIG.roleField];
  if (role === CONFIG.studentRoleValue) {
    window.location.href = 'dashboard.html';
    return;
  }
  if (CONFIG.teacherRoleValues.includes(role)) {
    window.location.href = 'admin/admin-dashboard.html';
    return;
  }
  throw new Error('Your account role is not authorized.');
}

async function passwordReset(identifier) {
  if (identifier.includes('@')) {
    return auth.sendPasswordResetEmail(identifier);
  }
  const userDoc = await fetchUserByAdmission(identifier);
  if (!userDoc) {
    throw new Error('Admission number not found.');
  }
  const email = userDoc.data()[CONFIG.emailField];
  if (!email) {
    throw new Error('Email missing for this student record.');
  }
  return auth.sendPasswordResetEmail(email);
}

async function signOutUser() {
  await auth.signOut();
  window.location.href = 'login.html';
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

async function getCurrentUserProfile() {
  const user = auth.currentUser;
  if (!user || !user.email) {
    return null;
  }

  const exactEmail = user.email.trim();
  const lowerEmail = exactEmail.toLowerCase();

  let snapshot = await db.collection(CONFIG.studentsCollection)
    .where(CONFIG.emailField, '==', exactEmail)
    .limit(1)
    .get();

  if (!snapshot.docs.length) {
    snapshot = await db.collection(CONFIG.studentsCollection)
      .where(CONFIG.emailField, '==', lowerEmail)
      .limit(1)
      .get();
  }

  if (!snapshot.docs.length) {
    snapshot = await db.collection(CONFIG.studentsCollection)
      .where('emailLower', '==', lowerEmail)
      .limit(1)
      .get();
  }

  return snapshot.docs.length ? snapshot.docs[0] : null;
}

function monitorAuthState(requiredRoles = [], onReady) {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    const profileDoc = await getCurrentUserProfile();
    if (!profileDoc) {
      await auth.signOut();
      window.location.href = 'login.html';
      return;
    }

    const profile = profileDoc.data();
    if (requiredRoles.length && !requiredRoles.includes(profile[CONFIG.roleField])) {
      if (profile[CONFIG.roleField] === CONFIG.studentRoleValue) {
        window.location.href = '../dashboard.html';
      } else {
        window.location.href = '../admin/admin-dashboard.html';
      }
      return;
    }
    if (typeof onReady === 'function') {
      onReady(profileDoc);
    }
  });
}

async function updatePassword(newPassword) {
  if (!auth.currentUser) {
    throw new Error('Not signed in.');
  }
  return auth.currentUser.updatePassword(newPassword);
}
