/**
 * Error handling utilities
 * Centralized error handling and user feedback
 */

/**
 * Common error types in the application
 */
export enum ErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Standard error interface
 */
export interface AppError {
  type: ErrorType;
  message: string;
  code?: string | number;
  details?: any;
}

/**
 * Error messages mapping
 */
const ERROR_MESSAGES = {
  [ErrorType.NETWORK_ERROR]: {
    vi: "Không thể kết nối tới server. Vui lòng kiểm tra kết nối internet.",
    en: "Unable to connect to server. Please check your internet connection.",
  },
  [ErrorType.VALIDATION_ERROR]: {
    vi: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.",
    en: "Invalid data. Please check your information.",
  },
  [ErrorType.AUTHENTICATION_ERROR]: {
    vi: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    en: "Session expired. Please login again.",
  },
  [ErrorType.AUTHORIZATION_ERROR]: {
    vi: "Bạn không có quyền truy cập tài nguyên này.",
    en: "You do not have permission to access this resource.",
  },
  [ErrorType.NOT_FOUND_ERROR]: {
    vi: "Không tìm thấy tài nguyên yêu cầu.",
    en: "Requested resource not found.",
  },
  [ErrorType.SERVER_ERROR]: {
    vi: "Lỗi server. Vui lòng thử lại sau.",
    en: "Server error. Please try again later.",
  },
  [ErrorType.UNKNOWN_ERROR]: {
    vi: "Đã xảy ra lỗi không xác định.",
    en: "An unknown error occurred.",
  },
} as const;

/**
 * Parse error from various sources
 */
export const parseError = (error: any): AppError => {
  // RTK Query error
  if (error?.status) {
    const status = error.status;
    const message =
      error.data?.message || error.data?.error?.message || "Unknown error";

    if (status === 400) {
      return {
        type: ErrorType.VALIDATION_ERROR,
        message,
        code: status,
        details: error.data,
      };
    }

    if (status === 401) {
      return {
        type: ErrorType.AUTHENTICATION_ERROR,
        message,
        code: status,
        details: error.data,
      };
    }

    if (status === 403) {
      return {
        type: ErrorType.AUTHORIZATION_ERROR,
        message,
        code: status,
        details: error.data,
      };
    }

    if (status === 404) {
      return {
        type: ErrorType.NOT_FOUND_ERROR,
        message,
        code: status,
        details: error.data,
      };
    }

    if (status >= 500) {
      return {
        type: ErrorType.SERVER_ERROR,
        message,
        code: status,
        details: error.data,
      };
    }

    if (status === "FETCH_ERROR") {
      return {
        type: ErrorType.NETWORK_ERROR,
        message,
        code: status,
        details: error,
      };
    }
  }

  // JavaScript Error
  if (error instanceof Error) {
    return {
      type: ErrorType.UNKNOWN_ERROR,
      message: error.message,
      details: error,
    };
  }

  // String error
  if (typeof error === "string") {
    return {
      type: ErrorType.UNKNOWN_ERROR,
      message: error,
    };
  }

  // Default unknown error
  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: "An unknown error occurred",
    details: error,
  };
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (
  error: any,
  language: "vi" | "en" = "vi"
): string => {
  const parsedError = parseError(error);

  // Use provided message if available and not generic
  if (parsedError.message && !parsedError.message.includes("Unknown error")) {
    return parsedError.message;
  }

  // Fall back to predefined messages
  return ERROR_MESSAGES[parsedError.type][language];
};

/**
 * Create error handler for components
 */
export const createErrorHandler = (onError?: (error: AppError) => void) => {
  return (error: any) => {
    const parsedError = parseError(error);

    if (import.meta.env.DEV) {
      console.group("🚨 Error Handler");
      //console.log('Original error:', error);
      //console.log('Parsed error:', parsedError);
      console.groupEnd();
    }

    if (onError) {
      onError(parsedError);
    }

    return parsedError;
  };
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: any): boolean => {
  const parsedError = parseError(error);

  return [ErrorType.NETWORK_ERROR, ErrorType.SERVER_ERROR].includes(
    parsedError.type
  );
};

/**
 * Format error for logging
 */
export const formatErrorForLogging = (error: any): string => {
  const parsedError = parseError(error);

  return JSON.stringify(
    {
      type: parsedError.type,
      message: parsedError.message,
      code: parsedError.code,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    },
    null,
    2
  );
};
