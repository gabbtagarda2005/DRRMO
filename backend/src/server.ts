// Must be the first import: ESM hoists imports, so env has to load before any
// module that reads process.env at import time (rate limiter, CORS, paths).
import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { assertProductionEnv, getJwtSecret } from './config/env.js';
import { UPLOAD_DIR } from './config/paths.js';
import { publicRouter, systemRouter } from './routes/system.js';
import { seedDemoDataIfEmpty } from './services/demoSeed.js';

import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { setSocketServer } from './utils/socket.js';
import { getCorsOptions, getSocketCorsOrigin } from './config/cors.js';
import { Incident } from './models/Incident.js';
import { ROLES } from './constants/roles.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import incidentRoutes from './routes/incidents.js';
import responderRoutes from './routes/responders.js';
import evacuationRoutes from './routes/evacuations.js';
import resourceRoutes from './routes/resources.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/reports.js';
import auditRoutes from './routes/audit.js';
import barangayRoutes from './routes/barangays.js';
import emergencyRequestsRoutes from './routes/emergencyRequests.js';
import appConfigRoutes from './routes/appConfig.js';

assertProductionEnv();

const app: Express = express();
// Render / Vercel / most PaaS terminate TLS at a proxy; trust the first hop so
// rate limiting and logs see the real client IP instead of the proxy's.
app.set('trust proxy', 1);
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: getSocketCorsOrigin(),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

setSocketServer(io);

interface SocketUser {
  id: string;
  email: string;
  role: string;
}

interface AuthedSocket extends Socket {
  data: { user: SocketUser };
}

function isValidLatLng(latitude: unknown, longitude: unknown): latitude is number {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

// Reject any Socket.IO connection that doesn't carry a valid JWT.
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    const decoded = jwt.verify(token, getJwtSecret()) as SocketUser;
    (socket as AuthedSocket).data.user = decoded;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});

const isDev = process.env.NODE_ENV !== 'production';

// Middleware
app.use(
  isDev
    ? helmet({
        crossOriginResourcePolicy: false,
        contentSecurityPolicy: false,
      })
    : helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
      })
);
app.use(cors(getCorsOptions()));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/api', apiRateLimiter);
app.use('/uploads', express.static(UPLOAD_DIR));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drrmo');
    logger.info('MongoDB connected successfully');
    await seedDemoDataIfEmpty().catch((error) => logger.error('Demo seed failed:', error));
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Socket.IO Setup
io.on('connection', (rawSocket) => {
  const socket = rawSocket as AuthedSocket;
  const user = socket.data.user;
  logger.info(`User connected: ${socket.id} (${user.email}, ${user.role})`);

  socket.join(`user_${user.id}`);
  if (user.role === ROLES.ADMIN || user.role === ROLES.DRRMO_OFFICER) {
    socket.join('municipality');
  }

  socket.on('join_incident', async (incidentId: string) => {
    try {
      if (user.role === ROLES.ADMIN || user.role === ROLES.DRRMO_OFFICER) {
        socket.join(`incident_${incidentId}`);
        return;
      }
      const incident = await Incident.findById(incidentId).select('reportedBy assignedResponders');
      if (!incident) {
        socket.emit('join_denied', { incidentId, reason: 'not_found' });
        return;
      }
      const isReporter = incident.reportedBy.toString() === user.id;
      const isAssigned = incident.assignedResponders.some((r) => r.toString() === user.id);
      if (isReporter || isAssigned) {
        socket.join(`incident_${incidentId}`);
      } else {
        socket.emit('join_denied', { incidentId, reason: 'forbidden' });
      }
    } catch {
      socket.emit('join_denied', { incidentId, reason: 'error' });
    }
  });

  socket.on('responder_location_update', (data: { latitude?: unknown; longitude?: unknown }) => {
    if (user.role !== ROLES.RESPONDER) return;
    if (!isValidLatLng(data?.latitude, data?.longitude)) return;
    io.to('municipality').emit('responder_location_updated', {
      responderId: user.id,
      latitude: data.latitude,
      longitude: data.longitude,
    });
  });

  socket.on('incident_status_update', (data: { incidentId?: string }) => {
    if (!data?.incidentId) return;
    io.to(`incident_${data.incidentId}`).emit('incident_updated', data);
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/responders', responderRoutes);
app.use('/api/evacuations', evacuationRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/barangays', barangayRoutes);
app.use('/api/emergency-requests', emergencyRequestsRoutes);
app.use('/api/app', appConfigRoutes);
app.use('/api/public', publicRouter);
app.use('/api/system', systemRouter);

app.get('/', (_req: Request, res: Response) => {
  res.json({ name: 'DRRMO API', status: 'OK', health: '/api/health' });
});

// Health check endpoint (used by Render's health checks)
app.get('/api/health', (_req: Request, res: Response) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'OK' : 'DEGRADED',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export { app, io };
