@echo off
setlocal
cd /d "%~dp0"
title Udhaya Netram - Windows EXE Compiler
cls
echo ====================================================================
echo      UDHAYA NETRAM - WINDOWS DESKTOP (.EXE) BUILDER
echo ====================================================================
echo.
echo Compiling native Windows Desktop executable...
echo.

"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /nologo /target:winexe /out:"%~dp0UdhayaNetram.exe" /reference:System.Windows.Forms.dll,System.Drawing.dll,System.dll "%~dp0UdhayaNetramApp.cs"

if %ERRORLEVEL% equ 0 (
    echo.
    echo ====================================================================
    echo [OK] SUCCESS! UdhayaNetram.exe has been compiled successfully.
    echo ====================================================================
    echo.
    echo Location: %~dp0UdhayaNetram.exe
    echo.
    echo Opening file in Windows Explorer...
    explorer /select,"%~dp0UdhayaNetram.exe"
) else (
    echo.
    echo [ERROR] Compilation failed.
)
pause
