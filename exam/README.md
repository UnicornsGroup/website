# Online Exam System

A lightweight online exam platform built with HTML, Tailwind CSS, vanilla JavaScript, Firebase Authentication, and Firestore Database. Designed for coaching classes and schools with mobile-friendly student and admin dashboards.

## Project Structure

- `index.html` — landing page
- `login.html` — unified login page for students and teachers
- `dashboard.html` — student dashboard
- `exam.html` — student exam interface
- `result.html` — student result page
- `admin/` — admin interface pages
  - `admin-dashboard.html`
  - `create-exam.html`
  - `manage-students.html`
  - `results.html`
- `css/custom.css` — UI styling overrides
- `js/config.js` — central Firestore configuration
- `js/firebase-config.js` — Firebase project credentials placeholder
- `js/auth.js` — authentication helper functions
- `js/dashboard.js` — student dashboard logic
- `js/exam.js` — exam and submission logic
- `js/timer.js` — timer and utility helpers
- `js/admin.js` — admin workflows and exam management
- `js/results.js` — result rendering
- `assets/logo/` — logo assets
- `firebase.json` — hosting configuration
- `firestore.rules` — Firestore security rules sample

## Firestore Schema

### `users`
Stores student and teacher records with existing fields.

Example document:
```json
{
  "admissionNumber": "SEA20260002",
  "studentName": "Student Name",
  "standard": "STD 10 (GM)",
  "role": "STUDENT",
  "email": "SEA20260002@surajenglishacademy.in",
  "mobileNumber": "",
  "photoUrl": ""
}
```

### `exams`
Stores exam metadata.

Fields:
- `title`
- `subject`
- `standard`
- `instructions`
- `durationMinutes`
- `startTime`
- `endTime`
- `published`
- `createdBy`
- `createdAt`

### `questions`
Stores questions linked to exams.

Fields:
- `examId`
- `questionText`
- `questionType` (`single` / `multiple`)
- `options`
- `correctAnswers`
- `marks`
- `createdAt`

### `submissions`
Stores student exam attempts.

Fields:
- `examId`
- `email`
- `admissionNumber`
- `standard`
- `answers`
- `score`
- `maxScore`
- `startedAt`
- `submittedAt`
- `timeTaken`
- `totalCorrect`
- `totalWrong`

### `results`
Stores result summaries for ranking and reports.
Same fields as `submissions` plus `examTitle`, `subject`, and `published`.

## Setup Steps

1. Replace Firebase values in `js/firebase-config.js`.
2. Enable Email/Password authentication in Firebase Authentication.
3. Create Firestore collections: `users`, `exams`, `questions`, `submissions`, `results`.
4. Add student records to `users` with `role: "STUDENT"` and registered email.
5. Create teacher/admin accounts in Firebase Auth and add matching user records with `role: "TEACHER"` or `"ADMIN"`.

## Login Flow

- Student login: admission number + password.
  - App searches `users` by `admissionNumber`, fetches email, and signs in with Firebase Auth.
- Teacher/Admin login: email + password.
- After login, the role is detected and the user is redirected to the proper dashboard.

## Features

- Standard-based exam filtering
- Exam schedule enforcement
- Countdown timer with localStorage persistence
- Auto-save answers and auto-submit on timeout
- Anti-cheating warnings for tab switches, copy/paste, and right-click
- Admin exam creation, student management, and leaderboard results
- Responsive Tailwind UI for mobile and desktop

## GitHub Pages Deployment

1. Push the repository to GitHub.
2. Open repository settings > Pages.
3. Set source to the `main` branch and root folder `/`.
4. Save and wait for deployment.

> For GitHub Pages, no Node backend is required. The static pages will work directly from the repository with Firebase configuration in `js/firebase-config.js`.

## Notes

- The system is built to remain lightweight and easy to maintain.
- Replace `assets/logo/logo.png` with your coaching logo later; the UI will automatically use the image or fallback to the coaching name.
- For enhanced production security, update `firestore.rules` to match your project user IDs and admin rules.
