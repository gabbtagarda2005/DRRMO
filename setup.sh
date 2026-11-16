#!/bin/bash

# DRRMO System Setup Script
echo "🚀 Setting up DRRMO Disaster Management System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version check passed: $(node -v)"

# Install dependencies for each app
APPS=("admin-app" "drrmo-officer-app" "responder-app" "barangay-app" "citizen-pwa-app")

for app in "${APPS[@]}"; do
    echo "📦 Installing dependencies for $app..."
    cd "frontend/$app"
    if command -v pnpm &> /dev/null; then
        pnpm install
    else
        npm install
    fi
    cd ../..
    echo "✅ $app dependencies installed"
done

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Create .env files in each frontend app directory"
echo "2. Set up your Lovable Cloud database and run the schema.sql"
echo "3. Run 'npm run dev' in each app directory to start development"
echo ""
echo "Apps will run on:"
echo "- Admin App: http://localhost:3000"
echo "- DRRMO Officer App: http://localhost:3001"
echo "- Responder App: http://localhost:3002"
echo "- Barangay App: http://localhost:3003"
echo "- Citizen PWA: http://localhost:3004"