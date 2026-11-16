# Environment Setup Guide

## Overview
This document provides instructions for setting up environment variables for the DRRMO (Disaster Response and Risk Management Office) system, which consists of a Node.js/Express backend and multiple React frontend applications.

## Project Structure
```
backend/           - Express.js server
frontend/
├── admin-app/           - Admin dashboard
├── drrmo-officer-app/   - DRRMO officer dashboard
├── responder-app/       - Responder mobile-friendly app
├── barangay-app/        - Barangay coordinator app
└── citizen-pwa-app/     - Citizen progressive web app
shared/           - Shared types and utilities
```

## Setup Instructions

### 1. Backend Environment Setup

**Create `.env` file in the project root (backend directory):**

```bash
# Navigate to backend directory
cd backend

# Copy the example environment file
cp ../.env.example .env

# Edit the .env file with your actual values
# nano .env  (or use your preferred text editor)
```

**Required Backend Variables:**
- `NODE_ENV`: Set to `development` for local, `production` for deployment
- `PORT`: Backend server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secure random string for JWT signing (generate with `openssl rand -base64 32`)
- `JWT_EXPIRE`: Token expiration time (format: "7d", "24h", etc.)

**Optional Backend Variables:**
- `EMAIL_*`: SMTP configuration for email notifications
- `LOG_LEVEL`: Logging verbosity (error, warn, info, debug)
- `RATE_LIMIT_*`: API rate limiting configuration

### 2. Frontend Environment Setup

Each frontend application needs its own `.env.local` file with API and WebSocket URLs.

**Create `.env.local` for Admin App:**

```bash
cd frontend/admin-app
cat > .env.local << EOF
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
EOF
```

**Repeat for other frontend apps:**
- `frontend/drrmo-officer-app`
- `frontend/responder-app`
- `frontend/barangay-app`
- `frontend/citizen-pwa-app`

All should point to the same backend API URL.

### 3. Database Setup

#### MongoDB Local Setup

**Option A: Using MongoDB Community (Recommended for Development)**

1. **Install MongoDB:**
   - Windows: Download from https://www.mongodb.com/try/download/community
   - macOS: `brew install mongodb-community`
   - Linux: Follow distribution-specific instructions

2. **Start MongoDB:**
   ```bash
   # Windows
   net start MongoDB

   # macOS
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod
   ```

3. **Set MongoDB URI in .env:**
   ```
   MONGODB_URI=mongodb://localhost:27017/drrmo
   ```

**Option B: Using Docker**

```bash
# Pull MongoDB image
docker pull mongo:latest

# Run MongoDB container
docker run -d \
  --name drrmo-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=your_password \
  mongo:latest

# Update .env
MONGODB_URI=mongodb://admin:your_password@localhost:27017/drrmo
```

#### Initialize Database Schema

```bash
# From project root
cd backend

# Run migrations (creates collections and indexes)
npm run db:migrate

# Seed sample data (optional)
npm run db:seed
```

### 4. Security Considerations

#### JWT Secret Generation

Generate a secure JWT secret:

```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

#### File Upload Directory

Create upload directory:

```bash
mkdir -p uploads
chmod 755 uploads
```

#### CORS Configuration

Update `CORS_ORIGIN` in `.env` to include your frontend URLs:

```
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004
```

### 5. Development Server Startup

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run build
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Admin Frontend:**
```bash
cd frontend/admin-app
npm install
npm run dev
# App runs on http://localhost:3000
```

**Terminal 3 - Other Frontends (Optional):**
```bash
cd frontend/[app-name]
npm install
npm run dev
```

### 6. Verify Installation

**Check Backend:**
```bash
curl http://localhost:5000/api/health
# Expected response: { "status": "ok" }
```

**Check Frontend:**
- Admin: http://localhost:3000 (should show login page)
- Officer: http://localhost:3001
- Responder: http://localhost:3002
- Barangay: http://localhost:3003
- Citizen PWA: http://localhost:3004

### 7. Production Deployment

#### Environment Variables for Production

```bash
NODE_ENV=production
MONGODB_URI=mongodb://user:pass@mongo-host:27017/drrmo
JWT_SECRET=[use-secure-random-value]
CORS_ORIGIN=https://admin.drrmo.gov.ph,https://officer.drrmo.gov.ph
```

#### Build Frontend for Production

```bash
# Each frontend app
npm run build

# Output will be in .vinxi/build/client/
```

#### Docker Deployment

See `DEPLOYMENT.md` for full Docker setup instructions.

### 8. Troubleshooting

**MongoDB Connection Failed:**
- Verify MongoDB is running: `mongosh` (or `mongo` for older versions)
- Check `MONGODB_URI` format and credentials
- Ensure port 27017 is not blocked

**Frontend API Connection Failed:**
- Verify backend is running on specified port
- Check `VITE_API_URL` matches backend URL
- Check browser console for CORS errors

**Port Already in Use:**
```bash
# Kill process on port 5000 (macOS/Linux)
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID [PID] /F
```

**JWT Authentication Issues:**
- Clear browser localStorage: `localStorage.clear()`
- Regenerate JWT secret and restart server
- Check token expiration time in `.env`

## Next Steps

1. Verify all services are running and communicating
2. Test login functionality with default admin credentials
3. Run database migrations
4. Configure email settings for notifications (optional)
5. Set up logging and monitoring
6. Review security best practices in documentation

For more information, see:
- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Architecture Documentation](./docs/architecture.md)
