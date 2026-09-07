/* ==============================================================================
   UDHAYA NETRAM - ENVIRONMENT CONFIGURATION LOADER
   Loads safe public settings dynamically from /api/config
   ============================================================================== */

const DEFAULT_CONFIG = {
  portalName: "UDHAYA NETRAM",
  portalNameTelugu: "ఉదయ నేత్రం",
  editorName: "Kadali Pallaparaju",
  editorPhone: "9848556806",
  editorEmail: "admin@udhayanetram.com",
  editorLocation: "Amalapuram, Konaseema",
  socials: {
    facebook: "https://facebook.com/udhayanetram",
    twitter: "https://x.com/udhayanetram",
    whatsapp: "https://wa.me/919848556806",
    telegram: "https://t.me/udhayanetram",
    youtube: "https://youtube.com/@udhayanetram"
  },
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
          portalName: envData.portalName || DEFAULT_CONFIG.portalName,
          portalNameTelugu: envData.portalNameTelugu || DEFAULT_CONFIG.portalNameTelugu,
          editorName: envData.editorName || DEFAULT_CONFIG.editorName,
          editorPhone: envData.editorPhone || DEFAULT_CONFIG.editorPhone,
          editorEmail: envData.editorEmail || DEFAULT_CONFIG.editorEmail,
          editorLocation: envData.editorLocation || DEFAULT_CONFIG.editorLocation,
          socials: DEFAULT_CONFIG.socials,
          firebase: {
            apiKey: envData.firebase?.apiKey || DEFAULT_CONFIG.firebase.apiKey,
            authDomain: envData.firebase?.authDomain || DEFAULT_CONFIG.firebase.authDomain,
            projectId: envData.firebase?.projectId || DEFAULT_CONFIG.firebase.projectId,
            storageBucket: envData.firebase?.storageBucket || DEFAULT_CONFIG.firebase.storageBucket,
            messagingSenderId: envData.firebase?.messagingSenderId || DEFAULT_CONFIG.firebase.messagingSenderId,
            appId: envData.firebase?.appId || DEFAULT_CONFIG.firebase.appId,
            measurementId: envData.firebase?.measurementId || DEFAULT_CONFIG.firebase.measurementId
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
