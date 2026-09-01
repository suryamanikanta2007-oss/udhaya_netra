@echo off
title Udhaya Netram - Deployment Assistant
cls
echo ====================================================================
echo      UDHAYA NETRAM (ఉదయ నేత్రం) - 1-CLICK DEPLOYMENT ASSISTANT
echo ====================================================================
echo.
echo Select where you want to deploy:
echo.
echo   [1] GitHub Pages / GitHub Repository (Free ^& Automated)
echo   [2] Firebase Hosting (https://udhayanetram.web.app)
echo   [3] Vercel (https://vercel.com)
echo   [4] Netlify (https://netlify.com)
echo   [5] Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto DEPLOY_GITHUB
if "%choice%"=="2" goto DEPLOY_FIREBASE
if "%choice%"=="3" goto DEPLOY_VERCEL
if "%choice%"=="4" goto DEPLOY_NETLIFY
if "%choice%"=="5" exit
goto INVALID

:DEPLOY_GITHUB
echo.
echo ====================================================================
echo   DEPLOY TO GITHUB & GITHUB PAGES
echo ====================================================================
echo.
set /p repo_url="Enter your GitHub Repository URL (e.g. https://github.com/username/udhayanetram.git): "
if "%repo_url%"=="" (
    echo Error: GitHub repository URL cannot be empty.
    pause
    exit /b
)
git remote remove origin >nul 2>&1
git remote add origin %repo_url%
git branch -M main
git push -u origin main
echo.
echo [✓] Pushed to GitHub successfully!
echo [i] GitHub Actions will automatically deploy to GitHub Pages under: Settings -^> Pages
pause
exit /b

:DEPLOY_FIREBASE
echo.
echo ====================================================================
echo   DEPLOY TO FIREBASE HOSTING (udhayanetram)
echo ====================================================================
echo.
echo Running Firebase deploy...
npx -y firebase-tools deploy --only hosting
pause
exit /b

:DEPLOY_VERCEL
echo.
echo ====================================================================
echo   DEPLOY TO VERCEL
echo ====================================================================
echo.
npx -y vercel --prod
pause
exit /b

:DEPLOY_NETLIFY
echo.
echo ====================================================================
echo   DEPLOY TO NETLIFY
echo ====================================================================
echo.
npx -y netlify-cli deploy --prod --dir=public
pause
exit /b

:INVALID
echo Invalid option selected.
pause
