"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-8 rounded border border-[rgb(var(--border))] bg-white dark:bg-[rgb(20,25,36)] px-2.5 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[rgb(var(--primary))] disabled:opacity-50 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
