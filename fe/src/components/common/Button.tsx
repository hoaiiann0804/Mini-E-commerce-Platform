import { ButtonHTMLAttributes, ElementType, forwardRef } from "react";
import { Link } from "react-router-dom";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  as?: ElementType;
  to?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = "",
      as,
      to,
      ...props
    },
    ref
  ) => {
    // ...existing code...
    const baseClasses =
      "inline-flex items-center justify-center rounded-md font-medium transition";
    const variantMap: Record<ButtonVariant, string> = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300",
      secondary:
        "bg-gray-600 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300",
      outline:
        "bg-transparent border border-gray-300 text-gray-800 hover:bg-gray-50",
      ghost: "bg-transparent text-gray-800 hover:bg-gray-100",
      danger:
        "bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300",
      success:
      "bg-emerald-500 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700",
    };
    const variantClasses = variantMap[variant] || variantMap.primary;
    const sizeClasses =
      size === "sm"
        ? "px-2 py-1 text-sm"
        : size === "lg"
          ? "px-5 py-3 text-lg"
          : "px-4 py-2";
    const widthClasses = fullWidth ? "w-full" : "";
    const disabledClasses =
      disabled || isLoading
        ? "opacity-50 cursor-not-allowed pointer-events-none"
        : "";
    const allClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${widthClasses} ${disabledClasses} ${className}`;

    const content = (
      <>
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}

        {!isLoading && leftIcon && (
          <span className="mr-2 flex-shrink-0">{leftIcon}</span>
        )}
        <span className="inline-block whitespace-nowrap">{children}</span>
        {!isLoading && rightIcon && (
          <span className="ml-2 flex-shrink-0">{rightIcon}</span>
        )}
      </>
    );

    // If the button should be a Link from react-router-dom
    if (as === Link && to) {
      return (
        <Link to={to} className={allClasses} {...(props as any)}>
          {content}
        </Link>
      );
    }

    // If the button should be a custom component
    if (as) {
      const Component = as;
      return (
        <Component className={allClasses} {...props}>
          {content}
        </Component>
      );
    }

    // Default button
    return (
      <button
        ref={ref}
        className={allClasses}
        disabled={disabled || isLoading}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
