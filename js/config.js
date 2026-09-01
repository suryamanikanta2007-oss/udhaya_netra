/* ==============================================================================
   UDHAYA NETRAM - ENVIRONMENT CONFIGURATION LOADER
   Loads API Keys & Configuration dynamically from .env / /api/config
   ============================================================================== */

const DEFAULT_CONFIG = {
  portalName: "UDHAYA NETRAM",
  portalNameTelugu: "ఉదయ నేత్రం",
  editorName: "Kadali Pallaparaju",
  editorPhone: "9848556806",
  editorEmail: "admin@udhayanetram.com",
  editorLocation: "Amalapuram, Konaseema",
  adminEmail: "admin@udhayanetram.com",
  adminPassword: "admin123",
  firebase: {
    apiKey: "AIzaSyDmnza1ol0Rvp-ciw3DsdZkr8NIfAGzj8A",
    authDomain: "udhayanetram.firebaseapp.com",
    projectId: "udhayanetram",
    storageBucket: "udhayanetram.firebasestorage.app",
    messagingSenderId: "134674275465",
    appId: "1:134674275465:web:0f8e2847ccdd49f3f87a58",
    measurementId: "G-RWKERMPGDJ"
  }
};

let activeConfig = { ...DEFAULT_CONFIG };

export async function loadAppConfig() {
  try {
    if (window.location.protocol.startsWith("http")) {
      const response = await fetch("/api/config", { cache: "no-store" });
      if (response.ok) {
        const envData = await response.json();
        activeConfig = {
          portalName: envData.PORTAL_NAME || DEFAULT_CONFIG.portalName,
          portalNameTelugu: envData.PORTAL_NAME_TELUGU || DEFAULT_CONFIG.portalNameTelugu,
          editorName: envData.EDITOR_NAME || DEFAULT_CONFIG.editorName,
          editorPhone: envData.EDITOR_PHONE || DEFAULT_CONFIG.editorPhone,
          editorEmail: envData.EDITOR_EMAIL || DEFAULT_CONFIG.editorEmail,
          editorLocation: envData.EDITOR_LOCATION || DEFAULT_CONFIG.editorLocation,
          adminEmail: envData.ADMIN_EMAIL || DEFAULT_CONFIG.adminEmail,
          adminPassword: envData.ADMIN_PASSWORD || DEFAULT_CONFIG.adminPassword,
          firebase: {
            apiKey: envData.FIREBASE_API_KEY || DEFAULT_CONFIG.firebase.apiKey,
            authDomain: envData.FIREBASE_AUTH_DOMAIN || DEFAULT_CONFIG.firebase.authDomain,
            projectId: envData.FIREBASE_PROJECT_ID || DEFAULT_CONFIG.firebase.projectId,
            storageBucket: envData.FIREBASE_STORAGE_BUCKET || DEFAULT_CONFIG.firebase.storageBucket,
            messagingSenderId: envData.FIREBASE_MESSAGING_SENDER_ID || DEFAULT_CONFIG.firebase.messagingSenderId,
            appId: envData.FIREBASE_APP_ID || DEFAULT_CONFIG.firebase.appId,
            measurementId: envData.FIREBASE_MEASUREMENT_ID || DEFAULT_CONFIG.firebase.measurementId
          }
        };
      }
    }
  } catch (err) {
    console.info("Using standalone/default environment configuration:", err);
  }
  return activeConfig;
}

export function getConfig() {
  return activeConfig;
}
