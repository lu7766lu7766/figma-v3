import { ref, computed, type App, type Plugin } from 'vue'
import type { AuthManager } from './AuthManager'
import { AuthMode } from './AuthStrategy'
import { AuthenticationRequiredError } from '../errors'

/**
 * Auth state for Vue
 */
export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  currentMode: AuthMode | null
  canWrite: boolean
}

/**
 * Create auth composable
 */
export function createAuthComposable(authManager: AuthManager) {
  const state = ref<AuthState>({
    isAuthenticated: authManager.isAuthenticated(),
    isLoading: false,
    error: null,
    currentMode: authManager.getCurrentMode(),
    canWrite: authManager.isAuthenticated()
  })

  /**
   * Sign in (OAuth2)
   */
  const signIn = async () => {
    state.value.isLoading = true
    state.value.error = null

    try {
      await authManager.signIn()
      state.value.isAuthenticated = true
      state.value.currentMode = authManager.getCurrentMode()
      state.value.canWrite = true
    } catch (error: any) {
      state.value.error = error.message
      throw error
    } finally {
      state.value.isLoading = false
    }
  }

  /**
   * Sign out
   */
  const signOut = async () => {
    state.value.isLoading = true
    state.value.error = null

    try {
      await authManager.signOut()
      state.value.isAuthenticated = false
      state.value.currentMode = authManager.getCurrentMode()
      state.value.canWrite = false
    } catch (error: any) {
      state.value.error = error.message
      throw error
    } finally {
      state.value.isLoading = false
    }
  }

  /**
   * Handle authentication required errors
   * Automatically prompts user to sign in and retries the operation
   */
  const handleAuthRequired = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await operation()
    } catch (error) {
      if (error instanceof AuthenticationRequiredError) {
        // Automatically trigger sign in
        await signIn()
        // Retry the operation
        return await operation()
      }
      throw error
    }
  }

  return {
    isAuthenticated: computed(() => state.value.isAuthenticated),
    isLoading: computed(() => state.value.isLoading),
    error: computed(() => state.value.error),
    currentMode: computed(() => state.value.currentMode),
    canWrite: computed(() => state.value.canWrite),
    signIn,
    signOut,
    handleAuthRequired
  }
}

/**
 * Auth plugin for Vue
 */
export function createAuthPlugin(authManager: AuthManager): Plugin {
  return {
    install(app: App) {
      const authComposable = createAuthComposable(authManager)

      app.provide('sheetsAuth', authComposable)
    }
  }
}
