import { Router } from 'express';
import { handleRegister, handleLogin, handleVerifyOtp } from '../controllers/auth.controller';

const router = Router();

// Endpoint to register a new user (generates and logs mock OTP)
router.post('/register', handleRegister);

// Endpoint to initiate login for an existing user (generates and logs mock OTP)
router.post('/login', handleLogin);

// Endpoint to verify OTP and return a JWT access token
router.post('/verify-otp', handleVerifyOtp);

export default router;
