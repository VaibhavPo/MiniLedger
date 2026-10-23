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
  async register(name: string, identifier: string): Promise<string> {
    const res = await apiRequest<{ success: boolean; data: { message: string } }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), identifier: identifier.trim() }),
      }
    );
    return res.data.message;
  },

  async login(identifier: string): Promise<string> {
    const res = await apiRequest<{ success: boolean; data: { message: string } }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ identifier: identifier.trim() }),
      }
    );
    return res.data.message;
  },

  async verifyOtp(identifier: string, otp: string): Promise<{ token: string; user: User }> {
    const res = await apiRequest<VerifyOtpResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier: identifier.trim(), otp: otp.trim() }),
    });

    setAuthToken(res.data.token);
    return {
      token: res.data.token,
      user: res.data.user,
    };
  },
};
