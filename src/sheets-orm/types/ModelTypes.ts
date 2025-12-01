/**
 * Model constructor
 */
export interface ModelConstructor {
  new (...args: any[]): any
  table: string
  softDeletes?: boolean
  hidden?: string[]
  scopes?: Record<string, (query: any) => any>
}

/**
 * Relationship type
 */
export type RelationType = 'hasOne' | 'hasMany' | 'belongsTo' | 'manyToMany'

/**
 * Relationship configuration
 */
export interface RelationshipConfig {
  type: RelationType
  model: () => ModelConstructor
  foreignKey: string
  localKey?: string
  ownerKey?: string
  pivotTable?: string
  relatedPivotKey?: string
  pivotKey?: string
}

export type HasMany<T extends ModelConstructor> = InstanceType<T>[]
export type BelongsTo<T extends ModelConstructor> = InstanceType<T> | null
export type HasOne<T extends ModelConstructor> = InstanceType<T> | null
export type ManyToMany<T extends ModelConstructor> = InstanceType<T>[]

/**
 * Serialized model data (plain JSON object)
 */
export type SerializedModel = Record<string, any>

/**
 * Serialized model array
 */
export type SerializedModelArray = SerializedModel[]

/**
 * Type helper to extract data properties from model instance (excluding methods)
 */
type DataOnly<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? never : K]: T[K]
}

/**
 * Type helper for serialized model data
 * Represents a model instance as a plain object with all properties
 * This allows methods like toArray() to return properly typed results
 */
export type Serialized<T> = DataOnly<T> & Record<string, any>

/**
 * Hook type
 */
export type HookType =
  | 'beforeCreate'
  | 'afterCreate'
  | 'beforeUpdate'
  | 'afterUpdate'
  | 'beforeSave'
  | 'afterSave'
  | 'beforeDelete'
  | 'afterDelete'
  | 'beforeFind'
  | 'afterFind'
