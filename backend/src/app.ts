import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import loanRoutes from './routes/loan.routes';

export function createApp(): express.Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Simple console request logger for easy debugging
  app.use(function requestLogger(req: Request, _res: Response, next: NextFunction) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
  });

  // Base API index & health check
  app.get('/', function rootHandler(_req: Request, res: Response) {
    res.json({
      name: 'MiniLedger API',
      status: 'active',
      version: '1.0.0',
      endpoints: {
        auth: {
          register: 'POST /api/auth/register',
          login: 'POST /api/auth/login',
          verifyOtp: 'POST /api/auth/verify-otp',
        },
        loans: {
          addLoan: 'POST /api/loans',
          summary: 'GET /api/loans/summary',
          listAll: 'GET /api/loans',
          repayLoan: 'POST /api/loans/:id/repay',
        },
      },
    });
  });

  app.get('/health', function healthCheckHandler(_req: Request, res: Response) {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/loans', loanRoutes);

  // 404 Route Handler
  app.use(function notFoundHandler(req: Request, res: Response) {
    res.status(404).json({
      success: false,
      error: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Global Error Handler
  app.use(function errorHandler(
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) {
    console.error('[Error] Unhandled application error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error occurred.',
    });
  });

  return app;
}
