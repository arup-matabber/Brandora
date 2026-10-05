import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", children, className = "", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-ink disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

    const variantStyles = {
      primary:
        "btn-primary bg-[#191918] !text-white hover:bg-[#2C2C29] active:bg-[#121211] shadow-subtle border border-[#191918]",
      secondary:
        "bg-[#F6F6F4] text-[#191918] border border-border-subtle hover:bg-[#EFEFEA] active:bg-[#E5E5DF]",
      outline:
        "bg-white text-[#191918] border border-border-subtle hover:bg-[#F6F6F4] hover:border-border-line",
      ghost:
        "bg-transparent text-ink-secondary hover:text-ink hover:bg-[#F6F6F4] active:bg-surface-muted",
    };

    const sizeStyles = {
      sm: "h-7 text-xs px-2.5 gap-1.5 tracking-tight",
      md: "h-8 text-xs px-3 gap-1.5 tracking-tight",
      lg: "h-9 text-sm px-4 gap-2 tracking-tight",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
