import React from "react";
import { Button, ButtonProps } from "antd";
import {
  CheckCircleOutlined,
  ArrowRightOutlined,
  ShoppingCartOutlined,
  HeartOutlined,
  HeartFilled,
  UserOutlined,
  SettingOutlined,
} from "@ant-design/icons";

export type PremiumButtonVariant =
  | "primary" // Teal gradient - main CTA
  | "secondary" // Orange gradient - secondary actions
  | "success" // Green gradient - success actions
  | "info" // Blue gradient - info actions
  | "warning" // Yellow gradient - warning actions
  | "danger" // Red gradient - danger actions
  | "ghost" // Transparent with border
  | "outline"; // Outline style

export type PremiumButtonIcon =
  | "check"
  | "arrow-right"
  | "cart"
  | "heart"
  | "heart-filled"
  | "user"
  | "settings"
  | "none";

interface PremiumButtonProps
  extends Omit<ButtonProps, "type" | "icon" | "variant"> {
  variant?: PremiumButtonVariant;
  iconType?: PremiumButtonIcon;
  isProcessing?: boolean;
  processingText?: string;
  gradientHover?: boolean;
}

const getIcon = (iconType: PremiumButtonIcon) => {
  switch (iconType) {
    case "check":
      return <CheckCircleOutlined />;
    case "arrow-right":
      return <ArrowRightOutlined />;
    case "cart":
      return <ShoppingCartOutlined />;
    case "heart":
      return <HeartOutlined />;
    case "heart-filled":
      return <HeartFilled />;
    case "user":
      return <UserOutlined />;
    case "settings":
      return <SettingOutlined />;
    default:
      return null;
  }
};

const getGradientStyle = (
  variant: PremiumButtonVariant,
  isProcessing: boolean
) => {
  const gradients = {
    primary: {
      normal: "linear-gradient(135deg, #2AACA7, #229A96)",
      processing: "linear-gradient(135deg, #4BBCB8, #2AACA7)",
      shadow: "rgba(42, 172, 167, 0.3)",
      shadowHover: "rgba(42, 172, 167, 0.4)",
    },
    secondary: {
      normal: "linear-gradient(135deg, #FF755E, #E56954)",
      processing: "linear-gradient(135deg, #FF8F7B, #FF755E)",
      shadow: "rgba(255, 117, 94, 0.3)",
      shadowHover: "rgba(255, 117, 94, 0.4)",
    },
    success: {
      normal: "linear-gradient(135deg, #10B981, #059669)",
      processing: "linear-gradient(135deg, #34D399, #10B981)",
      shadow: "rgba(16, 185, 129, 0.3)",
      shadowHover: "rgba(16, 185, 129, 0.4)",
    },
    info: {
      normal: "linear-gradient(135deg, #3B82F6, #2563EB)",
      processing: "linear-gradient(135deg, #60A5FA, #3B82F6)",
      shadow: "rgba(59, 130, 246, 0.3)",
      shadowHover: "rgba(59, 130, 246, 0.4)",
    },
    warning: {
      normal: "linear-gradient(135deg, #F59E0B, #D97706)",
      processing: "linear-gradient(135deg, #FBBF24, #F59E0B)",
      shadow: "rgba(245, 158, 11, 0.3)",
      shadowHover: "rgba(245, 158, 11, 0.4)",
    },
    danger: {
      normal: "linear-gradient(135deg, #EF4444, #DC2626)",
      processing: "linear-gradient(135deg, #F87171, #EF4444)",
      shadow: "rgba(239, 68, 68, 0.3)",
      shadowHover: "rgba(239, 68, 68, 0.4)",
    },
    ghost: {
      normal: "transparent",
      processing: "rgba(42, 172, 167, 0.1)",
      shadow: "rgba(42, 172, 167, 0.1)",
      shadowHover: "rgba(42, 172, 167, 0.2)",
    },
    outline: {
      normal: "transparent",
      processing: "rgba(42, 172, 167, 0.05)",
      shadow: "rgba(42, 172, 167, 0.1)",
      shadowHover: "rgba(42, 172, 167, 0.15)",
    },
  };

  const config = gradients[variant];
  return {
    background: isProcessing ? config.processing : config.normal,
    boxShadow: `0 4px 15px 0 ${config.shadow}`,
    shadowHover: `0 8px 25px 0 ${config.shadowHover}`,
  };
};

const PremiumButton: React.FC<PremiumButtonProps> = ({
  variant = "primary",
  iconType = "none",
  isProcessing = false,
  processingText = "Processing...",
  gradientHover = true,
  children,
  className = "",
  style = {},
  onMouseEnter,
  onMouseLeave,
  disabled,
  ...props
}) => {
  const gradientStyle = getGradientStyle(variant, isProcessing);
  const icon = !isProcessing && iconType !== "none" ? getIcon(iconType) : null;

  const isGhost = variant === "ghost";
  const isOutline = variant === "outline";

  const buttonStyle = {
    ...gradientStyle,
    borderColor: isOutline ? "#2AACA7" : "transparent",
    color: isGhost || isOutline ? "#2AACA7" : "white",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (!isProcessing && !disabled && gradientHover) {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = gradientStyle.shadowHover;
    }
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (!isProcessing && !disabled) {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = gradientStyle.boxShadow;
    }
    onMouseLeave?.(e);
  };

  const getButtonType = () => {
    if (isGhost || isOutline) return "default";
    return "primary";
  };

  const getButtonClasses = () => {
    const baseClasses = [
      "premium-button",
      `premium-button-${variant}`,
      "css-dev-only-do-not-override-mc1tut",
      "premium-button-icon-fix",
    ];

    // Add Ant Design specific classes for different variants
    if (variant === "primary") {
      baseClasses.push(
        "ant-btn-primary",
        "ant-btn-color-primary",
        "ant-btn-variant-solid"
      );
    } else if (variant === "secondary") {
      baseClasses.push(
        "ant-btn-default",
        "ant-btn-color-default",
        "ant-btn-variant-solid"
      );
    } else if (variant === "success") {
      baseClasses.push(
        "ant-btn-primary",
        "ant-btn-color-primary",
        "ant-btn-variant-solid"
      );
    } else if (variant === "danger") {
      baseClasses.push(
        "ant-btn-dangerous",
        "ant-btn-color-danger",
        "ant-btn-variant-solid"
      );
    } else if (variant === "outline") {
      baseClasses.push(
        "ant-btn-default",
        "ant-btn-color-default",
        "ant-btn-variant-outlined"
      );
    } else if (variant === "ghost") {
      baseClasses.push(
        "ant-btn-text",
        "ant-btn-color-default",
        "ant-btn-variant-text"
      );
    }

    if (className) {
      baseClasses.push(className);
    }

    return baseClasses.join(" ");
  };

  return (
    <Button
      type={getButtonType()}
      loading={isProcessing}
      disabled={disabled || isProcessing}
      // icon={icon}
      className={getButtonClasses()}
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {isProcessing ? (
        <span className="flex items-center justify-center">
          {processingText}
        </span>
      ) : (
        <span className="flex items-center justify-center gap-1">
          {icon && (
            <span className="flex items-center" style={{ fontSize: "20px" }}>
              {icon}
            </span>
          )}
          {children && <span>{children}</span>}
        </span>
      )}
    </Button>
  );
};

export default PremiumButton;
