import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/authService.js';
import { AppError } from '../middleware/errorHandler.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authRateLimiter);

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed');
      }

      // `role` in the request body is intentionally ignored — see authService.register.
      const { email, password, firstName, lastName } = req.body;
      const result = await authService.register(email, password, firstName, lastName);

      await ActivityLog.create({
        userId: result.user.id,
        action: 'create',
        resourceType: 'User',
        resourceId: result.user.id.toString(),
        changes: { email, firstName, lastName, role: 'citizen' },
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(400, 'Validation failed');
      }

      const { email, password } = req.body;
      const result = await authService.login(email, password);

      await ActivityLog.create({
        userId: result.user.id,
        action: 'login',
        resourceType: 'Auth',
        resourceId: result.user.id.toString(),
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
