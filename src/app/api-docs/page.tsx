"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-auto">
      <div className="min-w-0 w-full max-w-[100vw]">
        <SwaggerUI url="/api/swagger" docExpansion="list" defaultModelsExpandDepth={-1} />
      </div>
    </div>
  );
}
