# Check if MongoDB is running
Write-Host "Checking MongoDB connection..." -ForegroundColor Yellow

try {
    $mongoCommand = Get-Command mongosh -ErrorAction SilentlyContinue
    if (-not $mongoCommand) {
        $mongoCommand = Get-Command mongo -ErrorAction SilentlyContinue
    }

    if ($mongoCommand) {
        # Try to connect to MongoDB
        $testConnection = & $mongoCommand.Name --eval "db.runCommand('ping')" --quiet 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ MongoDB is running and accessible" -ForegroundColor Green
        } else {
            Write-Host "❌ MongoDB is not responding. Please start MongoDB service." -ForegroundColor Red
            Write-Host "To start MongoDB on Windows:" -ForegroundColor Yellow
            Write-Host "1. If using MongoDB Community Server: net start MongoDB" -ForegroundColor White
            Write-Host "2. If using Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest" -ForegroundColor White
            Write-Host "3. Or install MongoDB from: https://www.mongodb.com/try/download/community" -ForegroundColor White
            exit 1
        }
    } else {
        Write-Host "❌ MongoDB client not found. Please install MongoDB." -ForegroundColor Red
        Write-Host "Download from: https://www.mongodb.com/try/download/community" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "❌ Error checking MongoDB: $_" -ForegroundColor Red
    Write-Host "Please ensure MongoDB is installed and running on localhost:27017" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green