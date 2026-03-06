# Foody - Restaurant Ordering System

A full-stack web application for restaurant ordering, billing, and management. Customers browse the menu and place orders from their table; staff manage and fulfill those orders; admins oversee everything through a rich analytics dashboard.

---

## Table of Contents

1. [What is Foody?](#what-is-foody)
2. [Live Feature Overview](#live-feature-overview)
3. [User Roles](#user-roles)
4. [User Flow](#user-flow)
5. [Tech Stack](#tech-stack)
6. [Architecture](#architecture)
7. [Project Structure](#project-structure)
8. [Database Models](#database-models)
9. [API Reference](#api-reference)
10. [Authentication](#authentication)
11. [Running the Project](#running-the-project)
12. [Environment Variables](#environment-variables)
13. [Running Tests](#running-tests)
14. [Flutter / Mobile Compatibility](#flutter--mobile-compatibility)

---

## What is Foody?

Foody is a **dine-in restaurant ordering system** built for the modern restaurant workflow. Instead of paper menus and shouting for a waiter, customers scan a QR code (or open the app), browse the digital menu, and place orders directly from their table. Staff receive orders instantly and update their status in real time. Admins track revenue, manage the menu, set promotions, and communicate with customers through announcements.

**In plain words:**

> You sit at a table, open Foody, browse the menu, tap "Add to Cart", and confirm your order. A notification goes to the kitchen. You watch your order go from _Pending → Confirmed → Preparing → Served_. When done, you request the bill through the app. The restaurant prints or shows your receipt. You leave a review. Done.

---

## Live Feature Overview

| Feature                  | Description                                                         |
| ------------------------ | ------------------------------------------------------------------- |
| Digital Menu             | Full menu with categories, search, filters (veg/non-veg), images    |
| Cart & Ordering          | Add items, set quantity, add notes, enter table number              |
| Real-Time Order Tracking | Live order status from pending to served                            |
| Billing                  | Request bill or call waiter; admin generates/marks paid             |
| Reviews & Ratings        | Verified reviews (only for customers who completed an order)        |
| My Reviews               | Customers can view, edit, and delete all their past reviews         |
| Promotions               | Hot deals, featured items, daily specials, chef's specials          |
| Discounts                | Percentage off, fixed amount, BOGO (Buy X Get Y), combo deals       |
| Announcements            | Admin/staff post notices, offers, events; customers view them live  |
| Analytics Dashboard      | Revenue charts, order breakdowns, category stats, growth indicators |
| User Management          | Admin manages all user accounts and roles                           |
| Password Reset           | Email-based secure password reset flow                              |
| Responsive UI            | Works on mobile, tablet, and desktop                                |

---

## User Roles

There are **three roles** in Foody, each with a distinct experience.

### Customer

A regular diner who uses Foody to order food.

- Registers / logs in with email and password
- Browses the menu, adds items to cart, places orders
- Tracks order status in real time
- Requests the bill or calls the waiter from the app
- Leaves verified reviews for items they ordered
- Manages their own reviews (view, edit, delete)
- Views restaurant announcements and offers

### Staff

A restaurant employee (waiter, cashier, kitchen staff).

- Logs in to a staff-specific dashboard
- Views and manages all active orders
- Updates order status (Confirmed → Preparing → Served → Completed)
- Manages products and categories (add, edit, availability)
- Posts announcements visible to customers
- Cannot access user management or billing stats

### Admin

The restaurant owner or manager — full system access.

- Everything staff can do, plus:
- Full analytics dashboard (revenue, growth, hourly trends, category breakdown)
- User management (view all users, change roles, suspend accounts)
- Billing control (generate bills, mark as paid, choose payment method)
- Moderate customer reviews (view and delete)
- Set product discounts and promotional flags
- Access all historical data and reports

---

## User Flow

### Customer Journey

```
Visit foody.com
       │
       ▼
  [Landing Page]  ──── Sign Up ────►  [Register]  ──►  [Dashboard]
       │
       └──── Sign In ───►  [Login]  ──►  [Dashboard]
                                              │
                    ┌─────────────────────────┼──────────────────────────┐
                    │                         │                          │
                    ▼                         ▼                          ▼
              [Browse Menu]            [My Orders]               [Announcements]
                    │                         │
             Search / Filter           View Order Detail
             by category               Track live status
                    │                         │
             [Product Detail]           [Request Bill]
             View images                [Call Waiter]
             See ratings                [Leave Review]
             Read reviews               [Reorder]
                    │
             [Add to Cart]
                    │
              [Cart Page]
             Adjust qty / remove
                    │
             [Place Order]
             Table # + notes
                    │
             [Order Confirmed]
             Track: Pending → Confirmed → Preparing → Served
                    │
             [Bill Requested]
             Admin generates receipt
                    │
             [Completed Order]
             Leave star rating + comment
```

### Staff / Admin Journey

```
  [Login as Staff/Admin]
          │
          ▼
   [Admin Dashboard]
   Revenue, orders, charts
          │
     ┌────┴────────────────────────────────────────┐
     │         │           │           │            │
     ▼         ▼           ▼           ▼            ▼
 [Orders]  [Products] [Categories] [Reviews] [Announcements]
 View all   Add/edit   Add/edit     Delete    Create / pin
 Update     Set promo  Activate     manage    Set type/expiry
 status     discounts
     │
     ▼
 [Bills] (Admin only)
 Generate, mark paid
 Choose payment method
     │
 [Users] (Admin only)
 View all users
 Change roles
```

---

## Tech Stack

### Frontend

| Technology                  | Purpose                                          |
| --------------------------- | ------------------------------------------------ |
| **Next.js 15** (App Router) | React framework with file-based routing, SSR/SSG |
| **TypeScript**              | Type safety across the entire frontend           |
| **Tailwind CSS**            | Utility-first styling, responsive design         |
| **React Hook Form + Zod**   | Form validation with schema-based rules          |
| **Axios**                   | HTTP client for API calls, with interceptors     |
| **React Hot Toast**         | Non-intrusive toast notifications                |
| **React Icons (Feather)**   | Consistent, lightweight icon set                 |
| **js-cookie**               | Cookie management for auth tokens                |

### Backend

| Technology               | Purpose                                      |
| ------------------------ | -------------------------------------------- |
| **Node.js + Express 5**  | REST API server                              |
| **MongoDB + Mongoose 9** | Document database with ODM                   |
| **JWT (jsonwebtoken)**   | Stateless authentication tokens              |
| **bcryptjs**             | Password hashing (12 rounds)                 |
| **Multer**               | File upload handling (product/avatar images) |
| **Nodemailer**           | Transactional email (password reset)         |
| **PDFKit**               | PDF bill generation                          |
| **cookie-parser**        | Cookie-based token support                   |

### Testing

| Technology                | Purpose                              |
| ------------------------- | ------------------------------------ |
| **Jest**                  | Test runner and assertion library    |
| **Supertest**             | HTTP integration testing             |
| **mongodb-memory-server** | In-memory MongoDB for isolated tests |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│                                                             │
│   Next.js 15 (App Router)                                   │
│   ┌────────────────────────────────────────────────────┐   │
│   │  Landing Page  │  Auth Pages  │  Dashboard Pages   │   │
│   │   /            │  /login      │  /menu             │   │
│   │                │  /signup     │  /orders           │   │
│   │                │  /reset-pw   │  /admin            │   │
│   └────────────────────────────────────────────────────┘   │
│                     │  Axios + JWT Bearer Token             │
└─────────────────────┼───────────────────────────────────────┘
                      │ HTTP/REST (JSON)
┌─────────────────────▼───────────────────────────────────────┐
│                    EXPRESS SERVER                           │
│                    (Node.js + Express 5)                    │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Routes  │  │ Middlewares  │  │     Controllers      │  │
│  │ /api/... │  │ auth.protect │  │  AuthController      │  │
│  │          │  │ auth.authoriz│  │  ProductController   │  │
│  │          │  │ multer upload│  │  OrderController     │  │
│  └──────────┘  └──────────────┘  │  ReviewController    │  │
│                                  │  AnnouncementCtrl    │  │
│                                  │  StatsController     │  │
│                                  └──────────────────────┘  │
│                                            │                │
│  ┌─────────────────────────────────────────▼─────────────┐  │
│  │                  Repository Layer                     │  │
│  │  BaseRepository ← ProductRepository                  │  │
│  │                 ← OrderRepository                    │  │
│  │                 ← ReviewRepository                   │  │
│  │                 ← AnnouncementRepository             │  │
│  │  (DTO validation layer sits between Controllers      │  │
│  │   and Repositories for input sanitization)           │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │ Mongoose ODM
┌──────────────────────────────▼──────────────────────────────┐
│                        MONGODB                              │
│                                                             │
│  Collections:  users │ products │ categories │ orders       │
│                carts │ bills    │ reviews    │ announcements │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns Used

- **Repository Pattern** — Each model has a dedicated repository class extending `BaseRepository`. Controllers never query MongoDB directly.
- **DTO Pattern** — Data Transfer Objects validate and sanitize incoming request bodies before they reach the repository layer.
- **Role-Based Access Control (RBAC)** — `protect` middleware verifies JWT; `authorize(...roles)` middleware gates admin/staff-only routes.
- **Virtual Fields** — The `Product` model computes `finalPrice`, `savingsAmount`, and `savingsPercentage` as virtuals based on discount configuration.

---

## Project Structure

```
foody/
├── README.md
│
├── frontend/                          # Next.js 15 app
│   └── src/
│       ├── app/
│       │   ├── page.tsx               # Landing page (redirects logged-in users)
│       │   ├── layout.tsx             # Root layout (Toaster, fonts)
│       │   ├── login/page.tsx
│       │   ├── signup/page.tsx
│       │   ├── forgot-password/page.tsx
│       │   ├── reset-password/[token]/page.tsx
│       │   └── (dashboard)/
│       │       ├── layout.tsx         # Sidebar + header shell
│       │       ├── (customer)/
│       │       │   ├── dashboard/     # Customer stats + announcements
│       │       │   ├── menu/          # Product list + filters
│       │       │   ├── menu/[id]/     # Product detail + reviews
│       │       │   ├── cart/          # Cart management
│       │       │   ├── orders/        # Order list
│       │       │   ├── orders/[id]/   # Order detail + billing + inline reviews
│       │       │   ├── reviews/       # My Reviews CRUD page
│       │       │   ├── announcements/ # View restaurant announcements
│       │       │   └── profile/       # Profile + avatar + password
│       │       └── (admin)/
│       │           └── admin/
│       │               ├── page.tsx      # Admin analytics dashboard
│       │               ├── orders/       # Order management
│       │               ├── products/     # Product CRUD + promotions + discounts
│       │               ├── categories/   # Category management
│       │               ├── reviews/      # Review moderation
│       │               ├── bills/        # Billing management
│       │               ├── users/        # User management
│       │               └── announcements/ # Announcement CRUD
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx        # Role-aware navigation sidebar
│       │   │   └── Header.tsx         # Mobile header with menu toggle
│       │   ├── product/
│       │   │   ├── OfferBadge.tsx     # Promotional badge display
│       │   │   ├── PriceDisplay.tsx   # Price with discount strikethrough
│       │   │   └── OfferDetails.tsx   # BOGO/combo offer details card
│       │   └── ui/
│       │       └── ConfirmDialog.tsx
│       ├── hooks/
│       │   └── useAuth.ts             # Auth context (user, login, logout)
│       ├── lib/
│       │   ├── api.ts                 # Axios instance + getImageUrl helper
│       │   └── currency.ts            # formatCurrency (Nepali Rupee ₨)
│       ├── schemas/
│       │   └── review.schema.ts       # Zod schema for review forms
│       └── types/
│           └── index.ts               # All TypeScript interfaces
│
└── backend/                           # Express REST API
    ├── app.js                         # Express app (no listen — importable for tests)
    ├── server.js                      # Entry point (connects DB, starts listener)
    ├── jest.config.js
    ├── models/
    │   ├── User.js                    # bcrypt, JWT, reset token
    │   ├── Product.js                 # Discounts, promos, virtual finalPrice
    │   ├── Category.js
    │   ├── Cart.js
    │   ├── Order.js                   # Status enum, order items
    │   ├── Review.js                  # calcAverageRating static method
    │   ├── Bill.js                    # Payment method, PDF generation
    │   └── Announcement.js            # Type enum, pinned, expiresAt TTL
    ├── config/
    │   └── db.js                      # Mongoose connect
    ├── src/
    │   ├── controllers/               # Request handlers (one class per domain)
    │   ├── repositories/              # Data access layer (extends BaseRepository)
    │   ├── dtos/                      # Input validation objects
    │   ├── middlewares/
    │   │   ├── auth.middleware.js     # protect + authorize
    │   │   └── upload.middleware.js   # multer config
    │   ├── routes/                    # Express routers
    │   └── utils/
    │       └── sendEmail.js           # Nodemailer wrapper
    └── tests/
        ├── db.js                      # MongoMemoryServer helpers
        ├── helpers.js                 # Test data factories
        ├── auth.test.js               # 9 auth tests
        ├── products.test.js           # 8 product tests
        ├── orders.test.js             # 8 order tests
        ├── reviews.test.js            # 8 review tests
        └── announcements.test.js      # 10 announcement tests
```

---

## Database Models

### User

| Field               | Type   | Notes                          |
| ------------------- | ------ | ------------------------------ |
| name                | String | max 50 chars                   |
| email               | String | unique, lowercase              |
| password            | String | bcrypt hashed, select: false   |
| role                | Enum   | `customer` / `staff` / `admin` |
| avatar              | String | upload path                    |
| resetPasswordToken  | String | SHA-256 hashed                 |
| resetPasswordExpire | Date   | 10-minute window               |

### Product

| Field                                                | Type                | Notes                                      |
| ---------------------------------------------------- | ------------------- | ------------------------------------------ |
| name, description                                    | String              |                                            |
| price                                                | Number              | base price                                 |
| category                                             | ObjectId → Category |                                            |
| image, images                                        | String, [String]    | upload paths                               |
| isAvailable, isVeg                                   | Boolean             |                                            |
| rating, numReviews                                   | Number              | auto-calculated                            |
| discountType                                         | Enum                | `none / percentage / fixed / bogo / combo` |
| discountValue                                        | Number              | % or fixed amount                          |
| bogoConfig                                           | Object              | `{ buyQuantity, getQuantity }`             |
| comboItems                                           | [ObjectId]          | ref products                               |
| comboPrice                                           | Number              |                                            |
| isFeatured, isHotDeal, isDailySpecial, isChefSpecial | Boolean             | promotional flags                          |
| offerLabel                                           | String              | e.g. "50% Off"                             |
| offerValidUntil                                      | Date                |                                            |
| **finalPrice**                                       | Virtual             | computed from discount                     |

### Order

| Field                     | Type                                      | Notes                                                              |
| ------------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| user                      | ObjectId → User                           |                                                                    |
| items                     | [{product, name, price, quantity, image}] | snapshot at order time                                             |
| tableNumber               | String                                    |                                                                    |
| status                    | Enum                                      | `pending / confirmed / preparing / served / completed / cancelled` |
| subtotal, tax (5%), total | Number                                    |                                                                    |
| notes                     | String                                    | special requests                                                   |
| isPaid                    | Boolean                                   |                                                                    |

### Review

| Field        | Type               | Notes                           |
| ------------ | ------------------ | ------------------------------- |
| user         | ObjectId → User    |                                 |
| product      | ObjectId → Product |                                 |
| order        | ObjectId → Order   | verified purchase reference     |
| rating       | Number             | 1–5                             |
| comment      | String             | optional                        |
| Unique index |                    | one review per user per product |

### Announcement

| Field       | Type            | Notes                                        |
| ----------- | --------------- | -------------------------------------------- |
| title, body | String          | max 100 / 1000 chars                         |
| type        | Enum            | `offer / event / notice / closure / update`  |
| isPinned    | Boolean         | shown at top                                 |
| isActive    | Boolean         | visible to customers                         |
| expiresAt   | Date            | null = never expires; TTL index auto-removes |
| createdBy   | ObjectId → User |                                              |

### Bill

| Field                | Type             | Notes                          |
| -------------------- | ---------------- | ------------------------------ |
| order                | ObjectId → Order |                                |
| billNumber           | String           | auto-generated                 |
| subtotal, tax, total | Number           |                                |
| paymentMethod        | Enum             | `cash / esewa / khalti / bank` |
| isPaid               | Boolean          |                                |
| paidAt               | Date             |                                |
| status               | Enum             | `requested / generated / paid` |

---

## API Reference

All responses follow the format:

```json
{ "success": true, "data": ... }
{ "success": false, "message": "error description" }
```

### Auth — `/api/auth`

| Method | Endpoint                 | Auth      | Description                     |
| ------ | ------------------------ | --------- | ------------------------------- |
| POST   | `/register`              | Public    | Register new customer account   |
| POST   | `/login`                 | Public    | Login, returns JWT token + user |
| GET    | `/logout`                | Public    | Clears auth cookie              |
| GET    | `/me`                    | Customer+ | Get current user profile        |
| PUT    | `/me`                    | Customer+ | Update name / email             |
| PUT    | `/me/avatar`             | Customer+ | Upload profile picture          |
| PUT    | `/update-password`       | Customer+ | Change password                 |
| POST   | `/forgot-password`       | Public    | Send reset email                |
| PUT    | `/reset-password/:token` | Public    | Reset password with token       |

### Products — `/api/products`

| Method | Endpoint                    | Auth   | Description                                    |
| ------ | --------------------------- | ------ | ---------------------------------------------- |
| GET    | `/`                         | Public | List products (search, filter, paginate)       |
| GET    | `/:id`                      | Public | Get single product with category + combo items |
| GET    | `/featured-items`           | Public | Featured products                              |
| GET    | `/hot-deals`                | Public | Hot deal products                              |
| GET    | `/daily-specials`           | Public | Daily specials                                 |
| GET    | `/chef-specials`            | Public | Chef's specials                                |
| POST   | `/`                         | Staff+ | Create product (with image upload)             |
| PUT    | `/:id`                      | Staff+ | Update product                                 |
| DELETE | `/:id`                      | Admin  | Delete product                                 |
| PUT    | `/:id/toggle-featured`      | Staff+ | Toggle featured flag                           |
| PUT    | `/:id/toggle-hot-deal`      | Staff+ | Toggle hot deal flag                           |
| PUT    | `/:id/toggle-daily-special` | Staff+ | Toggle daily special flag                      |
| PUT    | `/:id/toggle-chef-special`  | Staff+ | Toggle chef special flag                       |
| PUT    | `/:id/set-discount`         | Staff+ | Set discount configuration                     |
| DELETE | `/:id/remove-discount`      | Staff+ | Remove all discounts                           |

### Orders — `/api/orders`

| Method | Endpoint      | Auth      | Description                         |
| ------ | ------------- | --------- | ----------------------------------- |
| POST   | `/`           | Customer+ | Place order from cart (clears cart) |
| GET    | `/my-orders`  | Customer+ | Get current user's orders           |
| GET    | `/all`        | Staff+    | Get all orders (paginated)          |
| GET    | `/:id`        | Customer+ | Get single order (owner or staff)   |
| PUT    | `/:id/status` | Staff+    | Update order status                 |

### Reviews — `/api/reviews`

| Method | Endpoint              | Auth      | Description                              |
| ------ | --------------------- | --------- | ---------------------------------------- |
| GET    | `/product/:productId` | Public    | Get reviews for a product                |
| POST   | `/product/:productId` | Customer+ | Submit review (requires completed order) |
| GET    | `/my-reviews`         | Customer+ | Get current user's all reviews           |
| PUT    | `/:id`                | Customer+ | Edit own review (admin can edit any)     |
| DELETE | `/:id`                | Customer+ | Delete own review (admin can delete any) |
| GET    | `/`                   | Admin     | Get all reviews (paginated)              |

### Announcements — `/api/announcements`

| Method | Endpoint | Auth   | Description                               |
| ------ | -------- | ------ | ----------------------------------------- |
| GET    | `/`      | Public | Get all active, non-expired announcements |
| GET    | `/all`   | Staff+ | Get all announcements including inactive  |
| POST   | `/`      | Staff+ | Create announcement                       |
| PUT    | `/:id`   | Staff+ | Update announcement                       |
| DELETE | `/:id`   | Staff+ | Delete announcement                       |

### Categories — `/api/categories`

| Method | Endpoint | Auth   | Description            |
| ------ | -------- | ------ | ---------------------- |
| GET    | `/`      | Public | List active categories |
| POST   | `/`      | Staff+ | Create category        |
| PUT    | `/:id`   | Staff+ | Update category        |
| DELETE | `/:id`   | Admin  | Delete category        |

### Cart — `/api/cart`

| Method | Endpoint             | Auth      | Description                |
| ------ | -------------------- | --------- | -------------------------- |
| GET    | `/`                  | Customer+ | Get current cart           |
| POST   | `/add`               | Customer+ | Add item (or increase qty) |
| PUT    | `/update`            | Customer+ | Update item quantity       |
| DELETE | `/remove/:productId` | Customer+ | Remove item                |
| DELETE | `/clear`             | Customer+ | Clear entire cart          |

### Bills — `/api/bills`

| Method | Endpoint          | Auth      | Description               |
| ------ | ----------------- | --------- | ------------------------- |
| POST   | `/request`        | Customer+ | Request bill for an order |
| GET    | `/order/:orderId` | Customer+ | Get bill for an order     |
| GET    | `/`               | Staff+    | Get all bills             |
| PUT    | `/:id/pay`        | Staff+    | Mark bill as paid         |
| GET    | `/:id/pdf`        | Staff+    | Download bill as PDF      |

### Stats — `/api/stats`

| Method | Endpoint     | Auth   | Description                                          |
| ------ | ------------ | ------ | ---------------------------------------------------- |
| GET    | `/dashboard` | Staff+ | Full analytics (revenue, orders, charts, breakdowns) |

### Users — `/api/users`

| Method | Endpoint | Auth  | Description                |
| ------ | -------- | ----- | -------------------------- |
| GET    | `/`      | Admin | List all users             |
| GET    | `/:id`   | Admin | Get single user            |
| PUT    | `/:id`   | Admin | Update user (role, status) |
| DELETE | `/:id`   | Admin | Delete user                |

---

## Authentication

Foody uses **JWT (JSON Web Tokens)** for stateless authentication.

### How it works

1. On login/register, the server signs a JWT with `{ id, role }` payload and returns it in the response body **and** as an `httpOnly` cookie.
2. The frontend stores the token in both `localStorage` and a cookie (the cookie is used by Next.js middleware for route protection; localStorage is used by Axios).
3. Every protected API request sends `Authorization: Bearer <token>` in the header.
4. The `protect` middleware verifies the token and attaches `req.user` to the request.
5. The `authorize(...roles)` middleware checks `req.user.role` against allowed roles.

### Token format

```
Header:  { alg: "HS256", typ: "JWT" }
Payload: { id: "<userId>", role: "customer|staff|admin", iat, exp }
```

### Password reset flow

1. User POSTs to `/api/auth/forgot-password` with their email
2. Server generates a random 20-byte token, hashes it with SHA-256, stores the hash + expiry (10 min) in the user document
3. Plain token is sent via email as a reset link
4. User PUTs to `/api/auth/reset-password/:plainToken` — server hashes it, finds the user, updates the password

---

## Running the Project

### Prerequisites

- Node.js 18+
- MongoDB (local instance or MongoDB Atlas)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install

# Create .env file (see Environment Variables section)
cp .env.example .env

npm run dev          # Start with nodemon (auto-reload)
# Server runs on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

npm run dev          # Start Next.js dev server
# App runs on http://localhost:3000
```

### Seed the Database (optional)

```bash
cd backend
npm run seed         # Populates categories, products, and a demo admin user
```

---

## Environment Variables

### Backend `.env`

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/foody

# Auth
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
COOKIE_EXPIRE=7

# Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend URL (for CORS + reset email link)
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Running Tests

Tests use an **in-memory MongoDB** instance — no real database connection needed.

```bash
cd backend

npm test                  # Run all tests once
npm run test:watch        # Watch mode (re-runs on file changes)
npm run test:coverage     # Generate coverage report
```

### Test Suite Overview

| File                          | Count  | What it covers                                                |
| ----------------------------- | ------ | ------------------------------------------------------------- |
| `tests/auth.test.js`          | 9      | Register, login, auth guards, profile update                  |
| `tests/products.test.js`      | 8      | CRUD, role protection, promotional endpoints                  |
| `tests/orders.test.js`        | 8      | Place order, empty cart, status updates, auth guards          |
| `tests/reviews.test.js`       | 8      | Verified review flow, duplicates, edit, delete, authorization |
| `tests/announcements.test.js` | 10     | Active filter, CRUD, role protection, visibility              |
| **Total**                     | **43** | Full integration coverage                                     |

### Test Architecture

```
tests/
├── db.js          # MongoMemoryServer: connect(), close(), clear()
├── helpers.js     # Factory functions: createUser, createAdmin, createProduct...
└── *.test.js      # Each file is fully isolated with its own DB instance
```

---

## Flutter / Mobile Compatibility

The REST API is fully compatible with Flutter (or any HTTP client). Key details:

- **Bearer token auth**: Add `Authorization: Bearer <token>` header to all protected requests
- **JSON responses**: All responses are `application/json` with consistent `{ success, data }` structure
- **Standard HTTP methods**: GET, POST, PUT, DELETE
- **No session state**: Fully stateless JWT — perfect for mobile apps
- **Image URLs**: Product/avatar images served at `http://<host>:5000/uploads/<filename>`

**Example Dart (dio) usage:**

```dart
final dio = Dio(BaseOptions(baseUrl: 'http://your-server:5000/api'));
dio.options.headers['Authorization'] = 'Bearer $token';

// Login
final res = await dio.post('/auth/login', data: {'email': e, 'password': p});
final token = res.data['token'];

// Get menu
final menu = await dio.get('/products');
final products = menu.data['products'];
```
