import { apiRequest, setAuthToken } from '../utils/api';

export interface User {
  id: number;
  name: string;
  identifier: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  data: {
    message: string;
    token: string;
    user: User;
  };
}

export const authService = {
  async login(identifier: string): Promise<string> {
    try {
      const res = await apiRequest<{ success: boolean; data: { message: string } }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ identifier }),
        }
      );
      return res.data.message;
    } catch (err: any) {
      // If user doesn't exist yet, auto-register to generate OTP
      if (err.message && err.message.includes('No account found')) {
        const name = identifier.split('@')[0] || 'User';
        const regRes = await apiRequest<{ success: boolean; data: { message: string } }>(
          '/auth/register',
          {
            method: 'POST',
            body: JSON.stringify({ name, identifier }),
          }
        );
        return regRes.data.message;
      }
      throw err;
    }
  },

  async verifyOtp(identifier: string, otp: string): Promise<{ token: string; user: User }> {
    const res = await apiRequest<VerifyOtpResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, otp }),
    });

    setAuthToken(res.data.token);
    return {
      token: res.data.token,
      user: res.data.user,
    };
  },
};
