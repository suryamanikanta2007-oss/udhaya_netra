/* ==========================================================================
   UDHAYA NETRAM (ఉదయ నేత్రం) - Application Core & Daily Publishing Engine
   Includes:
   - Secure Server-Side JWT Authentication & Protected REST API CRUD
   - Real Data Loading with Resilient Fallback & Graceful Empty States
   - Category Archive Pages with Multi-Page Pagination
   - Dynamic NewsArticle JSON-LD & SEO Meta Tag Injector
   - Universal WhatsApp Share on all articles and modals
   - Telugu TTS Speech Reader & Accessibility Keyboard Controls
   - Dark/Light Mode, Font Scaling & E-Paper Modal Viewer
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
let authToken = localStorage.getItem("udhaya_admin_token") || sessionStorage.getItem("udhaya_admin_token") || "";
let currentNewsData = [];
let currentEditionsData = [];
let currentTickerData = [];
let activeCategory = "All";
let currentPage = 1;
const ITEMS_PER_PAGE = 6;
let latestEditionUrl = "";
let currentOpenArticle = null;
let currentUtterance = null;
let isSpeaking = false;

// Default Telugu Starter Dataset (used when server/network is offline)
const defaultNews = [
  {
    id: "lead-1",
    title: "అమలాపురంలో ఘనంగా ప్రారంభమైన ఉదయ నేత్రం దినపత్రిక సేవలు - ప్రజా సమస్యలపై ప్రత్యేక కథనాలు",
    text: "డాక్టర్ బి.ఆర్. అంబేద్కర్ కోనసీమ జిల్లా కేంద్రం అమలాపురంలో ఉదయ నేత్రం తెలుగు డిజిటల్ దినపత్రిక నూతన ఎడిషన్ ఆవిష్కరణ కార్యక్రమం ఘనంగా జరిగింది.\n\nసంపాదకుడు కడలి పల్లపరాజు మాట్లాడుతూ.. ప్రజల సమస్యలు, అభివృద్ధి, వాస్తవాలను వెలుగులోకి తేవడమే పత్రిక ప్రధాన లక్ష్యమని పేర్కొన్నారు. గ్రామాల్లోని రైతుల సమస్యలు, యువత ఉపాధి, విద్యా వైద్య రంగాల సమస్యలపై ప్రత్యేక పరిశోధనాత్మక కథనాలు ప్రచురించనున్నట్లు తెలిపారు.\n\nకోనసీమ ప్రాంతంలోని ప్రతీ పల్లెకు నిష్పక్షపాత వార్తలను చేరవేస్తూ, ప్రజల పక్షాన నిలిచి పోరాడతామని ఆయన స్పష్టం చేశారు. ఈ కార్యక్రమంలో పలువురు ప్రముఖ జర్నలిస్టులు, సామాజిక కార్యకర్తలు పాల్గొని శుభాకాంక్షలు తెలిపారు.",
    category: "Konaseema",
    mandal: "అమలాపురం",
    image: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1000&auto=format&fit=crop&q=80",
    date: new Date().toISOString().split('T')[0],
    isLead: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "news-2",
    title: "కోనసీమలో గోదావరి డెల్టా రైతుల సంబరాలు - ఖరీఫ్ సాగునీటి విడుదల వేగవంతం",
    text: "కోనసీమ వ్యాప్తంగా ఖరీఫ్ సాగు పనులకు కాలువల ద్వారా సాగునీరు సమృద్ధిగా సరఫరా అవుతుండటంతో రైతులు హర్షం వ్యక్తం చేస్తున్నారు.\n\nఅమలాపురం, కొత్తపేట, ముమ్మిడివరం నియోజకవర్గాల్లోని వరి నాట్లు చురుగ్గా సాగుతున్నాయి. ఎరువులు, విత్తనాలు అందుబాటులో ఉంచేలా వ్యవసాయ శాఖ అధికారులు ప్రత్యేక పర్యవేక్షణ చేపట్టారు. చివరి ఆయకట్టు రైతులకు కూడా సాగునీరు అందేలా ఇరిగేషన్ శాఖ పటిష్ట చర్యలు చేపట్టింది.",
    category: "Agriculture",
    mandal: "కొత్తపేట",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80",
    date: new Date().toISOString().split('T')[0],
    isLead: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "news-3",
    title: "ఆంధ్రప్రదేశ్‌లో నూతన పారిశ్రామిక & మౌలిక సదుపాయాల అభివృద్ధి ప్రాజెక్టులకు శ్రీకారం",
    text: "రాష్ట్రంలో యువతకు విస్తృత ఉద్యోగ అవకాశాలు కల్పించేందుకు నూతన పారిశ్రామిక కారిడార్ల అభివృద్ధికి ప్రత్యేక చర్యలు చేపడుతున్నారు.\n\nరహదారుల విస్తరణ, పోర్టు ఆధారిత పరిశ్రమల ఏర్పాటు పనులు వేగవంతం అయ్యాయి. రాష్ట్రవ్యాప్తంగా నైపుణ్యాభివృద్ధి కేంద్రాలు ఏర్పాటు చేసి స్థానిక యువతకు ఉపాధి అవకాశాలు మెరుగుపరుస్తామని ప్రభుత్వం వెల్లడించింది.",
    category: "AP",
    mandal: "ఆంధ్రప్రదేశ్",
    image: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80",
    date: new Date().toISOString().split('T')[0],
    isLead: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "news-4",
    title: "జాతీయ స్థాయిలో డిజిటల్ మీడియా & గ్రామీణ వార్తా విప్లవం",
    text: "దేశవ్యాప్తంగా ప్రాంతీయ భాషల్లో డిజిటల్ దినపత్రికలకు ఆదరణ పెరుగుతోంది. సాంకేతిక పరిజ్ఞానంతో క్షణాల్లో వార్తలను చదువరులకు చేరవేస్తూ ఉదయ నేత్రం అగ్రగామిగా నిలుస్తోంది.\n\nమొబైల్ ఫోన్లలోనే ఈ-పేపర్ చదివే సౌకర్యం కల్పించడంతో పల్లెల నుంచి నగరాల వరకు పాఠకులు విశేష ఆదరణ చూపుతున్నారు.",
    category: "National",
    mandal: "జాతీయం",
    image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80",
    date: new Date().toISOString().split('T')[0],
    isLead: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "news-5",
    title: "టాలీవుడ్ తాజా చిత్ర విశేషాలు - గోదావరి అందాలలో షూటింగ్ సందడి",
    text: "కోనసీమ అందమైన లొకేషన్లలో పలు ప్రముఖ తెలుగు చిత్రాల చిత్రీకరణ జరుగుతోంది.\n\nఅమలాపురం, అంతర్వేది, దిండి రిసార్ట్స్ పరిసర ప్రాంతాలలో సినిమా యూనిట్ల సందడి నెలకొంది. స్థానిక కళాకారులు, సాంకేతిక నిపుణులకు ఉపాధి అవకాశాలు లభిస్తున్నాయి.",
    category: "Cinema",
    mandal: "రాజోలు",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
    date: new Date().toISOString().split('T')[0],
    isLead: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "news-6",
    title: "అంతర్వేది లక్ష్మీ నరసింహ స్వామి ఆలయంలో విశేష పూజలు - భక్తుల రద్దీ",
    text: "ప్రసిద్ధ పుణ్యక్షేత్రం అంతర్వేది శ్రీ లక్ష్మీ నరసింహ స్వామి దేవాలయంలో నేడు భక్తుల రద్దీ నెలకొంది.\n\nసాగర సంగమ స్నానాలు ఆచరించి స్వామివారిని దర్శించుకునేందుకు వేలాదిగా భక్తులు తరలివచ్చారు. ఆలయ అధికారులు భక్తులకు విస్తృత ఏర్పాట్లు చేశారు.",
    category: "Konaseema",
    mandal: "సఖినేటిపల్లి",
    image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&auto=format&fit=crop&q=80",
    date: new Date().toISOString().split('T')[0],
    isLead: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "news-7",
    title: "ఆంధ్రప్రదేశ్ విద్యా రంగంలో డిజిటల్ తరగతులు - విద్యార్థులకు అత్యాధునిక సౌకర్యాలు",
    text: "ప్రభుత్వ పాఠశాలల్లో డిజిటల్ విద్యా విధానాన్ని మరింత బలోపేతం చేసేందుకు చర్యలు ముమ్మరం అయ్యాయి.\n\nకోనసీమ జిల్లాలోని పాఠశాలల్లో ఇంటరాక్టివ్ ఫ్లాట్ ప్యానెల్స్ ద్వారా పాఠ్యాంశాల బోధన జరుగుతోంది.",
    category: "AP",
    mandal: "రాయవరం",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80",
    date: new Date().toISOString().split('T')[0],
    isLead: false,
    createdAt: new Date().toISOString()
  }
];

const defaultEditions = [
  {
    id: "epaper-main-1",
    title: "ఉదయ నేత్రం - ప్రధాన సంచిక (కోనసీమ & అమలాపురం)",
    date: new Date().toISOString().split('T')[0],
    pages: 6,
    url: "UDHATA NETRAM 26-06-2026.pdf",
    createdAt: new Date().toISOString()
  },
  {
    id: "epaper-main-2",
    title: "ఉదయ నేత్రం - దినపత్రిక సంచిక (25-06-2026)",
    date: "2026-06-25",
    pages: 6,
    url: "UDHAYA NETRAM 25-06-2026.....pdf",
    createdAt: new Date().toISOString()
  }
];

const defaultTickers = [
  { id: "tick-1", text: "⚡ ఉదయ నేత్రం డైలీ తెలుగు ఈ-పేపర్‌కు స్వాగతం!" },
  { id: "tick-2", text: "📰 కోనసీమ, అమలాపురం మరియు ఆంధ్రప్రదేశ్ తాజా వార్తలు ప్రతిరోజూ ఉదయం మీ చేతుల్లో!" },
  { id: "tick-3", text: "✨ సత్యం, ధైర్యం, నిష్పక్షపాత వార్తలకు చిరునామా ఉదయ నేత్రం!" },
  { id: "tick-4", text: "📞 ప్రకటనలు & వార్తలకు సంప్రదించండి: 9848556806" }
];

// --------------------------------------------------------------------------
// 1. APP INITIALIZATION & BOOTSTRAPPER
// --------------------------------------------------------------------------
async function initApp() {
  initTheme();
  initFontSize();
  updateLiveDate();
  setupKeyboardAccessibility();

  const config = await loadAppConfig();
  
  // Verify existing session with server if token exists
  if (authToken) {
    await verifyAdminSession();
  }

  // Optional Firebase initialization
  if (config.firebase && config.firebase.apiKey && !config.firebase.apiKey.includes("your_")) {
    try {
      app = initializeApp(config.firebase);
      db = getFirestore(app);
      auth = getAuth(app);

      onAuthStateChanged(auth, async user => {
        if (user && !isAdmin) {
          isAdmin = true;
          updateAdminUI(true);
        }
      });
    } catch (err) {
      console.info("Firebase offline fallback active:", err);
    }
  }

  // Load all data immediately from local server/storage
  await Promise.all([
    loadEditions(),
    loadNews(),
    loadTicker(),
    loadPollAndEditorial()
  ]);

  initDragAndDrop();
  handleHashNavigation();
  window.addEventListener("hashchange", handleHashNavigation);
}

// --------------------------------------------------------------------------
// 2. SERVER-SIDE AUTHENTICATION & SESSION MANAGEMENT
// --------------------------------------------------------------------------
async function verifyAdminSession() {
  try {
    const res = await fetch("/api/auth/verify", {
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.valid) {
        isAdmin = true;
        updateAdminUI(true);
        return;
      }
    }
  } catch (e) {
    console.warn("Session verification offline check:", e);
  }
  // If invalid or network failed with bad auth
  if (!isAdmin && authToken) {
    // Keep local session if previously verified in local mode
  }
}

function updateAdminUI(loggedIn) {
  const loginBox = document.getElementById("loginBox");
  const adminPanel = document.getElementById("adminPanel");
  const adminBadge = document.getElementById("adminBadge");

  if (loginBox) loginBox.style.display = loggedIn ? "none" : "block";
  if (adminPanel) adminPanel.style.display = loggedIn ? "block" : "none";
  if (adminBadge) adminBadge.style.display = loggedIn ? "inline-block" : "none";

  if (loggedIn) {
    renderAdminManager();
  }
}

window.loginAdmin = async function() {
  const email = document.getElementById("adminEmail")?.value.trim();
  const password = document.getElementById("adminPassword")?.value.trim();
  const remember = document.getElementById("rememberMe")?.checked;

  if (!email || !password) {
    status("దయచేసి ఈమెయిల్ మరియు పాస్‌వర్డ్ నమోదు చేయండి", false);
    return;
  }

  const btn = document.getElementById("loginSubmitBtn");
  if (btn) btn.disabled = true;

  try {
    // 1. Try Server-Side Secure Authentication
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.token) {
        authToken = data.token;
        if (remember) {
          localStorage.setItem("udhaya_admin_token", authToken);
        } else {
          sessionStorage.setItem("udhaya_admin_token", authToken);
        }
        isAdmin = true;
        updateAdminUI(true);
        status(`🎉 అడ్మిన్ లాగిన్ విజయవంతమైంది! (${data.user?.email || email})`, true);
        await loadEditions();
        await loadNews();
        return;
      }
    } else {
      const errData = await response.json().catch(() => ({}));
      if (errData.message) {
        status(errData.message, false);
        return;
      }
    }
  } catch (err) {
    console.warn("Server auth endpoint unavailable, checking fallback:", err);
  } finally {
    if (btn) btn.disabled = false;
  }

  // 2. Firebase Auth Fallback (if server unavailable and Firebase configured)
  if (auth) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      isAdmin = true;
      updateAdminUI(true);
      status("లాగిన్ విజయవంతమైంది (Firebase Auth)", true);
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
  authToken = "";
  localStorage.removeItem("udhaya_admin_token");
  sessionStorage.removeItem("udhaya_admin_token");

  if (auth) {
    await signOut(auth).catch(() => {});
  }

  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (e) {}

  updateAdminUI(false);
  status("లాగౌట్ అయ్యారు (Logged out successfully)", true);
  await loadEditions();
  await loadNews();
};

function getAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  return headers;
}

// --------------------------------------------------------------------------
// 3. SECURE CONTENT PUBLISHING & CRUD OPERATIONS
// --------------------------------------------------------------------------

// 3.1 E-Paper PDF Upload & Publish
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

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

window.uploadPDF = async function() {
  if (!isAdmin) {
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

    if (selectedPdfFile) {
      const base64Data = await readFileAsBase64(selectedPdfFile);

      try {
        const resp = await fetch("/api/upload-pdf", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            filename: selectedPdfFile.name,
            data: base64Data
          })
        });

        if (resp.ok) {
          const resJson = await resp.json();
          if (resJson.success && resJson.url) {
            finalPdfUrl = resJson.url;
          }
        }
      } catch (srvErr) {
        console.warn("Direct upload fallback:", srvErr);
      }

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

    // 1. Post to Server REST API
    let saved = false;
    try {
      const postRes = await fetch("/api/editions", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newEdition)
      });
      if (postRes.ok) saved = true;
    } catch (e) {}

    // 2. Firebase fallback
    if (!saved && db) {
      await addDoc(collection(db, "editions"), {
        ...newEdition,
        createdAt: serverTimestamp()
      });
      saved = true;
    }

    // 3. LocalStorage fallback
    if (!saved) {
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

window.deletePDF = async function(id) {
  if (!confirm("ఈ సంచికను ఖచ్చితంగా తొలగించాలనుకుంటున్నారా?")) return;
  if (!isAdmin) {
    status("Unauthorized. Admin privileges required.", false);
    return;
  }

  try {
    let deleted = false;
    try {
      const res = await fetch(`/api/editions/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) deleted = true;
    } catch (e) {}

    if (!deleted && db) {
      try {
        await deleteDoc(doc(db, "editions", id));
        deleted = true;
      } catch (e) {}
    }

    currentEditionsData = currentEditionsData.filter(e => e.id !== id);
    localStorage.setItem("udhaya_local_editions", JSON.stringify(currentEditionsData));

    status("సంచిక తొలగించబడింది", true);
    await loadEditions();
    renderAdminManager();
  } catch (e) {
    status("తొలగింపు విఫలమైంది: " + e.message, false);
  }
};

// 3.2 News Article Publishing & Editing
window.addNews = async function() {
  if (!isAdmin) {
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

    let saved = false;
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newArticle)
      });
      if (res.ok) saved = true;
    } catch (e) {}

    if (!saved && db) {
      await addDoc(collection(db, "news"), {
        ...newArticle,
        createdAt: serverTimestamp()
      });
      saved = true;
    }

    if (!saved) {
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
    const previewWrap = document.getElementById("imagePreviewWrap");
    if (previewWrap) previewWrap.style.display = "none";
    if (document.getElementById("isLeadStory")) document.getElementById("isLeadStory").checked = false;

    status("🎉 వార్త విజయవంతంగా ప్రచురించబడింది!", true);
    await loadNews();
    renderAdminManager();
    showPage("home");
  } catch (e) {
    status("వార్త ప్రచురణ విఫలమైంది: " + e.message, false);
  }
};

window.deleteNews = async function(id) {
  if (!confirm("ఈ వార్తను ఖచ్చితంగా తొలగించాలనుకుంటున్నారా?")) return;
  if (!isAdmin) {
    status("Unauthorized", false);
    return;
  }
  try {
    let deleted = false;
    try {
      const res = await fetch(`/api/news/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) deleted = true;
    } catch (e) {}

    if (!deleted && db) {
      try {
        await deleteDoc(doc(db, "news", id));
        deleted = true;
      } catch (e) {}
    }

    currentNewsData = currentNewsData.filter(n => n.id !== id);
    localStorage.setItem("udhaya_local_news", JSON.stringify(currentNewsData));

    status("వార్త తొలగించబడింది", true);
    await loadNews();
    renderAdminManager();
  } catch (e) {
    status("తొలగింపు విఫలమైంది: " + e.message, false);
  }
};

window.editNews = function(id, currentTitle, currentText) {
  const newTitle = prompt("వార్త శీర్షికను సవరించండి:", currentTitle);
  if (newTitle === null || !newTitle.trim()) return;
  const newText = prompt("వార్త పూర్తి సమాచారాన్ని సవరించండి:", currentText);
  if (newText === null || !newText.trim()) return;

  updateNewsContent(id, newTitle.trim(), newText.trim());
};

async function updateNewsContent(id, title, text) {
  try {
    let updated = false;
    try {
      const res = await fetch(`/api/news/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, text })
      });
      if (res.ok) updated = true;
    } catch (e) {}

    if (!updated && db) {
      try {
        await updateDoc(doc(db, "news", id), { title, text, updatedAt: serverTimestamp() });
        updated = true;
      } catch (e) {}
    }

    const idx = currentNewsData.findIndex(n => n.id === id);
    if (idx !== -1) {
      currentNewsData[idx].title = title;
      currentNewsData[idx].text = text;
      localStorage.setItem("udhaya_local_news", JSON.stringify(currentNewsData));
    }

    status("వార్త వివరాలు విజయవంతంగా అప్‌డేట్ చేయబడ్డాయి!", true);
    await loadNews();
    renderAdminManager();
  } catch (e) {
    status("సవరణ విఫలమైంది: " + e.message, false);
  }
}

// 3.3 Ticker Items Management
window.addTickerItem = async function() {
  const textInput = document.getElementById("tickerText");
  const text = textInput?.value.trim();
  if (!text) {
    status("దయచేసి బ్రేకింగ్ వార్త టెక్స్ట్ రాయండి", false);
    return;
  }

  const newItem = { text, createdAt: new Date().toISOString() };

  let saved = false;
  try {
    const res = await fetch("/api/ticker", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(newItem)
    });
    if (res.ok) saved = true;
  } catch (e) {}

  if (!saved && db) {
    try {
      await addDoc(collection(db, "ticker"), { ...newItem, createdAt: serverTimestamp() });
      saved = true;
    } catch (e) {}
  }

  if (!saved) {
    newItem.id = "tick-" + Date.now();
    currentTickerData.unshift(newItem);
    localStorage.setItem("udhaya_local_ticker", JSON.stringify(currentTickerData));
  }

  if (textInput) textInput.value = "";
  status("బ్రేకింగ్ న్యూస్ హెడ్‌లైన్ జోడించబడింది!", true);
  await loadTicker();
};

window.deleteTickerItem = async function(id) {
  if (!confirm("ఈ బ్రేకింగ్ న్యూస్‌ను తొలగించాలనుకుంటున్నారా?")) return;
  try {
    let deleted = false;
    try {
      const res = await fetch(`/api/ticker/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) deleted = true;
    } catch (e) {}

    if (!deleted && db) {
      try {
        await deleteDoc(doc(db, "ticker", id));
        deleted = true;
      } catch (e) {}
    }

    currentTickerData = currentTickerData.filter(t => t.id !== id);
    localStorage.setItem("udhaya_local_ticker", JSON.stringify(currentTickerData));

    status("బ్రేకింగ్ న్యూస్ తొలగించబడింది", true);
    await loadTicker();
  } catch (e) {
    status("తొలగింపు విఫలమైంది: " + e.message, false);
  }
};

// 3.4 Poll & Editorial Management
window.savePollSettings = async function() {
  const q = document.getElementById("pollQInput")?.value.trim();
  const o1 = document.getElementById("pollOpt1")?.value.trim();
  const o2 = document.getElementById("pollOpt2")?.value.trim();
  const o3 = document.getElementById("pollOpt3")?.value.trim();

  if (!q || !o1 || !o2) {
    status("దయచేసి ప్రశ్న మరియు కనీసం 2 ఆప్షన్లు నమోదు చేయండి", false);
    return;
  }

  const pollData = { question: q, opt1: o1, opt2: o2, opt3: o3 || "", votes: [0, 0, 0], totalVotes: 0 };
  localStorage.removeItem("udhaya_poll_voted");

  try {
    await fetch("/api/poll", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(pollData)
    });
  } catch (e) {}

  if (db) {
    try {
      await setDoc(doc(db, "settings", "daily_poll"), pollData);
    } catch (e) {}
  }

  localStorage.setItem("udhaya_daily_poll", JSON.stringify(pollData));
  status("🎉 నేటి పోల్ విజయవంతంగా అప్‌డేట్ చేయబడింది!", true);
  applyPollData(pollData);
};

window.saveEditorialQuote = async function() {
  const text = document.getElementById("editorialTextInput")?.value.trim();
  if (!text) {
    status("దయచేసి సంపాదకీయ సందేశం రాయండి", false);
    return;
  }

  const editData = {
    quote: text,
    author: "కడలి పల్లపరాజు",
    designation: "సంపాదకుడు & ప్రచురణకర్త • ఉదయ నేత్రం",
    date: new Date().toISOString().split('T')[0]
  };

  try {
    await fetch("/api/editorial", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(editData)
    });
  } catch (e) {}

  if (db) {
    try {
      await setDoc(doc(db, "settings", "daily_editorial"), editData);
    } catch (e) {}
  }

  localStorage.setItem("udhaya_daily_editorial", JSON.stringify(editData));
  status("సంపాదకీయం విజయవంతంగా అప్‌డేట్ చేయబడింది!", true);
  applyEditorialData(editData);
};

// --------------------------------------------------------------------------
// 4. DATA LOADERS & ROBUST RENDERING (NO INFINITE LOADERS)
// --------------------------------------------------------------------------

// 4.1 Load Editions
async function loadEditions() {
  const list = document.getElementById("editionList");
  const heroDate = document.getElementById("heroEditionDate");
  const statEditions = document.getElementById("statEditions");

  let editions = [];

  // Try Server API
  try {
    const res = await fetch("/api/editions", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        editions = json.data;
      }
    }
  } catch (e) {}

  // Fallback to LocalStorage / default
  if (editions.length === 0) {
    const saved = localStorage.getItem("udhaya_local_editions");
    editions = saved ? JSON.parse(saved) : [...defaultEditions];
  }

  currentEditionsData = editions;
  if (statEditions) statEditions.innerText = editions.length;

  if (list) {
    list.innerHTML = "";
    if (editions.length === 0) {
      list.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon">📄</div>
          <h3>ప్రస్తుతం ఈ-పేపర్ సంచికలు ఏవీ అందుబాటులో లేవు</h3>
          <p>దయచేసి కొద్ది సమయం తర్వాత మళ్ళీ ప్రయత్నించండి.</p>
          <button class="btn btn-gold" onclick="loadEditions()">🔄 రీఫ్రెష్ చేయండి</button>
        </div>
      `;
      return;
    }

    editions.forEach((e, idx) => {
      const card = document.createElement("div");
      card.className = "epaper-card";
      card.innerHTML = `
        <div class="epaper-thumb-box">
          <span class="epaper-icon" aria-hidden="true">📄</span>
          <span class="epaper-date-tag">📅 ${e.date || "నేటి సంచిక"}</span>
        </div>
        <h3>${e.title || "ఉదయ నేత్రం దినపత్రిక"}</h3>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px; font-family:var(--font-telugu);">అమలాపురం & కోనసీమ సమగ్ర వార్తా సంచిక • ${e.pages || 6} పేజీలు</p>
        <div class="epaper-actions">
          <button class="btn" style="flex:1;" onclick="openPDF('${e.url}', '${safe(e.title)}')">
            <span>📖 చదవండి</span>
          </button>
          <a href="${cleanPdfUrl(e.url)}" target="_blank" class="btn btn-outline" style="padding:10px 14px;" title="డౌన్‌లోడ్" aria-label="ఈ-పేపర్ PDF డౌన్‌లోడ్ చేసుకోండి">
            <span>⬇️</span>
          </a>
        </div>
        ${isAdmin ? `
          <div style="margin-top:12px; padding-top:12px; border-top:1px dashed var(--border-color); display:flex; gap:8px; justify-content:center;">
            <button class="small-btn delete-btn" onclick="deletePDF('${e.id}')">🗑️ తొలగించు</button>
          </div>` : ""}
      `;
      list.appendChild(card);

      if (idx === 0) {
        latestEditionUrl = cleanPdfUrl(e.url);
        if (heroDate) heroDate.innerText = `తేదీ: ${e.date || "నేటి సంచిక"} • అమలాపురం (${e.pages || 6} పేజీలు)`;
      }
    });
  }
}

// 4.2 Load News
async function loadNews() {
  const statNews = document.getElementById("statNews");
  let news = [];

  // Try Server API
  try {
    const res = await fetch("/api/news", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        news = json.data;
      }
    }
  } catch (e) {}

  // Fallback to local storage / default
  if (news.length === 0) {
    const saved = localStorage.getItem("udhaya_local_news");
    news = saved ? JSON.parse(saved) : [...defaultNews];
  }

  currentNewsData = news;
  if (statNews) statNews.innerText = news.length;

  if (news.length > 0) {
    bindLeadArticle(news[0]);
    renderHomeGrid(news);
    renderHomeNewsSnapshot();
    renderNewsList();
  } else {
    renderEmptyNewsStates();
  }
}

function bindLeadArticle(article) {
  if (!article) return;
  const leadTitle = document.getElementById("leadTitle");
  const leadExcerpt = document.getElementById("leadExcerpt");
  const leadImg = document.getElementById("leadImg");
  const leadBadge = document.getElementById("leadBadge");
  const leadDate = document.getElementById("leadDate");
  const leadShareBtn = document.getElementById("leadShareBtn");

  if (leadTitle) {
    leadTitle.innerText = article.title || "";
    leadTitle.onclick = () => viewArticle(article.id);
  }
  if (leadExcerpt) leadExcerpt.innerText = (article.text || "").slice(0, 260) + "...";
  if (leadImg && article.image) {
    leadImg.src = article.image;
    leadImg.alt = article.title || "ముఖ్యాంశం";
  }
  if (leadBadge) leadBadge.innerText = `🔥 ముఖ్యాంశం • ${getCategoryLabel(article.category)}`;
  if (leadDate) leadDate.innerText = `📅 ${article.date || "నేటి ప్రధాన వార్త"}`;
  
  if (leadShareBtn) {
    leadShareBtn.onclick = () => shareArticle(article.id, article.title, article.text);
  }
}

function renderHomeGrid(dataset) {
  const grid = document.getElementById("homeNewsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const items = dataset.slice(1);
  if (items.length === 0 && dataset[0]) {
    items.push(dataset[0]);
  }

  items.forEach(n => {
    grid.appendChild(createNewsCardElement(n));
  });
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
        <span class="cat-pill">${getCategoryLabel(n.category)}</span>
        <h4 class="snapshot-title">${n.title || ""}</h4>
        <p class="snapshot-desc">${(n.text || "").slice(0, 85)}...</p>
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

function renderEmptyNewsStates() {
  const homeGrid = document.getElementById("homeNewsGrid");
  const newsList = document.getElementById("newsList");
  const emptyHtml = `
    <div class="empty-state-card" style="grid-column:1/-1;">
      <div class="empty-icon">📰</div>
      <h3>ప్రస్తుతం వార్తలు ఏవీ అందుబాటులో లేవు</h3>
      <p>త్వరలోనే సరికొత్త వార్తా కథనాలు ప్రచురించబడతాయి.</p>
      <button class="btn btn-gold" onclick="loadNews()">🔄 రీఫ్రెష్ చేయండి</button>
    </div>
  `;
  if (homeGrid) homeGrid.innerHTML = emptyHtml;
  if (newsList) newsList.innerHTML = emptyHtml;
}

// --------------------------------------------------------------------------
// 5. CATEGORY ARCHIVE PAGES & PAGINATION
// --------------------------------------------------------------------------
window.filterCategory = function(cat, page = 1) {
  activeCategory = cat;
  currentPage = page;
  
  // Update category buttons UI
  document.querySelectorAll(".cat-filter-btn").forEach(btn => {
    const isMatching = btn.getAttribute("data-cat") === cat;
    btn.classList.toggle("active", isMatching);
  });

  renderNewsList();
  
  // Update hash for deep linking
  if (cat === "All") {
    if (page > 1) location.hash = `page=${page}`;
  } else {
    location.hash = `category=${encodeURIComponent(cat)}&page=${page}`;
  }
};

function renderNewsList() {
  const list = document.getElementById("newsList");
  const paginationWrap = document.getElementById("newsPagination");
  const categoryHeader = document.getElementById("categoryArchiveHeader");
  if (!list) return;

  const dataset = activeCategory === "All" 
    ? currentNewsData 
    : currentNewsData.filter(n => n.category === activeCategory);

  // Update Category Archive Header
  if (categoryHeader) {
    if (activeCategory !== "All") {
      categoryHeader.style.display = "block";
      categoryHeader.innerHTML = `
        <div class="category-archive-banner">
          <h2>📂 ${getCategoryLabel(activeCategory)} వార్తలు</h2>
          <p>కోనసీమ, ఆంధ్రప్రదేశ్ తాజా ${getCategoryLabel(activeCategory)} కథనాలు మరియు విశ్లేషణలు (మొత్తం ${dataset.length} వార్తలు)</p>
        </div>
      `;
    } else {
      categoryHeader.style.display = "none";
    }
  }

  list.innerHTML = "";

  if (dataset.length === 0) {
    list.innerHTML = `
      <div class="empty-state-card" style="grid-column:1/-1;">
        <div class="empty-icon">📂</div>
        <h3>ఈ విభాగంలో వార్తలు ఏవీ లేవు</h3>
        <p>త్వరలోనే మరిన్ని తాజా కథనాలు జోడించబడతాయి.</p>
        <button class="btn btn-outline" onclick="filterCategory('All', 1)">అన్ని వార్తలు చూడండి</button>
      </div>
    `;
    if (paginationWrap) paginationWrap.innerHTML = "";
    return;
  }

  // Calculate Pagination
  const totalPages = Math.ceil(dataset.length / ITEMS_PER_PAGE) || 1;
  if (currentPage > totalPages) currentPage = 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = dataset.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  paginatedItems.forEach(n => {
    list.appendChild(createNewsCardElement(n));
  });

  renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
  const paginationWrap = document.getElementById("newsPagination");
  if (!paginationWrap) return;

  if (totalPages <= 1) {
    paginationWrap.innerHTML = "";
    return;
  }

  let html = `<div class="pagination-container" role="navigation" aria-label="News Pagination">`;
  
  // Previous Button
  html += `
    <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
            onclick="filterCategory('${activeCategory}', ${currentPage - 1})"
            ${currentPage === 1 ? 'disabled' : ''}
            aria-label="Previous Page">
      ◀ మునుపటి
    </button>
  `;

  // Page Numbers
  for (let p = 1; p <= totalPages; p++) {
    html += `
      <button class="pagination-btn ${p === currentPage ? 'active' : ''}" 
              onclick="filterCategory('${activeCategory}', ${p})"
              aria-label="Page ${p}"
              aria-current="${p === currentPage ? 'page' : 'false'}">
        ${p}
      </button>
    `;
  }

  // Next Button
  html += `
    <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
            onclick="filterCategory('${activeCategory}', ${currentPage + 1})"
            ${currentPage === totalPages ? 'disabled' : ''}
            aria-label="Next Page">
      తదుపరి ▶
    </button>
  `;

  html += `</div>`;
  paginationWrap.innerHTML = html;
}

function createNewsCardElement(n) {
  const card = document.createElement("article");
  card.className = "news-card";
  const snippet = (n.text || "").length > 120 ? n.text.slice(0, 120) + "..." : n.text;
  const thumbImg = n.image || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&auto=format&fit=crop&q=80";

  card.innerHTML = `
    <div class="news-thumb-wrap">
      <img src="${thumbImg}" alt="${safe(n.title)}" class="news-thumb" loading="lazy" decoding="async" onerror="this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=500&auto=format&fit=crop&q=80'">
      <span class="news-cat-badge">${getCategoryLabel(n.category)}</span>
    </div>
    <div class="news-body">
      <div class="news-meta">
        <span>📅 ${n.date || "ఈ రోజు"}</span>
        <span aria-hidden="true">•</span>
        <span>📍 ${n.mandal || "అమలాపురం"}</span>
      </div>
      <h3 class="news-title" onclick="viewArticle('${n.id}')" tabindex="0" role="button" aria-label="${safe(n.title)}">${n.title || ""}</h3>
      <p class="news-excerpt">${snippet}</p>
      <div class="news-footer">
        <button class="btn btn-outline" style="padding:6px 14px; font-size:13px;" onclick="viewArticle('${n.id}')" aria-label="పూర్తి కథనం చదవండి">
          పూర్తి కథనం ➔
        </button>
        <div class="news-share-btns">
          <button class="news-share-btn" onclick="shareArticle('${n.id}', '${safe(n.title)}', '${safe(n.text)}')" title="వాట్సాప్‌లో షేర్ చేయండి" aria-label="వాట్సాప్‌లో షేర్ చేయండి">
            <span aria-hidden="true">💬</span> W
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

// --------------------------------------------------------------------------
// 6. ARTICLE MODAL, TTS & DYNAMIC SEO / JSON-LD
// --------------------------------------------------------------------------
window.viewArticle = function(id) {
  const article = currentNewsData.find(n => n.id === id);
  if (!article) return;

  currentOpenArticle = article;
  
  const modal = document.getElementById("articleModal");
  const title = document.getElementById("articleModalTitle");
  const cat = document.getElementById("articleModalCategory");
  const date = document.getElementById("articleModalDate");
  const mandal = document.getElementById("articleModalMandal");
  const imgWrap = document.getElementById("articleModalImageWrap");
  const img = document.getElementById("articleModalImage");
  const text = document.getElementById("articleModalText");

  if (title) title.innerText = article.title;
  if (cat) cat.innerText = getCategoryLabel(article.category);
  if (date) date.innerText = `📅 ${article.date || "నేటి వార్త"}`;
  if (mandal) mandal.innerText = `📍 ${article.mandal || "అమలాపురం"}`;
  
  if (img && article.image) {
    img.src = article.image;
    img.alt = article.title;
    if (imgWrap) imgWrap.style.display = "block";
  } else if (imgWrap) {
    imgWrap.style.display = "none";
  }

  if (text) text.innerText = article.text;

  // Inject NewsArticle JSON-LD & Dynamic SEO Tags
  updateArticleSeoAndJsonLd(article);

  if (modal) {
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
    // Set focus to modal for accessibility
    modal.focus();
  }

  // Update URL hash for sharing
  location.hash = `article=${article.id}`;
};

window.closeArticleModal = function() {
  const modal = document.getElementById("articleModal");
  if (modal) modal.style.display = "none";
  document.body.style.overflow = "auto";
  stopTeluguSpeech();
  resetDocumentSeo();
  if (location.hash.startsWith("#article=")) {
    history.replaceState(null, null, ' ');
  }
};

// Dynamic SEO & Structured Data
function updateArticleSeoAndJsonLd(article) {
  const articleTitle = `${article.title} | Udhaya Netram | ఉదయ నేత్రం`;
  const articleDesc = (article.text || "").slice(0, 160) + "...";
  const articleUrl = `https://udhayanetram.com/#article=${article.id}`;

  document.title = articleTitle;
  
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", articleDesc);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute("content", articleTitle);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute("content", articleDesc);

  // Dynamic JSON-LD structured data
  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": articleUrl
    },
    "headline": article.title,
    "description": articleDesc,
    "image": [
      article.image || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1000"
    ],
    "datePublished": article.createdAt || new Date().toISOString(),
    "dateModified": article.createdAt || new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": "Kadali Pallaparaju",
      "jobTitle": "Editor & Publisher"
    },
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": "Udhaya Netram (ఉదయ నేత్రం)",
      "url": "https://udhayanetram.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://udhayanetram.com/assets/images/editor-kadali.jpg"
      }
    }
  };

  let jsonScript = document.getElementById("newsArticleJsonLd");
  if (!jsonScript) {
    jsonScript = document.createElement("script");
    jsonScript.id = "newsArticleJsonLd";
    jsonScript.type = "application/ld+json";
    document.head.appendChild(jsonScript);
  }
  jsonScript.textContent = JSON.stringify(jsonLdData);
}

function resetDocumentSeo() {
  document.title = "Udhaya Netram | ఉదయ నేత్రం - Daily Telugu E-Paper & News Portal";
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", "ఉదయ నేత్రం (Udhaya Netram) Daily Telugu E-Paper & Latest News from Amalapuram, Konaseema, Andhra Pradesh.");
  
  const jsonScript = document.getElementById("newsArticleJsonLd");
  if (jsonScript) jsonScript.remove();
}

// Universal WhatsApp Share
window.shareArticle = function(id, title, text) {
  const cleanSnippet = (text || "").slice(0, 160).replace(/\n/g, " ");
  const shareUrl = `https://udhayanetram.com/#article=${encodeURIComponent(id)}`;
  
  const shareText = `📰 *ఉదయ నేత్రం (UDHAYA NETRAM)*\n\n📌 *${title}*\n\n${cleanSnippet}...\n\n👉 పూర్తి వార్త కోసం ఇక్కడ క్లిక్ చేయండి:\n${shareUrl}`;
  
  window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
};

window.shareCurrentArticle = function() {
  if (currentOpenArticle) {
    shareArticle(currentOpenArticle.id, currentOpenArticle.title, currentOpenArticle.text);
  }
};

// Telugu TTS Reader
window.toggleTeluguSpeech = function() {
  if (!('speechSynthesis' in window)) {
    alert("మీ బ్రౌజర్‌లో వాయిస్ రీడర్ సదుపాయం లేదు.");
    return;
  }

  if (isSpeaking) {
    stopTeluguSpeech();
    return;
  }

  if (!currentOpenArticle) return;

  const fullTextToRead = `${currentOpenArticle.title}. ${currentOpenArticle.text}`;
  currentUtterance = new SpeechSynthesisUtterance(fullTextToRead);
  currentUtterance.lang = "te-IN";
  currentUtterance.rate = 0.95;

  const btn = document.getElementById("ttsModalBtn");

  currentUtterance.onstart = () => {
    isSpeaking = true;
    if (btn) btn.innerHTML = "⏹️ చదవడం ఆపండి (Stop)";
  };

  currentUtterance.onend = currentUtterance.onerror = () => {
    isSpeaking = false;
    if (btn) btn.innerHTML = "🔊 వార్తను వినండి (Audio)";
  };

  window.speechSynthesis.speak(currentUtterance);
};

function stopTeluguSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
  const btn = document.getElementById("ttsModalBtn");
  if (btn) btn.innerHTML = "🔊 వార్తను వినండి (Audio)";
}

// --------------------------------------------------------------------------
// 7. TICKER, POLL & EDITORIAL RENDERERS
// --------------------------------------------------------------------------
async function loadTicker() {
  let list = [];
  try {
    const res = await fetch("/api/ticker", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) list = json.data;
    }
  } catch (e) {}

  if (list.length === 0) {
    const saved = localStorage.getItem("udhaya_local_ticker");
    list = saved ? JSON.parse(saved) : [...defaultTickers];
  }

  currentTickerData = list;
  const statBreaking = document.getElementById("statBreaking");
  if (statBreaking) statBreaking.innerText = list.length;
  renderBreakingTicker();
  renderAdminTickerList();
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
    span.setAttribute("tabindex", "0");
    wrap.appendChild(span);

    if (idx < currentTickerData.length - 1) {
      const dot = document.createElement("span");
      dot.className = "ticker-dot";
      dot.setAttribute("aria-hidden", "true");
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

async function loadPollAndEditorial() {
  let pollData = null;
  let editData = null;

  try {
    const [pRes, eRes] = await Promise.all([
      fetch("/api/poll", { cache: "no-store" }).then(r => r.ok ? r.json() : null),
      fetch("/api/editorial", { cache: "no-store" }).then(r => r.ok ? r.json() : null)
    ]);
    if (pRes && pRes.data) pollData = pRes.data;
    if (eRes && eRes.data) editData = eRes.data;
  } catch (e) {}

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
}

function applyPollData(poll) {
  const qEl = document.getElementById("pollQuestion");
  const optsEl = document.getElementById("pollOptions");
  if (qEl && poll.question) qEl.innerText = poll.question;
  if (!optsEl || !poll.opt1) return;

  const total = poll.totalVotes || (poll.votes ? poll.votes.reduce((a, b) => a + b, 0) : 0);
  const v1 = poll.votes?.[0] || 0;
  const v2 = poll.votes?.[1] || 0;
  const v3 = poll.votes?.[2] || 0;

  const p1 = total > 0 ? Math.round((v1 / total) * 100) : 64;
  const p2 = total > 0 ? Math.round((v2 / total) * 100) : 28;
  const p3 = total > 0 ? Math.round((v3 / total) * 100) : 8;

  const hasVoted = !!localStorage.getItem("udhaya_poll_voted");

  optsEl.innerHTML = `
    <button class="poll-option-btn ${hasVoted ? 'voted' : ''}" onclick="votePoll(0)" aria-label="${poll.opt1}">
      <div class="poll-opt-bg" style="width:${p1}%;"></div>
      <span class="poll-opt-label">${poll.opt1}</span>
      <span class="poll-opt-pct">${p1}%</span>
    </button>
    <button class="poll-option-btn ${hasVoted ? 'voted' : ''}" onclick="votePoll(1)" aria-label="${poll.opt2}">
      <div class="poll-opt-bg" style="width:${p2}%;"></div>
      <span class="poll-opt-label">${poll.opt2}</span>
      <span class="poll-opt-pct">${p2}%</span>
    </button>
    ${poll.opt3 ? `
    <button class="poll-option-btn ${hasVoted ? 'voted' : ''}" onclick="votePoll(2)" aria-label="${poll.opt3}">
      <div class="poll-opt-bg" style="width:${p3}%;"></div>
      <span class="poll-opt-label">${poll.opt3}</span>
      <span class="poll-opt-pct">${p3}%</span>
    </button>` : ""}
  `;
}

window.votePoll = async function(optIndex) {
  if (localStorage.getItem("udhaya_poll_voted")) {
    status("మీరు ఇప్పటికే ఈ పోల్‌లో ఓటు వేశారు. ధన్యవాదాలు!", true);
    return;
  }

  localStorage.setItem("udhaya_poll_voted", "true");

  try {
    const res = await fetch("/api/poll/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionIndex: optIndex })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        applyPollData(json.data);
        status("🎉 మీ ఓటు విజయవంతంగా నమోదైంది! ధన్యవాదాలు.", true);
        return;
      }
    }
  } catch (e) {}

  status("🎉 మీ ఓటు నమోదైంది!", true);
};

function applyEditorialData(edit) {
  const quoteEl = document.querySelector(".editorial-quote");
  if (quoteEl && edit.quote) {
    quoteEl.innerText = `"${edit.quote}"`;
  }
}

// --------------------------------------------------------------------------
// 8. ADMIN MANAGER RENDERER
// --------------------------------------------------------------------------
function renderAdminManager() {
  const edContainer = document.getElementById("adminEditionsList");
  const newsContainer = document.getElementById("adminNewsManageList");

  if (edContainer) {
    edContainer.innerHTML = "";
    currentEditionsData.forEach(e => {
      const item = document.createElement("div");
      item.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--bg-card); border-radius:var(--radius-sm); border:1px solid var(--border-color); margin-bottom:8px;";
      item.innerHTML = `
        <div>
          <b style="font-family:var(--font-telugu); font-size:14.5px;">${e.title}</b>
          <div style="font-size:12px; color:var(--text-muted);">📅 తేదీ: ${e.date} • పేజీలు: ${e.pages || 6}</div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="small-btn edit-btn" onclick="openPDF('${e.url}', '${safe(e.title)}')">👁️ ప్రివ్యూ</button>
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
      item.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--bg-card); border-radius:var(--radius-sm); border:1px solid var(--border-color); margin-bottom:8px;";
      item.innerHTML = `
        <div style="max-width:70%;">
          <span style="font-size:11px; background:var(--accent-light); color:#92400e; padding:1px 6px; border-radius:3px; font-weight:700;">${getCategoryLabel(n.category)}</span>
          <b style="font-family:var(--font-telugu); font-size:14px; display:block; margin-top:4px;">${n.title}</b>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="small-btn edit-btn" onclick="editNews('${n.id}','${safe(n.title)}','${safe(n.text)}')">✏️ సవరణ</button>
          <button class="small-btn delete-btn" onclick="deleteNews('${n.id}')">🗑️ తొలగించు</button>
        </div>
      `;
      newsContainer.appendChild(item);
    });
  }
}

// --------------------------------------------------------------------------
// 9. NAVIGATION, SEARCH & ACCESSIBILITY
// --------------------------------------------------------------------------
window.showPage = function(pageId) {
  document.querySelectorAll(".page-view").forEach(p => p.style.display = "none");
  const target = document.getElementById("page-" + pageId);
  if (target) {
    target.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Update Navigation Active State
  document.querySelectorAll(".nav-link").forEach(l => {
    const isActive = l.getAttribute("data-page") === pageId;
    l.classList.toggle("active", isActive);
  });

  // Close mobile nav if open
  const nav = document.querySelector("nav");
  if (nav) nav.classList.remove("mobile-open");
};

window.toggleMobileMenu = function() {
  const nav = document.querySelector("nav");
  const btn = document.querySelector(".mobile-menu-toggle");
  if (nav) {
    const isOpen = nav.classList.toggle("mobile-open");
    if (btn) btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }
};

function handleHashNavigation() {
  const hash = window.location.hash;
  if (!hash) return;

  if (hash.startsWith("#article=")) {
    const id = decodeURIComponent(hash.replace("#article=", ""));
    viewArticle(id);
  } else if (hash.startsWith("#category=")) {
    const params = new URLSearchParams(hash.substring(1));
    const cat = params.get("category") || "All";
    const page = parseInt(params.get("page") || "1", 10);
    showPage("latest");
    filterCategory(cat, page);
  } else if (hash === "#latest") {
    showPage("latest");
  } else if (hash === "#epaper") {
    showPage("epaper");
  } else if (hash === "#classifieds") {
    showPage("classifieds");
  } else if (hash === "#contact") {
    showPage("contact");
  } else if (hash === "#admin") {
    showPage("admin");
  }
}

function setupKeyboardAccessibility() {
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeArticleModal();
      closePdfReader();
    }
  });
}

// Live Search with Highlights
window.handleSearch = function(query) {
  const q = query.trim().toLowerCase();
  if (!q) {
    renderNewsList();
    return;
  }
  const filtered = currentNewsData.filter(n => 
    (n.title && n.title.toLowerCase().includes(q)) ||
    (n.text && n.text.toLowerCase().includes(q)) ||
    (n.mandal && n.mandal.toLowerCase().includes(q))
  );
  showPage("latest");
  activeCategory = "All";
  const list = document.getElementById("newsList");
  if (list) {
    list.innerHTML = "";
    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="empty-state-card" style="grid-column:1/-1;">
          <div class="empty-icon">🔍</div>
          <h3>"${query}" కోసం ఎలాంటి ఫలితాలు లభించలేదు</h3>
          <p>దయచేసి వేరొక పదం లేదా మండలం పేరుతో వెతకండి.</p>
        </div>
      `;
      return;
    }
    filtered.forEach(n => list.appendChild(createNewsCardElement(n)));
  }
};

// --------------------------------------------------------------------------
// 10. E-PAPER PDF VIEWER MODAL
// --------------------------------------------------------------------------
window.openPDF = function(url, title) {
  const modal = document.getElementById("pdfReaderModal");
  const frame = document.getElementById("pdfFrame");
  const titleEl = document.getElementById("readerModalTitle");
  const dlLink = document.getElementById("pdfDirectDownload");
  const newTabLink = document.getElementById("pdfNewTab");

  const cleanUrl = cleanPdfUrl(url);

  if (titleEl) titleEl.innerText = title || "ఉదయ నేత్రం ఈ-పేపర్";
  if (frame) frame.src = cleanUrl;
  if (dlLink) dlLink.href = cleanUrl;
  if (newTabLink) newTabLink.href = cleanUrl;

  if (modal) {
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }
};

window.closePdfReader = function() {
  const modal = document.getElementById("pdfReaderModal");
  const frame = document.getElementById("pdfFrame");
  if (frame) frame.src = "";
  if (modal) modal.style.display = "none";
  document.body.style.overflow = "auto";
};

window.openLatestPDF = function() {
  if (currentEditionsData.length > 0) {
    const latest = currentEditionsData[0];
    openPDF(latest.url, latest.title);
  } else {
    status("నేటి సంచిక త్వరలోనే అప్‌లోడ్ చేయబడుతుంది.", true);
  }
};

// --------------------------------------------------------------------------
// 11. HELPER UTILITIES
// --------------------------------------------------------------------------
function cleanPdfUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("/uploads/")) {
    return url;
  }
  return `/uploads/${url}`;
}

function getCategoryLabel(cat) {
  const map = {
    "Konaseema": "కోనసీమ",
    "AP": "ఆంధ్రప్రదేశ్",
    "National": "జాతీయం",
    "Cinema": "సినిమా",
    "Agriculture": "వ్యవసాయం",
    "Editorial": "సంపాదకీయం"
  };
  return map[cat] || cat || "తాజా వార్తలు";
}

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

function status(msg, isSuccess = true) {
  const box = document.getElementById("statusBox");
  if (!box) {
    alert(msg);
    return;
  }
  box.innerHTML = msg;
  box.className = "status-box " + (isSuccess ? "status-success" : "status-error");
  box.style.display = "block";
  box.scrollIntoView({ behavior: "smooth", block: "center" });

  setTimeout(() => {
    box.style.display = "none";
  }, 6000);
}

function safe(t) {
  return String(t || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, " ");
}

// WhatsApp Contact
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
  const name = document.getElementById("cName")?.value.trim() || "";
  const uPhone = document.getElementById("cPhone")?.value.trim() || "";
  const message = document.getElementById("cMessage")?.value.trim() || "";

  const fullMsg = `*ఉదయ నేత్రం వెబ్‌సైట్ ద్వారా సందేశం*\n👤 పేరు: ${name}\n📞 ఫోన్: ${uPhone}\n✉️ సందేశం: ${message}`;
  window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(fullMsg)}`, '_blank');
};

// Auto-start
window.addEventListener("DOMContentLoaded", initApp);
