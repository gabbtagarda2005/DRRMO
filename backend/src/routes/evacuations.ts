import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, rbacMiddleware, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { EvacuationCenter } from '../models/EvacuationCenter.js';
import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { ROLES } from '../constants/roles.js';
import { getSocketServer } from '../utils/socket.js';

const router = Router();

const EDITABLE = ['name', 'address', 'barangay', 'location', 'capacity', 'currentOccupancy', 'facilities', 'supplies', 'status'];

/** Barangay officials may only manage centers inside their own barangay. */
async function barangayScope(req: AuthRequest): Promise<string | null> {
  if (req.user!.role !== ROLES.BARANGAY_OFFICIAL) return null;
  const me = await User.findById(req.user!.id).select('barangay');
  if (!me?.barangay) throw new AppError(403, 'Your account has no barangay assigned');
  return me.barangay;
}
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const centers = await EvacuationCenter.find().sort({ status: 1, name: 1 });
    res.json(centers);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const center = await EvacuationCenter.findById(req.params.id);
    if (!center) {
      throw new AppError(404, 'Evacuation center not found');
    }
    res.json(center);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  rbacMiddleware(ROLES.ADMIN, ROLES.DRRMO_OFFICER, ROLES.BARANGAY_OFFICIAL),
  [
    body('name').notEmpty(),
    body('address').notEmpty(),
    body('barangay').notEmpty(),
    body('location.latitude').isFloat(),
    body('location.longitude').isFloat(),
    body('capacity').isInt({ gt: 0 }),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed');
      }

      const scope = await barangayScope(req);
      const data: Record<string, unknown> = {};
      for (const key of EDITABLE) if (req.body[key] !== undefined) data[key] = req.body[key];
      if (scope) data.barangay = scope;
      const center = await EvacuationCenter.create(data);
      await ActivityLog.create({
        userId: req.user!.id,
        action: 'create',
        resourceType: 'EvacuationCenter',
        resourceId: center._id.toString(),
        changes: data,
      });

      getSocketServer().emit('evacuation_update', center);
      res.status(201).json(center);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', rbacMiddleware(ROLES.ADMIN, ROLES.DRRMO_OFFICER, ROLES.BARANGAY_OFFICIAL), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await EvacuationCenter.findById(req.params.id);
    if (!existing) {
      throw new AppError(404, 'Evacuation center not found');
    }
    const scope = await barangayScope(req);
    if (scope && existing.barangay !== scope) {
      throw new AppError(403, 'You can only update evacuation centers in your barangay');
    }

    const updates: Record<string, unknown> = {};
    for (const key of EDITABLE) if (req.body[key] !== undefined) updates[key] = req.body[key];
    if (scope) delete updates.barangay;

    const capacity = Number(updates.capacity ?? existing.capacity);
    if (updates.capacity !== undefined && (!Number.isFinite(capacity) || capacity <= 0)) {
      throw new AppError(400, 'Capacity must be greater than zero');
    }
    if (updates.currentOccupancy !== undefined) {
      const occ = Number(updates.currentOccupancy);
      if (!Number.isFinite(occ) || occ < 0) throw new AppError(400, 'Occupancy must be zero or more');
      if (occ > capacity) throw new AppError(400, `Occupancy cannot exceed capacity (${capacity})`);
    }

    const center = await EvacuationCenter.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!center) {
      throw new AppError(404, 'Evacuation center not found');
    }

    await ActivityLog.create({
      userId: req.user!.id,
      action: 'update',
      resourceType: 'EvacuationCenter',
      resourceId: center._id.toString(),
      changes: updates,
    });

    getSocketServer().emit('evacuation_update', center);
    res.json(center);
  } catch (error) {
    next(error);
  }
});

export default router;
