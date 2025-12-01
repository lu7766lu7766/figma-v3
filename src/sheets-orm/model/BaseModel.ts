import type { HookType } from '../types/ModelTypes'
import { ModelQuery } from './ModelQuery'
import { ModelNotFoundError, ValidationError } from '../errors'

/**
 * Column decorator metadata storage
 */
const COLUMN_METADATA = Symbol('column_metadata')
const HOOK_METADATA = Symbol('hook_metadata')
const RELATION_METADATA = Symbol('relation_metadata')

/**
 * Base Model
 * Active Record pattern implementation
 */
export abstract class BaseModel {
  static table: string
  static softDeletes: boolean = false
  static hidden: string[] = []
  static scopes: Record<string, (query: ModelQuery) => ModelQuery> = {}

  // Internal state
  private $attributes: Record<string, any> = {}
  private $original: Record<string, any> = {}
  private $exists: boolean = false
  private $dirty: Set<string> = new Set()
  private $relations: Record<string, any> = {}

  /**
   * Get query builder for this model
   */
  static query<T extends typeof BaseModel>(this: T): ModelQuery<T> {
    return new ModelQuery(this)
  }

  /**
   * Find all records
   */
  static async all<T extends typeof BaseModel>(this: T): Promise<InstanceType<T>[]> {
    return this.query().get()
  }

  /**
   * Find record by ID
   */
  static async find<T extends typeof BaseModel>(
    this: T,
    id: any
  ): Promise<InstanceType<T> | null> {
    const primaryKey = this.getPrimaryKey()
    return this.query().where(primaryKey, id).first()
  }

  /**
   * Find record by ID or fail
   */
  static async findOrFail<T extends typeof BaseModel>(
    this: T,
    id: any
  ): Promise<InstanceType<T>> {
    const record = await this.find(id)

    if (!record) {
      throw new ModelNotFoundError(this.name, id)
    }

    return record
  }

  /**
   * Find record by column value
   */
  static async findBy<T extends typeof BaseModel>(
    this: T,
    column: string,
    value: any
  ): Promise<InstanceType<T> | null> {
    return this.query().where(column, value).first()
  }

  /**
   * Create new record
   */
  static async create<T extends typeof BaseModel>(
    this: T,
    data: any
  ): Promise<InstanceType<T>> {
    const instance = new this() as InstanceType<T>
    instance.fill(data)
    await instance.save()
    return instance
  }

  /**
   * Create many records
   */
  static async createMany<T extends typeof BaseModel>(
    this: T,
    records: any[]
  ): Promise<InstanceType<T>[]> {
    const instances: InstanceType<T>[] = []

    for (const data of records) {
      const instance = await this.create(data)
      instances.push(instance)
    }

    return instances
  }

  /**
   * Get primary key column name
   */
  static getPrimaryKey(): string {
    const metadata = this.getColumnMetadata()
    for (const [key, meta] of Object.entries(metadata)) {
      if (meta.isPrimary) {
        return key
      }
    }
    return 'id'
  }

  /**
   * Get column metadata
   */
  static getColumnMetadata(): Record<string, any> {
    return (this as any)[COLUMN_METADATA] || {}
  }

  /**
   * Get hook metadata
   */
  static getHookMetadata(): Record<HookType, Function[]> {
    return (this as any)[HOOK_METADATA] || {}
  }

  /**
   * Get relation metadata
   */
  static getRelationMetadata(): Record<string, any> {
    return (this as any)[RELATION_METADATA] || {}
  }

  /**
   * Register relation
   */
  static registerRelation(name: string, config: any): void {
    if (!(this as any)[RELATION_METADATA]) {
      (this as any)[RELATION_METADATA] = {}
    }
    ;(this as any)[RELATION_METADATA][name] = config
  }

  /**
   * Register column
   */
  static registerColumn(propertyKey: string, options: any = {}): void {
    if (!(this as any)[COLUMN_METADATA]) {
      (this as any)[COLUMN_METADATA] = {}
    }
    (this as any)[COLUMN_METADATA][propertyKey] = options
  }

  /**
   * Register hook
   */
  static registerHook(hookType: HookType, handler: Function): void {
    if (!(this as any)[HOOK_METADATA]) {
      (this as any)[HOOK_METADATA] = {}
    }
    if (!(this as any)[HOOK_METADATA][hookType]) {
      (this as any)[HOOK_METADATA][hookType] = []
    }
    (this as any)[HOOK_METADATA][hookType].push(handler)
  }

  /**
   * Run hooks
   */
  static async runHooks<T extends BaseModel>(hookType: HookType, instance: T): Promise<void> {
    const hooks = this.getHookMetadata()[hookType] || []

    for (const hook of hooks) {
      await hook.call(this, instance)
    }
  }

  /**
   * Clear cache for this model
   */
  static clearCache(): void {
    // Will be implemented in Database integration
  }

  /**
   * Fill model with data
   */
  fill(data: Record<string, any>): this {
    for (const [key, value] of Object.entries(data)) {
      this.$attributes[key] = value

      if (!this.$exists) {
        this.$original[key] = value
      } else {
        if (this.$original[key] !== value) {
          this.$dirty.add(key)
        }
      }
    }

    return this
  }

  /**
   * Merge data (only specified fields)
   */
  merge(data: Record<string, any>): this {
    return this.fill(data)
  }

  /**
   * Save model
   */
  async save(): Promise<this> {
    const constructor = this.constructor as typeof BaseModel

    if (this.$exists) {
      // Run before hooks
      await constructor.runHooks('beforeUpdate', this)
      await constructor.runHooks('beforeSave', this)

      // Update
      await this.performUpdate()

      // Run after hooks
      await constructor.runHooks('afterUpdate', this)
      await constructor.runHooks('afterSave', this)
    } else {
      // Run before hooks
      await constructor.runHooks('beforeCreate', this)
      await constructor.runHooks('beforeSave', this)

      // Create
      await this.performCreate()

      // Run after hooks
      await constructor.runHooks('afterCreate', this)
      await constructor.runHooks('afterSave', this)
    }

    this.$exists = true
    this.$original = { ...this.$attributes }
    this.$dirty.clear()

    return this
  }

  /**
   * Delete model
   */
  async delete(): Promise<void> {
    const constructor = this.constructor as typeof BaseModel

    await constructor.runHooks('beforeDelete', this)

    if (constructor.softDeletes) {
      this.$attributes.deletedAt = new Date()
      await this.save()
    } else {
      await this.performDelete()
    }

    await constructor.runHooks('afterDelete', this)
  }

  /**
   * Force delete (ignore soft deletes)
   */
  async forceDelete(): Promise<void> {
    await this.performDelete()
  }

  /**
   * Restore soft-deleted model
   */
  async restore(): Promise<void> {
    if (!(this.constructor as typeof BaseModel).softDeletes) {
      throw new Error('Model does not use soft deletes')
    }

    this.$attributes.deletedAt = null
    await this.save()
  }

  /**
   * Refresh model from database
   */
  async refresh(): Promise<this> {
    const constructor = this.constructor as typeof BaseModel
    const primaryKey = constructor.getPrimaryKey()
    const id = this.$attributes[primaryKey]

    if (!id) {
      throw new Error('Cannot refresh unsaved model')
    }

    const fresh = await constructor.find(id)

    if (fresh) {
      this.$attributes = (fresh as any).$attributes
      this.$original = (fresh as any).$original
      this.$exists = (fresh as any).$exists
      this.$dirty.clear()
    }

    return this
  }

  /**
   * Load relationship
   */
  async load(relation: string): Promise<this> {
    // Will be implemented in Relations
    return this
  }

  /**
   * Set relation data
   */
  setRelation(name: string, value: any): void {
    this.$relations[name] = value
  }

  /**
   * Get relation data
   */
  getRelation(name: string): any {
    return this.$relations[name]
  }

  /**
   * Check if relation is loaded
   */
  hasRelation(name: string): boolean {
    return name in this.$relations
  }

  /**
   * Get all relations
   */
  get relations(): Record<string, any> {
    return { ...this.$relations }
  }

  /**
   * Perform create
   */
  protected async performCreate(): Promise<void> {
    // Will be implemented via Database integration
  }

  /**
   * Perform update
   */
  protected async performUpdate(): Promise<void> {
    // Will be implemented via Database integration
  }

  /**
   * Perform delete
   */
  protected async performDelete(): Promise<void> {
    // Will be implemented via Database integration
  }

  /**
   * Check if model is new
   */
  get isNew(): boolean {
    return !this.$exists
  }

  /**
   * Check if model is persisted
   */
  get isPersisted(): boolean {
    return this.$exists
  }

  /**
   * Check if model is dirty
   */
  get isDirty(): boolean {
    return this.$dirty.size > 0
  }

  /**
   * Get dirty attributes
   */
  get dirty(): Record<string, any> {
    const result: Record<string, any> = {}

    this.$dirty.forEach(key => {
      result[key] = this.$attributes[key]
    })

    return result
  }

  /**
   * Get attributes
   */
  get attributes(): Record<string, any> {
    return { ...this.$attributes }
  }

  /**
   * Serialize to JSON
   */
  toJSON(): Record<string, any> {
    return this.serialize()
  }

  /**
   * Serialize model
   */
  serialize(): Record<string, any> {
    const constructor = this.constructor as typeof BaseModel
    const result: Record<string, any> = {}

    // Serialize attributes
    for (const [key, value] of Object.entries(this.$attributes)) {
      if (!constructor.hidden.includes(key)) {
        result[key] = value
      }
    }

    // Serialize loaded relations
    for (const [key, value] of Object.entries(this.$relations)) {
      if (Array.isArray(value)) {
        // For hasMany and manyToMany relations
        result[key] = value.map((item) => {
          return typeof item?.serialize === 'function' ? item.serialize() : item
        })
      } else if (value && typeof value?.serialize === 'function') {
        // For hasOne and belongsTo relations
        result[key] = value.serialize()
      } else {
        result[key] = value
      }
    }

    return result
  }

  /**
   * Validate model
   */
  async validate(): Promise<boolean> {
    // Will be implemented via Database integration
    return true
  }

  /**
   * Get validation errors
   */
  get errors(): Record<string, string[]> {
    return {}
  }
}
