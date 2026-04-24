import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-8 w-full rounded border border-[rgb(var(--border))] bg-white dark:bg-[rgb(20,25,36)] px-2.5 py-1 text-sm placeholder:text-[rgb(var(--muted))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--primary))] disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full rounded border border-[rgb(var(--border))] bg-white dark:bg-[rgb(20,25,36)] px-2.5 py-2 text-sm placeholder:text-[rgb(var(--muted))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--primary))] disabled:opacity-50 resize-y min-h-[80px]",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
