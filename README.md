# E-Commerce API (NestJS)

This is a **scalable e-commerce API** built with **NestJS**, following industry best practices. It includes authentication, product management, reservations, and order processing using **MySQL** and **TypeORM**.

## 📌 Features

- **Authentication & Authorization** (JWT-based, Role-based Access Control)
- **Product Management** (CRUD, Pagination, Sorting, Searching)
- **Product Reservations** (Auto-expiring reservations using Cron Jobs)
- **Orders** (Placing orders, inventory updates)
- **Reviews & Ratings** (User-product review system)
- **File Uploads** (Image validation and storage)
- **Standardized API Responses**

## 🏗️ Tech Stack

- **Backend:** NestJS, TypeScript
- **Database:** MySQL with TypeORM
- **Authentication:** Passport.js, JWT
- **Job Scheduling:** Cron Jobs (Auto-clear expired reservations)
- **Validation:** Class-Validator & DTOs
- **Storage:** Multer (For file uploads)

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-repo.git
cd your-repo
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Setup Environment Variables

Create a `.env` file in the root directory and configure:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=e-commerce

# Email Configuration
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password
AUTH_VERIFICATION_EMAIL=your_email@example.com

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Authentication
JWT_SECRET=your_jwt_secret
JWT_LIFETIME=30d

# Server Configuration
PORT=3000
```

### 4️⃣ Run Migrations

```bash
npm run typeorm migration:run
```

### 5️⃣ Start the Server

```bash
npm run start:dev
```

## 📌 API Modules Overview

### 🔑 Authentication Module

- **Signup, Login, Logout**
- **Forgot & Reset Password**
- **JWT-based authentication**

### 📦 Product Module

- **CRUD Operations**
- **Pagination, Searching, Sorting**
- **Product Reservations**

### 📌 Product Reservation Module

- **Reserve Product (Expires in 5 min)**
- **Auto-clear expired reservations using Cron Jobs**

### 🛍️ Order Module

- **Place Orders**
- **Manage Inventory**

### ⭐ Review Module

- **Add Product Reviews & Ratings**

## 🛠️ Project Structure

```
src/
│
├── common/               # Shared modules, utilities, and constants
│   ├── decorators/       # Custom decorators
│   ├── exceptions/       # Custom exceptions
│   ├── filters/          # Exception filters
│   ├── guards/           # Authorization and authentication guards
│   ├── interceptors/     # Request/response interceptors
│   ├── middlewares/      # Custom middlewares
│   ├── pipes/            # Validation pipes
│   └── utils/            # Shared utility functions
│
├── config/               # Configuration files (e.g., env-specific configurations)
├── database/             # Database configuration and models/entities
│   ├── migrations/       # Migration files (if using TypeORM/Sequelize)
│   ├── models/           # Schema definitions (if using Mongoose)
│   └── seeds/            # Seed data files
│
├── modules/              # Feature modules
│   ├── auth/             # Authentication module
│   ├── users/            # User module
│   ├── products/         # Product module
│   ├── orders/           # Order module
│   └── reviews/          # Review module
│
├── shared/               # Reusable components/services across modules
│   ├── dto/              # Shared DTOs
│   ├── entities/         # Shared entities/models
│   └── services/         # Shared services
│
├── app.module.ts         # Root module
├── main.ts               # Entry point
└── tests/                # Unit and integration tests
    ├── e2e/              # End-to-end tests
    └── unit/             # Unit tests

```

## 🕒 Cron Job: Auto-clear Product Reservations

A scheduled job runs every **5 minutes** to delete expired reservations:

```typescript
@Cron(CronExpression.EVERY_5_MINUTES, { name: 'clear_reserved_inventory' })
async clearReservedInventory() {
  await this.productReservationRepository
    .createQueryBuilder()
    .delete()
    .from(ProductReservations)
    .where('expires_at<NOW()')
    .execute();
}
```

## 🔗 API Documentation

Use **Postman** or **Swagger** to test the API.
Swagger UI will be available at:

```
http://localhost:3000/
```

## 🤝 Contributing

Feel free to raise issues or submit PRs to improve the project.

---
