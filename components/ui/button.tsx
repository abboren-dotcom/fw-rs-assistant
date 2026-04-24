import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none",
          variant === "default" &&
            "bg-[rgb(42,90,165)] text-white hover:bg-[rgb(35,75,140)] active:bg-[rgb(28,62,120)]",
          variant === "outline" &&
            "border border-[rgb(var(--border))] bg-transparent hover:bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))]",
          variant === "ghost" &&
            "bg-transparent hover:bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))]",
          variant === "destructive" &&
            "bg-red-600 text-white hover:bg-red-700",
          variant === "secondary" &&
            "bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--border))]",
          size === "sm" && "px-2.5 py-1 text-xs",
          size === "md" && "px-3.5 py-1.5 text-sm",
          size === "lg" && "px-5 py-2.5 text-base",
          size === "icon" && "p-1.5 aspect-square",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
