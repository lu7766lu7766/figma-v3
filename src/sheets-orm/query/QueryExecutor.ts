import type { QueryState, PaginatedResult, SchemaDefinition } from '../types'
import { SheetsAdapter } from '../adapters/SheetsAdapter'
import { WhereClauseBuilder } from './WhereClause'
import { QueryError } from '../errors'

/**
 * Query Executor
 * Executes queries against Google Sheets
 */
export class QueryExecutor {
  private adapter: SheetsAdapter
  private schemas: Record<string, SchemaDefinition>
  private cache: Map<string, { data: any, timestamp: number }>
  private cacheTTL: number
  private cacheEnabled: boolean

  constructor(
    adapter: SheetsAdapter,
    schemas: Record<string, SchemaDefinition>,
    cacheConfig: { enabled: boolean, ttl: number }
  ) {
    this.adapter = adapter
    this.schemas = schemas
    this.cache = new Map()
    this.cacheTTL = cacheConfig.ttl
    this.cacheEnabled = cacheConfig.enabled
  }

  /**
   * Execute SELECT query
   */
  async select(state: QueryState, whereBuilder: WhereClauseBuilder): Promise<any[]> {
    // Check cache
    const cacheKey = this.getCacheKey(state)
    if ((state.cache || this.cacheEnabled) && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      const ttl = state.cacheTTL || this.cacheTTL

      if (Date.now() - cached.timestamp < ttl) {
        return this.applyTransformations(cached.data, state, whereBuilder)
      } else {
        this.cache.delete(cacheKey)
      }
    }

    // Fetch data from sheets
    let data = await this.adapter.getSheet(state.table)

    // Cache if enabled
    if (state.cache || this.cacheEnabled) {
      this.cache.set(cacheKey, {
        data: [...data],
        timestamp: Date.now()
      })
    }

    return this.applyTransformations(data, state, whereBuilder)
  }

  /**
   * Apply WHERE, ORDER BY, LIMIT, OFFSET, SELECT
   */
  private applyTransformations(
    data: any[],
    state: QueryState,
    whereBuilder: WhereClauseBuilder
  ): any[] {
    let result = [...data]

    // WHERE
    if (state.where && state.where.length > 0) {
      result = result.filter(record => whereBuilder.matches(record))
    }

    // ORDER BY
    if (state.orderBy && state.orderBy.length > 0) {
      result.sort((a, b) => {
        for (const order of state.orderBy!) {
          const aVal = a[order.column]
          const bVal = b[order.column]

          if (aVal < bVal) return order.direction === 'asc' ? -1 : 1
          if (aVal > bVal) return order.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    // OFFSET
    if (state.offset) {
      result = result.slice(state.offset)
    }

    // LIMIT
    if (state.limit) {
      result = result.slice(0, state.limit)
    }

    // SELECT
    if (state.select) {
      result = result.map(record => {
        const selected: any = {}
        state.select!.forEach(col => {
          selected[col] = record[col]
        })
        return selected
      })
    }

    return result
  }

  /**
   * Execute paginated query
   */
  async paginate(
    state: QueryState,
    whereBuilder: WhereClauseBuilder,
    page: number,
    perPage: number
  ): Promise<PaginatedResult<any>> {
    // Get all matching records (without limit/offset)
    const tempState = { ...state, limit: undefined, offset: undefined }
    const allRecords = await this.select(tempState, whereBuilder)

    const total = allRecords.length
    const lastPage = Math.ceil(total / perPage)
    const from = (page - 1) * perPage
    const to = Math.min(from + perPage, total)

    const data = allRecords.slice(from, to)

    return {
      data,
      meta: {
        total,
        perPage,
        currentPage: page,
        lastPage,
        from: from + 1,
        to
      }
    }
  }

  /**
   * Insert single record
   */
  async insert(table: string, data: any): Promise<void> {
    const schema = this.schemas[table]

    // Handle auto-increment primary key
    if (schema) {
      const primaryKey = this.getPrimaryKey(schema)
      if (primaryKey && primaryKey.def.autoIncrement) {
        const maxId = await this.adapter.getMaxId(table, primaryKey.name)
        data[primaryKey.name] = maxId + 1
      }
    }

    await this.adapter.appendRows(table, [data])
    this.invalidateCache(table)
  }

  /**
   * Insert multiple records
   */
  async insertMany(table: string, records: any[]): Promise<void> {
    const schema = this.schemas[table]

    if (schema) {
      const primaryKey = this.getPrimaryKey(schema)
      if (primaryKey && primaryKey.def.autoIncrement) {
        let maxId = await this.adapter.getMaxId(table, primaryKey.name)

        records.forEach(record => {
          maxId++
          record[primaryKey.name] = maxId
        })
      }
    }

    await this.adapter.appendRows(table, records)
    this.invalidateCache(table)
  }

  /**
   * Update records
   */
  async update(
    state: QueryState,
    whereBuilder: WhereClauseBuilder,
    data: any
  ): Promise<number> {
    // Get all data to find matching rows
    const allData = await this.adapter.getSheet(state.table)

    const updates: Array<{ rowIndex: number, data: any }> = []

    allData.forEach((record, index) => {
      if (whereBuilder.matches(record)) {
        // Row index in sheet is index + 2 (header + 0-index)
        updates.push({
          rowIndex: index + 2,
          data: { ...record, ...data }
        })
      }
    })

    if (updates.length > 0) {
      await this.adapter.updateRows(state.table, updates)
      this.invalidateCache(state.table)
    }

    return updates.length
  }

  /**
   * Delete records
   */
  async delete(state: QueryState, whereBuilder: WhereClauseBuilder): Promise<number> {
    // Get all data to find matching rows
    const allData = await this.adapter.getSheet(state.table)

    const rowIndices: number[] = []

    allData.forEach((record, index) => {
      if (whereBuilder.matches(record)) {
        // Row index in sheet is index + 2 (header + 0-index)
        rowIndices.push(index + 2)
      }
    })

    if (rowIndices.length > 0) {
      await this.adapter.deleteRows(state.table, rowIndices)
      this.invalidateCache(state.table)
    }

    return rowIndices.length
  }

  /**
   * Get primary key from schema
   */
  private getPrimaryKey(schema: SchemaDefinition): { name: string, def: any } | null {
    for (const [name, def] of Object.entries(schema.columns)) {
      if (def.isPrimary) {
        return { name, def }
      }
    }
    return null
  }

  /**
   * Generate cache key
   */
  private getCacheKey(state: QueryState): string {
    return `${state.table}:${JSON.stringify({
      where: state.where,
      orderBy: state.orderBy
    })}`
  }

  /**
   * Invalidate cache for table
   */
  private invalidateCache(table: string): void {
    const keysToDelete: string[] = []

    this.cache.forEach((_, key) => {
      if (key.startsWith(`${table}:`)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Clear cache for specific table
   */
  clearTableCache(table: string): void {
    this.invalidateCache(table)
  }
}
