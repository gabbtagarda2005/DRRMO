@echo off

echo DRRMO Flutter Mobile Apps

echo Ensure backend is running: run-all.bat or "cd backend && npm run dev"

echo.



start "Citizen App" cmd /k "cd /d %~dp0 && powershell -ExecutionPolicy Bypass -File scripts\launch-flutter-app.ps1 -App Citizen"

start "Responder App" cmd /k "cd /d %~dp0 && powershell -ExecutionPolicy Bypass -File scripts\launch-flutter-app.ps1 -App Responder"



echo.

echo Launched Citizen and Responder in separate windows.

echo If Visual Studio is not installed, apps open in Chrome automatically.

echo.

pause

