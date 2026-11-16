import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, rbacMiddleware, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { ROLES } from '../constants/roles.js';

const router = Router();
router.use(authMiddleware, rbacMiddleware(ROLES.ADMIN, ROLES.DRRMO_OFFICER));

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, resourceType, action, page = 1, limit = 50 } = req.query;
    const filter: Record<string, any> = {};
    if (userId) filter.userId = userId;
    if (resourceType) filter.resourceType = resourceType;
    if (action) filter.action = action;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 50, 1), 200);

    const total = await ActivityLog.countDocuments(filter);
    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .populate('userId', 'firstName lastName email role');

    res.json({ data: logs, page: pageNumber, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const log = await ActivityLog.findById(req.params.id);
    if (!log) {
      throw new AppError(404, 'Activity log not found');
    }
    res.json(log);
  } catch (error) {
    next(error);
  }
});

export default router;
