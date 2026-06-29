# Sales Task Management System

A complete Sales Task Management System with role-based access control for Admin, Manager, and Salesman roles.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript** (Strict Mode)
- **MongoDB** + **Prisma ORM**
- **NextAuth** + JWT Authentication
- **Tailwind CSS** + Shadcn UI
- **React Hook Form** + Zod Validation
- **Socket.io** (Real-time notifications)

## Features

- Role-based authentication (Admin, Manager, Salesman)
- User management with organization hierarchy
- Task creation, assignment, and tracking
- Automatic overdue detection (IST timezone)
- Dashboard with stats for each role
- Reports with Excel, PDF, CSV export
- In-app notifications and activity logs
- Dark mode support

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB installed and running locally

### Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Make sure MongoDB is running locally, then push schema
npm run db:push

# Seed demo data
npm run db:seed

# Start development server
npm run dev
```

Ensure MongoDB is running locally before `db:push`. Default connection in `.env`:

```
DATABASE_URL="mongodb://localhost:27017/sales-task-management"
```

**One-time Prisma requirement:** MongoDB must run as a replica set (even on localhost). Run:

```bash
bash scripts/setup-mongodb.sh
```

Or manually:

```bash
# Add to /etc/mongod.conf under replication:
#   replSetName: "rs0"
sudo systemctl restart mongod
mongosh --eval "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: '127.0.0.1:27017' }] })"
```

Open [http://localhost:3000](http://localhost:3000)

### API Documentation (Swagger)

Open [http://localhost:3000/api-docs](http://localhost:3000/api-docs) to test all APIs interactively.

1. Call **POST /api/auth/login** with demo credentials
2. Copy the `token` from the response
3. Click **Authorize** (top right) and enter: `Bearer YOUR_TOKEN`
4. Test any protected endpoint

### Demo Credentials

| Role     | Email               | Password     |
|----------|---------------------|--------------|
| Admin    | admin@example.com   | admin123     |
| Manager  | manager@example.com | manager123   |
| Salesman | salesman@example.com| salesman123  |

## IST Date Format

All dates use `YYYY:MM:DD:HH:MM:SS` format in Asia/Kolkata timezone.

Example: `2026:06:21:14:30:45`

## Project Structure

```
src/
├── app/              # Next.js App Router pages & API routes
├── components/       # UI components (ui, dashboard, common)
├── lib/              # Utilities, prisma, auth, jwt
├── services/         # Business logic layer
├── repositories/     # Data access layer
├── middleware/       # Auth & role middleware
├── validations/      # Zod schemas
├── types/            # TypeScript types
└── hooks/            # Custom React hooks
```

## API Endpoints

| Method | Endpoint                  | Description          |
|--------|---------------------------|----------------------|
| POST   | /api/auth/login           | Login (via NextAuth) |
| POST   | /api/admin                | Create admin user    |
| POST   | /api/users                | Create user          |
| GET    | /api/users                | List users           |
| PUT    | /api/users/:id            | Update user          |
| DELETE | /api/users/:id            | Delete user          |
| POST   | /api/tasks                | Create task          |
| GET    | /api/tasks                | List tasks           |
| PUT    | /api/tasks/:id            | Update task          |
| DELETE | /api/tasks/:id            | Delete task          |
| POST   | /api/tasks/assign         | Assign task          |
| POST   | /api/tasks/complete       | Complete task        |
| GET    | /api/reports              | Generate reports     |
| GET    | /api/notifications        | Get notifications    |
| GET    | /api/activity-logs        | Activity audit logs  |

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:push      # Push Prisma schema
npm run db:seed      # Seed demo data
npm run db:studio    # Prisma Studio
npm test             # Run unit tests
```

## License

MIT
