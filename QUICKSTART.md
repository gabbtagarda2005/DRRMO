# DRRMO System - Quick Start Guide

## Project Overview

The DRRMO (Disaster Response and Risk Management Office) System is a comprehensive disaster management platform featuring:

- **Backend**: Node.js + Express + MongoDB + Socket.io
- **Frontend Apps**: 
  - Admin Dashboard (React)
  - DRRMO Officer Dashboard
  - Responder Mobile App
  - Barangay Coordinator App
  - Citizen Progressive Web App

## Prerequisites

- Node.js 16+ and npm 8+
- MongoDB 4.4+ (local or Docker)
- Git
- A code editor (VS Code recommended)

## Installation Steps

### 1. Clone and Setup

```bash
# Clone repository
git clone <repository-url>
cd DRRMO

# Install root dependencies (if using monorepo setup)
npm install
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp ../.env.example .env

# Edit .env with your configuration
# Important: Set MONGODB_URI and JWT_SECRET
nano .env

# Build TypeScript
npm run build

# Start development server
npm run dev
# Backend now runs on http://localhost:5000
```

### 3. Frontend Setup (Admin App)

```bash
cd frontend/admin-app

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
EOF

# Start development server
npm run dev
# Frontend now runs on http://localhost:3000
```

### 4. Verify Installation

**Backend Check:**
```bash
curl http://localhost:5000/api/health
# Should respond with: {"status":"ok"}
```

**Frontend Check:**
- Open http://localhost:3000 in your browser
- You should see the login page

## MongoDB Setup

### Quick Option: Docker

```bash
docker run -d \
  --name drrmo-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin \
  mongo:latest
```

Then update `.env`:
```
MONGODB_URI=mongodb://admin:admin@localhost:27017/drrmo
```

### Alternative: Local Installation

1. Download and install from https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. Connect with URI: `mongodb://localhost:27017/drrmo`

## Default Credentials

After database migration, use:
- **Email**: admin@drrmo.gov.ph
- **Password**: Admin@123456

## Project Structure

```
DRRMO/
├── backend/                    # Express.js server
│   ├── src/
│   │   ├── models/            # MongoDB schemas
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth, validation, etc.
│   │   └── server.ts          # Main server file
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── admin-app/             # Main admin dashboard
│   ├── drrmo-officer-app/     # Officer dashboard
│   ├── responder-app/         # Responder application
│   ├── barangay-app/          # Barangay app
│   └── citizen-pwa-app/       # Citizen PWA
│
├── shared/                    # Shared types and utilities
│   ├── constants/
│   ├── types/
│   └── utils/
│
├── database/                  # Database setup
│   ├── schema.sql
│   └── migrations/
│
└── docs/                      # Documentation
```

## Common Commands

### Backend

```bash
npm run dev       # Start dev server
npm run build     # Build TypeScript
npm run start     # Run built version
npm run lint      # Run ESLint
npm run db:migrate  # Run migrations
```

### Frontend

```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token

### Users
- `GET /api/users` - List users
- `GET /api/users/me` - Get current user
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user

### Incidents
- `GET /api/incidents` - List incidents
- `POST /api/incidents` - Create incident
- `GET /api/incidents/:id` - Get incident details
- `PUT /api/incidents/:id` - Update incident

### Reports
- `GET /api/reports` - List reports
- `POST /api/reports` - Create report
- `GET /api/reports/:id` - Get report details

### Audit Logs
- `GET /api/audit-logs` - List activity logs

## Real-Time Events (Socket.io)

The system uses Socket.io for real-time updates:

```typescript
// Connect to WebSocket
const socket = io('ws://localhost:5000');

// Listen for events
socket.on('incident-created', (incident) => {
  console.log('New incident:', incident);
});

socket.on('incident-updated', (incident) => {
  console.log('Updated incident:', incident);
});
```

## Troubleshooting

### Port Already in Use

```bash
# macOS/Linux: Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Windows: Find and kill process
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### MongoDB Connection Failed

1. Verify MongoDB is running
2. Check connection string in `.env`
3. Try connecting with `mongosh localhost`

### Frontend Can't Connect to Backend

1. Verify backend is running on port 5000
2. Check `VITE_API_URL` in `.env.local`
3. Check browser console for CORS errors
4. Verify firewall isn't blocking port 5000

### Clear Session/Cache

```javascript
// In browser console
localStorage.clear()
sessionStorage.clear()
location.reload()
```

## Next Steps

1. Read [ENVIRONMENT_SETUP.md](./docs/ENVIRONMENT_SETUP.md) for detailed configuration
2. Check [API.md](./docs/api.md) for API documentation
3. Review [DEPLOYMENT.md](./docs/deployment.md) for production setup
4. Set up additional frontend apps as needed

## Support

For issues or questions:
1. Check documentation in `/docs` folder
2. Review error messages in browser console and server logs
3. Verify all prerequisites are installed
4. Check that ports 5000, 3000-3004 are available

---

**Last Updated**: 2024
**Version**: 1.0.0
