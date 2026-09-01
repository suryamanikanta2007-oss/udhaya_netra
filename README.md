# UDHAYA NETRAM (ఉదయ నేత్రం) - Daily Telugu E-Paper & News Portal

A modern, responsive Telugu Daily E-Paper and News Web Portal for **Udhaya Netram** (Amalapuram, Dr. B.R. Ambedkar Konaseema District, Andhra Pradesh).

---

## 📁 Project Structure

```
d:/MANIKANTA/udhaya/
├── .env                  # Environment Variables & Firebase API Keys
├── .env.example          # Template configuration
├── .gitignore            # Git ignore rules
├── package.json          # Node.js project metadata
├── start.bat             # 1-Click launcher for Windows Localhost
├── server.ps1            # Built-in PowerShell/.NET Localhost Server
├── server.js             # Node.js Server
├── public/               # Static Web Root
│   ├── index.html        # Main HTML layout
│   ├── css/
│   │   └── style.css     # Design System & Responsive Styles
│   └── js/
│       ├── config.js     # Dynamic .env configuration loader
│       └── app.js        # Firebase Firestore & App logic
├── index.html            # Standalone Root Entry
├── style.css             # Standalone Root CSS
├── app.js                # Standalone Root Script
└── README.md             # Project Guide
```

---

## ⚙️ Environment Configuration (`.env`)

All sensitive credentials and portal settings are isolated in `.env`:

```env
PORT=3000

PORTAL_NAME=UDHAYA NETRAM
PORTAL_NAME_TELUGU=ఉదయ నేత్రం
EDITOR_NAME=Kadali Pallaparaju
EDITOR_PHONE=9848556806
EDITOR_EMAIL=admin@udhayanetram.com
EDITOR_LOCATION=Amalapuram, Konaseema

# Firebase Credentials
FIREBASE_API_KEY=AIzaSy...
FIREBASE_AUTH_DOMAIN=udhayanetram.firebaseapp.com
FIREBASE_PROJECT_ID=udhayanetram
FIREBASE_STORAGE_BUCKET=udhayanetram.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=134674275465
FIREBASE_APP_ID=1:134674275465:web:0f8e2847ccdd49f3f87a58
FIREBASE_MEASUREMENT_ID=G-RWKERMPGDJ
```

---

## 🚀 How to Run on Localhost

### Option 1: 1-Click Launch on Windows (Recommended)
Simply **double-click** `start.bat` in the project folder.  
It will start the server and automatically open `http://localhost:3000/` in your browser!

### Option 2: PowerShell
Run the following command in PowerShell:
```powershell
.\server.ps1
```

### Option 3: Node.js
If Node.js is installed:
```bash
npm start
```
or
```bash
node server.js
```

---

## 🌟 Key Features

1. **Telugu Masthead & Sunrise Logo**: Custom SVG logo, live Telugu date display (`📅 1 సెప్టెంబర్ 2026`), and editor contact information.
2. **Animated Breaking News Ticker**: Smooth continuous news marquee with hover-to-pause.
3. **Digital E-Paper PDF Viewer**: In-app modal viewer with download button, Google Docs viewer integration, and GitHub URL auto-fixing.
4. **Categorized News Portal**: Filter news by Konaseema, AP, National, Agriculture, and Cinema, with article popup view and 1-click WhatsApp share.
5. **Admin Portal**: Firebase Auth login for Editor/Admin (**Kadali Pallaparaju**) to publish PDF editions and news articles with inline edit and delete capabilities.
6. **WhatsApp Integration**: Instant 1-click WhatsApp chat for advertising inquiries and news submission.
