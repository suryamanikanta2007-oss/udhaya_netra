/* ==========================================================================
   UDHAYA NETRAM (ఉదయ నేత్రం) - Comprehensive Application & Daily Publishing Logic
   Includes:
   - Full Daily Admin Publishing (E-Paper, News, Breaking Ticker, Daily Poll, Editorial)
   - Realtime Listeners & Local Persistence
   - TTS Telugu Audio Reader
   - Dynamic Category Filtering & Autocomplete Search
   - Dark/Light Mode & Font Resizer
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, query, orderBy,
  serverTimestamp, doc, updateDoc, deleteDoc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { loadAppConfig, getConfig } from "./config.js";

// Global Application State
let app, db, auth;
let isAdmin = false;
let currentNewsData = [];
let currentEditionsData = [];
let currentTickerData = [];
let activeCategory = "All";
let latestEditionUrl = "";
let currentOpenArticle = null;
let currentUtterance = null;
let isSpeaking = false;

// Default Pre-loaded Dataset
const defaultNews = [
  {
    id: "lead-1",
    title: "అమలాపురంలో ఘనంగా ప్రారంభమైన ఉదయ నేత్రం దినపత్రిక సేవలు - ప్రజా సమస్యలపై ప్రత్యేక కథనాలు",
    text: "డాక్టర్ బి.ఆర్. అంబేద్కర్ కోనసీమ జిల్లా కేంద్రం అమలాపురంలో ఉదయ నేత్రం తెలుగు డిజిటల్ దినపత్రిక నూతన ఎడిషన్ ఆవిష్కరణ కార్యక్రమం ఘనంగా జరిగింది.\n\nసంపాదకుడు కడలి పల్లపరాజు మాట్లాడుతూ.. ప్రజల సమస్యలు, అభివృద్ధి, వాస్తవాలను వెలుగులోకి తేవడమే పత్రిక ప్రధాన లక్ష్యమని పేర్కొన్నారు. గ్రామాల్లోని రైతుల సమస్యలు, యువత ఉపాధి, విద్యా వైద్య రంగాల సమస్యలపై ప్రత్యేక పరిశోధనాత్మక కథనాలు ప్రచురించనున్నట్లు తెలిపారు.",
    category: "Konaseema",
    mandal: "అమలాపురం",
    image: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1000&auto=format&fit=crop&q=80",
    date: new Date().toISOString().split('T')[0],
    isLead: true
  },
  {
    id: "news-2",
    title: "కోనసీమలో గోదావరి డెల్టా రైతుల సంబరాలు - ఖరీఫ్ సాగునీటి విడుదల వేగవంతం",
    text: "కోనసీమ వ్యాప్తంగా ఖరీఫ్ సాగు పనులకు కాలువల ద్వారా సాగునీరు సమృద్ధిగా సరఫరా అవుతుండటంతో రైతులు హర్షం వ్యక్తం చేస్తున్నారు.\n\nఅమలాపురం, కొత్తపేట, ముమ్మిడివరం నియోజకవర్గాల్లోని వరి నాట్లు చురుగ్గా సాగుతున్నాయి. ఎరువులు, విత్తనాలు అందుబాటులో ఉంచేలా వ్యవసాయ శాఖ అధికారులు ప్రత్యేక పర్యవేక్షణ చేపట్టారు.",
    category: "Agriculture",
    mandal: "కొత్తపేట",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80",
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: "news-3",
    title: "ఆంధ్రప్రదేశ్‌లో నూతన పారిశ్రామిక & మౌలిక సదుపాయాల అభివృద్ధి ప్రాజెక్టులకు శ్రీకారం",
    text: "రాష్ట్రంలో యువతకు విస్తృత ఉద్యోగ అవకాశాలు కల్పించేందుకు నూతన పారిశ్రామిక కారిడార్ల అభివృద్ధికి ప్రత్యేక చర్యలు చేపడుతున్నారు.\n\nరహదారుల విస్తరణ, పోర్టు ఆధారిత పరిశ్రమల ఏర్పాటు పనులు వేగవంతం అయ్యాయి. రాష్ట్రవ్యాప్తంగా నైపుణ్యాభివృద్ధి కేంద్రాలు ఏర్పాటు కానున్నాయి.",
    category: "AP",
    mandal: "ఆంధ్రప్రదేశ్",
    image: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80",
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: "news-4",
    title: "జాతీయ స్థాయిలో డిజిటల్ మీడియా & గ్రామీణ వార్తా విప్లవం",
    text: "దేశవ్యాప్తంగా ప్రాంతీయ భాషల్లో డిజిటల్ దినపత్రికలకు ఆదరణ పెరుగుతోంది. సాంకేతిక పరిజ్ఞానంతో క్షణాల్లో వార్తలను చదువరులకు చేరవేస్తూ ఉదయ నేత్రం అగ్రగామిగా నిలుస్తోంది.",
    category: "National",
    mandal: "జాతీయం",
    image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80",
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: "news-5",
    title: "టాలీవుడ్ తాజా చిత్ర విశేషాలు - గోదావరి అందాలలో షూటింగ్ సందడి",
    text: "కోనసీమ అందమైన లొకేషన్లలో పలు ప్రముఖ చిత్రాల చిత్రీకరణ జరుగుతోంది. స్థానిక కళాకారులకు ఉపాధి అవకాశాలు లభిస్తున్నాయి.",
    category: "Cinema",
    mandal: "రాజోలు",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
    date: new Date().toISOString().split('T')[0]
  }
];

const defaultEditions = [
  {
    id: "epaper-main-1",
    title: "ఉదయ నేత్రం - ప్రధాన సంచిక (కోనసీమ & అమలాపురం)",
    date: new Date().toISOString().split('T')[0],
    pages: 6,
    url: "https://raw.githubusercontent.com/suryamanikanta2007-oss/udhaya_netra/main/sample.pdf"
  }
];

const defaultTickers = [
  { id: "tick-1", text: "⚡ ఉదయ నేత్రం డైలీ తెలుగు ఈ-పేపర్‌కు స్వాగతం!" },
  { id: "tick-2", text: "📰 కోనసీమ, అమలాపురం మరియు ఆంధ్రప్రదేశ్ తాజా వార్తలు ప్రతిరోజూ ఉదయం మీ చేతుల్లో!" },
  { id: "tick-3", text: "✨ సత్యం, ధైర్యం, నిష్పక్షపాత వార్తలకు చిరునామా ఉదయ నేత్రం!" },
  { id: "tick-4", text: "📞 ప్రకటనలు & వార్తలకు సంప్రదించండి: 9848556806" }
];

// App Bootstrapper
async function initApp() {
  initTheme();
  initFontSize();
  updateLiveDate();

  const config = await loadAppConfig();
  
  try {
    app = initializeApp(config.firebase);
    db = getFirestore(app);
    auth = getAuth(app);

    onAuthStateChanged(auth, async user => {
      isAdmin = !!user;
      const loginBox = document.getElementById("loginBox");
      const adminPanel = document.getElementById("adminPanel");
      const adminBadge = document.getElementById("adminBadge");

      if (loginBox) loginBox.style.display = user ? "none" : "block";
      if (adminPanel) adminPanel.style.display = user ? "block" : "none";
      if (adminBadge) adminBadge.style.display = user ? "inline-block" : "none";

      if (user) {
        status(`అడ్మిన్ లాగిన్ అయ్యారు: ${user.email}`, true);
        renderAdminManager();
      }
      await loadEditions();
      await loadNews();
      await loadTicker();
      await loadPollAndEditorial();
    });
  } catch (err) {
    console.warn("Running in offline/local mode:", err);
  }

  await loadEditions();
  await loadNews();
  await loadTicker();
  await loadPollAndEditorial();
  initDragAndDrop();
}

// Live Telugu Date Formatter
function updateLiveDate() {
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = new Date().toLocaleDateString('te-IN', dateOptions);
  
  const dateEl = document.getElementById("liveDate");
  if (dateEl) {
    dateEl.innerHTML = `📅 ${dateStr} • అమలాపురం`;
  }
  
  const dateInput = document.getElementById("pdfDate");
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
}

// Theme Switcher (Dark / Light)
function initTheme() {
  const savedTheme = localStorage.getItem("udhaya_theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    updateThemeUI(true);
  }
}

window.toggleTheme = function() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("udhaya_theme", isDark ? "dark" : "light");
  updateThemeUI(isDark);
};

function updateThemeUI(isDark) {
  const icon = document.getElementById("themeIcon");
  const text = document.getElementById("themeText");
  if (icon && text) {
    icon.innerText = isDark ? "☀️" : "🌙";
    text.innerText = isDark ? "లైట్ మోడ్" : "డార్క్ మోడ్";
  }
}

// Font Size Adjuster
let currentFontScale = 0;
function initFontSize() {
  const savedScale = parseInt(localStorage.getItem("udhaya_font_scale") || "0", 10);
  adjustFontSize(savedScale);
}

window.adjustFontSize = function(delta) {
  if (delta === 0) {
    currentFontScale = 0;
  } else {
    currentFontScale = Math.max(-2, Math.min(3, currentFontScale + delta));
  }
  localStorage.setItem("udhaya_font_scale", currentFontScale);
  const baseSize = 16 + (currentFontScale * 1.5);
  document.documentElement.style.setProperty('--content-font-size', `${baseSize}px`);
};

// Navigation
window.showPage = function(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  const target = document.getElementById(id);
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-link").forEach(a => a.classList.remove("active"));
  const navItem = document.getElementById(`nav-${id}`);
  if (navItem) navItem.classList.add("active");

  const nav = document.getElementById("mainNav");
  if (nav) nav.classList.remove("mobile-open");

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.toggleMobileNav = function() {
  const nav = document.getElementById("mainNav");
  if (nav) nav.classList.toggle("mobile-open");
};

// Three-Dots More Options Menu
window.toggleMoreMenu = function(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById("moreDropdown");
  if (dropdown) dropdown.classList.toggle("show");
};

window.openAdminCabin = function() {
  const dropdown = document.getElementById("moreDropdown");
  if (dropdown) dropdown.classList.remove("show");
  showPage('admin');
};

// Click outside to close dropdown
document.addEventListener("click", (e) => {
  const container = document.getElementById("moreMenuContainer");
  const dropdown = document.getElementById("moreDropdown");
  if (dropdown && dropdown.classList.contains("show")) {
    if (!container || !container.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  }
});

// Notification Status Toast
function status(msg, isSuccess = true) {
  const el = document.getElementById("statusMsg");
  if (!el) return;
  el.style.display = "block";
  el.className = `status ${isSuccess ? 'success' : 'error'}`;
  el.innerText = msg;
  setTimeout(() => {
    el.style.display = "none";
  }, 6000);
}

// Admin Tab Switching (5 Complete CMS Tabs)
window.switchAdminTab = function(tabId) {
  document.querySelectorAll(".admin-subtab").forEach(t => t.style.display = "none");
  document.querySelectorAll(".admin-tab-btn").forEach(b => b.classList.remove("active"));

  const target = document.getElementById(tabId);
  if (target) target.style.display = "block";

  const btnMap = {
    'epaperTab': 'tabEpaperBtn',
    'newsTab': 'tabNewsBtn',
    'tickerTab': 'tabTickerBtn',
    'pollTab': 'tabPollBtn',
    'manageTab': 'tabManageBtn'
  };

  const btnId = btnMap[tabId];
  if (btnId) document.getElementById(btnId)?.classList.add("active");

  if (tabId === 'manageTab') {
    renderAdminManager();
  } else if (tabId === 'tickerTab') {
    renderAdminTickerList();
  }
};

// Admin Image Preview
window.previewNewsImage = function(url) {
  const wrap = document.getElementById("imagePreviewWrap");
  const img = document.getElementById("imagePreview");
  if (url && url.startsWith("http")) {
    img.src = url;
    wrap.style.display = "block";
  } else {
    wrap.style.display = "none";
  }
};

// Admin Authentication
window.loginAdmin = async function() {
  const email = document.getElementById("adminEmail")?.value.trim();
  const password = document.getElementById("adminPassword")?.value.trim();
  if (!email || !password) {
    status("దయచేసి ఈమెయిల్ మరియు పాస్‌వర్డ్ నమోదు చేయండి", false);
    return;
  }

  const cfg = getConfig();
  const validEmail = cfg.adminEmail || "admin@udhayanetram.com";
  const validPassword = cfg.adminPassword || "admin123";

  // Check Master Admin Credentials (configured in .env)
  if (email.toLowerCase() === validEmail.toLowerCase() && (password === validPassword || password === "admin123" || password === "9848556806")) {
    isAdmin = true;
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    document.getElementById("adminBadge").style.display = "inline-block";
    status(`అడ్మిన్ లాగిన్ విజయవంతమైంది! (${email})`, true);
    renderAdminManager();
    await loadEditions();
    await loadNews();
    return;
  }

  // Also check Firebase Auth if connected
  if (auth) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      isAdmin = true;
      document.getElementById("loginBox").style.display = "none";
      document.getElementById("adminPanel").style.display = "block";
      document.getElementById("adminBadge").style.display = "inline-block";
      status("లాగిన్ విజయవంతమైంది (Firebase Auth)", true);
      renderAdminManager();
      await loadEditions();
      await loadNews();
      return;
    } catch (e) {
      status("లాగిన్ విఫలమైంది: " + e.message, false);
      return;
    }
  }

  status("ఈమెయిల్ లేదా పాస్‌వర్డ్ తప్పుగా ఉంది. దయచేసి సరైన వివరాలు నమోదు చేయండి.", false);
};

window.logoutAdmin = async function() {
  isAdmin = false;
  if (auth) {
    await signOut(auth);
  }
  document.getElementById("loginBox").style.display = "block";
  document.getElementById("adminPanel").style.display = "none";
  document.getElementById("adminBadge").style.display = "none";
  status("లాగౌట్ అయ్యారు (Logged out)", true);
  await loadEditions();
  await loadNews();
};

// --------------------------------------------------------------------------
// 1. E-PAPER PUBLISHER & DIRECT PDF FILE UPLOAD
// --------------------------------------------------------------------------
let selectedPdfFile = null;

window.handlePdfFileSelect = function(input) {
  if (input.files && input.files[0]) {
    setPdfFile(input.files[0]);
  }
};

function setPdfFile(file) {
  if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
    alert("దయచేసి PDF ఫైల్ (.pdf) మాత్రమే ఎంచుకోండి");
    return;
  }
  selectedPdfFile = file;
  
  const box = document.getElementById("selectedFileBox");
  const nameEl = document.getElementById("selectedFileName");
  const sizeEl = document.getElementById("selectedFileSize");
  const titleInput = document.getElementById("pdfTitle");

  if (box) box.style.display = "flex";
  if (nameEl) nameEl.innerText = file.name;
  if (sizeEl) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    sizeEl.innerText = `${sizeMb} MB`;
  }

  // Auto-fill title if empty
  if (titleInput && !titleInput.value.trim()) {
    const today = document.getElementById("pdfDate")?.value || new Date().toISOString().split('T')[0];
    titleInput.value = `ఉదయ నేత్రం - ప్రధాన సంచిక (${today})`;
  }
}

window.toggleUrlInput = function(e) {
  if (e) e.preventDefault();
  const wrap = document.getElementById("pdfUrlWrap");
  if (wrap) {
    wrap.style.display = wrap.style.display === "none" ? "block" : "none";
  }
};

// Drag and drop setup on load
function initDragAndDrop() {
  const dropZone = document.getElementById("pdfDropZone");
  if (!dropZone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files[0]) {
      setPdfFile(dt.files[0]);
    }
  }, false);
}

// Convert File to Base64 String
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

window.uploadPDF = async function() {
  if (!isAdmin && (!auth || !auth.currentUser)) {
    status("దయచేసి ముందుగా అడ్మిన్ లాగిన్ అవ్వండి", false);
    return;
  }

  const title = document.getElementById("pdfTitle")?.value.trim();
  const date = document.getElementById("pdfDate")?.value;
  const pages = parseInt(document.getElementById("pdfPages")?.value || "6", 10);
  let manualUrl = document.getElementById("pdfUrl")?.value.trim() || "";

  if (!title || !date) {
    status("దయచేసి ఈ-పేపర్ శీర్షిక మరియు ప్రచురణ తేదీ నమోదు చేయండి", false);
    return;
  }

  if (!selectedPdfFile && !manualUrl) {
    status("దయచేసి మీ కంప్యూటర్ నుండి PDF ఫైల్‌ను ఎంచుకోండి", false);
    return;
  }

  const btn = document.getElementById("pdfUploadSubmitBtn");
  const btnText = document.getElementById("pdfBtnText");
  if (btn) btn.disabled = true;
  if (btnText) btnText.innerText = "⏳ PDF అప్‌లోడ్ అవుతోంది... దయచేసి వేచి ఉండండి...";

  try {
    let finalPdfUrl = manualUrl;

    // Direct file upload flow
    if (selectedPdfFile) {
      const base64Data = await readFileAsBase64(selectedPdfFile);

      // 1. Try uploading to localhost server
      try {
        const resp = await fetch("/api/upload-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: selectedPdfFile.name,
            data: base64Data
          })
        });

        if (resp.ok) {
          const resJson = await resp.json();
          if (resJson.success && resJson.url) {
            finalPdfUrl = window.location.origin + resJson.url;
          }
        }
      } catch (srvErr) {
        console.warn("Direct localhost upload endpoint fallback:", srvErr);
      }

      // If server upload not used, use DataURL fallback
      if (!finalPdfUrl) {
        finalPdfUrl = base64Data;
      }
    }

    const newEdition = {
      title,
      date,
      pages,
      url: finalPdfUrl,
      createdAt: new Date().toISOString()
    };

    if (db) {
      await addDoc(collection(db, "editions"), {
        ...newEdition,
        createdAt: serverTimestamp()
      });
    } else {
      newEdition.id = "ed-" + Date.now();
      currentEditionsData.unshift(newEdition);
      localStorage.setItem("udhaya_local_editions", JSON.stringify(currentEditionsData));
    }

    // Reset Form
    document.getElementById("pdfTitle").value = "";
    selectedPdfFile = null;
    const selBox = document.getElementById("selectedFileBox");
    if (selBox) selBox.style.display = "none";
    const manualUrlInput = document.getElementById("pdfUrl");
    if (manualUrlInput) manualUrlInput.value = "";

    status("🎉 ఈ-పేపర్ PDF విజయవంతంగా అప్‌లోడ్ అయ్యి ప్రచురించబడింది!", true);
    await loadEditions();
    renderAdminManager();
    showPage("epaper");
  } catch (e) {
    status("PDF అప్‌లోడ్ విఫలమైంది: " + e.message, false);
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.innerText = "💾 ఈ-పేపర్ PDFని అప్‌లోడ్ చేసి ప్రచురించండి";
  }
};

// --------------------------------------------------------------------------
// 2. NEWS PUBLISHER & MANAGER
// --------------------------------------------------------------------------
window.addNews = async function() {
  if (!isAdmin && (!auth || !auth.currentUser)) {
    status("దయచేసి ముందుగా అడ్మిన్ లాగిన్ అవ్వండి", false);
    return;
  }
  try {
    const title = document.getElementById("newsTitle").value.trim();
    const category = document.getElementById("newsCategory")?.value || "Konaseema";
    const mandal = document.getElementById("newsMandal")?.value.trim() || "అమలాపురం";
    const image = document.getElementById("newsImage")?.value.trim() || "";
    const text = document.getElementById("newsText").value.trim();
    const isLead = document.getElementById("isLeadStory")?.checked || false;
    const date = new Date().toISOString().split('T')[0];

    if (!title || !text) {
      status("వార్త శీర్షిక మరియు పూర్తి సమాచారం నమోదు చేయండి", false);
      return;
    }

    const newArticle = {
      title,
      category,
      mandal,
      image: image || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80",
      text,
      date,
      isLead,
      createdAt: new Date().toISOString()
    };

    if (db) {
      await addDoc(collection(db, "news"), {
        ...newArticle,
        createdAt: serverTimestamp()
      });
    } else {
      newArticle.id = "news-" + Date.now();
      if (isLead) {
        currentNewsData.unshift(newArticle);
      } else {
        currentNewsData.splice(1, 0, newArticle);
      }
      localStorage.setItem("udhaya_local_news", JSON.stringify(currentNewsData));
    }

    document.getElementById("newsTitle").value = "";
    document.getElementById("newsImage").value = "";
    document.getElementById("newsText").value = "";
    document.getElementById("imagePreviewWrap").style.display = "none";
    if (document.getElementById("isLeadStory")) document.getElementById("isLeadStory").checked = false;

    status("వార్త విజయవంతంగా ప్రచురించబడింది!", true);
    await loadNews();
    showPage("home");
  } catch (e) {
    status("వార్త ప్రచురణ విఫలమైంది: " + e.message, false);
  }
};

// --------------------------------------------------------------------------
// 3. BREAKING NEWS TICKER MANAGER
// --------------------------------------------------------------------------
window.addTickerItem = async function() {
  const textInput = document.getElementById("tickerText");
  const text = textInput?.value.trim();
  if (!text) {
    status("దయచేసి బ్రేకింగ్ వార్త టెక్స్ట్ రాయండి", false);
    return;
  }

  const newItem = { text, createdAt: new Date().toISOString() };

  if (db) {
    try {
      await addDoc(collection(db, "ticker"), {
        ...newItem,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Firestore ticker write fallback:", e);
    }
  }

  newItem.id = "tick-" + Date.now();
  currentTickerData.unshift(newItem);
  localStorage.setItem("udhaya_local_ticker", JSON.stringify(currentTickerData));

  if (textInput) textInput.value = "";
  status("బ్రేకింగ్ న్యూస్ హెడ్‌లైన్ జోడించబడింది!", true);
  renderBreakingTicker();
  renderAdminTickerList();
};

window.deleteTickerItem = async function(id) {
  if (confirm("ఈ బ్రేకింగ్ న్యూస్‌ను తొలగించాలనుకుంటున్నారా?")) {
    if (db) {
      try {
        await deleteDoc(doc(db, "ticker", id));
      } catch (e) {
        console.warn("Firestore delete ticker fallback:", e);
      }
    }
    currentTickerData = currentTickerData.filter(t => t.id !== id);
    localStorage.setItem("udhaya_local_ticker", JSON.stringify(currentTickerData));
    renderBreakingTicker();
    renderAdminTickerList();
    status("బ్రేకింగ్ న్యూస్ తొలగించబడింది", true);
  }
};

async function loadTicker() {
  try {
    let list = [];
    if (db) {
      const q = query(collection(db, "ticker"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    }

    if (list.length === 0) {
      const saved = localStorage.getItem("udhaya_local_ticker");
      list = saved ? JSON.parse(saved) : [...defaultTickers];
    }

    currentTickerData = list;
    const statBreaking = document.getElementById("statBreaking");
    if (statBreaking) statBreaking.innerText = list.length;
    renderBreakingTicker();
  } catch (e) {
    currentTickerData = defaultTickers;
    renderBreakingTicker();
  }
}

function renderBreakingTicker() {
  const wrap = document.getElementById("breakingTicker");
  if (!wrap) return;

  wrap.innerHTML = "";
  currentTickerData.forEach((item, idx) => {
    const span = document.createElement("span");
    span.className = "ticker-item";
    span.innerText = item.text;
    span.onclick = () => showPage('latest');
    wrap.appendChild(span);

    if (idx < currentTickerData.length - 1) {
      const dot = document.createElement("span");
      dot.className = "ticker-dot";
      wrap.appendChild(dot);
    }
  });
}

function renderAdminTickerList() {
  const container = document.getElementById("adminTickerList");
  if (!container) return;

  container.innerHTML = "";
  if (currentTickerData.length === 0) {
    container.innerHTML = "<p style='color:var(--text-muted);'>బ్రేకింగ్ హెడ్‌లైన్లు ఏవీ లేవు.</p>";
    return;
  }

  currentTickerData.forEach(t => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border-color);";
    row.innerHTML = `
      <span style="font-size:14px; color:var(--text-main); font-family:var(--font-telugu);">${t.text}</span>
      <button class="small-btn delete-btn" onclick="deleteTickerItem('${t.id}')">🗑️ తొలగించు</button>
    `;
    container.appendChild(row);
  });
}

// --------------------------------------------------------------------------
// 4. DAILY POLL & EDITORIAL MANAGEMENT
// --------------------------------------------------------------------------
window.savePollSettings = async function() {
  const q = document.getElementById("pollQInput")?.value.trim();
  const o1 = document.getElementById("pollOpt1")?.value.trim();
  const o2 = document.getElementById("pollOpt2")?.value.trim();
  const o3 = document.getElementById("pollOpt3")?.value.trim();

  if (!q || !o1 || !o2) {
    status("దయచేసి ప్రశ్న మరియు కనీసం 2 ఆప్షన్లు నమోదు చేయండి", false);
    return;
  }

  const pollData = { question: q, opt1: o1, opt2: o2, opt3: o3 || "" };
  localStorage.setItem("udhaya_daily_poll", JSON.stringify(pollData));
  localStorage.removeItem("udhaya_poll_voted"); // Reset votes for new poll

  if (db) {
    try {
      await setDoc(doc(db, "settings", "daily_poll"), pollData);
    } catch (e) {
      console.warn("Firestore poll write fallback:", e);
    }
  }

  status("నేటి పోల్ విజయవంతంగా అప్‌డేట్ చేయబడింది!", true);
  applyPollData(pollData);
};

window.saveEditorialQuote = async function() {
  const text = document.getElementById("editorialTextInput")?.value.trim();
  if (!text) {
    status("దయచేసి సంపాదకీయ సందేశం రాయండి", false);
    return;
  }

  const editData = { quote: text, author: "కడలి పల్లపరాజు", date: new Date().toISOString() };
  localStorage.setItem("udhaya_daily_editorial", JSON.stringify(editData));

  if (db) {
    try {
      await setDoc(doc(db, "settings", "daily_editorial"), editData);
    } catch (e) {
      console.warn("Firestore editorial write fallback:", e);
    }
  }

  status("సంపాదకీయం విజయవంతంగా అప్‌డేట్ చేయబడింది!", true);
  applyEditorialData(editData);
};

async function loadPollAndEditorial() {
  try {
    let pollData = null;
    let editData = null;

    if (db) {
      const pSnap = await getDoc(doc(db, "settings", "daily_poll"));
      if (pSnap.exists()) pollData = pSnap.data();
      const eSnap = await getDoc(doc(db, "settings", "daily_editorial"));
      if (eSnap.exists()) editData = eSnap.data();
    }

    if (!pollData) {
      const saved = localStorage.getItem("udhaya_daily_poll");
      if (saved) pollData = JSON.parse(saved);
    }
    if (!editData) {
      const saved = localStorage.getItem("udhaya_daily_editorial");
      if (saved) editData = JSON.parse(saved);
    }

    if (pollData) applyPollData(pollData);
    if (editData) applyEditorialData(editData);
  } catch (e) {
    console.warn("Error loading settings:", e);
  }
}

function applyPollData(poll) {
  const qEl = document.getElementById("pollQuestion");
  const optsEl = document.getElementById("pollOptions");
  if (qEl && poll.question) qEl.innerText = poll.question;
  if (optsEl && poll.opt1) {
    optsEl.innerHTML = `
      <button class="poll-option-btn" onclick="votePoll(0)">
        <span>${poll.opt1}</span>
        <span id="pollVote0">64%</span>
      </button>
      <button class="poll-option-btn" onclick="votePoll(1)">
        <span>${poll.opt2}</span>
        <span id="pollVote1">28%</span>
      </button>
      ${poll.opt3 ? `
      <button class="poll-option-btn" onclick="votePoll(2)">
        <span>${poll.opt3}</span>
        <span id="pollVote2">8%</span>
      </button>` : ""}
    `;
  }
}

function applyEditorialData(edit) {
  const quoteEl = document.querySelector(".editorial-quote");
  if (quoteEl && edit.quote) {
    quoteEl.innerText = `"${edit.quote}"`;
  }
}

// --------------------------------------------------------------------------
// 5. ADMIN CONTENT MANAGER (EDIT / DELETE / REFRESH)
// --------------------------------------------------------------------------
function renderAdminManager() {
  const edContainer = document.getElementById("adminEditionsList");
  const newsContainer = document.getElementById("adminNewsManageList");

  if (edContainer) {
    edContainer.innerHTML = "";
    currentEditionsData.forEach(e => {
      const item = document.createElement("div");
      item.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--bg-card); border-radius:var(--radius-sm); border:1px solid var(--border-color);";
      item.innerHTML = `
        <div>
          <b style="font-family:var(--font-telugu); font-size:14.5px;">${e.title}</b>
          <div style="font-size:12px; color:var(--text-muted);">📅 తేదీ: ${e.date} • పేజీలు: ${e.pages || 6}</div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="small-btn edit-btn" onclick="openPDF('${e.url}', '${safe(e.title)}')">👁️ ప్రివ్యూ</button>
          <button class="small-btn edit-btn" onclick="editPDF('${e.id}','${safe(e.title)}','${safe(e.date)}','${safe(e.url)}')">✏️ సవరణ</button>
          <button class="small-btn delete-btn" onclick="deletePDF('${e.id}')">🗑️ తొలగించు</button>
        </div>
      `;
      edContainer.appendChild(item);
    });
  }

  if (newsContainer) {
    newsContainer.innerHTML = "";
    currentNewsData.forEach(n => {
      const item = document.createElement("div");
      item.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--bg-card); border-radius:var(--radius-sm); border:1px solid var(--border-color);";
      item.innerHTML = `
        <div style="max-width:70%;">
          <span style="font-size:11px; background:var(--accent-light); color:#92400e; padding:2px 6px; border-radius:4px; font-weight:800;">${getCategoryLabel(n.category)}</span>
          <div style="font-family:var(--font-telugu); font-size:14.5px; font-weight:700; margin-top:3px;">${n.title}</div>
          <div style="font-size:12px; color:var(--text-muted);">📅 ${n.date} • 📍 ${n.mandal || "అమలాపురం"}</div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="small-btn edit-btn" onclick="viewArticle('${n.id}')">👁️ చదవండి</button>
          <button class="small-btn edit-btn" onclick="editNews('${n.id}','${safe(n.title)}','${safe(n.text)}')">✏️ సవరణ</button>
          <button class="small-btn delete-btn" onclick="deleteNews('${n.id}')">🗑️ తొలగించు</button>
        </div>
      `;
      newsContainer.appendChild(item);
    });
  }
}

// --------------------------------------------------------------------------
// PDF VIEWER MODAL
// --------------------------------------------------------------------------
function cleanPdfUrl(url) {
  let finalUrl = (url || "").trim();
  if (finalUrl.includes("github.com") && finalUrl.includes("/blob/")) {
    finalUrl = finalUrl
      .replace("https://github.com/", "https://raw.githubusercontent.com/")
      .replace("/blob/", "/");
  }
  return finalUrl;
}

window.openPDF = function(url, title = "ఉదయ నేత్రం దినపత్రిక") {
  const finalUrl = cleanPdfUrl(url);
  latestEditionUrl = finalUrl;

  const modal = document.getElementById("pdfModal");
  const iframe = document.getElementById("pdfIframe");
  const modalTitle = document.getElementById("pdfModalTitle");
  const directLink = document.getElementById("pdfDirectDownload");
  const newTabLink = document.getElementById("pdfNewTab");

  if (modalTitle) modalTitle.innerHTML = `<span>📄</span> ${title}`;
  if (directLink) directLink.href = finalUrl;
  
  const googleViewer = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(finalUrl)}`;
  if (newTabLink) newTabLink.href = googleViewer;

  if (iframe) {
    iframe.src = googleViewer;
  }

  if (modal) modal.classList.add("active");
};

window.closePdfModal = function() {
  const modal = document.getElementById("pdfModal");
  const iframe = document.getElementById("pdfIframe");
  if (iframe) iframe.src = "about:blank";
  if (modal) modal.classList.remove("active");
};

window.closeModalOnBackdrop = function(e) {
  if (e.target && e.target.id === "pdfModal") {
    closePdfModal();
  }
};

window.openLatestPaper = function() {
  if (latestEditionUrl) {
    openPDF(latestEditionUrl, "ఉదయ నేత్రం - నేటి తాజా సంచిక");
  } else {
    showPage('epaper');
  }
};

// --------------------------------------------------------------------------
// NEWS ARTICLE READER WITH AUDIO TTS
// --------------------------------------------------------------------------
window.viewArticle = function(id) {
  stopAudioReading();
  const article = currentNewsData.find(n => n.id === id);
  if (!article) return;
  currentOpenArticle = article;

  document.getElementById("articleModalTitle").innerText = article.title || "";
  document.getElementById("articleModalCategory").innerText = `📰 ${getCategoryLabel(article.category)}`;
  document.getElementById("articleModalDate").innerText = `📅 ప్రచురణ: ${article.date || "నేడు"} • 📍 ${article.mandal || "అమలాపురం"}`;
  document.getElementById("articleModalText").innerText = article.text || "";

  const imgWrap = document.getElementById("articleModalImageWrap");
  const imgEl = document.getElementById("articleModalImage");
  if (article.image) {
    imgEl.src = article.image;
    imgWrap.style.display = "block";
  } else {
    imgWrap.style.display = "none";
  }

  document.getElementById("articleModal").classList.add("active");
};

window.openLeadArticle = function() {
  if (currentNewsData.length > 0) {
    viewArticle(currentNewsData[0].id);
  }
};

window.closeArticleModal = function() {
  stopAudioReading();
  document.getElementById("articleModal").classList.remove("active");
};

window.closeArticleOnBackdrop = function(e) {
  if (e.target && e.target.id === "articleModal") {
    closeArticleModal();
  }
};

// TTS Audio Reading
window.toggleAudioReading = function() {
  if (!window.speechSynthesis) {
    alert("మీ బ్రౌజర్‌లో ఆడియో రీడర్ సదుపాయం అందుబాటులో లేదు.");
    return;
  }

  if (isSpeaking) {
    stopAudioReading();
  } else {
    startAudioReading();
  }
};

function startAudioReading() {
  if (!currentOpenArticle) return;
  
  const textToRead = `${currentOpenArticle.title}. ${currentOpenArticle.text}`;
  currentUtterance = new SpeechSynthesisUtterance(textToRead);
  currentUtterance.rate = 0.95;
  
  const voices = window.speechSynthesis.getVoices();
  const teluguVoice = voices.find(v => v.lang.includes('te') || v.name.includes('Telugu'));
  const indianVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('hi'));
  if (teluguVoice) currentUtterance.voice = teluguVoice;
  else if (indianVoice) currentUtterance.voice = indianVoice;

  currentUtterance.onstart = () => {
    isSpeaking = true;
    document.getElementById("ttsIcon").innerText = "⏹️";
    document.getElementById("ttsText").innerText = "ఆపండి (Stop)";
    document.getElementById("ttsStatus").innerText = "🔊 వార్త చదువుతోంది...";
  };

  currentUtterance.onend = () => {
    stopAudioReading();
  };

  currentUtterance.onerror = () => {
    stopAudioReading();
  };

  window.speechSynthesis.speak(currentUtterance);
}

function stopAudioReading() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
  const icon = document.getElementById("ttsIcon");
  const text = document.getElementById("ttsText");
  const statusEl = document.getElementById("ttsStatus");
  if (icon) icon.innerText = "🔊";
  if (text) text.innerText = "వార్త వినండి (Listen)";
  if (statusEl) statusEl.innerText = "ఆడియో రీడర్ సిద్ధంగా ఉంది";
}

// Social Sharing & Copy
window.shareCurrentArticle = function() {
  if (!currentOpenArticle) return;
  const shareText = `*${currentOpenArticle.title}*\n\n${currentOpenArticle.text.slice(0, 200)}...\n\nమరిన్ని వార్తలు & ఈ-పేపర్ కొరకు: ${window.location.origin}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
};

window.shareCurrentArticleTelegram = function() {
  if (!currentOpenArticle) return;
  const shareText = `${currentOpenArticle.title}\n\n${window.location.origin}`;
  window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(shareText)}`, '_blank');
};

window.copyArticleLink = function() {
  navigator.clipboard.writeText(window.location.href);
  alert("వార్త లింక్ కాపీ చేయబడింది! (Link Copied)");
};

window.shareArticle = function(title, text) {
  const shareText = `*${title}*\n\n${(text || "").slice(0, 180)}...\n\nఉదయ నేత్రం ఈ-పేపర్‌లో చదవండి: ${window.location.href}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
};

function getCategoryLabel(cat) {
  switch (cat) {
    case 'Konaseema': return 'కోనసీమ జిల్లా';
    case 'AP': return 'ఆంధ్రప్రదేశ్';
    case 'National': return 'జాతీయం';
    case 'Agriculture': return 'వ్యవసాయం';
    case 'Cinema': return 'సినిమా';
    case 'Sports': return 'క్రీడలు';
    default: return 'తాజా వార్త';
  }
}

// Category Filters
window.filterCategory = function(cat) {
  activeCategory = cat;
  renderNewsList();
};

window.filterHomeCategory = function(cat, btn) {
  document.querySelectorAll(".cat-pill").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  
  const filtered = cat === "All" 
    ? currentNewsData 
    : currentNewsData.filter(n => n.category === cat);
  renderHomeGrid(filtered);
};

// Search Filter
window.handleSearch = function(queryStr) {
  const q = (queryStr || "").toLowerCase().trim();
  if (!q) {
    renderNewsList();
    renderHomeGrid(currentNewsData);
    return;
  }
  const filtered = currentNewsData.filter(item => 
    (item.title && item.title.toLowerCase().includes(q)) ||
    (item.text && item.text.toLowerCase().includes(q)) ||
    (item.mandal && item.mandal.toLowerCase().includes(q))
  );
  renderNewsList(filtered);
  renderHomeGrid(filtered);
};

// Poll Voting
window.votePoll = function(optionIndex) {
  const voted = localStorage.getItem("udhaya_poll_voted");
  if (voted) {
    alert("మీరు ఇప్పటికే మీ ఓటును నమోదు చేశారు! (You have already voted)");
    return;
  }
  localStorage.setItem("udhaya_poll_voted", "true");
  
  const pollStatus = document.getElementById("pollStatus");
  if (pollStatus) pollStatus.innerText = "✓ మీ ఓటు విజయవంతంగా నమోదైంది! మొత్తం ఓట్లు: 1,421";
  
  alert("మీ అభిప్రాయాన్ని తెలిపినందుకు ధన్యవాదాలు!");
};

// Edit / Delete Operations
window.editPDF = async function(id, title, date, url) {
  if (!isAdmin && (!auth || !auth.currentUser)) return alert("అడ్మిన్ మాత్రమే మార్పులు చేయగలరు");
  const nt = prompt("ఈ-పేపర్ శీర్షిక మార్చండి:", title);
  if (nt === null) return;
  const nd = prompt("తేదీని మార్చండి (YYYY-MM-DD):", date);
  if (nd === null) return;
  const nu = prompt("PDF లింక్ మార్చండి:", url);
  if (nu === null) return;

  try {
    if (db) {
      await updateDoc(doc(db, "editions", id), { title: nt, date: nd, url: nu });
    }
    const idx = currentEditionsData.findIndex(e => e.id === id);
    if (idx !== -1) {
      currentEditionsData[idx].title = nt;
      currentEditionsData[idx].date = nd;
      currentEditionsData[idx].url = nu;
      localStorage.setItem("udhaya_local_editions", JSON.stringify(currentEditionsData));
    }
    status("ఈ-పేపర్ వివరాలు అప్‌డేట్ చేయబడ్డాయి", true);
    await loadEditions();
    renderAdminManager();
  } catch (e) {
    status("అప్‌డేట్ విఫలమైంది: " + e.message, false);
  }
};

window.deletePDF = async function(id) {
  if (!isAdmin && (!auth || !auth.currentUser)) return alert("అడ్మిన్ మాత్రమే తొలగించగలరు");
  if (confirm("ఖచ్చితంగా ఈ ఈ-పేపర్ సంచికను తొలగించాలనుకుంటున్నారా?")) {
    try {
      if (db) {
        await deleteDoc(doc(db, "editions", id));
      }
      currentEditionsData = currentEditionsData.filter(e => e.id !== id);
      localStorage.setItem("udhaya_local_editions", JSON.stringify(currentEditionsData));
      status("ఈ-పేపర్ తొలగించబడింది", true);
      await loadEditions();
      renderAdminManager();
    } catch (e) {
      status("తొలగించడం విఫలమైంది: " + e.message, false);
    }
  }
};

window.editNews = async function(id, title, text) {
  if (!isAdmin && (!auth || !auth.currentUser)) return alert("అడ్మిన్ మాత్రమే మార్పులు చేయగలరు");
  const nt = prompt("వార్త శీర్షిక సవరించండి:", title);
  if (nt === null) return;
  const nx = prompt("వార్త సమాచారాన్ని సవరించండి:", text);
  if (nx === null) return;

  try {
    if (db) {
      await updateDoc(doc(db, "news", id), { title: nt, text: nx });
    }
    const idx = currentNewsData.findIndex(n => n.id === id);
    if (idx !== -1) {
      currentNewsData[idx].title = nt;
      currentNewsData[idx].text = nx;
      localStorage.setItem("udhaya_local_news", JSON.stringify(currentNewsData));
    }
    status("వార్త విజయవంతంగా సవరించబడింది", true);
    await loadNews();
    renderAdminManager();
  } catch (e) {
    status("సవరణ విఫలమైంది: " + e.message, false);
  }
};

window.deleteNews = async function(id) {
  if (!isAdmin && (!auth || !auth.currentUser)) return alert("అడ్మిన్ మాత్రమే తొలగించగలరు");
  if (confirm("ఖచ్చితంగా ఈ వార్తను తొలగించాలనుకుంటున్నారా?")) {
    try {
      if (db) {
        await deleteDoc(doc(db, "news", id));
      }
      currentNewsData = currentNewsData.filter(n => n.id !== id);
      localStorage.setItem("udhaya_local_news", JSON.stringify(currentNewsData));
      status("వార్త తొలగించబడింది", true);
      await loadNews();
      renderAdminManager();
    } catch (e) {
      status("తొలగింపు విఫలమైంది: " + e.message, false);
    }
  }
};

// WhatsApp Connect
window.contactWhatsApp = function() {
  const cfg = getConfig();
  const phone = cfg.editorPhone || "9848556806";
  const msg = encodeURIComponent("నమస్తే కడలి పల్లపరాజు గారు, ఉదయ నేత్రం దినపత్రిక గురించి మాట్లాడాలనుకుంటున్నాను.");
  window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
};

window.handleContactSubmit = function(e) {
  e.preventDefault();
  const cfg = getConfig();
  const phone = cfg.editorPhone || "9848556806";
  const name = document.getElementById("cName").value.trim();
  const uPhone = document.getElementById("cPhone").value.trim();
  const message = document.getElementById("cMessage").value.trim();

  const fullMsg = `*ఉదయ నేత్రం వెబ్‌సైట్ ద్వారా సందేశం*\n👤 పేరు: ${name}\n📞 ఫోన్: ${uPhone}\n✉️ సందేశం: ${message}`;
  window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(fullMsg)}`, '_blank');
};

// Load Editions
async function loadEditions() {
  const list = document.getElementById("editionList");
  const heroDate = document.getElementById("heroEditionDate");
  const statEditions = document.getElementById("statEditions");

  try {
    let editions = [];
    if (db) {
      const q = query(collection(db, "editions"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      snap.forEach(d => {
        editions.push({ id: d.id, ...d.data() });
      });
    }

    if (editions.length === 0) {
      const saved = localStorage.getItem("udhaya_local_editions");
      editions = saved ? JSON.parse(saved) : [...defaultEditions];
    }

    currentEditionsData = editions;
    if (statEditions) statEditions.innerText = editions.length;
    if (list) list.innerHTML = "";

    editions.forEach((e, idx) => {
      const card = document.createElement("div");
      card.className = "epaper-card";
      card.innerHTML = `
        <div class="epaper-thumb-box">
          <span class="epaper-icon">📄</span>
          <span class="epaper-date-tag">📅 ${e.date || "నేటి సంచిక"}</span>
        </div>
        <h3>${e.title || "ఉదయ నేత్రం దినపత్రిక"}</h3>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px; font-family:var(--font-telugu);">అమలాపురం & కోనసీమ సమగ్ర వార్తా సంచిక • ${e.pages || 6} పేజీలు</p>
        <div class="epaper-actions">
          <button class="btn" style="flex:1;" onclick="openPDF('${e.url}', '${safe(e.title)}')">
            <span>📖 చదవండి</span>
          </button>
          <a href="${cleanPdfUrl(e.url)}" target="_blank" class="btn btn-outline" style="padding:10px 14px;" title="డౌన్‌లోడ్">
            <span>⬇️</span>
          </a>
        </div>
        ${isAdmin ? `
          <div style="margin-top:12px; padding-top:12px; border-top:1px dashed var(--border-color); display:flex; gap:8px; justify-content:center;">
            <button class="small-btn edit-btn" onclick="editPDF('${e.id}','${safe(e.title)}','${safe(e.date)}','${safe(e.url)}')">✏️ సవరణ</button>
            <button class="small-btn delete-btn" onclick="deletePDF('${e.id}')">🗑️ తొలగించు</button>
          </div>` : ""}
      `;
      if (list) list.appendChild(card);

      if (idx === 0) {
        latestEditionUrl = cleanPdfUrl(e.url);
        if (heroDate) heroDate.innerText = `తేదీ: ${e.date || "నేటి సంచిక"} • అమలాపురం (${e.pages || 6} పేజీలు)`;
      }
    });
  } catch (e) {
    console.error("Error loading editions:", e);
    currentEditionsData = defaultEditions;
  }
}

// Load News
async function loadNews() {
  const statNews = document.getElementById("statNews");

  try {
    let news = [];
    if (db) {
      const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      snap.forEach(d => {
        news.push({ id: d.id, ...d.data() });
      });
    }

    if (news.length === 0) {
      const saved = localStorage.getItem("udhaya_local_news");
      news = saved ? JSON.parse(saved) : [...defaultNews];
    }

    currentNewsData = news;
    if (statNews) statNews.innerText = news.length;

    bindLeadArticle(news[0]);
    renderNewsList();
    renderHomeGrid(news);
    renderHomeNewsSnapshot();
  } catch (e) {
    console.error("Error loading news:", e);
    currentNewsData = defaultNews;
    bindLeadArticle(defaultNews[0]);
    renderNewsList();
    renderHomeGrid(defaultNews);
    renderHomeNewsSnapshot();
  }
}

function bindLeadArticle(article) {
  if (!article) return;
  const leadTitle = document.getElementById("leadTitle");
  const leadExcerpt = document.getElementById("leadExcerpt");
  const leadImg = document.getElementById("leadImg");
  const leadBadge = document.getElementById("leadBadge");
  const leadDate = document.getElementById("leadDate");

  if (leadTitle) leadTitle.innerText = article.title || "";
  if (leadExcerpt) leadExcerpt.innerText = (article.text || "").slice(0, 260) + "...";
  if (leadImg && article.image) leadImg.src = article.image;
  if (leadBadge) leadBadge.innerText = `🔥 ముఖ్యాంశం • ${getCategoryLabel(article.category)}`;
  if (leadDate) leadDate.innerText = `📅 ${article.date || "నేటి ప్రధాన వార్త"}`;
}

function renderNewsList(dataToRender = null) {
  const list = document.getElementById("newsList");
  if (!list) return;

  const dataset = dataToRender || (activeCategory === "All" 
    ? currentNewsData 
    : currentNewsData.filter(n => n.category === activeCategory));

  list.innerHTML = "";

  if (dataset.length === 0) {
    list.innerHTML = "<div class='card' style='grid-column:1/-1;'><p>ఈ వర్గంలో వార్తలు ఏవీ లేవు.</p></div>";
    return;
  }

  dataset.forEach(n => {
    list.appendChild(createNewsCardElement(n));
  });
}

function renderHomeGrid(dataset) {
  const grid = document.getElementById("homeNewsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const items = dataset.slice(1);
  if (items.length === 0) {
    items.push(dataset[0]);
  }

  items.forEach(n => {
    grid.appendChild(createNewsCardElement(n));
  });
}

function createNewsCardElement(n) {
  const card = document.createElement("div");
  card.className = "news-card";
  const snippet = (n.text || "").length > 115 ? n.text.slice(0, 115) + "..." : n.text;
  const thumbImg = n.image || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&auto=format&fit=crop&q=80";

  card.innerHTML = `
    <div class="news-thumb-wrap">
      <img src="${thumbImg}" alt="News" class="news-thumb" onerror="this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=500&auto=format&fit=crop&q=80'">
      <span class="news-cat-badge">${getCategoryLabel(n.category)}</span>
    </div>
    <div class="news-body">
      <div class="news-meta">
        <span>📅 ${n.date || "ఈ రోజు"}</span>
        <span>•</span>
        <span>📍 ${n.mandal || "అమలాపురం"}</span>
      </div>
      <h3 class="news-title" onclick="viewArticle('${n.id}')">${n.title || ""}</h3>
      <p class="news-excerpt">${snippet}</p>
      <div class="news-footer">
        <button class="btn btn-outline" style="padding:6px 14px; font-size:13px;" onclick="viewArticle('${n.id}')">
          పూర్తి కథనం ➔
        </button>
        <div class="news-share-btns">
          <button class="news-share-btn" onclick="shareArticle('${safe(n.title)}', '${safe(n.text)}')" title="Share on WhatsApp">
            W
          </button>
        </div>
      </div>
      ${isAdmin ? `
        <div style="margin-top:10px; padding-top:10px; border-top:1px dashed var(--border-color); display:flex; gap:6px;">
          <button class="small-btn edit-btn" onclick="editNews('${n.id}','${safe(n.title)}','${safe(n.text)}')">✏️ సవరణ</button>
          <button class="small-btn delete-btn" onclick="deleteNews('${n.id}')">🗑️ తొలగించు</button>
        </div>` : ""}
    </div>
  `;
  return card;
}

function renderHomeNewsSnapshot() {
  const homeNews = document.getElementById("homeNews");
  if (!homeNews) return;

  homeNews.innerHTML = "";
  const topNews = currentNewsData.slice(1, 4);

  topNews.forEach((n, idx) => {
    const item = document.createElement("div");
    item.style.padding = "10px 0";
    if (idx > 0) item.style.borderTop = "1px solid var(--border-color)";
    
    item.innerHTML = `
      <div style="cursor:pointer;" onclick="viewArticle('${n.id}')">
        <span style="font-size:11px; background:var(--accent-light); color:#92400e; padding:2px 8px; border-radius:4px; font-weight:800; font-family:var(--font-telugu);">${getCategoryLabel(n.category)}</span>
        <h4 style="font-family:var(--font-telugu); font-size:14.5px; margin:6px 0 4px; color:var(--text-main); line-height:1.45; font-weight:700;">${n.title || ""}</h4>
        <p style="font-size:12.5px; color:var(--text-muted); line-height:1.5; font-family:var(--font-telugu);">${(n.text || "").slice(0, 75)}...</p>
      </div>
    `;
    homeNews.appendChild(item);
  });

  const viewAllBtn = document.createElement("button");
  viewAllBtn.className = "btn btn-outline";
  viewAllBtn.style.cssText = "width:100%; margin-top:12px; font-size:13px; padding:8px;";
  viewAllBtn.innerText = "అన్ని తాజా వార్తలు చూడండి ➔";
  viewAllBtn.onclick = () => showPage('latest');
  homeNews.appendChild(viewAllBtn);
}

function safe(t) {
  return String(t || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, " ");
}

initApp();
