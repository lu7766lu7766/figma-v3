/**
 * Token Manager
 * Manages access token storage and retrieval
 */
export class TokenManager {
  private static readonly TOKEN_KEY = 'gapi_access_token'
  private static readonly TOKEN_EXPIRY_KEY = 'gapi_token_expiry'

  /**
   * Store access token
   */
  setAccessToken(token: string, expiresIn: number = 3600): void {
    localStorage.setItem(TokenManager.TOKEN_KEY, token)

    const expiryTime = Date.now() + (expiresIn * 1000)
    localStorage.setItem(TokenManager.TOKEN_EXPIRY_KEY, expiryTime.toString())
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    const token = localStorage.getItem(TokenManager.TOKEN_KEY)
    const expiry = localStorage.getItem(TokenManager.TOKEN_EXPIRY_KEY)

    if (!token || !expiry) {
      return null
    }

    // Check if token is expired
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
   */
  getTimeUntilExpiry(): number {
    const expiry = localStorage.getItem(TokenManager.TOKEN_EXPIRY_KEY)

    if (!expiry) {
      return 0
    }

    const timeLeft = parseInt(expiry) - Date.now()
    return Math.max(0, timeLeft)
  }

  /**
   * Check if token is about to expire (within 5 minutes)
   */
  isTokenExpiringSoon(): boolean {
    const timeLeft = this.getTimeUntilExpiry()
    return timeLeft > 0 && timeLeft < 5 * 60 * 1000
  }
}
