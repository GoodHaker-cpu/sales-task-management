export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Sales Task Management System API",
    description:
      "REST API for Sales Task Management. All dates use IST format: `YYYY:MM:DD:HH:MM:SS`.\n\n" +
      "**Authentication:** Call `POST /api/auth/login` to get a JWT token, then click **Authorize** and enter `Bearer <token>`.",
    version: "1.0.0",
  },
  servers: [{ url: "http://localhost:3000", description: "Local development" }],
  tags: [
    { name: "Auth", description: "Authentication endpoints" },
    { name: "Users", description: "User management" },
    { name: "Tasks", description: "Task management" },
    { name: "Reports", description: "Reports and dashboard stats" },
    { name: "Notifications", description: "In-app notifications" },
    { name: "Activity Logs", description: "Audit logs" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token from POST /api/auth/login",
      },
    },
    schemas: {
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@example.com" },
          password: { type: "string", example: "admin123" },
        },
      },
      CreateUserRequest: {
        type: "object",
        required: ["name", "email", "password", "role"],
        properties: {
          name: { type: "string", example: "John Admin" },
          email: { type: "string", example: "john@example.com" },
          password: { type: "string", example: "password123" },
          phone: { type: "string", example: "+91-9876543210" },
          role: { type: "string", enum: ["ADMIN", "MANAGER", "SALESMAN"] },
          managerId: { type: "string", description: "Required when role is SALESMAN" },
        },
      },
      UpdateUserRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          role: { type: "string", enum: ["ADMIN", "MANAGER", "SALESMAN"] },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
          managerId: { type: "string", nullable: true },
        },
      },
      CreateTaskRequest: {
        type: "object",
        required: ["title", "assignedToId", "startDate", "dueDate"],
        properties: {
          title: { type: "string", example: "Follow up with client" },
          description: { type: "string" },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "MEDIUM" },
          category: { type: "string", example: "Sales" },
          assignedToId: { type: "string", description: "Salesman user ID" },
          startDate: { type: "string", example: "2026:06:21:09:00:00" },
          dueDate: { type: "string", example: "2026:06:25:18:00:00" },
          estimatedHours: { type: "number", example: 8 },
          remarks: { type: "string" },
        },
      },
      UpdateTaskRequest: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
          category: { type: "string" },
          assignedToId: { type: "string" },
          startDate: { type: "string", example: "2026:06:21:09:00:00" },
          dueDate: { type: "string", example: "2026:06:25:18:00:00" },
          estimatedHours: { type: "number" },
          status: { type: "string", enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE", "CANCELLED"] },
          remarks: { type: "string" },
        },
      },
      AssignTaskRequest: {
        type: "object",
        required: ["taskId", "assignedToId"],
        properties: {
          taskId: { type: "string" },
          assignedToId: { type: "string" },
        },
      },
      BulkAssignRequest: {
        type: "object",
        required: ["taskIds", "assignedToId"],
        properties: {
          taskIds: { type: "array", items: { type: "string" } },
          assignedToId: { type: "string" },
        },
      },
      CompleteTaskRequest: {
        type: "object",
        required: ["taskId"],
        properties: {
          taskId: { type: "string" },
          remarks: { type: "string" },
        },
      },
      ChangePasswordRequest: {
        type: "object",
        required: ["currentPassword", "newPassword", "confirmPassword"],
        properties: {
          currentPassword: { type: "string" },
          newPassword: { type: "string" },
          confirmPassword: { type: "string" },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["token", "password", "confirmPassword"],
        properties: {
          token: { type: "string" },
          password: { type: "string" },
          confirmPassword: { type: "string" },
        },
      },
      CreateAdminRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "System Admin" },
          email: { type: "string", format: "email", example: "admin@example.com" },
          password: { type: "string", example: "admin123" },
          phone: { type: "string", example: "+91-9876543210" },
        },
      },
    },
  },
  paths: {
    "/api/admin": {
      post: {
        tags: ["Auth"],
        summary: "Create admin user",
        description:
          "Creates an admin account. **No auth required** if no admin exists yet (bootstrap). " +
          "If an admin already exists, requires Bearer token from an existing admin.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateAdminRequest" } } },
        },
        responses: {
          "201": { description: "Admin created", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
          "403": { description: "Admin already exists and caller is not admin" },
          "409": { description: "Email already exists" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and get JWT token",
        description: "Use the returned token in Authorize for all protected endpoints.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: {
          "200": { description: "Login successful", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/change-password": {
      post: {
        tags: ["Auth"],
        summary: "Change password",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ChangePasswordRequest" } } },
        },
        responses: { "200": { description: "Password changed" } },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ForgotPasswordRequest" } } },
        },
        responses: { "200": { description: "Reset email sent if account exists" } },
      },
      put: {
        tags: ["Auth"],
        summary: "Reset password with token",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ResetPasswordRequest" } } },
        },
        responses: { "200": { description: "Password reset successful" } },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "List users",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "role", in: "query", schema: { type: "string", enum: ["ADMIN", "MANAGER", "SALESMAN"] } },
          { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "INACTIVE"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: { "200": { description: "Paginated user list" } },
      },
      post: {
        tags: ["Users"],
        summary: "Create user",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateUserRequest" } } },
        },
        responses: { "201": { description: "User created" } },
      },
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "User details" } },
      },
      put: {
        tags: ["Users"],
        summary: "Update user",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateUserRequest" } } },
        },
        responses: { "200": { description: "User updated" } },
      },
      delete: {
        tags: ["Users"],
        summary: "Delete user (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "User deleted" } },
      },
    },
    "/api/tasks": {
      get: {
        tags: ["Tasks"],
        summary: "List tasks",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE", "CANCELLED"] } },
          { name: "priority", in: "query", schema: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "assignedToId", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: { "200": { description: "Paginated task list" } },
      },
      post: {
        tags: ["Tasks"],
        summary: "Create task",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateTaskRequest" } } },
        },
        responses: { "201": { description: "Task created" } },
      },
    },
    "/api/tasks/{id}": {
      get: {
        tags: ["Tasks"],
        summary: "Get task by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Task details" } },
      },
      put: {
        tags: ["Tasks"],
        summary: "Update task",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateTaskRequest" } } },
        },
        responses: { "200": { description: "Task updated" } },
      },
      delete: {
        tags: ["Tasks"],
        summary: "Delete task",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Task deleted" } },
      },
    },
    "/api/tasks/assign": {
      post: {
        tags: ["Tasks"],
        summary: "Assign task to salesman",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AssignTaskRequest" } } },
        },
        responses: { "200": { description: "Task assigned" } },
      },
      put: {
        tags: ["Tasks"],
        summary: "Bulk assign tasks",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/BulkAssignRequest" } } },
        },
        responses: { "200": { description: "Tasks bulk assigned" } },
      },
    },
    "/api/tasks/complete": {
      post: {
        tags: ["Tasks"],
        summary: "Mark task as completed",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CompleteTaskRequest" } } },
        },
        responses: { "200": { description: "Task completed" } },
      },
    },
    "/api/reports": {
      get: {
        tags: ["Reports"],
        summary: "Generate report",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "type", in: "query", schema: { type: "string", enum: ["completion", "salesman-performance", "overdue", "manager-performance"], default: "completion" } },
          { name: "format", in: "query", schema: { type: "string", enum: ["json", "csv", "xlsx", "pdf"], default: "json" } },
        ],
        responses: { "200": { description: "Report data or file download" } },
      },
      post: {
        tags: ["Reports"],
        summary: "Get dashboard stats",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Dashboard statistics" } },
      },
    },
    "/api/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Get notifications",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "unreadOnly", in: "query", schema: { type: "boolean" } }],
        responses: { "200": { description: "Notification list" } },
      },
      put: {
        tags: ["Notifications"],
        summary: "Mark notification(s) as read",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  id: { type: "string", description: "Notification ID to mark read" },
                  markAll: { type: "boolean", description: "Mark all as read" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated" } },
      },
    },
    "/api/activity-logs": {
      get: {
        tags: ["Activity Logs"],
        summary: "Get activity audit logs",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "userId", in: "query", schema: { type: "string" } },
          { name: "action", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: { "200": { description: "Activity log list" } },
      },
    },
  },
};
