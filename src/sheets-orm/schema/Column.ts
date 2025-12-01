import type { ColumnDefinition, ColumnType, ValidationRule } from '../types/SchemaTypes'

/**
 * Column Builder
 * Fluent API for defining column schema
 */
export class ColumnBuilder<T = any> {
  private definition: ColumnDefinition

  constructor(type: ColumnType) {
    this.definition = {
      type,
      rules: []
    }
  }

  /**
   * Mark as primary key
   */
  primary(): this {
    this.definition.isPrimary = true
    return this
  }

  /**
   * Enable auto increment
   */
  autoIncrement(): this {
    this.definition.autoIncrement = true
    return this
  }

  /**
   * Mark as required
   */
  required(): this {
    this.definition.required = true
    this.definition.rules!.push({
      type: 'required',
      message: 'This field is required'
    })
    return this
  }

  /**
   * Mark as nullable
   */
  nullable(): this {
    this.definition.nullable = true
    return this
  }

  /**
   * Set default value
   */
  default(value: any): this {
    this.definition.default = value
    return this
  }

  /**
   * Mark as unique
   */
  unique(): this {
    this.definition.unique = true
    this.definition.rules!.push({
      type: 'unique',
      message: 'This field must be unique'
    })
    return this
  }

  /**
   * Set minimum length (for strings)
   */
  minLength(min: number): this {
    this.definition.rules!.push({
      type: 'minLength',
      value: min,
      message: `Must be at least ${min} characters`
    })
    return this
  }

  /**
   * Set maximum length (for strings)
   */
  maxLength(max: number): this {
    this.definition.rules!.push({
      type: 'maxLength',
      value: max,
      message: `Must be at most ${max} characters`
    })
    return this
  }

  /**
   * Set pattern (for strings)
   */
  pattern(regex: RegExp, message?: string): this {
    this.definition.rules!.push({
      type: 'pattern',
      value: regex,
      message: message || 'Invalid format'
    })
    return this
  }

  /**
   * Validate email format
   */
  email(): this {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    this.definition.rules!.push({
      type: 'email',
      value: emailRegex,
      message: 'Invalid email format'
    })
    return this
  }

  /**
   * Set minimum value (for numbers)
   */
  min(min: number): this {
    this.definition.rules!.push({
      type: 'min',
      value: min,
      message: `Must be at least ${min}`
    })
    return this
  }

  /**
   * Set maximum value (for numbers)
   */
  max(max: number): this {
    this.definition.rules!.push({
      type: 'max',
      value: max,
      message: `Must be at most ${max}`
    })
    return this
  }

  /**
   * Mark as integer
   */
  integer(): this {
    this.definition.rules!.push({
      type: 'integer',
      message: 'Must be an integer'
    })
    return this
  }

  /**
   * Set minimum items (for arrays)
   */
  minItems(min: number): this {
    this.definition.rules!.push({
      type: 'minItems',
      value: min,
      message: `Must have at least ${min} items`
    })
    return this
  }

  /**
   * Set maximum items (for arrays)
   */
  maxItems(max: number): this {
    this.definition.rules!.push({
      type: 'maxItems',
      value: max,
      message: `Must have at most ${max} items`
    })
    return this
  }

  /**
   * Auto-create timestamp (for dateTime)
   */
  autoCreate(): this {
    this.definition.autoCreate = true
    return this
  }

  /**
   * Auto-update timestamp (for dateTime)
   */
  autoUpdate(): this {
    this.definition.autoUpdate = true
    return this
  }

  /**
   * Build column definition
   */
  build(): ColumnDefinition {
    return this.definition
  }
}

/**
 * Schema column type builders
 */
export class Schema {
  /**
   * String column
   */
  static string(): ColumnBuilder<string> {
    return new ColumnBuilder('string')
  }

  /**
   * Number column
   */
  static number(): ColumnBuilder<number> {
    return new ColumnBuilder('number')
  }

  /**
   * Boolean column
   */
  static boolean(): ColumnBuilder<boolean> {
    return new ColumnBuilder('boolean')
  }

  /**
   * DateTime column
   */
  static dateTime(): ColumnBuilder<Date> {
    return new ColumnBuilder('dateTime')
  }

  /**
   * Date column
   */
  static date(): ColumnBuilder<Date> {
    return new ColumnBuilder('date')
  }

  /**
   * Time column
   */
  static time(): ColumnBuilder<string> {
    return new ColumnBuilder('time')
  }

  /**
   * JSON column
   */
  static json(): ColumnBuilder<any> {
    return new ColumnBuilder('json')
  }

  /**
   * Array column
   */
  static array(type: ColumnBuilder<any>): ColumnBuilder<any[]> {
    const builder = new ColumnBuilder('array')
    builder['definition'].arrayType = type['definition'].type
    return builder
  }

  /**
   * Enum column
   */
  static enum<T extends readonly any[]>(values: T): ColumnBuilder<T[number]> {
    const builder = new ColumnBuilder('enum')
    builder['definition'].enumValues = values as any
    return builder
  }

  /**
   * Text column (long string)
   */
  static text(): ColumnBuilder<string> {
    return new ColumnBuilder('text')
  }

  /**
   * Create schema definition
   */
  static create(columns: Record<string, ColumnBuilder<any>>) {
    const definitions: Record<string, ColumnDefinition> = {}

    for (const [name, builder] of Object.entries(columns)) {
      definitions[name] = builder.build()
    }

    return {
      columns: definitions
    }
  }
}
