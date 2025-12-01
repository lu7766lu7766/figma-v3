/**
 * Authentication Mode
 */
export enum AuthMode {
  API_KEY = 'api_key',
  OAUTH2 = 'oauth2'
}

/**
 * Authentication Strategy Interface
 * All authentication methods must implement this interface
 */
export interface AuthStrategy {
  /**
   * Authentication mode
   */
  readonly mode: AuthMode

  /**
   * Initialize the authentication strategy
   */
  initialize(): Promise<void>

  /**
   * Check if the strategy is available and ready to use
   */
  isAvailable(): boolean

  /**
   * Check if this strategy can perform write operations
   */
  canWrite(): boolean

  /**
   * Check if this strategy requires user action (e.g., login)
   */
  requiresUserAction(): boolean
}
