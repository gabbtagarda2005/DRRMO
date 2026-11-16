@echo off

echo Starting DRRMO Disaster Management System...

echo Opening backend, web portals, and Flutter mobile apps.

echo.

echo Ensure MongoDB is running and you have run setup.bat first.

echo.



call :FreePort 5000
call :FreePort 3000
call :FreePort 3001
call :FreePort 3003

echo.
start "Backend" cmd /k "cd /d %~dp0backend && npm run dev"
start "Admin App" cmd /k "cd /d %~dp0frontend\admin-app && npm run dev"
start "DRRMO Officer App" cmd /k "cd /d %~dp0frontend\drrmo-officer-app && npm run dev"
start "Barangay App" cmd /k "cd /d %~dp0frontend\barangay-app && npm run dev"
start "Citizen App" cmd /k "cd /d %~dp0 && powershell -ExecutionPolicy Bypass -File scripts\launch-flutter-app.ps1 -App Citizen"
start "Responder App" cmd /k "cd /d %~dp0 && powershell -ExecutionPolicy Bypass -File scripts\launch-flutter-app.ps1 -App Responder"



echo.

echo Started:

echo   Backend API       http://127.0.0.1:5000
echo   Admin App         http://localhost:3000
echo   Officer App       http://localhost:3001
echo   Barangay App      http://localhost:3003

echo   Citizen Mobile    Chrome or Windows desktop

echo   Responder Mobile  Chrome or Windows desktop

echo.

echo Mobile: uses Windows desktop if Visual Studio C++ is installed, else Chrome.

echo Press any key to exit this launcher (services keep running).

pause

goto :EOF

:FreePort
set PORT=%1
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT%" ^| findstr LISTENING') do (
    echo Stopping process %%P on port %PORT%...
    taskkill /F /PID %%P >nul 2>&1
)
goto :EOF

