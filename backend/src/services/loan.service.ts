import { query } from '../config/db';
import { Loan, LoanSummary } from '../types';

// Add a new loan entry
export async function createLoan(
  userId: number,
  friendName: string,
  amount: number,
  dueDate: string,
  notes?: string
): Promise<Loan> {
  const insertSql = `
    INSERT INTO loans (user_id, friend_name, amount, repaid_amount, due_date, status, notes)
    VALUES ($1, $2, $3, 0.00, $4, 'PENDING', $5)
    RETURNING id, user_id, friend_name, amount, repaid_amount, due_date, status, notes, created_at
  `;

  const values = [userId, friendName, amount, dueDate, notes || null];
  const result = await query(insertSql, values);
  return result.rows[0];
}

// Fetch ledger summary: total lent, total repaid, overdue amount
export async function getLoanSummary(userId: number): Promise<LoanSummary> {
  const summarySql = `
    SELECT
      COALESCE(SUM(amount), 0) AS total_lent,
      COALESCE(SUM(repaid_amount), 0) AS total_repaid,
      COALESCE(SUM(
        CASE
          WHEN due_date < CURRENT_DATE AND status != 'REPAID'
          THEN (amount - repaid_amount)
          ELSE 0
        END
      ), 0) AS overdue_amount,
      COUNT(CASE WHEN status != 'REPAID' THEN 1 END) AS active_loan_count
    FROM loans
    WHERE user_id = $1
  `;

  const result = await query(summarySql, [userId]);
  const row = result.rows[0];

  const totalLent = parseFloat(row.total_lent);
  const totalRepaid = parseFloat(row.total_repaid);
  const overdueAmount = parseFloat(row.overdue_amount);
  const outstandingAmount = Math.max(0, totalLent - totalRepaid);
  const activeLoanCount = parseInt(row.active_loan_count, 10);

  return {
    totalLent: totalLent,
    totalRepaid: totalRepaid,
    overdueAmount: overdueAmount,
    outstandingAmount: outstandingAmount,
    activeLoanCount: activeLoanCount,
  };
}

// Get all loans for the logged-in user
export async function getUserLoans(userId: number): Promise<Loan[]> {
  const sql = `
    SELECT id, user_id, friend_name, amount, repaid_amount, due_date, status, notes, created_at
    FROM loans
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;
  const result = await query(sql, [userId]);
  return result.rows;
}

// Record a repayment towards a loan
export async function recordRepayment(
  userId: number,
  loanId: number,
  repaymentAmount: number
): Promise<Loan> {
  // Find the loan first
  const findResult = await query(
    'SELECT * FROM loans WHERE id = $1 AND user_id = $2',
    [loanId, userId]
  );

  if (findResult.rows.length === 0) {
    throw new Error('Loan not found.');
  }

  const loan = findResult.rows[0];
  const currentRepaid = parseFloat(loan.repaid_amount);
  const totalAmount = parseFloat(loan.amount);

  const newRepaidAmount = currentRepaid + repaymentAmount;
  let newStatus = 'PARTIALLY_REPAID';

  if (newRepaidAmount >= totalAmount) {
    newStatus = 'REPAID';
  }

  const updateSql = `
    UPDATE loans
    SET repaid_amount = $1, status = $2
    WHERE id = $3 AND user_id = $4
    RETURNING id, user_id, friend_name, amount, repaid_amount, due_date, status, notes, created_at
  `;

  const updateResult = await query(updateSql, [newRepaidAmount, newStatus, loanId, userId]);
  return updateResult.rows[0];
}
