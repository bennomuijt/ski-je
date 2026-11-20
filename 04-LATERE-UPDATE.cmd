@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title SKI-je - Nieuwe versie publiceren
if not exist node_modules\.bin\wrangler.cmd (
 echo Voer eerst 01-INSTALLATIE-EN-INLOGGEN.cmd uit in deze map.
 goto einde
)
call npm run check
if errorlevel 1 goto mislukt
call npx wrangler deploy
if errorlevel 1 goto mislukt
echo.
echo Klaar. De bestaande Cloudflare-URL blijft normaal hetzelfde.
goto einde
:mislukt
echo Update niet gelukt, controleer de foutmelding.
:einde
pause
