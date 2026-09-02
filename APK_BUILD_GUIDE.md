# 📱 Udhaya Netram (ఉదయ నేత్రం) - Android APK Guide

This guide explains how to get, install, and customize the Android mobile app for **Udhaya Netram (ఉదయ నేత్రం)**.

---

## 🚀 3 Easy Ways to Get Your APK

### Method 1: Instant Cloud Build via GitHub (Recommended - 0 Setup)
You do **not** need Android Studio or Java installed on your computer. GitHub compiles the APK in the cloud for free.

1. Double-click `build_apk.bat` in the project folder and choose **[1]**.
   *(Or run `git add .`, `git commit -m "Build APK"`, `git push origin main` in terminal)*
2. Open your GitHub Repository Actions page:  
   👉 **[https://github.com/suryamanikanta2007-oss/udhaya_netra/actions](https://github.com/suryamanikanta2007-oss/udhaya_netra/actions)**
3. Click on the latest workflow named **`Build Udhaya Netram Android APK`**.
4. Scroll down to the **Artifacts** section at the bottom of the page and click **`UdhayaNetram-APK`** to download your APK zip file.
5. Extract the `.zip` to find `UdhayaNetram-Debug.apk` and send it to your Android phone via WhatsApp, USB, or Google Drive.
6. Alternatively, check GitHub Releases:  
   👉 **[https://github.com/suryamanikanta2007-oss/udhaya_netra/releases](https://github.com/suryamanikanta2007-oss/udhaya_netra/releases)**

---

### Method 2: Open in Android Studio (For Developers)
If you want to edit the native code, build custom APKs, or publish to Google Play Store:

1. Open **Android Studio**.
2. Click **Open Project** and select the `android` folder (`d:\MANIKANTA\udhaya\android`).
3. Allow Gradle to sync dependencies.
4. Go to **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
5. Click **locate** when Android Studio finishes building to get your `.apk`.

---

### Method 3: Instant 1-Tap PWA Mobile Install (No APK Needed)
Anyone can install the website as an app directly from their Android mobile browser:

1. Open **[https://suryamanikanta2007-oss.github.io/udhaya_netra/](https://suryamanikanta2007-oss.github.io/udhaya_netra/)** in Google Chrome on your Android mobile.
2. Tap the **Three Dots Menu (⋮)** at the top-right of Chrome.
3. Tap **"Install App"** or **"Add to Home screen"**.
4. The **ఉదయ నేత్రం** icon will appear on your phone's home screen and launch in full-screen standalone mode.

---

## ✨ Features Built Into the Android App

| Feature | Description |
| :--- | :--- |
| 📰 **Live Telugu News** | Seamless web portal integration with smooth scrolling and responsive design. |
| 📥 **E-Paper PDF Downloader** | Integrated with Android `DownloadManager` for 1-click downloading of daily edition PDFs directly to phone storage. |
| 🔄 **Pull-to-Refresh** | Swipe down from the top to refresh and check for breaking news. |
| 🛡️ **Offline Retry Screen** | Custom Telugu offline interface when internet is unavailable. |
| 🔙 **Smart Back Navigation** | Navigates through read pages; double-tap back to safely exit the app. |
| ⚡ **WhatsApp Sharing** | Native deep links for instant sharing of articles to WhatsApp groups and contacts. |
| 🎨 **Branded Splash Screen** | Features the Udhaya Netram sun-eye logo and newspaper motto. |

---

## 📂 Project Structure

```
udhaya/
├── android/                          # Complete Android Studio Native Project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml   # App permissions & activities
│   │   │   ├── java/com/udhayanetram/app/
│   │   │   │   ├── MainActivity.java # WebView, PDF Downloader & Navigation
│   │   │   │   └── SplashActivity.java # Animated splash screen
│   │   │   └── res/                  # Icons, layouts, themes, colors & Telugu strings
│   │   └── build.gradle              # App build config (SDK 34)
│   ├── build.gradle                  # Project build config
│   ├── gradlew / gradlew.bat         # Gradle wrapper executables
│   └── settings.gradle
├── .github/workflows/
│   └── build-apk.yml                 # Automated Cloud APK Builder
├── public/
│   ├── manifest.json                 # PWA Web App Manifest
│   └── sw.js                         # Service Worker for offline caching
├── build_apk.bat                     # 1-Click Builder Assistant
└── APK_BUILD_GUIDE.md                # This guide
```

---

## 📲 How to Install the APK on Your Android Phone

1. Transfer `UdhayaNetram-Debug.apk` to your phone.
2. Tap the APK file in your phone's **Files** or **Downloads** app.
3. If prompted with *"For your security, your phone is not allowed to install unknown apps from this source"*, tap **Settings** -> enable **Allow from this source**.
4. Tap **Install**.
5. Tap **Open** to launch **ఉదయ నేత్రం**!
