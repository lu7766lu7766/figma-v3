/**
 * Google Sheets ORM
 * Main export file
 */

import type { App, Plugin } from 'vue'
import type { SheetsORMConfig } from './types'
import { Database } from './core/Database'
import { defineConfig } from './core/Config'
import { createAuthPlugin } from './auth/AuthPlugin'

// Core exports
export { Database } from './core/Database'
export { defineConfig } from './core/Config'

// Query Builder
export { QueryBuilder } from './query/QueryBuilder'

// Model
export { BaseModel } from './model/BaseModel'
export { ModelQuery } from './model/ModelQuery'

// Decorators
export {
  column,
  beforeCreate,
  afterCreate,
  beforeUpdate,
  afterUpdate,
  beforeSave,
  afterSave,
  beforeDelete,
  afterDelete,
  beforeFind,
  afterFind,
  hasMany,
  belongsTo,
  hasOne,
  manyToMany
} from './model/decorators'

// Schema
export { Schema } from './schema/Column'
export { Validator } from './schema/Validator'

// Types
export type {
  SheetsORMConfig,
  SchemaDefinition,
  ColumnDefinition,
  QueryState,
  PaginatedResult,
  HasMany,
  BelongsTo,
  HasOne,
  ManyToMany,
  Serialized
} from './types'

// Errors
export {
  ORMError,
  ValidationError,
  ModelNotFoundError,
  ConnectionError,
  QueryError,
  AuthenticationError,
  AuthenticationRequiredError,
  SchemaError
} from './errors'

// Auth
export { AuthManager } from './auth/AuthManager'
export { AuthMode } from './auth/AuthStrategy'

/**
 * Create Sheets ORM instance
 */
export function createSheetsORM(config: SheetsORMConfig) {
  const db = new Database(config)

  return {
    install(app: App) {
      // Provide database instance
      app.provide('sheetsORM', db)

      // Provide auth using AuthManager
      const authPlugin = createAuthPlugin(db.getAuthManager())
      app.use(authPlugin)

      // Global property
      app.config.globalProperties.$db = db
    },
    db
  }
}

/**
 * Vue composables
 */
export { useDatabase } from './vue/composables'
export { useAuth } from './vue/composables'

// Re-export for convenience
export { defineConfig as default }
