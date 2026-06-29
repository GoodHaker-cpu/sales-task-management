import { config } from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

config();

function getDatabaseUrl(): string {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error("DATABASE_URL is not set. Add it to your .env file.");
  }
  return uri;
}

function istDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0
): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${year}:${pad(month)}:${pad(day)}:${pad(hour)}:${pad(minute)}:${pad(second)}`;
}

async function main() {
  console.log("Seeding database (native MongoDB driver)...");

  const client = new MongoClient(getDatabaseUrl());
  await client.connect();
  const db = client.db();

  const collections = [
    "ActivityLog",
    "Notification",
    "TaskComment",
    "TaskAttachment",
    "Task",
    "PasswordReset",
    "User",
  ];

  for (const name of collections) {
    try {
      await db.collection(name).drop();
    } catch {
      // Collection may not exist
    }
  }

  const now = istDate(2026, 6, 21, 14, 30, 0);
  const adminId = new ObjectId();
  const managerId = new ObjectId();
  const salesman1Id = new ObjectId();
  const salesman2Id = new ObjectId();

  await db.collection("User").insertMany([
    {
      _id: adminId,
      name: "System Admin",
      email: "admin@example.com",
      password: await bcrypt.hash("admin123", 12),
      phone: "+91-9876543210",
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: managerId,
      name: "Raj Manager",
      email: "manager@example.com",
      password: await bcrypt.hash("manager123", 12),
      phone: "+91-9876543211",
      role: "MANAGER",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: salesman1Id,
      name: "Amit Salesman",
      email: "salesman@example.com",
      password: await bcrypt.hash("salesman123", 12),
      phone: "+91-9876543212",
      role: "SALESMAN",
      status: "ACTIVE",
      managerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: salesman2Id,
      name: "Priya Sales",
      email: "priya@example.com",
      password: await bcrypt.hash("salesman123", 12),
      phone: "+91-9876543213",
      role: "SALESMAN",
      status: "ACTIVE",
      managerId,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await db.collection("Task").insertMany([
    {
      _id: new ObjectId(),
      taskId: "TSK-20260621-ABCD",
      title: "Follow up with ABC Corp client",
      description: "Schedule meeting and send proposal for Q3 deal",
      priority: "HIGH",
      category: "Sales Follow-up",
      status: "IN_PROGRESS",
      assignedById: managerId,
      assignedToId: salesman1Id,
      startDate: istDate(2026, 6, 20, 9, 0, 0),
      dueDate: istDate(2026, 6, 25, 18, 0, 0),
      estimatedHours: 8,
      isOverdue: false,
      createdAt: istDate(2026, 6, 20, 9, 0, 0),
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      taskId: "TSK-20260621-EFGH",
      title: "Prepare monthly sales report",
      description: "Compile sales data for June 2026",
      priority: "MEDIUM",
      category: "Reporting",
      status: "PENDING",
      assignedById: managerId,
      assignedToId: salesman2Id,
      startDate: istDate(2026, 6, 21, 10, 0, 0),
      dueDate: istDate(2026, 6, 28, 17, 0, 0),
      estimatedHours: 4,
      isOverdue: false,
      createdAt: istDate(2026, 6, 21, 10, 0, 0),
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      taskId: "TSK-20260615-WXYZ",
      title: "Client onboarding - XYZ Ltd",
      description: "Complete onboarding documentation",
      priority: "CRITICAL",
      category: "Onboarding",
      status: "OVERDUE",
      assignedById: managerId,
      assignedToId: salesman1Id,
      startDate: istDate(2026, 6, 10, 9, 0, 0),
      dueDate: istDate(2026, 6, 15, 18, 0, 0),
      estimatedHours: 6,
      isOverdue: true,
      createdAt: istDate(2026, 6, 10, 9, 0, 0),
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      taskId: "TSK-20260601-DONE",
      title: "Product demo for DEF Inc",
      description: "Conduct product demonstration",
      priority: "HIGH",
      category: "Demo",
      status: "COMPLETED",
      assignedById: managerId,
      assignedToId: salesman2Id,
      startDate: istDate(2026, 6, 1, 10, 0, 0),
      dueDate: istDate(2026, 6, 5, 17, 0, 0),
      completionDate: istDate(2026, 6, 4, 16, 30, 0),
      estimatedHours: 3,
      isOverdue: false,
      createdAt: istDate(2026, 6, 1, 10, 0, 0),
      updatedAt: istDate(2026, 6, 4, 16, 30, 0),
    },
  ]);

  await db.collection("Notification").insertMany([
    {
      _id: new ObjectId(),
      userId: salesman1Id,
      message: 'New task assigned: "Follow up with ABC Corp client"',
      type: "TASK_ASSIGNED",
      isRead: false,
      createdAt: istDate(2026, 6, 20, 9, 0, 0),
    },
    {
      _id: new ObjectId(),
      userId: salesman1Id,
      message: 'Task overdue: "Client onboarding - XYZ Ltd" - Task Not Completed Within Timeline',
      type: "TASK_OVERDUE",
      isRead: false,
      createdAt: now,
    },
  ]);

  await db.collection("ActivityLog").insertMany([
    {
      _id: new ObjectId(),
      userId: adminId,
      action: "USER_CREATED",
      details: "Seeded admin user",
      ipAddress: "127.0.0.1",
      createdAt: now,
    },
    {
      _id: new ObjectId(),
      userId: managerId,
      action: "TASK_CREATED",
      details: "Created task TSK-20260621-ABCD",
      ipAddress: "127.0.0.1",
      createdAt: istDate(2026, 6, 20, 9, 0, 0),
    },
  ]);

  await client.close();

  console.log("Seed completed!");
  console.log("Admin:    admin@example.com / admin123");
  console.log("Manager:  manager@example.com / manager123");
  console.log("Salesman: salesman@example.com / salesman123");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
