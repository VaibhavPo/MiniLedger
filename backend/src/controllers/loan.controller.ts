import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import {
  createLoan,
  getLoanSummary,
  getUserLoans,
  recordRepayment,
} from '../services/loan.service';

// Handles POST /api/loans (Add a loan entry: friend name, amount, due date)
export async function handleAddLoan(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User is not authenticated.' });
      return;
    }

    const { friend_name, amount, due_date, notes } = req.body;

    // Field validation
    if (!friend_name || friend_name.trim() === '') {
      res.status(400).json({ success: false, error: 'Friend name is required.' });
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      res.status(400).json({ success: false, error: 'Amount must be a positive number.' });
      return;
    }

    if (!due_date) {
      res.status(400).json({ success: false, error: 'Due date is required (YYYY-MM-DD).' });
      return;
    }

    // Verify valid date format
    const parsedDate = new Date(due_date);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ success: false, error: 'Invalid due date format. Please use YYYY-MM-DD.' });
      return;
    }

    const newLoan = await createLoan(
      userId,
      friend_name.trim(),
      numericAmount,
      due_date,
      notes
    );

    res.status(201).json({
      success: true,
      message: 'Loan entry created successfully.',
      data: newLoan,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add loan entry.',
    });
  }
}

// Handles GET /api/loans/summary (Returns total lent, total repaid, overdue amount)
export async function handleGetSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User is not authenticated.' });
      return;
    }

    const summary = await getLoanSummary(userId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate loan summary.',
    });
  }
}

// Handles GET /api/loans (List all loans for the authenticated user)
export async function handleGetLoans(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User is not authenticated.' });
      return;
    }

    const loans = await getUserLoans(userId);

    res.status(200).json({
      success: true,
      count: loans.length,
      data: loans,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch loans.',
    });
  }
}

// Handles POST /api/loans/:id/repay (Record repayment towards a loan)
export async function handleRepayLoan(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User is not authenticated.' });
      return;
    }

    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const loanId = parseInt(paramId, 10);
    if (isNaN(loanId)) {
      res.status(400).json({ success: false, error: 'Invalid loan ID parameter.' });
      return;
    }

    const { amount } = req.body;
    const repaymentAmount = parseFloat(amount);
    if (isNaN(repaymentAmount) || repaymentAmount <= 0) {
      res.status(400).json({ success: false, error: 'Repayment amount must be a positive number.' });
      return;
    }

    const updatedLoan = await recordRepayment(userId, loanId, repaymentAmount);

    res.status(200).json({
      success: true,
      message: 'Repayment recorded successfully.',
      data: updatedLoan,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to record repayment.',
    });
  }
}
