import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FormPageHeaderProps {
  backHref: string;
  title: string;
  description?: string;
  className?: string;
}

export function FormPageHeader({ backHref, title, description, className }: FormPageHeaderProps) {
  return (
    <div className={cn("flex items-start gap-3 sm:gap-4", className)}>
      <Link href={backHref} className="shrink-0">
        <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      <div className="min-w-0 pt-0.5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground mt-1 break-words">{description}</p>
        )}
      </div>
    </div>
  );
}
