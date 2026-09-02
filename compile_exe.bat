@echo off
title Udhaya Netram - Windows EXE Compiler
cls
echo ====================================================================
echo      UDHAYA NETRAM (ఉదయ నేత్రం) - WINDOWS DESKTOP (.EXE) BUILDER
echo ====================================================================
echo.
echo Compiling native Windows Desktop executable...
echo.

"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /target:winexe /out:UdhayaNetram.exe /reference:System.Windows.Forms.dll,System.Drawing.dll,System.dll UdhayaNetramApp.cs

if %ERRORLEVEL% equ 0 (
    echo.
    echo ====================================================================
    echo [✓] SUCCESS! UdhayaNetram.exe has been compiled successfully.
    echo ====================================================================
    echo.
    echo Location: %~dp0UdhayaNetram.exe
    echo.
    echo Opening file in Windows Explorer...
    explorer /select,"%~dp0UdhayaNetram.exe"
) else (
    echo.
    echo [X] Compilation failed.
)
pause
