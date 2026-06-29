import { NextRequest } from "next/server";
import { taskService } from "@/services/task.service";
import { reportService } from "@/services/report.service";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/middleware/role.middleware";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "completion";
    const format = searchParams.get("format") || "json";

    let report;
    switch (type) {
      case "salesman-performance":
        report = await reportService.getSalesmanPerformanceReport(user);
        break;
      case "overdue":
        report = await reportService.getOverdueTasksReport(user);
        break;
      case "manager-performance":
        report = await reportService.getManagerPerformanceReport(user);
        break;
      default:
        report = await reportService.getTaskCompletionReport(user);
    }

    if (format === "csv") {
      const csv = reportService.exportToCSV(report);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${type}-report.csv"`,
        },
      });
    }

    if (format === "xlsx") {
      const buffer = reportService.exportToExcel(report);
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${type}-report.xlsx"`,
        },
      });
    }

    if (format === "pdf") {
      const buffer = reportService.exportToPDF(report);
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${type}-report.pdf"`,
        },
      });
    }

    return successResponse(report);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(_req: NextRequest) {
  try {
    const user = await requireAuth();
    const stats = await taskService.getDashboardStats(user);
    return successResponse(stats);
  } catch (error) {
    return errorResponse(error);
  }
}
