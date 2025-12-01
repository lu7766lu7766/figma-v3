import { inject, type ComputedRef } from 'vue'
import type { Database } from '../core/Database'

/**
 * Use database composable
 */
export function useDatabase(): Database {
  const db = inject<Database>('sheetsORM')

  if (!db) {
    throw new Error('SheetsORM not installed. Please install the plugin first.')
  }

  return db
}

/**
 * Use auth composable
 */
export function useAuth() {
  const auth = inject<{
    isAuthenticated: ComputedRef<boolean>
    isLoading: ComputedRef<boolean>
    error: ComputedRef<string | null>
    signIn: () => Promise<void>
    signOut: () => Promise<void>
  }>('sheetsAuth')

  if (!auth) {
    throw new Error('SheetsAuth not installed. Please install the plugin first.')
  }

  return auth
}
