export const STATUS_CODE = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CONFLICT: 409,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type StatusCode = typeof STATUS_CODE[keyof typeof STATUS_CODE];

export class FunctionError extends Error {
  statusCode: StatusCode;

  constructor(message: string, statusCode: StatusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}
