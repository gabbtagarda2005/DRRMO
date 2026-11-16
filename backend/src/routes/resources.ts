import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, rbacMiddleware, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { Resource } from '../models/Resource.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { ROLES } from '../constants/roles.js';
import { getSocketServer } from '../utils/socket.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const resources = await Resource.find().sort({ status: 1, name: 1 });
    res.json(resources);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      throw new AppError(404, 'Resource not found');
    }
    res.json(resource);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  rbacMiddleware(ROLES.ADMIN, ROLES.DRRMO_OFFICER),
  [
    body('name').notEmpty(),
    body('type').notEmpty(),
    body('status').notEmpty(),
    body('location').notEmpty(),
    body('quantity').isInt({ gt: 0 }),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed');
      }

      const resource = await Resource.create(req.body);
      await ActivityLog.create({
        userId: req.user!.id,
        action: 'create',
        resourceType: 'Resource',
        resourceId: resource._id.toString(),
        changes: req.body,
      });

      getSocketServer().emit('resource_update', resource);
      res.status(201).json(resource);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', rbacMiddleware(ROLES.ADMIN, ROLES.DRRMO_OFFICER), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!resource) {
      throw new AppError(404, 'Resource not found');
    }

    await ActivityLog.create({
      userId: req.user!.id,
      action: 'update',
      resourceType: 'Resource',
      resourceId: resource._id.toString(),
      changes: req.body,
    });

    getSocketServer().emit('resource_update', resource);
    res.json(resource);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', rbacMiddleware(ROLES.ADMIN), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await Resource.findByIdAndDelete(req.params.id);
    await ActivityLog.create({
      userId: req.user!.id,
      action: 'delete',
      resourceType: 'Resource',
      resourceId: req.params.id,
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
