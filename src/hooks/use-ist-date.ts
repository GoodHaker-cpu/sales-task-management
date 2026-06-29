"use client";

import { formatISTDate, getCurrentISTDateTime } from "@/lib/utils";

export function useISTDate() {
  return {
    now: getCurrentISTDateTime(),
    format: formatISTDate,
  };
}
