# DRRMO System Runner
# This script starts all components of the DRRMO system

Write-Host "🚀 Starting DRRMO Disaster Management System..." -ForegroundColor Green

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
& "$PSScriptRoot\check-prerequisites.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prerequisites check failed. Please resolve the issues above." -ForegroundColor Red
    exit 1
}

# Function to start a service
function Start-Service {
    param (
        [string]$Name,
        [string]$Path,
        [string]$Command
    )

    Write-Host "Starting $Name..." -ForegroundColor Yellow
    try {
        $job = Start-Job -Name $Name -ScriptBlock {
            param($path, $cmd)
            Set-Location $path
            Write-Host "Running in directory: $(Get-Location)" -ForegroundColor Cyan
            Write-Host "Executing: $cmd" -ForegroundColor Cyan
            Invoke-Expression $cmd
        } -ArgumentList $Path, $Command

        Start-Sleep -Seconds 2  # Give it a moment to start

        # Check if job is still running
        if ($job.State -eq 'Running') {
            Write-Host "$Name started successfully (Job ID: $($job.Id))" -ForegroundColor Green
        } else {
            Write-Host "$Name failed to start. Checking output..." -ForegroundColor Red
            $output = Receive-Job -Job $job
            Write-Host "Job output:" -ForegroundColor Red
            Write-Host $output -ForegroundColor Red
            Remove-Job -Job $job -Force
            return $false
        }
    } catch {
        Write-Host "Error starting $Name : $_" -ForegroundColor Red
        return $false
    }
    return $true
}

# Start Backend
$backendStarted = Start-Service -Name "Backend" -Path "$PSScriptRoot\backend" -Command "npm run dev"

# Start Frontend Apps
$frontendApps = @(
    @{Name="Admin App"; Path="$PSScriptRoot\frontend\admin-app"; Port="3000"},
    @{Name="DRRMO Officer App"; Path="$PSScriptRoot\frontend\drrmo-officer-app"; Port="3001"},
    @{Name="Barangay App"; Path="$PSScriptRoot\frontend\barangay-app"; Port="3003"}
)

$frontendStarted = $true
foreach ($app in $frontendApps) {
    $started = Start-Service -Name $app.Name -Path $app.Path -Command "npm run dev"
    if (-not $started) {
        $frontendStarted = $false
    }
}

if (-not $backendStarted -or -not $frontendStarted) {
    Write-Host "" -ForegroundColor Red
    Write-Host "❌ Some services failed to start. Please check the errors above." -ForegroundColor Red
    Write-Host "Try running services individually to debug:" -ForegroundColor Yellow
    Write-Host "  Backend: cd backend && npm run dev" -ForegroundColor White
    Write-Host "  Frontend: cd frontend\[app-name] && npm run dev" -ForegroundColor White
    exit 1
}

Write-Host "" -ForegroundColor White
Write-Host "🎉 All services are starting up!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "Apps will be available at:" -ForegroundColor Cyan
Write-Host "- Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "- Admin App: http://localhost:3000" -ForegroundColor White
Write-Host "- DRRMO Officer App: http://localhost:3001" -ForegroundColor White
Write-Host "- Barangay App: http://localhost:3003" -ForegroundColor White
Write-Host "- Citizen Mobile (Flutter): cd mobile\citizen_app; flutter run" -ForegroundColor White
Write-Host "- Responder Mobile (Flutter): cd mobile\responder_app; flutter run" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow

# Wait for all jobs
try {
    while ($true) {
        $runningJobs = Get-Job | Where-Object { $_.State -eq 'Running' }
        if ($runningJobs.Count -eq 0) {
            Write-Host "All jobs have completed. Exiting..." -ForegroundColor Yellow
            break
        }
        Start-Sleep -Seconds 5
        Write-Host "Active services: $($runningJobs.Count) - $(Get-Date)" -ForegroundColor Gray
    }
} finally {
    Write-Host "Stopping all services..." -ForegroundColor Red
    Get-Job | Stop-Job -ErrorAction SilentlyContinue
    Get-Job | Remove-Job -ErrorAction SilentlyContinue
    Write-Host "All services stopped." -ForegroundColor Red
}