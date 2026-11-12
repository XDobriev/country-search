import { HttpError } from '../api/HttpError';

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

export function classifyError(error: unknown): ClassifiedError {
  if (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError')
  ) {
    return {
      category: ErrorCategory.ABORT,
      shouldDisplayToUser: false,
      canRetry: false,
      message: '',
    };
  }

  if (
    (error instanceof DOMException && error.name === 'TimeoutError') ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'TimeoutError')
  ) {
    return {
      category: ErrorCategory.TIMEOUT,
      shouldDisplayToUser: true,
      canRetry: true,
      message: 'Время ожидания ответа истекло. Пожалуйста, попробуйте снова.',
    };
  }

  if (error instanceof HttpError) {
    if (error.status === 404) {
      return {
        category: ErrorCategory.NOT_FOUND,
        shouldDisplayToUser: false,
        canRetry: false,
        message: 'По вашему запросу ничего не найдено.',
        statusCode: 404,
      };
    }

    return {
      category: ErrorCategory.HTTP_ERROR,
      shouldDisplayToUser: true,
      canRetry: true,
      message: `Ошибка сервера (${error.status}): ${error.message || 'Не удалось получить данные'}.`,
      statusCode: error.status,
    };
  }

  if (
    error instanceof TypeError ||
    (error instanceof Error && /network|fetch|internet|connection/i.test(error.message))
  ) {
    return {
      category: ErrorCategory.NETWORK_ERROR,
      shouldDisplayToUser: true,
      canRetry: true,
      message: 'Ошибка сети. Проверьте подключение к интернету и повторите попытку.',
    };
  }

  const fallbackMessage =
    error instanceof Error && error.message
      ? `Произошла ошибка: ${error.message}`
      : 'Произошла неизвестная ошибка при выполнении запроса.';

  return {
    category: ErrorCategory.UNKNOWN,
    shouldDisplayToUser: true,
    canRetry: true,
    message: fallbackMessage,
  };
}
