import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { authMiddleware, rbacMiddleware, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authMiddleware);

const VALID_ROLES = Object.values(ROLES) as string[];

/** Fields a signed-in user may change on their own profile. Role / isActive are admin-only. */
const SELF_EDITABLE = ['firstName', 'lastName', 'phone', 'avatar'] as const;

/** Fields an administrator may change on any account. */
const ADMIN_EDITABLE = ['firstName', 'lastName', 'phone', 'avatar', 'barangay', 'role', 'isActive', 'password'] as const;

function pick<T extends Record<string, unknown>>(source: T, keys: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}

/** Never write secrets (even hashed) into the audit trail. */
function redact(changes: Record<string, unknown>): Record<string, unknown> {
  const { password, ...rest } = changes;
  return password !== undefined ? { ...rest, password: '[changed]' } : rest;
}

router.get('/', rbacMiddleware(ROLES.ADMIN), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.put(
  '/me',
  [
    body('firstName').optional().isString().trim().notEmpty(),
    body('lastName').optional().isString().trim().notEmpty(),
    body('phone').optional().isString(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed');
      }

      const updates = pick(req.body, SELF_EDITABLE);
      const user = await User.findByIdAndUpdate(req.user?.id, updates, { new: true, runValidators: true }).select('-password');
      if (!user) {
        throw new AppError(404, 'User not found');
      }

      await ActivityLog.create({
        userId: req.user!.id,
        action: 'update',
        resourceType: 'User',
        resourceId: user._id.toString(),
        changes: updates,
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/me/password',
  [body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 8 })],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'New password must be at least 8 characters');
      }

      const user = await User.findById(req.user?.id).select('+password');
      if (!user) {
        throw new AppError(404, 'User not found');
      }

      const matches = await bcrypt.compare(req.body.currentPassword, user.password);
      if (!matches) {
        throw new AppError(400, 'Current password is incorrect');
      }

      user.password = await bcrypt.hash(req.body.newPassword, 10);
      await user.save();

      await ActivityLog.create({
        userId: req.user!.id,
        action: 'update',
        resourceType: 'User',
        resourceId: user._id.toString(),
        changes: { password: '[changed]' },
      });

      res.json({ message: 'Password updated' });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/',
  rbacMiddleware(ROLES.ADMIN),
  [
    body('email').isEmail(),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('role').isIn(VALID_ROLES),
    body('password').isLength({ min: 6 }),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed: check email, names, role and password (min 6 characters)');
      }

      const { email, password, firstName, lastName, role, barangay, phone, avatar } = req.body;
      const existingUser = await User.findOne({ email: String(email).toLowerCase() });
      if (existingUser) {
        throw new AppError(400, 'Email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({ email, password: hashedPassword, firstName, lastName, role, barangay, phone, avatar });
      await user.save();

      await ActivityLog.create({
        userId: req.user!.id,
        action: 'create',
        resourceType: 'User',
        resourceId: user._id.toString(),
        changes: { email, firstName, lastName, role, barangay },
      });

      const { password: _, ...responseUser } = user.toObject();
      res.status(201).json(responseUser);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id', rbacMiddleware(ROLES.ADMIN, ROLES.DRRMO_OFFICER), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', rbacMiddleware(ROLES.ADMIN), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const updates = pick(req.body, ADMIN_EDITABLE);

    if (updates.role !== undefined && !VALID_ROLES.includes(String(updates.role))) {
      throw new AppError(400, 'Invalid role');
    }

    const isSelf = req.params.id === req.user!.id;
    if (isSelf && (updates.isActive === false || (updates.role !== undefined && updates.role !== ROLES.ADMIN))) {
      throw new AppError(400, 'You cannot suspend or demote your own administrator account');
    }

    if (typeof updates.password === 'string') {
      if (updates.password.length < 6) {
        throw new AppError(400, 'Password must be at least 6 characters');
      }
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    await ActivityLog.create({
      userId: req.user!.id,
      action: 'update',
      resourceType: 'User',
      resourceId: user._id.toString(),
      changes: redact(updates),
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', rbacMiddleware(ROLES.ADMIN), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.params.id === req.user!.id) {
      throw new AppError(400, 'You cannot delete your own account');
    }

    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) {
      throw new AppError(404, 'User not found');
    }

    await ActivityLog.create({
      userId: req.user!.id,
      action: 'delete',
      resourceType: 'User',
      resourceId: req.params.id,
      changes: { email: deleted.email, role: deleted.role },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
