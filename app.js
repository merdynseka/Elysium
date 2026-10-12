const SUPREME_ADMIN_EMAIL = "brainnerschwarz@gmail.com";

// Configuration Firebase configurée pour Elysium
const firebaseConfig = {
  apiKey: "AIzaSyDRWOfzks3Mni03-GzeltsXNp1VJ8rBPmQ",
  authDomain: "elysium-c4743.firebaseapp.com",
  projectId: "elysium-c4743",
  storageBucket: "elysium-c4743.firebasestorage.app",
  messagingSenderId: "588187726489",
  appId: "1:588187726489:web:1a6532c7eb25ab54553e08",
  measurementId: "G-CCPSJYNSB9"
};

// Initialisation des services
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();


let currentLanguage = localStorage.getItem("elysium_lang") || "en";
let isLoginMode = true;
let currentUser = null;

function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem("elysium_lang", lang);
  applyTranslations();
  if (document.getElementById("settingsLanguage")) {
    document.getElementById("settingsLanguage").value = lang;
  }
  if (document.getElementById("langSelect")) {
    document.getElementById("langSelect").value = lang;
  }
}

function applyTranslations() {
  const allTextNodes = document.querySelectorAll("[data-i18n]");
  allTextNodes.forEach(el => {
    const key = el.getAttribute("data-i18n");
    const text = translations[currentLanguage][key];
    if (text) el.textContent = text;
  });

  document.documentElement.lang = currentLanguage;
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("elysium_theme", isDark ? "dark" : "light");
}

function initTheme() {
  const savedTheme = localStorage.getItem("elysium_theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }
  const btn = document.getElementById("themeToggleBtn");
  if (btn) {
    btn.textContent = document.body.classList.contains("dark") ? "Light" : "Dark";
  }
}

function renderResourceCard(item) {
  const wrap = document.createElement("div");
  wrap.className = "resource-card";

  const thumb = document.createElement("div");
  thumb.className = "thumb";
  thumb.textContent = item.type.toUpperCase();

  const content = document.createElement("div");
  content.className = "content";

  const title = document.createElement("h4");
  title.textContent = item.title;

  const desc = document.createElement("p");
  desc.textContent = item.description || "Course resource";

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.innerHTML = `
    <span>${item.type}</span>
    <span>${item.course}</span>
  `;

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.gap = "8px";
  actions.style.marginTop = "12px";

  const downloadBtn = document.createElement("a");
  downloadBtn.href = item.fileUrl || "#";
  downloadBtn.target = "_blank";
  downloadBtn.className = "primary-btn";
  downloadBtn.textContent = "Open";

  actions.appendChild(downloadBtn);
  content.appendChild(title);
  content.appendChild(desc);
  content.appendChild(meta);
  content.appendChild(actions);

  wrap.appendChild(thumb);
  wrap.appendChild(content);

  return wrap;
}

async function loadResources() {
  const grid = document.getElementById("resourceGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const snapshot = await db.collection("resources").orderBy("createdAt", "desc").get();
  snapshot.docs.forEach(doc => {
    const item = doc.data();
    grid.appendChild(renderResourceCard(item));
  });
}

function openAuthModal() {
  const modal = document.getElementById("authModal");
  if (modal) modal.classList.remove("hidden");
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");
  if (modal) modal.classList.add("hidden");
}

function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  const title = document.getElementById("authTitle");
  const button = document.getElementById("authSubmitBtn");
  const modeText = document.getElementById("authModeText");
  const toggleBtn = document.getElementById("toggleAuthMode");

  if (isLoginMode) {
    title.textContent = "Login";
    button.textContent = "Login";
    modeText.textContent = "Need an account?";
    toggleBtn.textContent = "Create one";
  } else {
    title.textContent = "Create account";
    button.textContent = "Create account";
    modeText.textContent = "Already have an account?";
    toggleBtn.textContent = "Login";
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("emailInput").value.trim();
  const password = document.getElementById("passwordInput").value.trim();

  try {
    if (isLoginMode) {
      await auth.signInWithEmailAndPassword(email, password);
    } else {
      await auth.createUserWithEmailAndPassword(email, password);
    }
    closeAuthModal();
  } catch (error) {
    alert(error.message);
  }
}

async function updateAuthUi() {
  const authBtn = document.getElementById("authBtn");
  const userEmailText = document.getElementById("userEmailText");
  currentUser = auth.currentUser;

  if (authBtn) {
    authBtn.textContent = currentUser ? "Logout" : "Login";
  }

  if (userEmailText) {
    userEmailText.textContent = currentUser ? currentUser.email : "Not signed in";
  }

  if (authBtn) {
    authBtn.onclick = async () => {
      if (currentUser) {
        await auth.signOut();
      } else {
        openAuthModal();
      }
    };
  }
}

function bindHomePageEvents() {
  const uploadBtn = document.getElementById("openUploadBtn");
  const uploadModal = document.getElementById("uploadModal");
  const closeUploadModal = document.getElementById("closeUploadModal");
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");

  if (uploadBtn) {
    uploadBtn.addEventListener("click", () => {
      if (!auth.currentUser) {
        openAuthModal();
        return;
      }
      uploadModal.classList.remove("hidden");
    });
  }

  if (closeUploadModal) {
    closeUploadModal.addEventListener("click", () => {
      uploadModal.classList.add("hidden");
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", filterResources);
  }

  if (searchInput) {
    searchInput.addEventListener("input", filterResources);
  }
}

async function filterResources() {
  const searchInput = document.getElementById("searchInput");
  const typeFilter = document.getElementById("typeFilter");
  const grid = document.getElementById("resourceGrid");

  if (!grid) return;

  const term = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const type = typeFilter ? typeFilter.value : "all";

  const snapshot = await db.collection("resources").get();
  let filtered = snapshot.docs.map(doc => doc.data());

  filtered = filtered.filter(item => {
    const matchesText =
      !term ||
      item.title.toLowerCase().includes(term) ||
      item.course.toLowerCase().includes(term) ||
      item.type.toLowerCase().includes(term);

    const matchesType = type === "all" || item.type === type;

    return matchesText && matchesType;
  });

  grid.innerHTML = "";
  filtered.forEach(item => {
    grid.appendChild(renderResourceCard(item));
  });
}

async function handleUpload(e) {
  e.preventDefault();

  const file = document.getElementById("fileInput").files[0];
  const title = document.getElementById("uploadTitle").value.trim();
  const course = document.getElementById("uploadCourse").value.trim();
  const type = document.getElementById("uploadType").value;
  const tags = document.getElementById("uploadTags").value;
  const description = document.getElementById("uploadDescription").value.trim();

  if (!file || !title || !course) {
    alert("Please fill all required fields.");
    return;
  }

  try {
    const storageRef = storage.ref(`resources/${Date.now()}_${file.name}`);
    const snapshot = await storageRef.put(file);
    const fileUrl = await snapshot.ref.getDownloadURL();

    await db.collection("resources").add({
      title,
      course,
      type,
      tags: tags.split(",").map(tag => tag.trim()).filter(Boolean),
      description,
      fileUrl,
      uploadedBy: auth.currentUser.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById("uploadForm").reset();
    document.getElementById("uploadModal").classList.add("hidden");
    alert("File uploaded successfully.");
    loadResources();
  } catch (error) {
    alert("Upload failed: " + error.message);
  }
}

async function checkAdminAccess() {
  const adminPanel = document.getElementById("adminPanel");
  const denied = document.getElementById("adminAccessDenied");
  if (!adminPanel || !denied) return;

  if (!auth.currentUser) {
    denied.classList.remove("hidden");
    adminPanel.classList.add("hidden");
    return;
  }

  const userEmail = auth.currentUser.email;
  const userDoc = await db.collection("admins").doc(userEmail).get();

  if (userEmail === SUPREME_ADMIN_EMAIL || userDoc.exists) {
    denied.classList.add("hidden");
    adminPanel.classList.remove("hidden");
  } else {
    denied.classList.remove("hidden");
    adminPanel.classList.add("hidden");
  }
}

async function addAdmin() {
  const email = document.getElementById("adminEmailInput").value.trim();

  if (!email) return;
  if (auth.currentUser.email !== SUPREME_ADMIN_EMAIL) {
    alert("Only the supreme admin can add admins.");
    return;
  }

  await db.collection("admins").doc(email).set({ email, addedBy: auth.currentUser.email });
  alert("Admin added.");
  document.getElementById("adminEmailInput").value = "";
}

async function loadAdminFiles() {
  const list = document.getElementById("adminFilesList");
  if (!list) return;

  const snapshot = await db.collection("resources").orderBy("createdAt", "desc").get();
  list.innerHTML = "";

  snapshot.docs.forEach(doc => {
    const item = doc.data();
    const entry = document.createElement("div");
    entry.className = "card";

    entry.innerHTML = `
      <strong>${item.title}</strong><br>
      <span>${item.course} • ${item.type}</span><br>
      <small>Uploaded by: ${item.uploadedBy || "unknown"}</small><br>
      <a href="${item.fileUrl}" target="_blank">Open</a>
    `;

    list.appendChild(entry);
  });
}

function bindGlobalUI() {
  const langSelect = document.getElementById("langSelect");
  if (langSelect) {
    langSelect.value = currentLanguage;
    langSelect.addEventListener("change", (e) => setLanguage(e.target.value));
  }

  const settingsLanguage = document.getElementById("settingsLanguage");
  if (settingsLanguage) {
    settingsLanguage.value = currentLanguage;
    settingsLanguage.addEventListener("change", (e) => setLanguage(e.target.value));
  }

  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }

  const authForm = document.getElementById("authForm");
  if (authForm) authForm.addEventListener("submit", handleAuthSubmit);

  const toggleAuthModeBtn = document.getElementById("toggleAuthMode");
  if (toggleAuthModeBtn) toggleAuthModeBtn.addEventListener("click", toggleAuthMode);

  const closeAuthModalBtn = document.getElementById("closeAuthModal");
  if (closeAuthModalBtn) closeAuthModalBtn.addEventListener("click", closeAuthModal);

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await auth.signOut();
      updateAuthUi();
    });
  }

  const addAdminBtn = document.getElementById("addAdminBtn");
  if (addAdminBtn) addAdminBtn.addEventListener("click", addAdmin);

  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Message sent successfully.");
      contactForm.reset();
    });
  }

  const uploadForm = document.getElementById("uploadForm");
  if (uploadForm) uploadForm.addEventListener("submit", handleUpload);
}

document.addEventListener("DOMContentLoaded", async () => {
  setLanguage(currentLanguage);
  initTheme();
  bindGlobalUI();
  bindHomePageEvents();

  auth.onAuthStateChanged(async () => {
    updateAuthUi();

    if (document.getElementById("adminPanel")) {
      await checkAdminAccess();
      await loadAdminFiles();
    }

    if (document.getElementById("resourceGrid")) {
      await loadResources();
    }
  });
});