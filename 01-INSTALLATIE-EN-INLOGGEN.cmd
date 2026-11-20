@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title SKI-je - Cloudflare installeren en inloggen
where node >nul 2>&1
if errorlevel 1 (
 echo Node.js niet gevonden. Installeer eerst Node.js LTS vanaf https://nodejs.org/en/download
 goto einde
)
where npm >nul 2>&1
if errorlevel 1 (
 echo npm niet gevonden. Installeer Node.js LTS opnieuw.
 goto einde
)
echo [1/2] Cloudflare hulpmiddel installeren...
call npm install --no-audit --no-fund
if errorlevel 1 (
 echo Installatie niet gelukt. Controleer de internetverbinding.
 goto einde
)
echo.
echo [2/2] Cloudflare-account koppelen. Log in in de browser.
call npx wrangler login
if errorlevel 1 (
 echo Inloggen is niet afgerond.
 goto einde
)
echo.
echo GELUKT: ga verder met 02-PUBLICEREN-NAAR-CLOUDFLARE.cmd
echo.
:einde
pause
