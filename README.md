# Elysium

A simple free website for students to share ebooks, PDFs, images, and podcasts.

## Features
- Home page
- Settings page
- Help page
- Contact page
- Admin panel
- English and French support
- White theme only
- Deepskyblue accent
- Login required for upload and download
- Supreme admin email: brainnerschwarz@gmail.com

## Free stack
- GitHub Pages
- Firebase Authentication
- Firebase Firestore
- Firebase Storage

## Setup
1. Create a Firebase project.
2. Enable:
   - Authentication
   - Email/password sign-in
   - Firestore
   - Storage
3. Replace Firebase config in app.js
4. Create a GitHub repo named Elysium
5. Push the files to GitHub
6. Enable GitHub Pages in the repo settings
7. Upload your site files

## Firebase config
In app.js, replace:
```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
