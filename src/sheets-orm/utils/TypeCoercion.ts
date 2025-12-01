import type { ColumnType, ColumnDefinition } from '../types/SchemaTypes'

/**
 * Type coercion utilities
 * Convert between Google Sheets strings and TypeScript types
 */

/**
 * Coerce value from sheets (string) to TypeScript type
 */
export function coerceFromSheets(value: any, columnDef: ColumnDefinition): any {
  if (value === null || value === undefined || value === '') {
    return columnDef.nullable ? null : columnDef.default
  }

  switch (columnDef.type) {
    case 'number':
      return parseFloat(value)

    case 'boolean':
      if (typeof value === 'boolean') return value
      if (typeof value === 'string') {
        const lower = value.toLowerCase()
        return lower === 'true' || lower === '1' || lower === 'yes'
      }
      return !!value

    case 'dateTime':
    case 'date':
      if (value instanceof Date) return value
      return new Date(value)

    case 'time':
      return value.toString()

    case 'json':
      if (typeof value === 'object') return value
      try {
        return JSON.parse(value)
      } catch {
        return value
      }

    case 'array':
      if (Array.isArray(value)) return value
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          return Array.isArray(parsed) ? parsed : [value]
        } catch {
          return value.split(',').map(s => s.trim())
        }
      }
      return [value]

    case 'enum':
      return value

    case 'string':
    case 'text':
    default:
      return value.toString()
  }
}

/**
 * Coerce value to sheets (string) format
 */
export function coerceToSheets(value: any, columnDef: ColumnDefinition): any {
  if (value === null || value === undefined) {
    return ''
  }

  switch (columnDef.type) {
    case 'number':
      return value

    case 'boolean':
      return value ? 'TRUE' : 'FALSE'

    case 'dateTime':
      if (value instanceof Date) {
        return value.toISOString()
      }
      return value

    case 'date':
      if (value instanceof Date) {
        return value.toISOString().split('T')[0]
      }
      return value

    case 'time':
      return value.toString()

    case 'json':
      return typeof value === 'object' ? JSON.stringify(value) : value

    case 'array':
      return Array.isArray(value) ? JSON.stringify(value) : value

    case 'enum':
    case 'string':
    case 'text':
    default:
      return value.toString()
  }
}

/**
 * Get default value for column type
 */
export function getDefaultValue(columnDef: ColumnDefinition): any {
  if (columnDef.default !== undefined) {
    return columnDef.default
  }

  if (columnDef.nullable) {
    return null
  }

  switch (columnDef.type) {
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'array':
      return []
    case 'json':
      return {}
    case 'string':
    case 'text':
    case 'enum':
    case 'time':
    default:
      return ''
  }
}
