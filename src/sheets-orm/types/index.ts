import type { SchemaDefinition } from './SchemaTypes'

/**
 * Configuration for the Sheets ORM
 */
export interface SheetsORMConfig {
  spreadsheetId: string
  auth: {
    // API Key (optional, for read-only access to public sheets)
    apiKey?: string
    // OAuth2 configuration (optional, but required for write operations)
    oauth?: {
      clientId: string
      scopes: string[]
    }
    // Preferred authentication mode
    preferredMode?: 'api_key' | 'oauth2'
  }
  schemas: Record<string, SchemaDefinition>
  cache?: {
    enabled: boolean
    ttl: number
  }
  debug?: boolean
  pagination?: {
    perPage: number
    maxPerPage: number
  }
}

/**
 * Pagination result
 */
export interface PaginationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  from: number
  to: number
}

export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Cache entry
 */
export interface CacheEntry {
  data: any
  timestamp: number
}

export * from './SchemaTypes'
export * from './QueryTypes'
export * from './ModelTypes'
