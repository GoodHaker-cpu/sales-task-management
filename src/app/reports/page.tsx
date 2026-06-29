"use client";

import { useRequireAuth } from "@/hooks/use-require-auth";
import { AuthLoading } from "@/components/common/auth-loading";
import { DashboardLayout } from "@/components/common/sidebar";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

const reports = [
  { type: "completion", title: "Task Completion Report", desc: "Overview of all task completions" },
  { type: "salesman-performance", title: "Salesman Performance", desc: "Individual salesman metrics" },
  { type: "overdue", title: "Overdue Tasks Report", desc: "Tasks not completed within timeline" },
  { type: "manager-performance", title: "Manager Performance", desc: "Manager team performance (Admin only)" },
];

export default function ReportsPage() {
  const { session, isLoading, isAuthenticated } = useRequireAuth();

  const downloadReport = (type: string, format: string) => {
    window.open(`/api/reports?type=${type}&format=${format}`, "_blank");
  };

  if (isLoading) return <AuthLoading />;
  if (!isAuthenticated || !session) return null;

  const filteredReports =
    session.user.role === "ADMIN"
      ? reports
      : reports.filter((r) => r.type !== "manager-performance");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Reports"
          description="Generate and export reports (IST timestamps)"
        />

        <div className="grid gap-4 md:grid-cols-2">
          {filteredReports.map((report) => (
            <Card key={report.type}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  {report.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{report.desc}</p>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => downloadReport(report.type, "json")}>
                    View JSON
                  </Button>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => downloadReport(report.type, "csv")}>
                    <Download className="h-4 w-4 mr-1" /> CSV
                  </Button>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => downloadReport(report.type, "xlsx")}>
                    <Download className="h-4 w-4 mr-1" /> Excel
                  </Button>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => downloadReport(report.type, "pdf")}>
                    <Download className="h-4 w-4 mr-1" /> PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
