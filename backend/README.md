# MiniLedger Backend

Node.js, TypeScript, and PostgreSQL backend for tracking personal loans lent to friends.

---

## Features

- **TypeScript + Node.js**: Clean architecture with simple, readable procedural functions (no complex arrow gymnastics or convoluted pipelines).
- **PostgreSQL Database**: Auto-initializes `users`, `otps`, and `loans` tables on startup.
- **Mock OTP Authentication**:
  - `POST /api/auth/register`: Initiates registration and outputs a 6-digit OTP code directly to server console logs.
  - `POST /api/auth/login`: Initiates login for an existing user and prints an OTP to server logs.
  - `POST /api/auth/verify-otp`: Validates the OTP and returns a signed JWT token.
- **Loan Tracking**:
  - `POST /api/loans`: Add a loan entry (`friend_name`, `amount`, `due_date`, optional `notes`).
  - `GET /api/loans/summary`: Returns summary statistics:
    - `totalLent`: Total amount lent across all records.
    - `totalRepaid`: Total amount repaid across all records.
    - `overdueAmount`: Sum of remaining balances on loans past their due date.
    - `outstandingAmount`: Total remaining balance (`totalLent - totalRepaid`).
    - `activeLoanCount`: Number of non-settled loans.
  - `GET /api/loans`: Fetch all loans for the logged-in user.
  - `POST /api/loans/:id/repay`: Record a repayment amount against a loan.

---

## Folder Structure

```text
backend/
├── src/
│   ├── config/
│   │   └── db.ts                # PostgreSQL connection pool and auto-table creation
│   ├── controllers/
│   │   ├── auth.controller.ts   # Express request handlers for register, login, OTP
│   │   └── loan.controller.ts   # Express request handlers for loans and summary
│   ├── middleware/
│   │   └── auth.middleware.ts   # JWT authentication verification middleware
│   ├── routes/
│   │   ├── auth.routes.ts       # Auth route definitions
│   │   └── loan.routes.ts       # Loan route definitions
│   ├── services/
│   │   ├── auth.service.ts      # Auth database queries & business logic
│   │   └── loan.service.ts      # Loan calculations, aggregations & queries
│   ├── types/
│   │   └── index.ts             # Shared TypeScript interfaces
│   ├── utils/
│   │   └── otp.util.ts          # OTP generator and console log formatter
│   ├── app.ts                   # Express app configuration & middleware
│   └── server.ts                # Server startup & DB initialization
├── .env                         # Local environment variables
├── .env.example                 # Example environment variables template
├── docker-compose.yml           # Optional PostgreSQL Docker container
├── package.json                 # Project dependencies & scripts
├── requests.http                # Interactive HTTP test suite (VS Code REST Client)
└── tsconfig.json                # TypeScript compiler configuration
```

---

## Getting Started

### 1. Database Setup

You can use an existing local PostgreSQL server or launch one via Docker:

```bash
# Using Docker (optional):
docker compose up -d
```

Verify your database credentials in `backend/.env`:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=miniledger

JWT_SECRET=super_secret_jwt_key_change_me_in_production
JWT_EXPIRES_IN=7d
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run in Development Mode

```bash
npm run dev
```

*The server will automatically connect to PostgreSQL and create any missing tables (`users`, `otps`, `loans`).*

### 4. Build and Run Production Bundle

```bash
npm run build
npm start
```

---

## API Endpoints Reference

### Authentication

#### 1. Register User
- **Method**: `POST`
- **URL**: `/api/auth/register`
- **Body**:
  ```json
  {
    "name": "Vaibhav",
    "identifier": "vaibhav@example.com"
  }
  ```
- **Console Log**: Check your server terminal! A mock OTP will be printed:
  ```text
  ==================================================
  [MOCK OTP SERVICE] - USER REGISTRATION
  Target Recipient : vaibhav@example.com
  Your OTP Code    : 482910
  Expiration       : Valid for 5 minutes
  ==================================================
  ```

#### 2. Login User
- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Body**:
  ```json
  {
    "identifier": "vaibhav@example.com"
  }
  ```

#### 3. Verify OTP
- **Method**: `POST`
- **URL**: `/api/auth/verify-otp`
- **Body**:
  ```json
  {
    "identifier": "vaibhav@example.com",
    "otp": "482910"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Authentication successful.",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "name": "Vaibhav",
        "identifier": "vaibhav@example.com"
      }
    }
  }
  ```

---

### Loans (Requires `Authorization: Bearer <token>` Header)

#### 4. Add a Loan Entry
- **Method**: `POST`
- **URL**: `/api/loans`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "friend_name": "Rahul Sharma",
    "amount": 2500.00,
    "due_date": "2026-11-20",
    "notes": "Emergency loan"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Loan entry created successfully.",
    "data": {
      "id": 1,
      "user_id": 1,
      "friend_name": "Rahul Sharma",
      "amount": "2500.00",
      "repaid_amount": "0.00",
      "due_date": "2026-11-20T00:00:00.000Z",
      "status": "PENDING",
      "notes": "Emergency loan"
    }
  }
  ```

#### 5. Get Ledger Summary
- **Method**: `GET`
- **URL**: `/api/loans/summary`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "totalLent": 3500,
      "totalRepaid": 500,
      "overdueAmount": 1000,
      "outstandingAmount": 3000,
      "activeLoanCount": 2
    }
  }
  ```

#### 6. List All Loans
- **Method**: `GET`
- **URL**: `/api/loans`
- **Headers**: `Authorization: Bearer <token>`

#### 7. Record a Repayment
- **Method**: `POST`
- **URL**: `/api/loans/:id/repay`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "amount": 500.00
  }
  ```
