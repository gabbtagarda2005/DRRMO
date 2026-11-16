import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { authMiddleware, rbacMiddleware, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { ROLES } from '../constants/roles.js';
import { getSocketServer } from '../utils/socket.js';

const router = Router();

router.use(authMiddleware);

const BROADCASTERS = [ROLES.ADMIN, ROLES.DRRMO_OFFICER, ROLES.BARANGAY_OFFICIAL];

/**
 * Audiences an alert can target. `barangay:<name>` targets everyone registered
 * in that barangay. Barangay officials are always confined to their own barangay.
 */
const ROLE_AUDIENCES: Record<string, string[] | null> = {
  all: null,
  citizens: [ROLES.CITIZEN],
  responders: [ROLES.RESPONDER],
  barangay_officials: [ROLES.BARANGAY_OFFICIAL],
  staff: [ROLES.ADMIN, ROLES.DRRMO_OFFICER, ROLES.RESPONDER, ROLES.BARANGAY_OFFICIAL],
};

async function resolveAudience(audience: string, sender: AuthRequest['user']): Promise<{ audience: string; ids: string[] }> {
  let effective = audience;

  if (sender!.role === ROLES.BARANGAY_OFFICIAL) {
    const me = await User.findById(sender!.id).select('barangay');
    if (!me?.barangay) {
      throw new AppError(400, 'Your account has no barangay assigned; ask an administrator to set one.');
    }
    effective = `barangay:${me.barangay}`;
  }

  const filter: Record<string, unknown> = { isActive: { $ne: false } };
  if (effective.startsWith('barangay:')) {
    filter.barangay = effective.slice('barangay:'.length);
  } else if (effective in ROLE_AUDIENCES) {
    const roles = ROLE_AUDIENCES[effective];
    if (roles) filter.role = { $in: roles };
  } else {
    throw new AppError(400, 'Unknown audience');
  }

  const users = await User.find(filter).select('_id');
  return { audience: effective, ids: users.map((u) => u._id.toString()) };
}

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notifications = await Notification.find({ recipients: req.user?.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .select('-recipients');
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

/** Broadcast history. Officers/admins see every broadcast; barangay officials see their own. */
router.get('/sent', rbacMiddleware(...BROADCASTERS), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filter: Record<string, unknown> = { createdBy: { $exists: true } };
    if (req.user!.role === ROLES.BARANGAY_OFFICIAL) {
      filter.createdBy = new mongoose.Types.ObjectId(req.user!.id);
    }

    const sent = await Notification.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $limit: 50 },
      {
        $project: {
          title: 1,
          message: 1,
          type: 1,
          priority: 1,
          audience: 1,
          createdAt: 1,
          createdBy: 1,
          recipientCount: { $size: { $ifNull: ['$recipients', []] } },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy',
          pipeline: [{ $project: { firstName: 1, lastName: 1, role: 1, barangay: 1 } }],
        },
      },
      { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
    ]);

    res.json(sent);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  rbacMiddleware(...BROADCASTERS),
  [
    body('title').isString().trim().notEmpty(),
    body('message').isString().trim().notEmpty(),
    body('type').isIn(['alert', 'update', 'warning', 'info']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('recipients').optional().isArray(),
    body('audience').optional().isString(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed: title, message and type are required');
      }

      let audience = 'direct';
      let recipients: string[] = [];

      if (typeof req.body.audience === 'string' && req.body.audience.length > 0) {
        const resolved = await resolveAudience(req.body.audience, req.user);
        audience = resolved.audience;
        recipients = resolved.ids;
      } else if (Array.isArray(req.body.recipients) && req.user!.role !== ROLES.BARANGAY_OFFICIAL) {
        recipients = (req.body.recipients as unknown[]).map(String).filter((id) => mongoose.isValidObjectId(id));
      } else {
        throw new AppError(400, 'Provide an audience for this alert');
      }

      if (recipients.length === 0) {
        throw new AppError(400, 'No active users match that audience yet');
      }

      const notification = await Notification.create({
        title: req.body.title,
        message: req.body.message,
        type: req.body.type,
        priority: req.body.priority || 'medium',
        relatedIncident: req.body.relatedIncident,
        recipients,
        audience,
        createdBy: req.user!.id,
        isRead: new Map(recipients.map((recipient) => [recipient, false])),
      });

      await ActivityLog.create({
        userId: req.user!.id,
        action: 'create',
        resourceType: 'Notification',
        resourceId: notification._id.toString(),
        changes: { title: notification.title, audience, recipientCount: recipients.length, priority: notification.priority },
      });

      const payload = {
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        audience,
        createdAt: notification.createdAt,
      };
      const io = getSocketServer();
      for (const recipientId of recipients) {
        io.to(`user_${recipientId}`).emit('notification', payload);
      }

      res.status(201).json({ ...payload, recipientCount: recipients.length });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      throw new AppError(404, 'Notification not found');
    }
    if (!notification.recipients.some((r) => r.toString() === req.user!.id)) {
      throw new AppError(403, 'Not a recipient of this notification');
    }

    notification.isRead.set(req.user!.id, true);
    await notification.save();

    res.json({ _id: notification._id, read: true });
  } catch (error) {
    next(error);
  }
});

export default router;
