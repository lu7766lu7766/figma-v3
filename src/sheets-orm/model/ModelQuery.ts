import { QueryBuilder } from "../query/QueryBuilder"
import type { OrderDirection, Operator, PaginatedResult } from "../types"
import type { ModelConstructor, Serialized } from "../types/ModelTypes"

/**
 * Model Query Builder
 * Extends QueryBuilder with model-specific features
 */
export class ModelQuery<T extends ModelConstructor = ModelConstructor> extends QueryBuilder {
  private modelClass: T
  private preloadRelations: string[] = []
  private withTrashedFlag: boolean = false
  private onlyTrashedFlag: boolean = false

  constructor(modelClass: T) {
    // We'll need to get executor from database
    // For now, pass null and it will be set later
    super(modelClass.table, null as any)
    this.modelClass = modelClass
  }

  /**
   * Apply scope
   */
  apply(scopeName: string): this {
    const scope = this.modelClass.scopes?.[scopeName]

    if (!scope) {
      throw new Error(`Scope "${scopeName}" not found on ${this.modelClass.name}`)
    }

    return scope(this)
  }

  /**
   * Preload relationships
   */
  preload<K extends keyof InstanceType<T> & string>(relation: K): this {
    this.preloadRelations.push(relation)
    return this
  }

  /**
   * Include soft-deleted records
   */
  withTrashed(): this {
    this.withTrashedFlag = true
    return this
  }

  /**
   * Only get soft-deleted records
   */
  onlyTrashed(): this {
    this.onlyTrashedFlag = true
    return this
  }

  /**
   * Override where to support model columns
   */
  where(column: string, operator: Operator | any, value?: any): this {
    super.where(column, operator, value)
    return this
  }

  /**
   * Override orderBy
   */
  orderBy(column: string, direction: OrderDirection = "asc"): this {
    super.orderBy(column, direction)
    return this
  }

  /**
   * Get first result as model instance
   */
  async first(): Promise<any | null> {
    this.applySoftDeleteConstraints()
    const result = await super.first()
    return result ? this.hydrate(result) : null
  }

  /**
   * Get all results as model instances
   */
  async get(): Promise<InstanceType<T>[]> {
    this.applySoftDeleteConstraints()
    const results = await super.get()
    const instances = results.map((result) => this.hydrate(result))

    // Preload relationships
    if (this.preloadRelations.length > 0) {
      await this.eagerLoad(instances)
    }

    return instances
  }

  /**
   * Get paginated results as model instances
   */
  async paginate(page: number = 1, perPage: number = 20): Promise<PaginatedResult<InstanceType<T>>> {
    this.applySoftDeleteConstraints()
    const result = await super.paginate(page, perPage)

    const instances = result.data.map((item) => this.hydrate(item))

    // Preload relationships
    if (this.preloadRelations.length > 0) {
      await this.eagerLoad(instances)
    }

    return {
      data: instances,
      meta: result.meta,
    }
  }

  /**
   * Serialize model instances to plain JSON objects
   */
  private serializeInstances(instances: InstanceType<T>[]): Serialized<InstanceType<T>>[] {
    return instances.map(instance => instance.serialize()) as Serialized<InstanceType<T>>[]
  }

  /**
   * Get all results as plain JSON objects
   * Automatically serializes preloaded relations
   */
  async toArray(): Promise<Serialized<InstanceType<T>>[]> {
    const instances = await this.get()
    return this.serializeInstances(instances)
  }

  /**
   * Get first result as plain JSON object
   * Automatically serializes preloaded relations
   */
  async firstToArray(): Promise<Serialized<InstanceType<T>> | null> {
    const instance = await this.first()
    return instance ? (instance.serialize() as Serialized<InstanceType<T>>) : null
  }

  /**
   * Get paginated results as plain JSON objects
   * Automatically serializes preloaded relations
   */
  async paginateToArray(page: number = 1, perPage: number = 20): Promise<PaginatedResult<Serialized<InstanceType<T>>>> {
    const result = await this.paginate(page, perPage)

    return {
      data: this.serializeInstances(result.data),
      meta: result.meta
    }
  }

  /**
   * Apply soft delete constraints
   */
  private applySoftDeleteConstraints(): void {
    if (!this.modelClass.softDeletes) {
      return
    }

    if (this.onlyTrashedFlag) {
      this.whereNotNull("deletedAt")
    } else if (!this.withTrashedFlag) {
      this.whereNull("deletedAt")
    }
  }

  /**
   * Hydrate plain object into model instance
   */
  private hydrate(data: any): InstanceType<T> {
    const instance = new this.modelClass() as InstanceType<T>

    // Set internal state
    ;(instance as any).$attributes = data
    ;(instance as any).$original = { ...data }
    ;(instance as any).$exists = true
    ;(instance as any).$dirty = new Set()

    return instance
  }

  /**
   * Eager load relationships
   */
  private async eagerLoad(instances: InstanceType<T>[]): Promise<void> {
    for (const relation of this.preloadRelations) {
      // Load relation for all instances
      await this.loadRelation(instances, relation)
    }
  }

  /**
   * Load relation for instances
   */
  private async loadRelation(instances: InstanceType<T>[], relation: string): Promise<void> {
    const metadata = this.modelClass.getRelationMetadata?.()[relation]

    if (!metadata) {
      return
    }

    const RelatedModel = metadata.model() as ModelConstructor

    switch (metadata.type) {
      case 'hasMany': {
        const localKey = metadata.localKey || this.modelClass.getPrimaryKey()
        const ids = Array.from(new Set(instances.map((instance: any) => instance.$attributes[localKey]).filter(Boolean)))

        if (ids.length === 0) return

        const related = await (RelatedModel as any)
          .query()
          .whereIn(metadata.foreignKey, ids)
          .get()

        const grouped = new Map<any, any[]>()
        related.forEach((record: any) => {
          const key = record.$attributes[metadata.foreignKey]
          if (!grouped.has(key)) {
            grouped.set(key, [])
          }
          grouped.get(key)!.push(record)
        })

        instances.forEach((instance: any) => {
          const key = instance.$attributes[localKey]
          const relationData = grouped.get(key) || []
          instance.setRelation(relation, relationData)
        })
        break
      }

      case 'belongsTo': {
        const foreignKey = metadata.foreignKey
        const ownerKey = metadata.ownerKey || (RelatedModel as any).getPrimaryKey?.()
        const ids = Array.from(new Set(instances.map((instance: any) => instance.$attributes[foreignKey]).filter(Boolean)))

        if (ids.length === 0 || !ownerKey) return

        const related = await (RelatedModel as any)
          .query()
          .whereIn(ownerKey, ids)
          .get()

        const lookup = new Map<any, any>()
        related.forEach((record: any) => {
          lookup.set(record.$attributes[ownerKey], record)
        })

        instances.forEach((instance: any) => {
          const key = instance.$attributes[foreignKey]
          instance.setRelation(relation, lookup.get(key) || null)
        })
        break
      }

      case 'hasOne': {
        const localKey = metadata.localKey || this.modelClass.getPrimaryKey()
        const ids = Array.from(new Set(instances.map((instance: any) => instance.$attributes[localKey]).filter(Boolean)))

        if (ids.length === 0) return

        const related = await (RelatedModel as any)
          .query()
          .whereIn(metadata.foreignKey, ids)
          .get()

        const lookup = new Map<any, any>()
        related.forEach((record: any) => {
          lookup.set(record.$attributes[metadata.foreignKey], record)
        })

        instances.forEach((instance: any) => {
          const key = instance.$attributes[localKey]
          instance.setRelation(relation, lookup.get(key) || null)
        })
        break
      }

      case 'manyToMany': {
        const localKey = metadata.localKey || this.modelClass.getPrimaryKey()
        const relatedKey = metadata.ownerKey || (RelatedModel as any).getPrimaryKey?.()
        const ids = Array.from(new Set(instances.map((instance: any) => instance.$attributes[localKey]).filter(Boolean)))

        if (ids.length === 0 || !metadata.pivotTable || !relatedKey) return

        // Step 1: Query pivot table to get relationships using QueryBuilder
        const { QueryBuilder } = require('../query/QueryBuilder')
        const pivotQuery = new QueryBuilder(metadata.pivotTable, this.executor)
        const pivotData = await pivotQuery
          .whereIn(metadata.foreignKey, ids)
          .get()

        // Step 2: Get related IDs from pivot
        const relatedIds = Array.from(new Set(
          pivotData
            .map((pivot: any) => pivot[metadata.relatedPivotKey!])
            .filter(Boolean)
        ))

        if (relatedIds.length === 0) {
          instances.forEach((instance: any) => {
            instance.setRelation(relation, [])
          })
          return
        }

        // Step 3: Query related models
        const related = await (RelatedModel as any)
          .query()
          .whereIn(relatedKey, relatedIds)
          .get()

        // Step 4: Create lookup map from pivot data
        const pivotLookup = new Map<any, any[]>()
        pivotData.forEach((pivot: any) => {
          const key = pivot[metadata.foreignKey]
          if (!pivotLookup.has(key)) {
            pivotLookup.set(key, [])
          }
          pivotLookup.get(key)!.push(pivot[metadata.relatedPivotKey!])
        })

        // Step 5: Create related lookup
        const relatedLookup = new Map<any, any>()
        related.forEach((record: any) => {
          relatedLookup.set(record.$attributes[relatedKey], record)
        })

        // Step 6: Assign relations to instances
        instances.forEach((instance: any) => {
          const key = instance.$attributes[localKey]
          const relatedIds = pivotLookup.get(key) || []
          const relatedRecords = relatedIds
            .map((id: any) => relatedLookup.get(id))
            .filter(Boolean)
          instance.setRelation(relation, relatedRecords)
        })
        break
      }

      default:
        break
    }
  }

  /**
   * Clone query
   */
  clone(): ModelQuery<T> {
    const cloned = new ModelQuery(this.modelClass)
    cloned.state = { ...this.state }
    cloned.whereBuilder = Object.create(Object.getPrototypeOf(this.whereBuilder), Object.getOwnPropertyDescriptors(this.whereBuilder))
    cloned.preloadRelations = [...this.preloadRelations]
    cloned.withTrashedFlag = this.withTrashedFlag
    cloned.onlyTrashedFlag = this.onlyTrashedFlag
    return cloned
  }
}
