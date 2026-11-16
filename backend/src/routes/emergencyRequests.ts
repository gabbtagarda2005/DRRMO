import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, rbacMiddleware, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { EmergencyRequest } from '../models/EmergencyRequest.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { ROLES } from '../constants/roles.js';
import { getSocketServer } from '../utils/socket.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const pageNumber = Number(page);
    const pageSize = Number(limit);
    const total = await EmergencyRequest.countDocuments(filter);
    const requests = await EmergencyRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .populate('reportedBy assignedResponder verifiedBy');

    res.json({ data: requests, page: pageNumber, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const request = await EmergencyRequest.findById(req.params.id)
      .populate('reportedBy assignedResponder verifiedBy');
    if (!request) {
      throw new AppError(404, 'Emergency request not found');
    }
    res.json(request);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  [
    body('type').notEmpty(),
    body('description').notEmpty(),
    body('priority').notEmpty(),
    body('location.latitude').isFloat(),
    body('location.longitude').isFloat(),
    body('location.address').notEmpty(),
    body('location.barangay').notEmpty(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed');
      }

      const request = await EmergencyRequest.create({
        ...req.body,
        reportedBy: req.user!.id,
        mediaUrls: req.body.mediaUrls || [],
      });

      await ActivityLog.create({
        userId: req.user!.id,
        action: 'create',
        resourceType: 'EmergencyRequest',
        resourceId: request._id.toString(),
        changes: req.body,
      });

      getSocketServer().emit('emergency_alert', request);
      res.status(201).json(request);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', rbacMiddleware(ROLES.ADMIN, ROLES.DRRMO_OFFICER, ROLES.RESPONDER), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const request = await EmergencyRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!request) {
      throw new AppError(404, 'Emergency request not found');
    }

    await ActivityLog.create({
      userId: req.user!.id,
      action: 'update',
      resourceType: 'EmergencyRequest',
      resourceId: request._id.toString(),
      changes: req.body,
    });

    getSocketServer().emit('emergency_alert', request);
    res.json(request);
  } catch (error) {
    next(error);
  }
});

export default router;
