import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { authMiddleware, rbacMiddleware, AuthRequest } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';
import { Incident } from '../models/Incident.js';
import { EvacuationCenter } from '../models/EvacuationCenter.js';
import { Responder } from '../models/Responder.js';
import { Barangay } from '../models/Barangay.js';
import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Resource } from '../models/Resource.js';
import { getSocketServer } from '../utils/socket.js';

/**
 * Public, unauthenticated aggregate figures for the marketing / landing page.
 * Only counts are exposed — never names, coordinates or contact details.
 */
export const publicRouter = Router();

const ACTIVE_STATUSES = ['reported', 'verified', 'responding', 'in_progress'];
const OVERVIEW_TTL_MS = 30_000;
let overviewCache: { at: number; body: unknown } | null = null;

publicRouter.get('/overview', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (overviewCache && Date.now() - overviewCache.at < OVERVIEW_TTL_MS) {
      res.set('Cache-Control', 'public, max-age=30');
      return res.json(overviewCache.body);
    }

    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [activeIncidents, resolved30d, centers, respondersReady, barangays] = await Promise.all([
      Incident.countDocuments({ status: { $in: ACTIVE_STATUSES } }),
      Incident.countDocuments({ status: { $in: ['resolved', 'closed'] }, updatedAt: { $gte: since30d } }),
      EvacuationCenter.aggregate([
        { $match: { status: 'operational' } },
        { $group: { _id: null, count: { $sum: 1 }, capacity: { $sum: '$capacity' }, occupancy: { $sum: '$currentOccupancy' } } },
      ]),
      Responder.countDocuments({ status: { $in: ['available', 'on_duty'] } }),
      Barangay.countDocuments(),
    ]);

    const shelter = centers[0] ?? { count: 0, capacity: 0, occupancy: 0 };
    const body = {
      status: mongoose.connection.readyState === 1 ? 'operational' : 'degraded',
      activeIncidents,
      resolvedLast30Days: resolved30d,
      evacuationCenters: shelter.count,
      shelterCapacity: shelter.capacity,
      shelterOccupancy: shelter.occupancy,
      respondersReady,
      barangays,
      updatedAt: new Date().toISOString(),
    };

    overviewCache = { at: Date.now(), body };
    res.set('Cache-Control', 'public, max-age=30');
    res.json(body);
  } catch (error) {
    next(error);
  }
});

/** Administrator infrastructure view — real numbers replacing the old static cards. */
export const systemRouter = Router();
systemRouter.use(authMiddleware, rbacMiddleware(ROLES.ADMIN));

const DB_STATES: Record<number, string> = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

systemRouter.get('/health', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pingStart = Date.now();
    let dbLatencyMs: number | null = null;
    try {
      await mongoose.connection.db?.admin().ping();
      dbLatencyMs = Date.now() - pingStart;
    } catch {
      dbLatencyMs = null;
    }

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [usersByRole, activeUsers, suspendedUsers, logins24h, actions24h, incidents, resources] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      User.countDocuments({ isActive: { $ne: false } }),
      User.countDocuments({ isActive: false }),
      ActivityLog.countDocuments({ action: 'login', createdAt: { $gte: since24h } }),
      ActivityLog.countDocuments({ createdAt: { $gte: since24h } }),
      Incident.countDocuments(),
      Resource.countDocuments(),
    ]);

    let realtimeSessions = 0;
    try {
      realtimeSessions = getSocketServer().engine.clientsCount;
    } catch {
      realtimeSessions = 0;
    }

    const mem = process.memoryUsage();
    res.json({
      api: {
        uptimeSeconds: Math.round(process.uptime()),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        memoryMb: Math.round(mem.rss / 1024 / 1024),
      },
      database: {
        state: DB_STATES[mongoose.connection.readyState] ?? 'unknown',
        latencyMs: dbLatencyMs,
        name: mongoose.connection.name,
      },
      realtime: { sessions: realtimeSessions },
      users: {
        total: usersByRole.reduce((sum, r) => sum + r.count, 0),
        active: activeUsers,
        suspended: suspendedUsers,
        byRole: Object.fromEntries(usersByRole.map((r) => [r._id, r.count])),
      },
      activity: { logins24h, actions24h },
      records: { incidents, resources },
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});
