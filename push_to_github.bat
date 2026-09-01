@echo off
title Push Udhaya Netram to GitHub
cls
echo ====================================================================
echo      PUSHING UDHAYA NETRAM TO GITHUB REPOSITORY
echo      Repository: https://github.com/suryamanikanta2007-oss/udhaya_netra.git
echo ====================================================================
echo.
echo Pushing branch 'main' to GitHub...
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ====================================================================
    echo [OK] SUCCESS! Pushed to GitHub successfully!
    echo [i] View repository: https://github.com/suryamanikanta2007-oss/udhaya_netra
    echo ====================================================================
) else (
    echo [!] Push encountered an authentication step. If prompted in browser, please authorize GitHub.
)
echo.
pause
