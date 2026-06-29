import { prisma } from "@/lib/prisma";
import { taskRepository } from "@/repositories/task.repository";
import { userRepository } from "@/repositories/user.repository";
import { getCurrentISTDateTime } from "@/lib/utils";
import { ReportData, SessionUser } from "@/types";
import { AppError } from "@/lib/api-response";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export class ReportService {
  async getTaskCompletionReport(actor: SessionUser): Promise<ReportData> {
    const filters = this.getFiltersForRole(actor);
    const tasks = await this.fetchTasksForReport(filters);

    const rows = tasks.map((t) => ({
      taskId: t.taskId,
      title: t.title,
      assignee: t.assignedTo.name,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      completionDate: t.completionDate || "N/A",
      isOverdue: t.isOverdue ? "Yes" : "No",
    }));

    const completed = tasks.filter((t) => t.status === "COMPLETED").length;

    return {
      title: "Task Completion Report",
      generatedAt: getCurrentISTDateTime(),
      rows,
      summary: {
        total: tasks.length,
        completed,
        pending: tasks.filter((t) => t.status === "PENDING").length,
        overdue: tasks.filter((t) => t.isOverdue).length,
        completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      },
    };
  }

  async getSalesmanPerformanceReport(actor: SessionUser): Promise<ReportData> {
    if (actor.role === "SALESMAN") throw new AppError("Access denied", 403);

    let salesmenIds: string[] = [];
    if (actor.role === "MANAGER") {
      salesmenIds = await userRepository.getSalesmenIdsByManager(actor.id);
    } else {
      salesmenIds = (
        await prisma.user.findMany({ where: { role: "SALESMAN" }, select: { id: true } })
      ).map((s) => s.id);
    }

    const rows = await Promise.all(
      salesmenIds.map(async (id) => {
        const user = await userRepository.findById(id);
        const total = await taskRepository.countByStatus(undefined, { assignedToId: id });
        const completed = await taskRepository.countByStatus("COMPLETED", { assignedToId: id });
        const overdue = await taskRepository.countByStatus("OVERDUE", { assignedToId: id });

        return {
          name: user?.name || "Unknown",
          email: user?.email || "",
          totalTasks: total,
          completedTasks: completed,
          overdueTasks: overdue,
          completionRate: total ? Math.round((completed / total) * 100) : 0,
        };
      })
    );

    return {
      title: "Salesman Performance Report",
      generatedAt: getCurrentISTDateTime(),
      rows: rows.sort((a, b) => b.completionRate - a.completionRate),
    };
  }

  async getOverdueTasksReport(actor: SessionUser): Promise<ReportData> {
    const filters = this.getFiltersForRole(actor);
    const overdueTasks = await taskRepository.getOverdueTasks(filters);

    const rows = overdueTasks.map((t) => ({
      taskId: t.taskId,
      title: t.title,
      assignee: t.assignedTo.name,
      manager: t.assignedBy.name,
      dueDate: t.dueDate,
      priority: t.priority,
      message: "Task Not Completed Within Timeline",
    }));

    return {
      title: "Overdue Tasks Report",
      generatedAt: getCurrentISTDateTime(),
      rows,
      summary: { total: rows.length },
    };
  }

  async getManagerPerformanceReport(actor: SessionUser): Promise<ReportData> {
    if (actor.role !== "ADMIN") throw new AppError("Admin access required", 403);

    const managers = await prisma.user.findMany({
      where: { role: "MANAGER", status: "ACTIVE" },
    });

    const rows = await Promise.all(
      managers.map(async (manager) => {
        const teamSize = (await userRepository.getTeamMembers(manager.id)).length;
        const total = await taskRepository.countByStatus(undefined, { assignedById: manager.id });
        const completed = await taskRepository.countByStatus("COMPLETED", {
          assignedById: manager.id,
        });
        const overdue = await taskRepository.countByStatus("OVERDUE", {
          assignedById: manager.id,
        });

        return {
          name: manager.name,
          email: manager.email,
          teamSize,
          totalTasks: total,
          completedTasks: completed,
          overdueTasks: overdue,
          completionRate: total ? Math.round((completed / total) * 100) : 0,
        };
      })
    );

    return {
      title: "Manager Performance Report",
      generatedAt: getCurrentISTDateTime(),
      rows: rows.sort((a, b) => b.completionRate - a.completionRate),
    };
  }

  exportToCSV(report: ReportData): string {
    if (!report.rows.length) return "";
    const headers = Object.keys(report.rows[0]);
    const csvRows = [
      headers.join(","),
      ...report.rows.map((row) =>
        headers.map((h) => `"${String(row[h]).replace(/"/g, '""')}"`).join(",")
      ),
    ];
    return csvRows.join("\n");
  }

  exportToExcel(report: ReportData): Buffer {
    const ws = XLSX.utils.json_to_sheet(report.rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.utils.sheet_add_aoa(ws, [[`Generated: ${report.generatedAt} (IST)`]], { origin: "A1" });
    return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  }

  exportToPDF(report: ReportData): Buffer {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(report.title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${report.generatedAt} (IST)`, 14, 28);

    if (report.rows.length) {
      const headers = Object.keys(report.rows[0]);
      const body = report.rows.map((row) => headers.map((h) => String(row[h])));

      autoTable(doc, {
        head: [headers],
        body,
        startY: 35,
        styles: { fontSize: 8 },
      });
    }

    return Buffer.from(doc.output("arraybuffer"));
  }

  private getFiltersForRole(actor: SessionUser): Partial<{ assignedById: string; assignedToId: string }> {
    if (actor.role === "MANAGER") return { assignedById: actor.id };
    if (actor.role === "SALESMAN") return { assignedToId: actor.id };
    return {};
  }

  private async fetchTasksForReport(filters: Partial<{ assignedById: string; assignedToId: string }>) {
    const result = await taskRepository.findMany({ ...filters, limit: 1000 });
    return result.data.map((t) => {
      const task = t as typeof t & { assignedTo?: { name: string } };
      return {
        taskId: task.taskId,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        completionDate: task.completionDate,
        isOverdue: task.isOverdue,
        assignedTo: { name: task.assignedTo?.name || "Unknown" },
      };
    });
  }
}

export const reportService = new ReportService();
