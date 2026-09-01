@echo off
title Udhaya Netram Local Server
cls
echo ==========================================================
echo   UDHAYA NETRAM (ఉదయ నేత్రం) - Starting Local Server
echo ==========================================================
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
