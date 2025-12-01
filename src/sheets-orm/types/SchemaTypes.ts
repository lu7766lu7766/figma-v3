/**
 * Schema column types
 */
export type ColumnType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'dateTime'
  | 'date'
  | 'time'
  | 'json'
  | 'array'
  | 'enum'
  | 'text'

/**
 * Validation rule
 */
export interface ValidationRule {
  type: string
  value?: any
  message?: string
}

/**
 * Column definition
 */
export interface ColumnDefinition {
  type: ColumnType
  isPrimary?: boolean
  autoIncrement?: boolean
  required?: boolean
  nullable?: boolean
  default?: any
  unique?: boolean
  rules?: ValidationRule[]
  enumValues?: any[]
  arrayType?: ColumnType
  autoCreate?: boolean
  autoUpdate?: boolean
}

/**
 * Schema definition
 */
export interface SchemaDefinition {
  columns: Record<string, ColumnDefinition>
}

/**
 * Infer TypeScript type from schema
 */
export type InferSchemaType<T extends SchemaDefinition> = {
  [K in keyof T['columns']]: InferColumnType<T['columns'][K]>
}

/**
 * Infer TypeScript type from column definition
 */
export type InferColumnType<T extends ColumnDefinition> =
  T['type'] extends 'string' | 'text' ? string :
  T['type'] extends 'number' ? number :
  T['type'] extends 'boolean' ? boolean :
  T['type'] extends 'dateTime' | 'date' ? Date :
  T['type'] extends 'time' ? string :
  T['type'] extends 'json' ? any :
  T['type'] extends 'array' ? any[] :
  T['type'] extends 'enum' ? T['enumValues'] extends readonly any[] ? T['enumValues'][number] : any :
  any
