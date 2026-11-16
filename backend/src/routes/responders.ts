import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, rbacMiddleware, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { Responder } from '../models/Responder.js';
import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { ROLES } from '../constants/roles.js';
import { getSocketServer } from '../utils/socket.js';

const router = Router();

router.use(authMiddleware);

router.get('/', rbacMiddleware(ROLES.ADMIN, ROLES.DRRMO_OFFICER, ROLES.RESPONDER), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const responders = await Responder.find().populate('userId', 'firstName lastName email phone role');
    res.json(responders);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const responder = await Responder.findById(req.params.id).populate('userId', 'firstName lastName email phone role');
    if (!responder) {
      throw new AppError(404, 'Responder not found');
    }
    res.json(responder);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  rbacMiddleware(ROLES.ADMIN, ROLES.DRRMO_OFFICER),
  [body('userId').notEmpty(), body('status').optional().isString(), body('team').optional().isString()],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed');
      }

      const user = await User.findById(req.body.userId);
      if (!user) {
        throw new AppError(404, 'User not found');
      }

      const responder = await Responder.create({
        userId: user._id,
        status: req.body.status || 'available',
        currentLocation: req.body.currentLocation,
        team: req.body.team,
        certifications: req.body.certifications || [],
      });

      await ActivityLog.create({
        userId: req.user!.id,
        action: 'create',
        resourceType: 'Responder',
        resourceId: responder._id.toString(),
        changes: req.body,
      });

      getSocketServer().to('municipality').emit('responder_location', responder);
      res.status(201).json(responder);
    } catch (error) {
      next(error);
    }
  }
);

const RESPONDER_STATUSES = ['available', 'on_duty', 'responding', 'on_scene', 'off_duty'];

/** Officers/admins may update any responder; a responder may only update their own record. */
async function assertCanModifyResponder(req: AuthRequest, responderId: string) {
  const role = req.user!.role;
  if (role === ROLES.ADMIN || role === ROLES.DRRMO_OFFICER) return;
  if (role === ROLES.RESPONDER) {
    const own = await Responder.findOne({ _id: responderId, userId: req.user!.id }).select('_id');
    if (own) return;
  }
  throw new AppError(403, 'Access forbidden: insufficient permissions');
}

router.put('/:id/location', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude } = req.body;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new AppError(400, 'Latitude and longitude are required');
    }

    const responder = await Responder.findByIdAndUpdate(
      req.params.id,
      { currentLocation: { latitude, longitude } },
      { new: true }
    ).populate('userId', 'firstName lastName email phone role');

    if (!responder) {
      throw new AppError(404, 'Responder not found');
    }

    await ActivityLog.create({
      userId: req.user!.id,
      action: 'update',
      resourceType: 'Responder',
      resourceId: responder._id.toString(),
      changes: { currentLocation: responder.currentLocation },
    });

    getSocketServer().to('municipality').emit('responder_location', responder);
    res.json(responder);
  } catch (error) {
    next(error);
  }
});

router.put('/:id/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!status) {
      throw new AppError(400, 'Status is required');
    }

    const responder = await Responder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', 'firstName lastName email phone role');

    if (!responder) {
      throw new AppError(404, 'Responder not found');
    }

    await ActivityLog.create({
      userId: req.user!.id,
      action: 'update',
      resourceType: 'Responder',
      resourceId: responder._id.toString(),
      changes: { status },
    });

    getSocketServer().to('municipality').emit('responder_location', responder);
    res.json(responder);
  } catch (error) {
    next(error);
  }
});

export default router;
