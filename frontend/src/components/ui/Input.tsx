import { type InputHTMLAttributes, forwardRef, type ReactNode } from "react";
import { clsx } from "clsx";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, disabled, required, className, ...props }, ref) => {
    return (
      <div className={clsx("w-full space-y-1.5", className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-300">
            {label} {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            disabled={disabled}
            required={required}
            className={clsx(
              "block w-full rounded-lg bg-gray-900 border text-sm text-gray-100 placeholder-gray-500",
              "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-800",
              icon ? "pl-10" : "px-4",
              "py-2.5",
              error
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                : "border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20"
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-400 mt-1 animate-in slide-in-from-top-1 fade-in">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500 mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;
