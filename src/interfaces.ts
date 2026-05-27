export type EusendErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'MONTHLY_LIMIT_EXCEEDED'
  | 'DAILY_LIMIT_EXCEEDED'
  | 'ALL_SUPPRESSED'
  | 'DOMAIN_NOT_VERIFIED'
  | 'INTERNAL_ERROR'
  | 'CONFLICT'
  | 'PLAN_LIMIT_EXCEEDED'
  | 'application_error';

export interface EusendError {
  message: string;
  statusCode: number | null;
  name: EusendErrorCode;
}

export type EusendResponse<T> =
  | { data: T; error: null; headers: Record<string, string> }
  | { data: null; error: EusendError; headers: Record<string, string> | null };
