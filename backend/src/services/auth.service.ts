import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import { generateOtp, logMockOtp } from '../utils/otp.util';
import { User, UserTokenPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Helper to save OTP to database
async function saveOtp(identifier: string, otp: string): Promise<void> {
  // Invalidate any older unused OTPs for this identifier
  await query('UPDATE otps SET used = TRUE WHERE identifier = $1 AND used = FALSE', [identifier]);

  // Set expiration to 5 minutes from now
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await query(
    'INSERT INTO otps (identifier, otp, expires_at) VALUES ($1, $2, $3)',
    [identifier, otp, expiresAt]
  );
}

// Register user and send OTP to server logs
export async function registerUser(name: string, identifier: string) {
  const existingUserResult = await query(
    'SELECT id FROM users WHERE identifier = $1',
    [identifier]
  );

  if (existingUserResult.rows.length > 0) {
    throw new Error('User already exists with this identifier. Please log in instead.');
  }

  // Create new user record
  const insertResult = await query(
    'INSERT INTO users (name, identifier) VALUES ($1, $2) RETURNING id, name, identifier, created_at',
    [name, identifier]
  );
  const newUser: User = insertResult.rows[0];

  // Generate and save OTP
  // const otp = generateOtp();
  const otp = 123987
  await saveOtp(identifier, otp);

  // Mock send OTP to console
  logMockOtp(identifier, otp, 'User Registration');

  return {
    message: 'Registration initiated. OTP sent to server logs.',
    identifier: newUser.identifier,
    name: newUser.name,
  };
}

// Request login OTP for an existing user
export async function loginUser(identifier: string) {
  const userResult = await query(
    'SELECT id, name, identifier FROM users WHERE identifier = $1',
    [identifier]
  );

  if (userResult.rows.length === 0) {
    throw new Error('No account found with this identifier. Please register first.');
  }

  const user = userResult.rows[0];

  // Generate and save OTP
  const otp = generateOtp();
  await saveOtp(identifier, otp);

  // Mock send OTP to console
  logMockOtp(identifier, otp, 'User Login');

  return {
    message: 'Login initiated. OTP sent to server logs.',
    identifier: user.identifier,
  };
}

// Verify OTP and generate JWT authentication token
export async function verifyOtp(identifier: string, otp: string) {
  const otpResult = await query(
    `SELECT id, otp, expires_at, used
     FROM otps
     WHERE identifier = $1 AND used = FALSE
     ORDER BY created_at DESC
     LIMIT 1`,
    [identifier]
  );

  if (otpResult.rows.length === 0) {
    throw new Error('No active OTP found. Please request a new one.');
  }

  const record = otpResult.rows[0];

  if (new Date() > new Date(record.expires_at)) {
    throw new Error('OTP has expired. Please request a new OTP.');
  }

  if (record.otp !== otp.trim()) {
    throw new Error('Invalid OTP code. Please check server logs and try again.');
  }

  // Mark OTP as used
  await query('UPDATE otps SET used = TRUE WHERE id = $1', [record.id]);

  // Retrieve user details
  const userResult = await query(
    'SELECT id, name, identifier FROM users WHERE identifier = $1',
    [identifier]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found.');
  }

  const user = userResult.rows[0];

  const payload: UserTokenPayload = {
    userId: user.id,
    identifier: user.identifier,
    name: user.name,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  return {
    message: 'Authentication successful.',
    token: token,
    user: {
      id: user.id,
      name: user.name,
      identifier: user.identifier,
    },
  };
}
