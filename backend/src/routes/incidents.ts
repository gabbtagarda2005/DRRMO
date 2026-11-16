import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, rbacMiddleware, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { Incident } from '../models/Incident.js';
import { Responder } from '../models/Responder.js';
import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { ROLES } from '../constants/roles.js';
import { getSocketServer } from '../utils/socket.js';
import { upload } from '../middleware/upload.js';
import { calculateIncidentPriority } from '../services/priorityEngine.js';
import { canTransition, getNextStatuses, isIncidentStatus } from '../services/incidentStateMachine.js';

const router = Router();

router.use(authMiddleware);

const OFFICERS = [ROLES.ADMIN, ROLES.DRRMO_OFFICER];

/** Incidents are visible to every signed-in role, so only expose non-sensitive person fields. */
const PERSON_SELECT = 'firstName lastName role barangay';
const PERSON_FIELDS = [
  { path: 'reportedBy', select: PERSON_SELECT },
  { path: 'assignedResponders', select: PERSON_SELECT },
  { path: 'verifiedBy', select: PERSON_SELECT },
];

function broadcastIncidentUpdate(incident: any) {
  const io = getSocketServer();
  io.to('municipality').emit('incident_update', incident);
  io.to(`incident_${incident._id}`).emit('incident_update', incident);
}

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, type, severity, barangay, page = 1, limit = 20 } = req.query;
    const filters: Record<string, any> = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (severity) filters.severity = severity;
    if (barangay) filters['location.barangay'] = barangay;

    const pageNumber = Number(page);
    const pageSize = Number(limit);
    const total = await Incident.countDocuments(filters);

    const incidents = await Incident.find(filters)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .populate(PERSON_FIELDS);

    res.json({ data: incidents, page: pageNumber, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    next(error);
  }
});

// Must be registered before `/:id` so it isn't swallowed by the id-param route.
router.get('/stats/summary', rbacMiddleware(...OFFICERS), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [total, byStatusAgg, bySeverityAgg, hourlyAgg] = await Promise.all([
      Incident.countDocuments(),
      Incident.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Incident.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
      Incident.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: { $dateTrunc: { date: '$createdAt', unit: 'hour' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const byStatus: Record<string, number> = {};
    for (const row of byStatusAgg) byStatus[row._id] = row.count;

    const bySeverity: Record<string, number> = {};
    for (const row of bySeverityAgg) bySeverity[row._id] = row.count;

    const now = new Date();
    const hourly: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const bucketStart = new Date(now);
      bucketStart.setMinutes(0, 0, 0);
      bucketStart.setHours(bucketStart.getHours() - i);
      const match = hourlyAgg.find((row: any) => new Date(row._id).getTime() === bucketStart.getTime());
      hourly.push(match ? match.count : 0);
    }

    res.json({ total, byStatus, bySeverity, hourly });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate(PERSON_FIELDS);
    if (!incident) {
      throw new AppError(404, 'Incident record not found');
    }
    res.json(incident);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  [
    body('title').notEmpty(),
    body('description').notEmpty(),
    body('type').notEmpty(),
    body('severity').notEmpty(),
    body('location.latitude').isFloat({ min: -90, max: 90 }),
    body('location.longitude').isFloat({ min: -180, max: 180 }),
    body('location.address').notEmpty(),
    body('location.barangay').notEmpty(),
    body('affectedCount').optional().isInt({ min: 0 }),
    body('injuredCount').optional().isInt({ min: 0 }),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed');
      }

      const { score, level, reason } = calculateIncidentPriority({
        type: req.body.type,
        severity: req.body.severity,
        affectedCount: Number(req.body.affectedCount) || 0,
        injuredCount: Number(req.body.injuredCount) || 0,
        ageMinutes: 0,
      });

      const incidentData = {
        ...req.body,
        reportedBy: req.user?.id,
        mediaUrls: req.body.mediaUrls || [],
        priority: score,
        priorityLevel: level,
        priorityReason: reason,
        priorityOverridden: false,
      };

      const incident = await Incident.create(incidentData);
      await ActivityLog.create({
        userId: req.user!.id,
        action: 'create',
        resourceType: 'Incident',
        resourceId: incident._id.toString(),
        changes: incidentData,
      });

      broadcastIncidentUpdate(incident);

      res.status(201).json(incident);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', rbacMiddleware(...OFFICERS), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const EDITABLE_FIELDS = ['title', 'description', 'type', 'severity', 'affectedCount', 'injuredCount', 'mediaUrls', 'location'];
    const updates: Record<string, any> = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in req.body) updates[field] = req.body[field];
    }

    const incident = await Incident.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate(PERSON_FIELDS);
    if (!incident) {
      throw new AppError(404, 'Incident not found');
    }

    await ActivityLog.create({
      userId: req.user!.id,
      action: 'update',
      resourceType: 'Incident',
      resourceId: incident._id.toString(),
      changes: updates,
    });

    broadcastIncidentUpdate(incident);

    res.json(incident);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/verify', rbacMiddleware(...OFFICERS), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      throw new AppError(404, 'Incident not found');
    }
    if (!canTransition(incident.status, 'verified')) {
      throw new AppError(400, `Cannot verify an incident with status "${incident.status}"`);
    }

    incident.status = 'verified';
    incident.verifiedBy = req.user!.id as any;
    incident.verifiedAt = new Date();
    await incident.save();

    await ActivityLog.create({
      userId: req.user!.id,
      action: 'verify',
      resourceType: 'Incident',
      resourceId: incident._id.toString(),
      changes: { status: 'verified' },
    });

    broadcastIncidentUpdate(incident);

    res.json(incident);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/:id/priority',
  rbacMiddleware(...OFFICERS),
  [body('level').isIn(['low', 'medium', 'high', 'critical']), body('reason').notEmpty()],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'A priority level and reason are required');
      }

      const incident = await Incident.findById(req.params.id);
      if (!incident) {
        throw new AppError(404, 'Incident not found');
      }

      const previousLevel = incident.priorityLevel;
      incident.priorityLevel = req.body.level;
      incident.priorityReason = req.body.reason;
      incident.priorityOverridden = true;
      await incident.save();

      await ActivityLog.create({
        userId: req.user!.id,
        action: 'priority_override',
        resourceType: 'Incident',
        resourceId: incident._id.toString(),
        changes: { previousLevel, newLevel: req.body.level, reason: req.body.reason },
      });

      broadcastIncidentUpdate(incident);

      res.json(incident);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Barangay officials flag a local incident for municipal command attention.
 * Escalation is idempotent and does not change the incident's lifecycle status.
 */
router.post(
  '/:id/escalate',
  rbacMiddleware(ROLES.BARANGAY_OFFICIAL, ...OFFICERS),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const incident = await Incident.findById(req.params.id);
      if (!incident) {
        throw new AppError(404, 'Incident not found');
      }

      if (req.user!.role === ROLES.BARANGAY_OFFICIAL) {
        const me = await User.findById(req.user!.id).select('barangay');
        if (me?.barangay && me.barangay !== incident.location.barangay) {
          throw new AppError(403, 'You can only escalate incidents in your own barangay');
        }
      }

      if (!incident.escalated) {
        incident.escalated = true;
        incident.escalatedAt = new Date();
        incident.escalatedBy = req.user!.id as any;
        await incident.save();

        await ActivityLog.create({
          userId: req.user!.id,
          action: 'update',
          resourceType: 'Incident',
          resourceId: incident._id.toString(),
          changes: { escalated: true, note: req.body?.note },
        });
      }

      const populated = await incident.populate(PERSON_FIELDS);
      broadcastIncidentUpdate(populated);
      res.json(populated);
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:id/assign', rbacMiddleware(...OFFICERS), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { responderIds } = req.body;
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      throw new AppError(404, 'Incident not found');
    }
    if (!canTransition(incident.status, 'responding')) {
      throw new AppError(400, `Cannot assign responders to an incident with status "${incident.status}"`);
    }

    const responders = await Responder.find({ userId: { $in: responderIds } });
    incident.assignedResponders = responders.map((r) => r.userId);
    incident.status = 'responding';
    await incident.save();

    await Responder.updateMany({ userId: { $in: responderIds } }, { status: 'responding' });

    await ActivityLog.create({
      userId: req.user!.id,
      action: 'assign',
      resourceType: 'Incident',
      resourceId: incident._id.toString(),
      changes: { assignedResponders: incident.assignedResponders },
    });

    broadcastIncidentUpdate(incident);

    res.json(incident);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/status', rbacMiddleware(...OFFICERS), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!status || !isIncidentStatus(status)) {
      throw new AppError(400, 'A valid status is required');
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      throw new AppError(404, 'Incident not found');
    }

    if (!canTransition(incident.status, status)) {
      throw new AppError(
        400,
        `Cannot move an incident from "${incident.status}" to "${status}". Valid next steps: ${getNextStatuses(incident.status).join(', ') || 'none (terminal state)'}`
      );
    }

    incident.status = status;
    if (status === 'resolved' || status === 'closed') {
      incident.closedAt = new Date();
    }
    await incident.save();

    await ActivityLog.create({
      userId: req.user!.id,
      action: 'status_change',
      resourceType: 'Incident',
      resourceId: incident._id.toString(),
      changes: { status },
    });

    broadcastIncidentUpdate(incident);

    res.json(incident);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/media', upload.array('media', 5), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      throw new AppError(404, 'Incident not found');
    }

    const files = (req.files as Express.Multer.File[]) || [];
    const mediaUrls = files.map((file) => `/uploads/${file.filename}`);
    incident.mediaUrls = [...(incident.mediaUrls || []), ...mediaUrls];
    await incident.save();

    await ActivityLog.create({
      userId: req.user!.id,
      action: 'update',
      resourceType: 'Incident',
      resourceId: incident._id.toString(),
      changes: { mediaUrls },
    });

    broadcastIncidentUpdate(incident);

    res.json(incident);
  } catch (error) {
    next(error);
  }
});

export default router;
