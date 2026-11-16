import jwt, { type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { getJwtSecret } from '../config/env.js';

export class AuthService {
  /**
   * Public self-registration always creates a citizen account. Privileged roles
   * (officers, responders, barangay officials, admins) are provisioned by an
   * administrator through `POST /api/users`.
   */
  async register(email: string, password: string, firstName: string, lastName: string) {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError(400, 'Email already registered');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'citizen',
    });

    await user.save();

    return this.generateToken(user);
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (user.isActive === false) {
      throw new AppError(403, 'This account has been suspended. Contact your system administrator.');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    return this.generateToken(user);
  }

  generateToken(user: IUser) {
    const secret = getJwtSecret();
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const options: SignOptions = { expiresIn: expiresIn as any };
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      secret,
      options
    );

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        barangay: user.barangay,
        phone: user.phone,
        isActive: user.isActive,
      },
    };
  }

  async verifyToken(token: string) {
    try {
      return jwt.verify(token, getJwtSecret());
    } catch (error) {
      throw new AppError(401, 'Invalid token');
    }
  }
}

export const authService = new AuthService();
