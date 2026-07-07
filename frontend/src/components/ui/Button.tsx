import { type ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantClasses = {
  primary:
    "bg-blue-600 hover:bg-blue-500 text-white border-transparent shadow-md shadow-blue-900/20 focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-950",
  secondary:
    "bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700 hover:border-gray-600 shadow-sm focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-950",
  danger:
    "bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-500/30 hover:border-red-500/60 focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-gray-950",
  ghost:
    "bg-transparent hover:bg-gray-800/60 text-gray-400 hover:text-gray-200 border-transparent focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-950",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-5 py-3 text-base rounded-xl gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "inline-flex items-center justify-center font-medium border transition-all duration-150",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
export default Button;
