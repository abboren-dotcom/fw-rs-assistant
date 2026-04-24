import { cn } from "@/lib/utils";
import type { ConfidenceLevel, EvidenceKind } from "@/types";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "destructive";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium leading-none",
        variant === "default" && "bg-primary/10 text-primary border border-primary/20",
        variant === "outline" && "border border-border text-muted-foreground",
        variant === "secondary" && "bg-secondary text-secondary-foreground border border-border",
        variant === "destructive" && "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400",
        className
      )}
    >
      {children}
    </span>
  );
}

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return (
    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium leading-none", `badge-${level}`)}>
      {level === "high" ? "High" : level === "medium" ? "Medium" : "Low"}
    </span>
  );
}

export function EvidenceBadge({ kind }: { kind: EvidenceKind }) {
  return (
    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium leading-none", `badge-${kind}`)}>
      {kind === "parsed" ? "Parsed" : kind === "inferred" ? "Inferred" : "Manual"}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    proposed: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    accepted: "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300",
    rejected: "bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/30 dark:text-red-400 line-through",
    needs_review: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
    ok: "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300",
    warning: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
    error: "bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/30 dark:text-red-400",
    ignored: "bg-gray-50 text-gray-500 border border-gray-200 dark:bg-gray-800/30 dark:text-gray-400",
  };

  const label: Record<string, string> = {
    proposed: "Proposed",
    accepted: "Accepted",
    rejected: "Rejected",
    needs_review: "Needs review",
    ok: "OK",
    warning: "Warning",
    error: "Error",
    ignored: "Ignored",
  };

  return (
    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium leading-none", map[status] ?? map.proposed)}>
      {label[status] ?? status}
    </span>
  );
}
