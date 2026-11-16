# DRRMO System Setup Script for Windows
# Installs dependencies for all components of the DRRMO system

$ErrorActionPreference = 'Stop'

Write-Host 'Setting up DRRMO Disaster Management System...' -ForegroundColor Green

function Fail([string]$message) {
    Write-Host "ERROR: $message" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Fail 'Node.js is not installed. Please install Node.js 18+ first.'
}

$nodeVersion = (& node -v).Trim()
if ($nodeVersion -notmatch '^v(\d+)') {
    Fail "Unable to parse Node.js version. Found: $nodeVersion"
}

$nodeMajor = [int]$matches[1]
if ($nodeMajor -lt 18) {
    Fail "Node.js version 18+ is required. Current version: $nodeVersion"
}

Write-Host "Node.js version check passed ($nodeVersion)" -ForegroundColor Green

function Install-Dependencies([string]$folder) {
    $fullPath = Join-Path $PSScriptRoot $folder
    if (-not (Test-Path $fullPath)) {
        Fail "Folder not found: $fullPath"
    }

    Write-Host "Installing dependencies in $folder..." -ForegroundColor Yellow
    Push-Location $fullPath
    try {
        if (Get-Command pnpm -ErrorAction SilentlyContinue) {
            & pnpm install
        } else {
            & npm install
        }
        if ($LASTEXITCODE -ne 0) {
            Fail ("npm/pnpm install failed in {0} (exit code {1})" -f $folder, $LASTEXITCODE)
        }
        Write-Host "Dependencies installed in $folder" -ForegroundColor Green
    } catch {
        Fail ("Failed to install dependencies in {0}: {1}" -f $folder, $_.Exception.Message)
    } finally {
        Pop-Location
    }
}

Install-Dependencies 'backend'

Install-Dependencies 'frontend\shared-ui'

function Install-FlutterDependencies([string]$folder) {
    $fullPath = Join-Path $PSScriptRoot $folder
    if (-not (Test-Path $fullPath)) {
        Fail "Folder not found: $fullPath"
    }

    if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
        Fail 'Flutter SDK is not installed. Install from https://docs.flutter.dev/get-started/install'
    }

    Write-Host "Installing Flutter dependencies in $folder..." -ForegroundColor Yellow
    Push-Location $fullPath
    try {
        & flutter pub get
        if ($LASTEXITCODE -ne 0) {
            Fail ("flutter pub get failed in {0} (exit code {1})" -f $folder, $LASTEXITCODE)
        }
        Write-Host "Dependencies installed in $folder" -ForegroundColor Green
    } catch {
        Fail ("Failed to install Flutter dependencies in {0}: {1}" -f $folder, $_.Exception.Message)
    } finally {
        Pop-Location
    }
}

$mobileApps = @(
    'mobile\drrmo_core',
    'mobile\citizen_app',
    'mobile\responder_app'
)

foreach ($app in $mobileApps) {
    Install-FlutterDependencies $app
}

$frontendApps = @(
    'frontend\admin-app',
    'frontend\drrmo-officer-app',
    'frontend\barangay-app'
)

foreach ($app in $frontendApps) {
    Install-Dependencies $app
}

Write-Host ''
Write-Host 'Setup complete!' -ForegroundColor Green
Write-Host ''
Write-Host 'Next steps:' -ForegroundColor Cyan
Write-Host '1. Create .env files in each frontend app directory if needed' -ForegroundColor White
Write-Host '2. Set up your database using schema.sql in the database folder' -ForegroundColor White
Write-Host '3. Run .\run-all.bat or .\run-all.ps1 to start the entire system' -ForegroundColor White
Write-Host ''
Write-Host 'Apps will run on:' -ForegroundColor Cyan
Write-Host '- Backend API: http://localhost:5000' -ForegroundColor White
Write-Host '- Admin App: http://localhost:3000' -ForegroundColor White
Write-Host '- DRRMO Officer App: http://localhost:3001' -ForegroundColor White
Write-Host '- Barangay App: http://localhost:3003' -ForegroundColor White
Write-Host '- Citizen Mobile (Flutter): cd mobile\citizen_app && flutter run' -ForegroundColor White
Write-Host '- Responder Mobile (Flutter): cd mobile\responder_app && flutter run' -ForegroundColor White
