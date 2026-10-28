# Restaurant POS & Management System

A modern, high-performance, offline-first Restaurant Point of Sale (POS) and Management System built as a monorepo with Turborepo, React PWA, Fastify, and Socket.IO.

---

## screenshots
- cashier/captain screen 
  <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/36400ec7-b1a3-424f-ba22-8c2f175a47ff" />
  <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/412f55c8-116d-48ab-8cfb-fb58ec74cc15" />
  <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/365ddaa9-40a2-4577-83a6-2b3b4b15d03f" />
  <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/bfcc65d0-80c3-410d-b96f-7758cb407c20" />
  <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/81526ae7-69f8-47ca-8e3b-98916b23e897" />

  
- cook/KDS screen : 
  <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/d0743bd8-c755-42c0-a31f-aa61e0421109" />
  <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/01ff0643-5613-465e-afe6-927a8494fa5b" />

- super-admin
  <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/dd2da3c8-c4a6-4308-8e0a-361caa204135" />
  <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/ecaeb9b1-49b0-4c04-861f-8d2f7e7b8284" />

- Admin-screen
  <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/cc9d9d7d-a901-47e6-af1f-6800720cad75" />
  <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/e0c5b1a4-3c4b-4397-8e11-2846f2748841" />











## 🚀 Overview

The **Restaurant POS** system is designed for restaurants, cafes, bars, and multi-chain food outlets. It supports end-to-end operations including floor plan management, live table tracking, multi-course KOT generation, real-time kitchen displays (KDS), split billing, multi-tender payments, shift reconciliation, and role-based access control.

---

## 🛠️ Architecture & Tech Stack

```
Restaurant-POSS/
├── apps/
│   ├── api/            # Fastify backend, Socket.IO server, Mongoose models, Web Push
│   └── web/            # React 18, Vite PWA, TailwindCSS, Zustand, Dexie.js (IndexedDB)
├── packages/
│   ├── shared/         # Common schemas (Zod), billing engine, role definitions & statuses
│   └── eslint-config/  # Shared ESLint configuration
```

- **Monorepo Tooling:** [Turborepo](https://turbo.build/) + [pnpm](https://pnpm.io/) Workspaces
- **Frontend (`@pos/web`):**
  - **Framework:** React 18 with Vite
  - **State Management:** Zustand + Dexie.js (Offline-first IndexedDB persistence)
  - **Styling & UI:** TailwindCSS, Radix UI primitives, Lucide Icons
  - **Real-Time:** Socket.IO Client (live order, table, and KOT sync)
  - **PWA & Offline:** Vite Plugin PWA, Service Worker, Web Push Notifications
- **Backend (`@pos/api`):**
  - **Framework:** Fastify v5
  - **Database:** MongoDB via Mongoose
  - **Real-Time Server:** Socket.IO
  - **Security:** Argon2 password/PIN hashing, `@fastify/jwt`, `@fastify/cookie`, rate limiting
  - **Notifications:** Web Push (VAPID)
- **Shared Package (`@pos/shared`):**
  - Shared Zod validation schemas
  - Pure billing calculation engine (GST, CGST, SGST, discounts, charges, rounding)
  - System roles, permissions, and entity statuses

---

## ✨ Key Features

1. **Role-Based Access Control (RBAC):**
   - **Platform Super Admin:** Platform-wide oversight and store onboarding.
   - **Owner / Admin:** Outlet setup, team management, tax/charge configuration, and full reporting.
   - **Store Manager:** Day operations (Day Open/Close, Cash Float), menu management, floor layouts, and bill voids.
   - **Counter Biller / Cashier:** Bill generation, discount applications, multi-mode payment settlement (Cash, UPI, Card, Customer Due), and receipts.
   - **Service Captain:** Table view, guest management, dine-in ordering, and table transfer/merging.
   - **Kitchen Cook / Chef:** Kitchen Display System (KDS), station routing (Tandoor, Kitchen, Bar), KOT acknowledgment, and audio ringer alerts.

2. **Floor & Live Table Management:**
   - Multi-area floors (Ground Floor AC, Terrace, Bar).
   - Real-time table states: `VACANT`, `OCCUPIED` (Running), `BILLED`, `RESERVED`.
   - Table transfer and merging workflows.

3. **Ordering & Kitchen Display System (KDS):**
   - Item search, categories, variants, and add-ons.
   - Station-based KOT routing.
   - Audio ringers and background push notifications when food is marked ready.

4. **Billing & Settlement Engine:**
   - GST compliance (CGST, SGST, IGST) with customizable tax rates.
   - Flat and percentage discounts with manager overrides.
   - Automatic currency formatting and rounding to the nearest rupee.
   - Instant receipt printing and printable invoice preview.

5. **Day Operations & Cash Management:**
   - Business day open/close enforcement.
   - Shift management, opening float tracking, and cash movements (Cash In, Cash Out, Cash Drop).

---

## 📋 Prerequisites

- **Node.js:** `>= 18.0.0`
- **pnpm:** `>= 9.0.0` or `10.x`
- **MongoDB:** Local MongoDB instance or MongoDB Atlas connection URI

---

## ⚙️ Environment Variables

Create `.env` in the root (and in `apps/api/.env` if running directly):

```env
# Server / API Configuration
NODE_ENV=development
PORT=4000
HOST=0.0.0.0
MONGODB_URI=mongodb://localhost:27017/resto-pos
JWT_SECRET=your_jwt_secret_key_minimum_16_chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
COOKIE_SECRET=your_cookie_secret_key_minimum_16_chars
CORS_ORIGIN=http://localhost:5173

# Frontend (Build / Dev)
VITE_API_BASE_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Database Seeding (Optional)

To seed initial system roles and the default super-admin user:

```bash
pnpm --filter @pos/api seed
```

**Default Credentials:**

- **Email:** `superadmin@pos.internal`
- **Phone:** `9999999999`
- **Password:** `Pos@12345`
- **PIN:** `9999`

### 3. Run Development Server

Starts both the Fastify backend on port `4000` and Vite web app on port `5173`:

```bash
pnpm dev
```

Or run packages individually:

```bash
# Run API only (port 4000)
pnpm --filter @pos/api dev

# Run Web only (port 5173)
pnpm --filter @pos/web dev
```

Access the web interface at `http://localhost:5173`.

---

## 🧪 Testing & Quality Assurance

Run all test suites across the monorepo:

```bash
pnpm test
```

Run test suite for a specific package:

```bash
# API tests
pnpm --filter @pos/api test

# Web frontend tests
pnpm --filter @pos/web test

# Shared library tests
pnpm --filter @pos/shared test
```

---

## 📦 Production Build

Build all packages and web assets:

```bash
pnpm build
```

The production assets for the frontend are output to `apps/web/dist/`.

---

## 🐳 Docker Deployment

To spin up the entire stack using Docker:

```bash
docker-compose up --build
```
