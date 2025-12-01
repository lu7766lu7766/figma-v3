import type { SheetsORMConfig } from '../types'
import { GoogleAuth } from '../auth/GoogleAuth'
import { AuthManager } from '../auth/AuthManager'
import { AuthMode } from '../auth/AuthStrategy'
import { SheetsAdapter } from '../adapters/SheetsAdapter'
import { QueryBuilder } from '../query/QueryBuilder'
import { QueryExecutor } from '../query/QueryExecutor'
import { BaseModel } from '../model/BaseModel'
import { Validator } from '../schema/Validator'

/**
 * Database
 * Main entry point for the ORM
 */
export class Database {
  private config: SheetsORMConfig
  private authManager: AuthManager
  private adapter: SheetsAdapter
  private executor: QueryExecutor
  private static instance: Database | null = null

  constructor(config: SheetsORMConfig) {
    this.config = config

    // Create AuthManager
    this.authManager = new AuthManager({
      apiKey: config.auth.apiKey,
      oauth: config.auth.oauth,
      preferredMode: config.auth.preferredMode === 'oauth2' ? AuthMode.OAUTH2 : AuthMode.API_KEY
    })

    // Create Adapter with AuthManager
    this.adapter = new SheetsAdapter(config.spreadsheetId, config.schemas, this.authManager)

    this.executor = new QueryExecutor(
      this.adapter,
      config.schemas,
      config.cache || { enabled: false, ttl: 5 * 60 * 1000 }
    )

    // Set global instance
    Database.instance = this

    // Integrate with BaseModel
    this.integrateWithBaseModel()
  }

  /**
   * Initialize database (load gapi, authenticate, etc.)
   */
  async initialize(): Promise<void> {
    await this.authManager.initialize()
  }

  /**
   * Get authentication manager
   */
  getAuthManager(): AuthManager {
    return this.authManager
  }

  /**
   * Get authentication instance (backward compatibility)
   * @deprecated Use getAuthManager() instead
   */
  getAuth(): GoogleAuth {
    const oauth2Strategy = this.authManager.getOAuth2Strategy()
    if (!oauth2Strategy) {
      throw new Error('OAuth2 is not configured')
    }
    return oauth2Strategy
  }

  /**
   * Get query builder for table
   */
  from(table: string): QueryBuilder {
    return new QueryBuilder(table, this.executor)
  }

  /**
   * Get query builder for table (alias)
   */
  table(table: string): QueryBuilder {
    return this.from(table)
  }

  /**
   * Get configuration
   */
  getConfig(): SheetsORMConfig {
    return this.config
  }

  /**
   * Get sheets adapter
   */
  getAdapter(): SheetsAdapter {
    return this.adapter
  }

  /**
   * Get query executor
   */
  getExecutor(): QueryExecutor {
    return this.executor
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.executor.clearCache()
  }

  /**
   * Get global database instance
   */
  static getInstance(): Database {
    if (!Database.instance) {
      throw new Error('Database not initialized. Call createSheetsORM() first.')
    }
    return Database.instance
  }

  /**
   * Integrate with BaseModel
   */
  private integrateWithBaseModel(): void {
    const db = this

    // Override performCreate
    BaseModel.prototype['performCreate'] = async function (this: BaseModel) {
      const constructor = this.constructor as typeof BaseModel
      const schema = db.config.schemas[constructor.table]

      if (schema) {
        const validator = new Validator(schema)
        await validator.validate(this['$attributes'])
      }

      // Handle auto-create timestamps
      const columnMetadata = constructor.getColumnMetadata()
      for (const [key, meta] of Object.entries(columnMetadata)) {
        if (meta.autoCreate && !this['$attributes'][key]) {
          this['$attributes'][key] = new Date()
        }
        if (meta.autoUpdate) {
          this['$attributes'][key] = new Date()
        }
      }

      await db.executor.insert(constructor.table, this['$attributes'])

      // Refresh to get auto-increment ID
      if (this['$attributes'][constructor.getPrimaryKey()]) {
        const id = this['$attributes'][constructor.getPrimaryKey()]
        const fresh = await constructor.find(id)
        if (fresh) {
          this['$attributes'] = (fresh as any)['$attributes']
        }
      }
    }

    // Override performUpdate
    BaseModel.prototype['performUpdate'] = async function (this: BaseModel) {
      const constructor = this.constructor as typeof BaseModel
      const schema = db.config.schemas[constructor.table]

      if (schema) {
        const validator = new Validator(schema)
        await validator.validate(this['$attributes'])
      }

      // Handle auto-update timestamps
      const columnMetadata = constructor.getColumnMetadata()
      for (const [key, meta] of Object.entries(columnMetadata)) {
        if (meta.autoUpdate) {
          this['$attributes'][key] = new Date()
        }
      }

      const primaryKey = constructor.getPrimaryKey()
      const id = this['$attributes'][primaryKey]

      const qb = new QueryBuilder(constructor.table, db.executor)
      await qb.where(primaryKey, id).update(this['$attributes'])
    }

    // Override performDelete
    BaseModel.prototype['performDelete'] = async function (this: BaseModel) {
      const constructor = this.constructor as typeof BaseModel
      const primaryKey = constructor.getPrimaryKey()
      const id = this['$attributes'][primaryKey]

      const qb = new QueryBuilder(constructor.table, db.executor)
      await qb.where(primaryKey, id).delete()
    }

    // Override query() to use proper executor
    const originalQuery = BaseModel.query
    BaseModel.query = function <T extends typeof BaseModel>(this: T) {
      const query = originalQuery.call(this)
      query.setExecutor(db.executor)
      return query
    }

    // Override clearCache
    BaseModel.clearCache = function () {
      db.executor.clearTableCache(this.table)
    }
  }
}
