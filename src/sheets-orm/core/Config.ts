import type { SheetsORMConfig } from '../types'

/**
 * Default configuration
 */
export const defaultConfig: Partial<SheetsORMConfig> = {
  cache: {
    enabled: false,
    ttl: 5 * 60 * 1000 // 5 minutes
  },
  debug: false,
  pagination: {
    perPage: 20,
    maxPerPage: 100
  },
  auth: {
    preferredMode: 'api_key', // Default to API Key (faster, no user interaction)
    oauth: {
      clientId: '',
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly'
      ]
    }
  }
}

/**
 * Merge user config with default config
 */
export function mergeConfig(userConfig: Partial<SheetsORMConfig>): SheetsORMConfig {
  return {
    spreadsheetId: userConfig.spreadsheetId || '',
    auth: {
      ...defaultConfig.auth!,
      ...userConfig.auth
    },
    schemas: userConfig.schemas || {},
    cache: {
      ...defaultConfig.cache!,
      ...userConfig.cache
    },
    debug: userConfig.debug ?? defaultConfig.debug!,
    pagination: {
      ...defaultConfig.pagination!,
      ...userConfig.pagination
    }
  }
}

/**
 * Define configuration helper
 */
export function defineConfig(config: SheetsORMConfig): SheetsORMConfig {
  return mergeConfig(config)
}
