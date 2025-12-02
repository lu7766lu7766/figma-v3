import { AuthMode, type AuthStrategy } from './AuthStrategy'
import { ApiKeyAuth } from './ApiKeyAuth'
import { GoogleAuth } from './GoogleAuth'
import { AuthenticationError, AuthenticationRequiredError } from '../errors'

/**
 * AuthManager Configuration
 */
export interface AuthManagerConfig {
  apiKey?: string
  oauth?: {
    clientId: string
    scopes: string[]
    token?: {
      expiresIn?: number | null
      refreshThreshold?: number
    }
  }
  preferredMode?: AuthMode
}

/**
 * Authentication Manager
 * Manages multiple authentication strategies and switches between them
 */
export class AuthManager {
  private strategies: Map<AuthMode, AuthStrategy> = new Map()
  private currentStrategy: AuthStrategy | null = null
  private config: AuthManagerConfig
  private pendingAuthPromise: Promise<void> | null = null

  constructor(config: AuthManagerConfig) {
    this.config = config
    this.initializeStrategies()
  }

  /**
   * Initialize available authentication strategies
   */
  private initializeStrategies(): void {
   // Initialize API Key strategy if configured
    if (this.config.apiKey) {
      const apiKeyAuth = new ApiKeyAuth(this.config.apiKey)
      this.strategies.set(AuthMode.API_KEY, apiKeyAuth)
    }

    // Initialize OAuth2 strategy if configured
    if (this.config.oauth) {
      const oauth2Auth = new GoogleAuth(
        this.config.oauth.clientId,
        this.config.oauth.scopes,
        // Pass token configuration
        this.config.oauth.token ? {
          expiresIn: this.config.oauth.token.expiresIn,
          refreshThreshold: this.config.oauth.token.refreshThreshold
        } : undefined
      )
      this.strategies.set(AuthMode.OAUTH2, oauth2Auth)
    }

    // Set default strategy based on preference
    const preferredMode = this.config.preferredMode || AuthMode.API_KEY
    this.currentStrategy = this.strategies.get(preferredMode) || null
  }

  /**
   * Initialize the auth manager
   * Prioritizes API Key (fast, no user interaction) over OAuth2
   */
  async initialize(): Promise<void> {
   // Try to initialize API Key first (fast, no user interaction)
    const oauth2Auth = this.strategies.get(AuthMode.OAUTH2) as GoogleAuth | undefined

    // Initialize OAuth2 first to restore any existing session
    if (oauth2Auth) {
      await oauth2Auth.initialize()

      // If already have a valid token, prefer OAuth2
      if (oauth2Auth.isAuthenticated()) {
        this.currentStrategy = oauth2Auth
        return
      }
    }

    if (this.strategies.has(AuthMode.API_KEY)) {
      const apiKeyAuth = this.strategies.get(AuthMode.API_KEY)!
      try {
        await apiKeyAuth.initialize()
        this.currentStrategy = apiKeyAuth
        return
      } catch (error) {
        console.warn('API Key initialization failed:', error)
      }
    }

    // If API Key failed or not available, fall back to initialized OAuth2 (even if not signed in)
    if (oauth2Auth) {
      this.currentStrategy = oauth2Auth
    }
  }

  /**
   * Ensure read permission
   * Uses current strategy if available
   */
  async ensureReadPermission(): Promise<void> {
    if (!this.currentStrategy) {
      throw new AuthenticationError('No authentication strategy available')
    }

    if (!this.currentStrategy.isAvailable()) {
      await this.currentStrategy.initialize()
    }
  }

  /**
   * Ensure write permission
   * Throws AuthenticationRequiredError if current strategy cannot write
   */
  async ensureWritePermission(): Promise<void> {
    if (this.currentStrategy?.canWrite()) {
      return
    }

    // Current strategy cannot write, try to switch to OAuth2
    if (!this.strategies.has(AuthMode.OAUTH2)) {
      throw new AuthenticationError(
        'Write operations require OAuth2 authentication, but it is not configured.'
      )
    }

    const oauth2Auth = this.strategies.get(AuthMode.OAUTH2) as GoogleAuth

    // If already in the middle of signing in, wait for it
    if (this.pendingAuthPromise) {
      await this.pendingAuthPromise
      return
    }

    // If already authenticated, just switch
    if (oauth2Auth.isAuthenticated()) {
      this.currentStrategy = oauth2Auth
      return
    }

    // Need user to sign in - throw special error
    throw new AuthenticationRequiredError(
      'This operation requires authentication. Please sign in.',
      AuthMode.OAUTH2
    )
  }

  /**
   * Sign in with OAuth2
   */
  async signIn(): Promise<void> {
    const oauth2Auth = this.strategies.get(AuthMode.OAUTH2) as GoogleAuth

    if (!oauth2Auth) {
      throw new AuthenticationError('OAuth2 is not configured')
    }

    this.pendingAuthPromise = oauth2Auth.signIn()

    try {
      await this.pendingAuthPromise
      this.currentStrategy = oauth2Auth
    } finally {
      this.pendingAuthPromise = null
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    const oauth2Auth = this.strategies.get(AuthMode.OAUTH2) as GoogleAuth

    if (oauth2Auth && oauth2Auth.isAuthenticated()) {
      await oauth2Auth.signOut()
    }

    // Switch back to API Key if available
    if (this.strategies.has(AuthMode.API_KEY)) {
      this.currentStrategy = this.strategies.get(AuthMode.API_KEY)!
    } else {
      this.currentStrategy = null
    }
  }

  /**
   * Check if authenticated (can write)
   */
  isAuthenticated(): boolean {
    return this.currentStrategy?.canWrite() ?? false
  }

  /**
   * Get current authentication mode
   */
  getCurrentMode(): AuthMode | null {
    return this.currentStrategy?.mode ?? null
  }

  /**
   * Get current strategy
   */
  getCurrentStrategy(): AuthStrategy | null {
    return this.currentStrategy
  }

  /**
   * Manually switch to a specific authentication mode
   */
  async switchToMode(mode: AuthMode): Promise<void> {
    const strategy = this.strategies.get(mode)

    if (!strategy) {
      throw new AuthenticationError(`Authentication mode ${mode} is not available`)
    }

    if (!strategy.isAvailable()) {
      await strategy.initialize()
    }

    this.currentStrategy = strategy
  }

  /**
   * Get OAuth2 strategy (for backward compatibility)
   */
  getOAuth2Strategy(): GoogleAuth | null {
    return this.strategies.get(AuthMode.OAUTH2) as GoogleAuth || null
  }
}
