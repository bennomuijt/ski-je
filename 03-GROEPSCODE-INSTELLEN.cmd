@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title SKI-je - Beheerderscode beveiligen
echo Dit is de geheime code waarmee ALLEEN JIJ een nieuwe skigroep aanmaakt.
echo Kies een UNIEKE code van minimaal 16 tekens.
echo Typ de code in de volgende terminal-prompt. Plak deze niet in ChatGPT.
echo Druk daarna op Enter. De code wordt als Cloudflare Secret opgeslagen.
echo.
call npx wrangler secret put GROUP_CREATE_SECRET
if errorlevel 1 (
 echo Instellen is niet gelukt. Publiceer eerst met script 02.
 goto einde
)
echo.
echo GELUKT. Check in de browser https://[jouw-werkelijke-adres]/api/health
echo Daar moet createConfigured true zijn.
:einde
pause
