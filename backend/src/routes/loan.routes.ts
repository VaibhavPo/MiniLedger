import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  handleAddLoan,
  handleGetSummary,
  handleGetLoans,
  handleRepayLoan,
} from '../controllers/loan.controller';

const router = Router();

// All loan routes require authentication (via Bearer token or x-user-id header)
router.use(authenticateToken);

// Endpoint to add a new loan entry (friend name, amount, due date)
router.post('/', handleAddLoan);

// Endpoint that returns summary (total lent, total repaid, overdue amount)
router.get('/summary', handleGetSummary);

// Optional helper endpoint to list all loans
router.get('/', handleGetLoans);

// Optional helper endpoint to record a repayment towards a loan
router.post('/:id/repay', handleRepayLoan);

export default router;
