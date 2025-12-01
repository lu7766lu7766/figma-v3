import { AuthMode, type AuthStrategy } from './AuthStrategy'
import { AuthenticationError } from '../errors'
import { initGapiClient } from './GoogleApiLoader'

/**
 * API Key Authentication Strategy
 * Supports read-only access to public spreadsheets
 */
export class ApiKeyAuth implements AuthStrategy {
  readonly mode = AuthMode.API_KEY
  private apiKey: string
  private isInitialized = false

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Initialize Google API with API Key
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    if (!this.apiKey) {
      throw new AuthenticationError('API Key is not configured')
    }

    try {
      // Initialize gapi client with API Key
      await initGapiClient({ apiKey: this.apiKey })
      this.isInitialized = true
    } catch (error) {
      throw new AuthenticationError(`Failed to initialize API Key authentication: ${error}`)
    }
  }

  /**
   * Check if API Key auth is available
   */
  isAvailable(): boolean {
    return this.isInitialized && !!this.apiKey
  }

  /**
   * API Key cannot perform write operations
   */
  canWrite(): boolean {
    return false
  }

  /**
   * API Key does not require user action
   */
  requiresUserAction(): boolean {
    return false
  }
}
