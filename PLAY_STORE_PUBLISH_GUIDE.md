# 🏪 Google Play Store Publishing Guide for Udhaya Netram (ఉదయ నేత్రం)

This guide walks you through every step to publish the **Udhaya Netram (ఉదయ నేత్రం)** app onto the **Google Play Store**.

---

## 📋 Pre-Publishing Checklist

| Item | Requirement | Status / Location |
| :--- | :--- | :--- |
| **Android App Bundle** | `.aab` file | Built automatically (`app-release.aab`) |
| **Google Play Developer Account** | 1-time $25 Google registration fee | [https://play.google.com/console/signup](https://play.google.com/console/signup) |
| **Privacy Policy URL** | Mandatory public link | `https://suryamanikanta2007-oss.github.io/udhaya_netra/privacy.html` |
| **App Icon** | 512 x 512 px PNG | High-res vector in `res/drawable/` |
| **Feature Graphic Banner** | 1024 x 500 px JPEG/PNG | Banner asset |
| **Phone Screenshots** | Min 2 (recommended 4-6) | Captured on any Android device |

---

## 🚀 Step-by-Step Publishing Walkthrough

### Step 1: Create a Google Play Console Account
1. Go to **[Google Play Console](https://play.google.com/console/signup)**.
2. Sign in with your Google account.
3. Pay the one-time registration fee of **$25 USD**.
4. Complete your identity verification (Government ID proof / Organization details).

---

### Step 2: Create a New App
1. In the Play Console dashboard, click **"Create app"** (top-right).
2. Enter the app details:
   - **App name:** `ఉదయ నేత్రం - Udhaya Netram Telugu E-Paper`
   - **Default language:** `Telugu - te` (or `English (India) - en-IN`)
   - **App or Game:** `App`
   - **Free or Paid:** `Free`
3. Accept the Declarations and click **"Create app"**.

---

### Step 3: Complete App Content Declarations
In the left sidebar, navigate to **Policy and Programs ➔ App content** and complete each declaration:

1. **Privacy Policy**:
   - URL: `https://suryamanikanta2007-oss.github.io/udhaya_netra/privacy.html`
2. **Ads**:
   - Select *"No, my app does not contain ads"* (or Yes if you add AdMob).
3. **App Access**:
   - Select *"All functionality is available without special access"* (no login needed).
4. **Content Rating (IARC)**:
   - Category: **News / Magazine**
   - Answer the questionnaire (violence: No, adult: No, etc.) ➔ You will receive a **Rated 3+ (Everyone)** certificate.
5. **Target Audience**:
   - Select **13 and older** (13-17, 18+).
6. **News Apps Policy**:
   - Select *"Yes, this is a News App"*.
   - Provide your publication details:
     - *Publisher/Editor:* Kadali Pallaparaju
     - *Registration:* RNI Registered Telugu Newspaper
     - *Location:* Amalapuram, Dr. B.R. Ambedkar Konaseema District, Andhra Pradesh.

---

### Step 4: Set Up Main Store Listing
Go to **Grow ➔ Store presence ➔ Main store listing**:

#### 📝 App Details (Copy-Paste Ready):

- **App name:**  
  `ఉదయ నేత్రం (Udhaya Netram) - Daily Telugu E-Paper`

- **Short description (Up to 80 characters):**  
  `ఉదయ నేత్రం - దినపత్రిక & ఈ-పేపర్ | Daily Telugu News & E-Paper from Konaseema`

- **Full description (Up to 4000 characters):**  
```
ఉదయ నేత్రం (Udhaya Netram) - తెలుగు దినపత్రిక & డిజిటల్ ఈ-పేపర్

ధర్మో రక్షతి రక్షితః • సత్యమేవ జయతే
ప్రజల పక్షాన నిలిచే నిష్పక్షపాత తెలుగు దినపత్రిక.

అమలాపురం, డా. బి.ఆర్. అంబేద్కర్ కోనసీమ జిల్లా మరియు ఆంధ్రప్రదేశ్ తాజా వార్తలు, ప్రత్యేక కథనాలు, మరియు ప్రతిరోజూ ఉదయమే పూర్తి డిజిటల్ ఈ-పేపర్ (E-Paper) ను మీ మొబైల్‌లోనే చదువుకోండి.

ముఖ్య లక్షణాలు (App Features):
★ ప్రతిరోజూ పూర్తి ఈ-పేపర్ ఉచిత పఠనం
★ 1-క్లిక్ PDF ఈ-పేపర్ డౌన్‌లోడ్ సదుపాయం
★ తాజా బ్రేకింగ్ న్యూస్ & విశ్లేషణలు
★ అమలాపురం మరియు కోనసీమ స్థానిక వార్తలు
★ వాట్సాప్ మరియు సోషల్ మీడియాలో వార్తల షేరింగ్
★ సులభమైన మొబైల్ రీడింగ్ ఇంటర్‌ఫేస్ & డార్క్ మోడ్

సంపాదకుడు & ప్రచురణకర్త:
కడలి పళ్ళపరాజు (Kadali Pallaparaju)
అమలాపురం, కోనసీమ జిల్లా, ఆంధ్రప్రదేశ్.
```

#### 🎨 Graphics & Media:
- **App Icon:** 512 x 512 px PNG (Sun & Eye Logo)
- **Feature Graphic:** 1024 x 500 px Banner (Gold & Maroon Udhaya Netram header)
- **Phone Screenshots:** Upload 2 to 4 screenshots of the app running on your phone.

---

### Step 5: Upload the Release Bundle (.aab)
1. In the left sidebar, go to **Release ➔ Production** (or *Closed testing*).
2. Click **"Create new release"**.
3. Under **App bundles**, drag and drop your **`app-release.aab`** file (downloaded from GitHub Actions / Artifacts).
4. Enter **Release name:** `1.0.0`
5. Enter **Release notes:**
   ```
   ఉదయ నేత్రం (Udhaya Netram) మొదటి అధికారిక విడుదల (Initial Release).
   - Live Telugu E-Paper & Daily News Portal.
   ```
6. Click **"Next"** ➔ **"Save and publish"**.

---

### Step 6: Google Review & Live on Play Store
- Google Play typically reviews new apps within **1 to 3 business days**.
- Once approved, your app will be **LIVE** on the Google Play Store for millions of Telugu readers to download!
