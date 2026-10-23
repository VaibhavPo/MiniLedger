# 📱 MiniLedger

> **Smart Personal Loan & Peer-to-Peer Debt Tracker**  
> A full-stack mobile solution designed to eliminate awkward money conversations and messy spreadsheets by keeping a clean, structured record of money lent to friends and family.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#)
[![Node.js](https://img.shields.io/badge/Node.js-v22+-339933?logo=node.js&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6?logo=typescript&logoColor=white)](#)
[![React Native](https://img.shields.io/badge/React_Native-0.88-61DAFB?logo=react&logoColor=black)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](#)

---

## 📥 Pre-Built Android App (APK Download)

If you just want to test or demo the mobile app directly on your Android device without compiling the source code:

> 📦 **[Download Latest Android Debug APK (Google Drive Placeholder)](https://drive.google.com/your-debug-apk-link-placeholder-here)**  
> *(Replace the URL above with your actual Google Drive or GitHub Release shareable link)*

---

## 🌐 Live Hosted Backend API

The backend is deployed and actively running in the cloud. You can connect your mobile app or REST client directly to it:

* **Production / Test API URL**:  
  `https://miniledger-kyjz.onrender.com/`
* **Health Check**:  
  [`https://miniledger-kyjz.onrender.com/health`](https://miniledger-kyjz.onrender.com/health)
* **Demo OTP**:  
  When testing against the remote hosted server, use OTP: `123987`

---

## 🎯 Aim of MiniLedger

MiniLedger was created to solve a common everyday dilemma: keeping track of informal personal loans lent to colleagues, friends, and family.

### Key Objectives & Features
* 🤝 **Peer-to-Peer Loan Tracking**: Log loans with the borrower's name, loan amount, due date, and custom notes.
* 💳 **Partial & Full Repayments**: Record repayments incrementally; the app automatically recalculates remaining balances and updates the loan status (`PENDING`, `PARTIAL`, `SETTLED`).
* 📊 **Financial Dashboard**: At-a-glance summary cards showing Total Lent, Total Repaid, Outstanding Balance, and Overdue Amounts.
* 🔐 **Passwordless OTP Authentication**: Frictionless login experience with mock 6-digit OTP verification.
* ⚙️ **On-the-Fly Server Switching**: The mobile app includes a built-in server configuration screen allowing you to switch between the hosted cloud server, local Docker instance, or Android emulator loopback with live connection testing.

---

## 🏗️ Architecture & Technology Stack

```
MiniLedger/
├── backend/            # Express + TypeScript + PostgreSQL REST API
│   ├── src/            # Controllers, Services, Routes, Middlewares
│   ├── docker-compose  # Automated Postgres container
│   └── requests.http   # Interactive REST API test suite
│
└── mobile/             # React Native (CLI) Cross-Platform Mobile Client
    ├── src/
    │   ├── screens/    # ServerConfig, Login, OTP, HomeScreen
    │   ├── services/   # Auth and Loan API services
    │   ├── styles/     # Material/Tailored color palette & typography
    │   └── utils/      # API client & URL normalizer
    └── android/        # Native Android Gradle configuration
```

* **Frontend**: React Native 0.88, TypeScript, Lucide Icons, React Native Safe Area Context.
* **Backend**: Node.js, Express 4, TypeScript, PostgreSQL (pg pool), JWT.
* **DevOps**: Docker & Docker Compose for PostgreSQL.

---

## 📱 Dynamic Server Configuration (First Screen)

When launching the mobile application:
1. **Server Detection**: If not previously configured, the app opens natively to the **Backend Connection** screen (`ServerConfigScreen`).
2. **Presets Available**:
   * **Remote Server**: Automatically connects to `https://miniledger-kyjz.onrender.com/` (Default test OTP: `123987`).
   * **Android Emulator**: Resolves to `http://10.0.2.2:5000/api` (standard Android Studio emulator loopback).
   * **Localhost / LAN IP**: Set custom address such as `http://192.168.x.x:5000/api`.
3. **Test Connection**: Tap **"Test Connection"** to verify server reachability in real-time before continuing.
4. **Change Anytime**: You can return to the server configuration screen at any point from the login view.

---

## 🚀 Step-by-Step Setup & How to Run

### Prerequisites
* **Node.js**: `v22.11.0` or higher
* **npm**: `v10+`
* **Docker & Docker Compose** (for running local PostgreSQL) or an existing PostgreSQL instance
* **Android Studio & Android SDK** (with JDK 17 configured)

---

### 1️⃣ Setting Up & Running the Backend

#### Step 1: Open the backend folder
```bash
cd backend
```

#### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
# On Windows (PowerShell):
Copy-Item .env.example .env

# On macOS / Linux:
cp .env.example .env
```

Ensure the configuration matches your local database:
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

#### Step 3: Start the PostgreSQL Database
If you have Docker installed, simply run:
```bash
docker compose up -d
```
*(This starts a PostgreSQL 16 Alpine container on port `5432` with volume persistence).*

#### Step 4: Install Dependencies & Launch Dev Server
```bash
npm install
npm run dev
```

* The server runs on **`http://localhost:5000`**.
* All database tables (`users`, `otps`, `loans`) are **automatically created** on initial boot.
* During local testing, OTP codes are printed directly to the backend terminal log.

---

### 2️⃣ Setting Up & Running the Mobile App

#### Step 1: Open the mobile folder
```bash
cd ../mobile
# or from root: cd mobile
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Start the Metro Bundler
In a dedicated terminal window:
```bash
npm start
```

#### Step 4: Launch on Android
Make sure an Android emulator is running or a physical device is connected with USB Debugging enabled:
```bash
npm run android
```

> **Note for Physical Android Devices**: If connecting to a local backend on your computer via Wi-Fi, ensure your phone and PC are on the same Wi-Fi network and enter your machine's local IP (e.g. `http://192.168.1.50:5000/api`) or select the **Remote Server** preset.

---

## 🔨 Building Android APKs

### ⚠️ Important Path Note
Make sure your terminal is inside `mobile/android` before invoking `./gradlew` (or `.\gradlew` on Windows). If you are already inside `mobile/android`, do **not** run `cd android` again.

---

### 🛠️ Option A: Build Debug APK (Fastest for testing)

Run the following from the `mobile` directory:

```powershell
# Navigate into the android directory
cd android

# Build the Debug APK
.\gradlew assembleDebug
```

* **Output Location**:  
  `mobile/android/app/build/outputs/apk/debug/app-debug.apk`
* You can drag and drop this `.apk` directly onto an Android emulator or transfer it to an Android phone to install!

---

### 📦 Option B: Build Release APK

Run from the `mobile/android` directory:

```powershell
.\gradlew assembleRelease
```

* **Output Location**:  
  `mobile/android/app/build/outputs/apk/release/app-release.apk`

---

## 📡 Backend API Reference

| Endpoint | Method | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | No | Server status & health check |
| `/api/auth/register` | `POST` | No | Registers user and logs/dispatches 6-digit OTP |
| `/api/auth/login` | `POST` | No | Initiates login and logs/dispatches 6-digit OTP |
| `/api/auth/verify-otp` | `POST` | No | Validates OTP and returns JWT token |
| `/api/loans` | `GET` | Yes (`Bearer`) | Retrieves all loans for logged-in user |
| `/api/loans` | `POST` | Yes (`Bearer`) | Creates a new loan entry |
| `/api/loans/summary` | `GET` | Yes (`Bearer`) | Aggregated metrics (total lent, overdue, outstanding) |
| `/api/loans/:id/repay` | `POST` | Yes (`Bearer`) | Records a partial or full repayment |

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
