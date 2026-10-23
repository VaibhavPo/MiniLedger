import { apiRequest } from '../utils/api';

export interface Loan {
  id: number;
  user_id: number;
  friend_name: string;
  amount: string | number;
  repaid_amount: string | number;
  due_date: string;
  status: 'PENDING' | 'PARTIALLY_REPAID' | 'REPAID';
  notes?: string | null;
  created_at: string;
}

export interface LoanSummary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
  outstandingAmount: number;
  activeLoanCount: number;
}

export const loanService = {
  async getLoans(): Promise<Loan[]> {
    const res = await apiRequest<{ success: boolean; data: Loan[] }>('/loans');
    return res.data;
  },

  async getSummary(): Promise<LoanSummary> {
    const res = await apiRequest<{ success: boolean; data: LoanSummary }>('/loans/summary');
    return res.data;
  },

  async addLoan(loanData: {
    friend_name: string;
    amount: number;
    due_date: string;
    notes?: string;
  }): Promise<Loan> {
    const res = await apiRequest<{ success: boolean; data: Loan }>('/loans', {
      method: 'POST',
      body: JSON.stringify(loanData),
    });
    return res.data;
  },

  async repayLoan(id: number, amount: number): Promise<Loan> {
    const res = await apiRequest<{ success: boolean; data: Loan }>(`/loans/${id}/repay`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    return res.data;
  },
};
