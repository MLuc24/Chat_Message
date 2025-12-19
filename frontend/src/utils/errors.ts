/**
 * Type guard to check if error is an Axios error
 */
interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export function isAxiosError(error: unknown): error is AxiosErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  );
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return fallback;
}
