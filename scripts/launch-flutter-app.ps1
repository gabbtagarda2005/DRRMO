# Picks the best Flutter device: Windows desktop if VS is installed, otherwise Chrome.
# Usage: .\launch-flutter-app.ps1 Citizen|Responder
#    or: .\launch-flutter-app.ps1 -AppDir mobile\citizen_app -AppName 'DRRMO Citizen'
param(
    [Parameter(Position = 0)]
    [ValidateSet('Citizen', 'Responder')]
    [string]$App,

    [string]$AppDir,
    [string]$AppName
)

switch ($App) {
    'Citizen' {
        $AppDir = 'mobile\citizen_app'
        if (-not $AppName) { $AppName = 'DRRMO Citizen' }
    }
    'Responder' {
        $AppDir = 'mobile\responder_app'
        if (-not $AppName) { $AppName = 'DRRMO Responder' }
    }
}

if (-not $AppDir) {
    Write-Host 'ERROR: Specify -App Citizen|Responder or -AppDir <path>.' -ForegroundColor Red
    exit 1
}

if (-not $AppName) { $AppName = 'DRRMO Mobile App' }

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$appPath = Join-Path $root $AppDir

if (-not (Test-Path $appPath)) {
    Write-Host "ERROR: App folder not found: $appPath" -ForegroundColor Red
    exit 1
}

Set-Location $appPath

function Test-WindowsDesktopToolchain {
    $vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    if (-not (Test-Path $vswhere)) { return $false }
    $installPath = & $vswhere -latest -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath 2>$null
    return [bool]$installPath
}

Write-Host ""
Write-Host "=== $AppName ===" -ForegroundColor Cyan
Write-Host "Folder: $appPath" -ForegroundColor Gray
Write-Host ""

if (Test-WindowsDesktopToolchain) {
    Write-Host "Launching on Windows desktop..." -ForegroundColor Green
    & flutter run -d windows
} else {
    Write-Host "Visual Studio C++ tools not found." -ForegroundColor Yellow
    Write-Host "Windows desktop builds need: Visual Studio -> Desktop development with C++" -ForegroundColor Yellow
    Write-Host "Download: https://visualstudio.microsoft.com/downloads/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Launching in Chrome instead (requires backend running on port 5000)..." -ForegroundColor Green
    & flutter run -d chrome
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Flutter exited with code $LASTEXITCODE" -ForegroundColor Red
    pause
}
