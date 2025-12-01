import type { QueryState, OrderDirection, Operator, PaginatedResult } from '../types'
import { WhereClauseBuilder } from './WhereClause'
import { QueryExecutor } from './QueryExecutor'

/**
 * Query Builder
 * Fluent API for building queries
 */
export class QueryBuilder {
  protected state: QueryState
  protected whereBuilder: WhereClauseBuilder
  protected executor: QueryExecutor

  constructor(table: string, executor: QueryExecutor) {
    this.state = {
      table,
      select: undefined,
      where: undefined,
      orderBy: undefined,
      limit: undefined,
      offset: undefined,
      cache: undefined,
      cacheTTL: undefined
    }
    this.whereBuilder = new WhereClauseBuilder()
    this.executor = executor
  }

  /**
   * Set executor (used by Database integration)
   */
  setExecutor(executor: QueryExecutor): void {
    this.executor = executor
  }

  /**
   * Get executor
   */
  getExecutor(): QueryExecutor {
    return this.executor
  }

  /**
   * Specify columns to select
   */
  select(columns: string[] | '*'): this {
    this.state.select = columns === '*' ? undefined : columns
    return this
  }

  /**
   * Add WHERE clause
   */
  where(column: string, operator: Operator | any, value?: any): this {
    this.whereBuilder.where(column, operator, value)
    this.state.where = this.whereBuilder.getClauses()
    return this
  }

  /**
   * Add OR WHERE clause
   */
  orWhere(column: string, operator: Operator | any, value?: any): this {
    this.whereBuilder.orWhere(column, operator, value)
    this.state.where = this.whereBuilder.getClauses()
    return this
  }

  /**
   * Add WHERE IN clause
   */
  whereIn(column: string, values: any[]): this {
    this.whereBuilder.whereIn(column, values)
    this.state.where = this.whereBuilder.getClauses()
    return this
  }

  /**
   * Add WHERE NOT IN clause
   */
  whereNotIn(column: string, values: any[]): this {
    this.whereBuilder.whereNotIn(column, values)
    this.state.where = this.whereBuilder.getClauses()
    return this
  }

  /**
   * Add WHERE NULL clause
   */
  whereNull(column: string): this {
    this.whereBuilder.whereNull(column)
    this.state.where = this.whereBuilder.getClauses()
    return this
  }

  /**
   * Add WHERE NOT NULL clause
   */
  whereNotNull(column: string): this {
    this.whereBuilder.whereNotNull(column)
    this.state.where = this.whereBuilder.getClauses()
    return this
  }

  /**
   * Add WHERE BETWEEN clause
   */
  whereBetween(column: string, values: [any, any]): this {
    this.whereBuilder.whereBetween(column, values)
    this.state.where = this.whereBuilder.getClauses()
    return this
  }

  /**
   * Add WHERE NOT BETWEEN clause
   */
  whereNotBetween(column: string, values: [any, any]): this {
    this.whereBuilder.whereNotBetween(column, values)
    this.state.where = this.whereBuilder.getClauses()
    return this
  }

  /**
   * Add ORDER BY clause
   */
  orderBy(column: string, direction: OrderDirection = 'asc'): this {
    if (!this.state.orderBy) {
      this.state.orderBy = []
    }
    this.state.orderBy.push({ column, direction })
    return this
  }

  /**
   * Set LIMIT
   */
  limit(count: number): this {
    this.state.limit = count
    return this
  }

  /**
   * Set OFFSET
   */
  offset(count: number): this {
    this.state.offset = count
    return this
  }

  /**
   * Enable caching for this query
   */
  cache(ttl?: number): this {
    this.state.cache = true
    this.state.cacheTTL = ttl
    return this
  }

  /**
   * Get first result
   */
  async first(): Promise<any | null> {
    const results = await this.limit(1).get()
    return results.length > 0 ? results[0] : null
  }

  /**
   * Get all results
   */
  async get(): Promise<any[]> {
    return this.executor.select(this.state, this.whereBuilder)
  }

  /**
   * Get paginated results
   */
  async paginate(page: number = 1, perPage: number = 20): Promise<PaginatedResult<any>> {
    return this.executor.paginate(this.state, this.whereBuilder, page, perPage)
  }

  /**
   * Count results
   */
  async count(column: string = '*'): Promise<number> {
    const results = await this.executor.select(this.state, this.whereBuilder)
    return results.length
  }

  /**
   * Insert data
   */
  async insert(data: any): Promise<void> {
    return this.executor.insert(this.state.table, data)
  }

  /**
   * Insert many records
   */
  async insertMany(data: any[]): Promise<void> {
    return this.executor.insertMany(this.state.table, data)
  }

  /**
   * Update records
   */
  async update(data: any): Promise<number> {
    return this.executor.update(this.state, this.whereBuilder, data)
  }

  /**
   * Delete records
   */
  async delete(): Promise<number> {
    return this.executor.delete(this.state, this.whereBuilder)
  }

  /**
   * Get query state
   */
  getState(): QueryState {
    return { ...this.state }
  }

  /**
   * Get where builder
   */
  getWhereBuilder(): WhereClauseBuilder {
    return this.whereBuilder
  }

  /**
   * Clone query builder
   */
  clone(): QueryBuilder {
    const cloned = new QueryBuilder(this.state.table, this.executor)
    cloned.state = { ...this.state }
    cloned.whereBuilder = Object.create(
      Object.getPrototypeOf(this.whereBuilder),
      Object.getOwnPropertyDescriptors(this.whereBuilder)
    )
    return cloned
  }
}
