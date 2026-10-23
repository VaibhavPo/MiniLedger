import { Request, Response } from 'express';
import { registerUser, loginUser, verifyOtp } from '../services/auth.service';

// Handles POST /api/auth/register
export async function handleRegister(req: Request, res: Response): Promise<void> {
  try {
    const { name, identifier } = req.body;

    if (!name || !identifier) {
      res.status(400).json({
        success: false,
        error: 'Both "name" and "identifier" (email or phone) are required.',
      });
      return;
    }

    const result = await registerUser(name.trim(), identifier.trim());
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Registration failed.',
    });
  }
}

// Handles POST /api/auth/login
export async function handleLogin(req: Request, res: Response): Promise<void> {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      res.status(400).json({
        success: false,
        error: '"identifier" (email or phone) is required to login.',
      });
      return;
    }

    const result = await loginUser(identifier.trim());
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Login failed.',
    });
  }
}

// Handles POST /api/auth/verify-otp
export async function handleVerifyOtp(req: Request, res: Response): Promise<void> {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      res.status(400).json({
        success: false,
        error: 'Both "identifier" and "otp" are required.',
      });
      return;
    }

    const result = await verifyOtp(identifier.trim(), otp.toString().trim());
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'OTP verification failed.',
    });
  }
}
