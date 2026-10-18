@echo off
setlocal
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22.12 or newer with npm, then run this file again.
  pause
  exit /b 1
)
echo Installing dependencies. Internet access is required.
call npm install
if errorlevel 1 goto fail
call npm run dist:win
if errorlevel 1 goto fail
echo Installer created in the release folder.
pause
exit /b 0
:fail
echo Build failed. Read the error above. No installer was confirmed.
pause
exit /b 1
