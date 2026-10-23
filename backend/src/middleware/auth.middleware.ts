import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, UserTokenPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

// Simple middleware function to protect routes
export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  
  // Also support custom x-user-id header for convenient development/testing if token isn't yet created
  const devUserIdHeader = req.headers['x-user-id'];

  if (!authHeader && devUserIdHeader) {
    const devUserId = parseInt(devUserIdHeader as string, 10);
    if (!isNaN(devUserId)) {
      req.user = {
        userId: devUserId,
        identifier: 'dev-user@miniledger.local',
        name: 'Development User',
      };
      return next();
    }
  }

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: 'Access denied. Please provide Authorization header (e.g. Bearer <token>).',
    });
    return;
  }

  const tokenParts = authHeader.split(' ');
  const token = tokenParts.length === 2 ? tokenParts[1] : tokenParts[0];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserTokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token. Please verify OTP and login again.',
    });
  }
}
