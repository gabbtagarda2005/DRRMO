@echo off
echo Stopping any process on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do (
  echo Killing PID %%a
  taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Starting backend with latest CORS settings...
start "Backend" cmd /k "cd /d %~dp0backend && npm run dev"

echo.
echo Wait for "Server running on port 5000" then retry mobile login.
echo Test in browser: http://127.0.0.1:5000/api/health
pause
