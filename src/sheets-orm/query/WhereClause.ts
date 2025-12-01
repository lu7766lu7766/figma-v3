import type { WhereClause as IWhereClause, Operator } from '../types/QueryTypes'

/**
 * Where Clause Builder
 * Builds and evaluates WHERE conditions
 */
export class WhereClauseBuilder {
  private clauses: IWhereClause[] = []

  /**
   * Add WHERE clause
   */
  where(column: string, operator: Operator | any, value?: any, type: 'AND' | 'OR' = 'AND'): this {
    // Support shorthand: where('id', 1) === where('id', '=', 1)
    if (value === undefined && operator !== 'NULL' && operator !== 'NOT NULL') {
      value = operator
      operator = '='
    }

    this.clauses.push({
      column,
      operator: operator as Operator,
      value,
      type
    })

    return this
  }

  /**
   * Add OR WHERE clause
   */
  orWhere(column: string, operator: Operator | any, value?: any): this {
    return this.where(column, operator, value, 'OR')
  }

  /**
   * Add WHERE IN clause
   */
  whereIn(column: string, values: any[]): this {
    return this.where(column, 'IN', values)
  }

  /**
   * Add WHERE NOT IN clause
   */
  whereNotIn(column: string, values: any[]): this {
    return this.where(column, 'NOT IN', values)
  }

  /**
   * Add WHERE NULL clause
   */
  whereNull(column: string): this {
    return this.where(column, 'NULL')
  }

  /**
   * Add WHERE NOT NULL clause
   */
  whereNotNull(column: string): this {
    return this.where(column, 'NOT NULL')
  }

  /**
   * Add WHERE BETWEEN clause
   */
  whereBetween(column: string, values: [any, any]): this {
    return this.where(column, 'BETWEEN', values)
  }

  /**
   * Add WHERE NOT BETWEEN clause
   */
  whereNotBetween(column: string, values: [any, any]): this {
    return this.where(column, 'NOT BETWEEN', values)
  }

  /**
   * Get all where clauses
   */
  getClauses(): IWhereClause[] {
    return this.clauses
  }

  /**
   * Check if record matches all where clauses
   */
  matches(record: any): boolean {
    if (this.clauses.length === 0) {
      return true
    }

    let result = this.evaluateClause(record, this.clauses[0])

    for (let i = 1; i < this.clauses.length; i++) {
      const clause = this.clauses[i]
      const clauseResult = this.evaluateClause(record, clause)

      if (clause.type === 'OR') {
        result = result || clauseResult
      } else {
        result = result && clauseResult
      }
    }

    return result
  }

  /**
   * Evaluate single where clause
   */
  private evaluateClause(record: any, clause: IWhereClause): boolean {
    const value = record[clause.column]

    switch (clause.operator) {
      case '=':
        return value == clause.value

      case '!=':
        return value != clause.value

      case '>':
        return value > clause.value

      case '<':
        return value < clause.value

      case '>=':
        return value >= clause.value

      case '<=':
        return value <= clause.value

      case 'IN':
        return Array.isArray(clause.value) && clause.value.includes(value)

      case 'NOT IN':
        return Array.isArray(clause.value) && !clause.value.includes(value)

      case 'NULL':
        return value === null || value === undefined || value === ''

      case 'NOT NULL':
        return value !== null && value !== undefined && value !== ''

      case 'BETWEEN':
        if (Array.isArray(clause.value) && clause.value.length === 2) {
          return value >= clause.value[0] && value <= clause.value[1]
        }
        return false

      case 'NOT BETWEEN':
        if (Array.isArray(clause.value) && clause.value.length === 2) {
          return value < clause.value[0] || value > clause.value[1]
        }
        return true

      default:
        return false
    }
  }
}
