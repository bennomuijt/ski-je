@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title SKI-je - Cloudflare online zetten
if not exist node_modules\.bin\wrangler.cmd (
 echo Wrangler niet gevonden. Voer eerst 01-INSTALLATIE-EN-INLOGGEN.cmd uit.
 goto einde
)
echo [1/2] Broncode en groeptests controleren...
call npm run check
if errorlevel 1 (
 echo Tests niet geslaagd. Er wordt niets gepubliceerd.
 goto einde
)
echo.
echo [2/2] Naar Cloudflare publiceren...
call npx wrangler deploy
if errorlevel 1 (
 echo Publiceren is niet gelukt. Kopieer de foutmelding zonder geheimen.
 goto einde
)
echo.
echo De Cloudflare-URL staat hierboven. Bewaar die.
echo Zet NU de geheime groepscode met 03-GROEPSCODE-INSTELLEN.cmd
echo.
:einde
pause
