export interface SuccessResponse<T> {
  status: true;
  message: string;
  timestamp: string;
  data: T;
  meta?: Record<string, any>; // opsional, kadang ada kadang tidak
}

export interface ErrorResponse {
  status: false;
  message: string;
  error: string;
  timestamp: string;
}
