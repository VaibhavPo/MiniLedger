import { Request } from 'express';

export interface User {
  id: number;
  name: string;
  identifier: string; // email or phone number
  created_at: Date;
}

export interface UserTokenPayload {
  userId: number;
  identifier: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserTokenPayload;
}

export interface Loan {
  id: number;
  user_id: number;
  friend_name: string;
  amount: number;
  repaid_amount: number;
  due_date: string;
  status: 'PENDING' | 'PARTIALLY_REPAID' | 'REPAID';
  notes?: string;
  created_at: Date;
}

export interface LoanSummary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
  outstandingAmount: number;
  activeLoanCount: number;
}
