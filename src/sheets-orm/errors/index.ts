/**
 * Base ORM Error
 */
export class ORMError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ORMError'
    Object.setPrototypeOf(this, ORMError.prototype)
  }
}

/**
 * Validation Error
 */
export class ValidationError extends ORMError {
  constructor(public messages: Record<string, string[]>) {
    super('Validation failed')
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * Model Not Found Error
 */
export class ModelNotFoundError extends ORMError {
  constructor(model: string, id: any) {
    super(`${model} with id ${id} not found`)
    this.name = 'ModelNotFoundError'
    Object.setPrototypeOf(this, ModelNotFoundError.prototype)
  }
}

/**
 * Connection Error
 */
export class ConnectionError extends ORMError {
  constructor(message: string) {
    super(message)
    this.name = 'ConnectionError'
    Object.setPrototypeOf(this, ConnectionError.prototype)
  }
}

/**
 * Query Error
 */
export class QueryError extends ORMError {
  constructor(message: string, public query?: any) {
    super(message)
    this.name = 'QueryError'
    Object.setPrototypeOf(this, QueryError.prototype)
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends ORMError {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
    Object.setPrototypeOf(this, AuthenticationError.prototype)
  }
}

/**
 * Authentication Required Error
 * Thrown when an operation requires authentication (e.g., write operations with API Key)
 */
export class AuthenticationRequiredError extends AuthenticationError {
  constructor(
    message: string,
    public requiredMode: string,
    public canRetry: boolean = true
  ) {
    super(message)
    this.name = 'AuthenticationRequiredError'
    Object.setPrototypeOf(this, AuthenticationRequiredError.prototype)
  }
}

/**
 * Schema Error
 */
export class SchemaError extends ORMError {
  constructor(message: string) {
    super(message)
    this.name = 'SchemaError'
    Object.setPrototypeOf(this, SchemaError.prototype)
  }
}
