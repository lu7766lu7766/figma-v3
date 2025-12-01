/**
 * Query operators
 */
export type Operator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'NOT IN' | 'BETWEEN' | 'NOT BETWEEN' | 'NULL' | 'NOT NULL'

/**
 * Where clause
 */
export interface WhereClause {
  column: string
  operator: Operator
  value?: any
  type?: 'AND' | 'OR'
}

/**
 * Order by direction
 */
export type OrderDirection = 'asc' | 'desc'

/**
 * Order by clause
 */
export interface OrderByClause {
  column: string
  direction: OrderDirection
}

/**
 * Query state
 */
export interface QueryState {
  table: string
  select?: string[]
  where?: WhereClause[]
  orderBy?: OrderByClause[]
  limit?: number
  offset?: number
  cache?: boolean
  cacheTTL?: number
}
