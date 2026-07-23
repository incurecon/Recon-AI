import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { DB } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'incurecon-ai-super-secret-jwt-key-2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName: string;
  };
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(payload: { id: string; email: string; fullName: string }, rememberMe = false): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: rememberMe ? '30d' : '24h',
  });
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in first.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; fullName: string };
    const user = DB.findUserById(decoded.id);
    if (user) {
      req.user = { id: user.id, email: user.email, fullName: user.fullName };
    } else {
      req.user = { id: decoded.id, email: decoded.email, fullName: decoded.fullName };
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication session. Please sign in.' });
  }
}
