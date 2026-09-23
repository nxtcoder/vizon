@echo off
REM Run this AFTER installing Git. Double-click or run from cmd: push-to-github.bat
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
  echo Git not found. Install from https://git-scm.com/download/win then run this again.
  pause
  exit /b 1
)

if not exist .git (
  echo Initializing git and adding remote...
  git init
  git remote add origin https://github.com/Pranshu115/vizon.git
  git branch -M main
)

git add -A
git status
echo.
set /p OK="Commit and push these changes? (y/n): "
if /i not "%OK%"=="y" exit /b 0

git commit -m "Updates: Eicher 2059XP single listing, console fix, memory/watch fixes, seed scripts"
git push -u origin main
echo.
echo Done. If push failed, check docs\PUSH_TO_GITHUB.md for login/token steps.
pause
