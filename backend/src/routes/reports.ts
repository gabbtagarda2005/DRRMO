import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, rbacMiddleware, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { Report } from '../models/Report.js';
import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { ROLES } from '../constants/roles.js';
import { getSocketServer } from '../utils/socket.js';

const router = Router();
router.use(authMiddleware);

const REPORT_TYPES = ['damage_report', 'field_report', 'casualty_report', 'resource_report'];
const REPORT_STATUSES = ['pending', 'reviewed', 'processed'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, incidentId, status, barangay, mine, page = 1, limit = 20 } = req.query;
    const filter: Record<string, any> = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (incidentId) filter.relatedIncident = incidentId;
    if (barangay) filter.barangay = barangay;
    if (mine === 'true') filter.submittedBy = req.user!.id;

    // Citizens and barangay officials only ever see their own submissions / barangay.
    if (req.user!.role === ROLES.CITIZEN) {
      filter.submittedBy = req.user!.id;
    } else if (req.user!.role === ROLES.BARANGAY_OFFICIAL && !filter.submittedBy) {
      const me = await User.findById(req.user!.id).select('barangay');
      if (me?.barangay) filter.barangay = me.barangay;
      else filter.submittedBy = req.user!.id;
    }

    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 200);
    const total = await Report.countDocuments(filter);

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .populate('submittedBy', 'firstName lastName email role barangay')
      .populate('relatedIncident', 'title type status location');

    res.json({ data: reports, page: pageNumber, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('submittedBy', 'firstName lastName email role barangay')
      .populate('relatedIncident', 'title type status location');
    if (!report) {
      throw new AppError(404, 'Report not found');
    }
    res.json(report);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  [
    body('title').isString().trim().notEmpty(),
    body('description').isString().trim().notEmpty(),
    body('type').isIn(REPORT_TYPES),
    body('severity').optional().isIn(SEVERITIES),
    body('relatedIncident').optional({ values: 'falsy' }).isMongoId(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed: title, description and a valid type are required');
      }

      const submitter = await User.findById(req.user!.id).select('barangay');
      const { title, description, type, severity, relatedIncident, details, mediaUrls } = req.body;

      const report = await Report.create({
        title,
        description,
        type,
        severity: severity || 'low',
        relatedIncident: relatedIncident || undefined,
        details,
        mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [],
        barangay: req.body.barangay || submitter?.barangay,
        submittedBy: req.user!.id,
        status: 'pending',
      });

      await ActivityLog.create({
        userId: req.user!.id,
        action: 'create',
        resourceType: 'Report',
        resourceId: report._id.toString(),
        changes: { title, type, severity, barangay: report.barangay },
      });

      getSocketServer().to('municipality').emit('report_created', report);

      res.status(201).json(report);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', rbacMiddleware(ROLES.ADMIN, ROLES.DRRMO_OFFICER), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const updates: Record<string, unknown> = {};
    if (req.body.status !== undefined) {
      if (!REPORT_STATUSES.includes(req.body.status)) throw new AppError(400, 'Invalid report status');
      updates.status = req.body.status;
    }
    if (req.body.severity !== undefined) {
      if (!SEVERITIES.includes(req.body.severity)) throw new AppError(400, 'Invalid severity');
      updates.severity = req.body.severity;
    }

    const report = await Report.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('submittedBy', 'firstName lastName email role barangay');
    if (!report) {
      throw new AppError(404, 'Report not found');
    }

    await ActivityLog.create({
      userId: req.user!.id,
      action: 'status_change',
      resourceType: 'Report',
      resourceId: report._id.toString(),
      changes: updates,
    });

    res.json(report);
  } catch (error) {
    next(error);
  }
});

export default router;
