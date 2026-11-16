import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, rbacMiddleware, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { Barangay } from '../models/Barangay.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { ROLES } from '../constants/roles.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const barangays = await Barangay.find().sort({ name: 1 });
    res.json(barangays);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const barangay = await Barangay.findById(req.params.id).populate('officials resources');
    if (!barangay) {
      throw new AppError(404, 'Barangay not found');
    }
    res.json(barangay);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  rbacMiddleware(ROLES.ADMIN, ROLES.DRRMO_OFFICER),
  [body('name').notEmpty(), body('code').notEmpty(), body('location.latitude').isFloat(), body('location.longitude').isFloat()],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed');
      }

      const barangay = await Barangay.create(req.body);
      await ActivityLog.create({
        userId: req.user!.id,
        action: 'create',
        resourceType: 'Barangay',
        resourceId: barangay._id.toString(),
        changes: req.body,
      });

      res.status(201).json(barangay);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', rbacMiddleware(ROLES.ADMIN, ROLES.DRRMO_OFFICER), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const barangay = await Barangay.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!barangay) {
      throw new AppError(404, 'Barangay not found');
    }

    await ActivityLog.create({
      userId: req.user!.id,
      action: 'update',
      resourceType: 'Barangay',
      resourceId: barangay._id.toString(),
      changes: req.body,
    });

    res.json(barangay);
  } catch (error) {
    next(error);
  }
});

export default router;
