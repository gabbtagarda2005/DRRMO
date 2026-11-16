@echo off
echo Seeding DRRMO demo user accounts...
cd /d %~dp0backend
call npm run seed
echo.
echo Done. See DEMO_ACCOUNTS.txt in the project root for login details.
pause
