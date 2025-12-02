import { TokenManager } from './TokenManager'
import { AuthenticationError } from '../errors'
import { AuthMode, type AuthStrategy } from './AuthStrategy'
import { getGapi, initGapiClient, loadGoogleIdentityServices } from './GoogleApiLoader'

/**
 * Google OAuth2 Authentication
 */
export class GoogleAuth implements AuthStrategy {
  readonly mode = AuthMode.OAUTH2
  private tokenManager: TokenManager
  private clientId: string
  private scopes: string
  private isInitialized = false
  private initPromise: Promise<void> | null = null
  private tokenConfig: {
    expiresIn?: number | null
    refreshThreshold: number
  }

  constructor(
    clientId: string,
    scopes: string[],
    tokenConfig?: { expiresIn?: number | null; refreshThreshold?: number }
  ) {
    this.clientId = clientId
    this.scopes = scopes.join(' ')
    this.tokenManager = new TokenManager()

    // Initialize token config with defaults
    this.tokenConfig = {
      expiresIn: 3600,
      refreshThreshold: 5 * 60 * 1000
    }

    // Validate and merge token config
    if (tokenConfig) {
      // Validate expiresIn
      if (tokenConfig.expiresIn !== undefined && tokenConfig.expiresIn !== null) {
        if (typeof tokenConfig.expiresIn !== 'number' || tokenConfig.expiresIn <= 0) {
          throw new Error('auth.oauth.token.expiresIn must be a positive number or null')
        }
        this.tokenConfig.expiresIn = tokenConfig.expiresIn
      } else if (tokenConfig.expiresIn === null) {
        this.tokenConfig.expiresIn = null
      }

      // Validate refreshThreshold
      if (tokenConfig.refreshThreshold !== undefined) {
        if (tokenConfig.refreshThreshold <= 0) {
          throw new Error('auth.oauth.token.refreshThreshold must be a positive number')
        }

        // If expiresIn is a number, validate refreshThreshold < expiresIn
        const expiresIn = this.tokenConfig.expiresIn ?? 3600
        if (typeof expiresIn === 'number' && tokenConfig.refreshThreshold >= expiresIn * 1000) {
          throw new Error('auth.oauth.token.refreshThreshold must be less than expiresIn')
        }

        this.tokenConfig.refreshThreshold = tokenConfig.refreshThreshold
      }
    }
  }

  /**
   * Initialize Google API
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this.doInitialize()
    return this.initPromise
  }

  private async doInitialize(): Promise<void> {
    try {
      const gapi = getGapi()

      // Initialize gapi client (without API Key for OAuth2)
      await initGapiClient()

      // Restore token if exists
      const token = this.tokenManager.getAccessToken()
      if (token) {
        gapi.client.setToken({ access_token: token })
      }

      this.isInitialized = true
    } catch (error) {
      this.initPromise = null
      throw new AuthenticationError(`Failed to initialize Google API: ${error}`)
    }
  }

  /**
   * Sign in user
   */
  async signIn(): Promise<void> {
    await this.initialize()

    // Load Google Identity Services dynamically
    await loadGoogleIdentityServices()

    const gapi = getGapi()

    return new Promise((resolve, reject) => {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: this.scopes,
        callback: (response: any) => {
          if (response.error) {
            reject(new AuthenticationError(response.error))
            return
          }

          if (response.access_token) {
            // Use configured expiresIn, or fallback to Google's response
            let expiresIn = this.tokenConfig.expiresIn

            // If not explicitly configured, use Google's response or default
            if (expiresIn === undefined) {
              expiresIn = response.expires_in || 3600
            }
            // If configured as null, pass null for permanent login

            this.tokenManager.setAccessToken(response.access_token, expiresIn)
            gapi.client.setToken({ access_token: response.access_token })
            resolve()
          } else {
            reject(new AuthenticationError('No access token received'))
          }
        }
      })

      tokenClient.requestAccessToken({ prompt: 'consent' })
    })
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    const token = this.tokenManager.getAccessToken()
    const gapi = getGapi()

    if (token) {
      try {
        // Load Google Identity Services if needed
        await loadGoogleIdentityServices()
        google.accounts.oauth2.revoke(token, () => {
          // Token revoked
        })
      } catch (error) {
        // Ignore errors during revoke
      }

      this.tokenManager.clearAccessToken()
      gapi.client.setToken(null)
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.tokenManager.hasValidToken()
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this.tokenManager.getAccessToken()
  }

  /**
   * Ensure user is authenticated
   * Uses configured refresh threshold
   */
  async ensureAuthenticated(): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new AuthenticationError('User is not authenticated. Please sign in first.')
    }

    // Check if token is expiring soon using configured threshold
    if (this.tokenManager.isTokenExpiringSoon(this.tokenConfig.refreshThreshold)) {
      // Try to refresh by signing in again
      await this.signIn()
    }
  }

  /**
   * Check if OAuth2 auth is available (AuthStrategy interface)
   */
  isAvailable(): boolean {
    return this.isInitialized
  }

  /**
   * OAuth2 can perform write operations if authenticated (AuthStrategy interface)
   */
  canWrite(): boolean {
    return this.isAuthenticated()
  }

  /**
   * OAuth2 requires user action if not authenticated (AuthStrategy interface)
   */
  requiresUserAction(): boolean {
    return !this.isAuthenticated()
  }
}
