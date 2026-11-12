export enum ErrorCategory {
  ABORT = 'ABORT',
  TIMEOUT = 'TIMEOUT',
  HTTP_ERROR = 'HTTP_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export interface ClassifiedError {
  category: ErrorCategory;
  shouldDisplayToUser: boolean;
  canRetry: boolean;
  message: string;
  statusCode?: number;
}

export function classifyError(_error: unknown): ClassifiedError {
  throw new Error('Not implemented');
}
