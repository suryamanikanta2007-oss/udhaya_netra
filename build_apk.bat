@echo off
title Udhaya Netram - Android APK Builder
cls
echo ====================================================================
echo      UDHAYA NETRAM (ఉదయ నేత్రం) - ANDROID APK BUILD ASSISTANT
echo ====================================================================
echo.
echo Select an option:
echo.
echo   [1] (RECOMMENDED) Build APK in GitHub Cloud & Download
echo       - Zero setup required (No Android Studio/Java needed on PC)
echo       - Automatically compiles and gives you UdhayaNetram.apk
echo.
echo   [2] Build APK Locally using Gradle (Requires Android SDK/Java)
echo.
echo   [3] Open Project in Android Studio (Folder: ./android)
echo.
echo   [4] Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto CLOUD_BUILD
if "%choice%"=="2" goto LOCAL_BUILD
if "%choice%"=="3" goto OPEN_STUDIO
if "%choice%"=="4" exit
goto INVALID

:CLOUD_BUILD
echo.
echo ====================================================================
echo   TRIGGERING AUTOMATED CLOUD APK BUILD ON GITHUB...
echo ====================================================================
echo.
git add .
git commit -m "feat(mobile): Add Android APK project and Cloud Build workflow"
git push origin main
echo.
echo [✓] Pushed to GitHub successfully!
echo [i] GitHub is now building your Android APK in the cloud.
echo [i] Opening GitHub Actions in your browser...
start https://github.com/suryamanikanta2007-oss/udhaya_netra/actions
echo.
echo Steps to download your APK:
echo 1. Click the latest 'Build Udhaya Netram Android APK' workflow run.
echo 2. Scroll down to 'Artifacts' and click 'UdhayaNetram-APK' to download.
echo    Or go to Releases: https://github.com/suryamanikanta2007-oss/udhaya_netra/releases
echo.
pause
exit /b

:LOCAL_BUILD
echo.
echo ====================================================================
echo   BUILDING ANDROID APK LOCALLY...
echo ====================================================================
echo.
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% equ 0 (
    echo.
    echo [✓] Local APK Build Successful!
    echo [i] Your APK is located at:
    echo     android\app\build\outputs\apk\debug\
    explorer app\build\outputs\apk\debug\
) else (
    echo.
    echo [X] Local build failed. Java or Android SDK may not be configured in PATH.
    echo [i] Please use Option [1] to build in the cloud for free with zero setup!
)
cd ..
pause
exit /b

:OPEN_STUDIO
echo.
echo Opening Android project folder...
start explorer "%~dp0android"
echo.
echo [i] Open Android Studio, click "Open", and select the "android" folder inside this project.
pause
exit /b

:INVALID
echo Invalid choice.
pause
