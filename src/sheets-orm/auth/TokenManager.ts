/**
 * Token Manager
 * Manages access token storage and retrieval
 */
export class TokenManager {
  private static readonly TOKEN_KEY = 'gapi_access_token'
  private static readonly TOKEN_EXPIRY_KEY = 'gapi_token_expiry'
  private static readonly PERMANENT_EXPIRY = 'permanent'

  /**
   * Store access token
   * @param token Access token string
   * @param expiresIn Expiration time in seconds, null = never expires, undefined = use default 3600
   */
  setAccessToken(token: string, expiresIn?: number | null): void {
    localStorage.setItem(TokenManager.TOKEN_KEY, token)

    if (expiresIn === null) {
      // Permanent login: mark as permanent
      localStorage.setItem(TokenManager.TOKEN_EXPIRY_KEY, TokenManager.PERMANENT_EXPIRY)
    } else {
      // Use specified expiry time (seconds) or default
      const expireSeconds = expiresIn ?? 3600
      const expiryTime = Date.now() + (expireSeconds * 1000)
      localStorage.setItem(TokenManager.TOKEN_EXPIRY_KEY, expiryTime.toString())
    }
  }

  /**
   * Get access token
   * Returns null if token expired (but not if it's permanent)
   */
  getAccessToken(): string | null {
    const token = localStorage.getItem(TokenManager.TOKEN_KEY)
    const expiry = localStorage.getItem(TokenManager.TOKEN_EXPIRY_KEY)

    if (!token || !expiry) {
      return null
    }

    // Permanent token never expires
    if (expiry === TokenManager.PERMANENT_EXPIRY) {
      return token
    }

    // Check if regular token is expired
    if (Date.now() > parseInt(expiry)) {
      this.clearAccessToken()
      return null
    }

    return token
  }

  /**
   * Clear access token
   */
  clearAccessToken(): void {
    localStorage.removeItem(TokenManager.TOKEN_KEY)
    localStorage.removeItem(TokenManager.TOKEN_EXPIRY_KEY)
  }

  /**
   * Check if token exists and is valid
   */
  hasValidToken(): boolean {
    return this.getAccessToken() !== null
  }

  /**
   * Get time until token expires (in milliseconds)
   * Returns Infinity for permanent tokens
   */
  getTimeUntilExpiry(): number {
    const expiry = localStorage.getItem(TokenManager.TOKEN_EXPIRY_KEY)

    if (!expiry) {
      return 0
    }

    // Permanent token returns Infinity
    if (expiry === TokenManager.PERMANENT_EXPIRY) {
      return Infinity
    }

    const timeLeft = parseInt(expiry) - Date.now()
    return Math.max(0, timeLeft)
  }

  /**
   * Check if token is about to expire
   * Returns false for permanent tokens
   * @param threshold Threshold in milliseconds (default: 5 minutes)
   */
  isTokenExpiringSoon(threshold: number = 5 * 60 * 1000): boolean {
    const expiry = localStorage.getItem(TokenManager.TOKEN_EXPIRY_KEY)

    // Permanent token never expires
    if (expiry === TokenManager.PERMANENT_EXPIRY) {
      return false
    }

    if (!expiry) {
      return false
    }

    const timeLeft = parseInt(expiry) - Date.now()
    return timeLeft > 0 && timeLeft < threshold
  }
}
