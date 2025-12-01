import type { SchemaDefinition, ColumnDefinition, ValidationRule } from '../types/SchemaTypes'
import { ValidationError } from '../errors'

/**
 * Validator
 * Validates data against schema
 */
export class Validator {
  private schema: SchemaDefinition

  constructor(schema: SchemaDefinition) {
    this.schema = schema
  }

  /**
   * Validate data against schema
   */
  async validate(data: any, existingRecords?: any[]): Promise<void> {
    const errors: Record<string, string[]> = {}

    for (const [columnName, columnDef] of Object.entries(this.schema.columns)) {
      const value = data[columnName]
      const columnErrors = await this.validateColumn(
        columnName,
        value,
        columnDef,
        data,
        existingRecords
      )

      if (columnErrors.length > 0) {
        errors[columnName] = columnErrors
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors)
    }
  }

  /**
   * Validate single column
   */
  private async validateColumn(
    columnName: string,
    value: any,
    columnDef: ColumnDefinition,
    data: any,
    existingRecords?: any[]
  ): Promise<string[]> {
    const errors: string[] = []

    // Skip validation for auto-increment primary keys
    if (columnDef.isPrimary && columnDef.autoIncrement) {
      return errors
    }

    // Check required
    if (columnDef.required && (value === null || value === undefined || value === '')) {
      errors.push(`${columnName} is required`)
      return errors // Stop further validation if required field is missing
    }

    // Skip other validations if value is null/undefined and nullable
    if ((value === null || value === undefined || value === '') && columnDef.nullable) {
      return errors
    }

    // Type validation
    const typeError = this.validateType(value, columnDef)
    if (typeError) {
      errors.push(typeError)
      return errors // Stop further validation if type is wrong
    }

    // Apply validation rules
    if (columnDef.rules) {
      for (const rule of columnDef.rules) {
        const ruleError = await this.validateRule(
          columnName,
          value,
          rule,
          columnDef,
          data,
          existingRecords
        )
        if (ruleError) {
          errors.push(ruleError)
        }
      }
    }

    return errors
  }

  /**
   * Validate type
   */
  private validateType(value: any, columnDef: ColumnDefinition): string | null {
    if (value === null || value === undefined || value === '') {
      return null
    }

    switch (columnDef.type) {
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return 'Must be a number'
        }
        break

      case 'boolean':
        if (typeof value !== 'boolean') {
          return 'Must be a boolean'
        }
        break

      case 'dateTime':
      case 'date':
        if (!(value instanceof Date) && isNaN(Date.parse(value))) {
          return 'Must be a valid date'
        }
        break

      case 'array':
        if (!Array.isArray(value)) {
          return 'Must be an array'
        }
        break

      case 'json':
        // JSON can be any type
        break

      case 'enum':
        if (columnDef.enumValues && !columnDef.enumValues.includes(value)) {
          return `Must be one of: ${columnDef.enumValues.join(', ')}`
        }
        break

      case 'string':
      case 'text':
      case 'time':
        if (typeof value !== 'string') {
          return 'Must be a string'
        }
        break
    }

    return null
  }

  /**
   * Validate rule
   */
  private async validateRule(
    columnName: string,
    value: any,
    rule: ValidationRule,
    columnDef: ColumnDefinition,
    data: any,
    existingRecords?: any[]
  ): Promise<string | null> {
    switch (rule.type) {
      case 'required':
        // Already handled in validateColumn
        return null

      case 'unique':
        if (existingRecords) {
          const isPrimaryKey = columnDef.isPrimary
          const exists = existingRecords.some(record => {
            // Skip self when updating
            if (isPrimaryKey && data[columnName] === record[columnName]) {
              return false
            }
            return record[columnName] === value
          })

          if (exists) {
            return rule.message || `${columnName} must be unique`
          }
        }
        return null

      case 'minLength':
        if (typeof value === 'string' && value.length < rule.value) {
          return rule.message || `Must be at least ${rule.value} characters`
        }
        return null

      case 'maxLength':
        if (typeof value === 'string' && value.length > rule.value) {
          return rule.message || `Must be at most ${rule.value} characters`
        }
        return null

      case 'pattern':
      case 'email':
        if (typeof value === 'string' && !rule.value.test(value)) {
          return rule.message || 'Invalid format'
        }
        return null

      case 'min':
        if (typeof value === 'number' && value < rule.value) {
          return rule.message || `Must be at least ${rule.value}`
        }
        return null

      case 'max':
        if (typeof value === 'number' && value > rule.value) {
          return rule.message || `Must be at most ${rule.value}`
        }
        return null

      case 'integer':
        if (typeof value === 'number' && !Number.isInteger(value)) {
          return rule.message || 'Must be an integer'
        }
        return null

      case 'minItems':
        if (Array.isArray(value) && value.length < rule.value) {
          return rule.message || `Must have at least ${rule.value} items`
        }
        return null

      case 'maxItems':
        if (Array.isArray(value) && value.length > rule.value) {
          return rule.message || `Must have at most ${rule.value} items`
        }
        return null

      default:
        return null
    }
  }
}
