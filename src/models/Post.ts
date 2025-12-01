import { BaseModel, column, beforeSave, belongsTo } from '@/sheets-orm'
import type { BelongsTo } from '@/sheets-orm'
import type { ModelQuery } from '@/sheets-orm'
import User from './User'

/**
 * Post Model
 */
export default class Post extends BaseModel {
  static table = 'posts'
  static softDeletes = true

  // Columns
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare title: string

  @column()
  declare content: string

  @column()
  declare excerpt: string

  @column()
  declare tags: string[]

  @column()
  declare published: boolean

  @column()
  declare publishedAt: Date | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: Date

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: Date

  @column.dateTime()
  declare deletedAt: Date | null

  // Relationships
  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  // Scopes
  static scopes = {
    published: (query: ModelQuery) => query.where('published', true),
    draft: (query: ModelQuery) => query.where('published', false),
    recent: (query: ModelQuery) => query.orderBy('createdAt', 'desc').limit(10)
  }

  // Hooks
  @beforeSave()
  async updateTimestamps() {
    if (this.isNew) {
      this.createdAt = new Date()
    }
    this.updatedAt = new Date()

    // Auto-set publishedAt when publishing
    if (this.published && !this.publishedAt) {
      this.publishedAt = new Date()
    }
  }

  // Accessors
  get isPublished(): boolean {
    return this.published
  }

  get isDraft(): boolean {
    return !this.published
  }

  // Methods
  async publish(): Promise<this> {
    this.published = true
    this.publishedAt = new Date()
    return this.save()
  }

  async unpublish(): Promise<this> {
    this.published = false
    this.publishedAt = null
    return this.save()
  }

  // Serialization
  serialize() {
    return {
      ...super.serialize(),
      isPublished: this.isPublished,
      isDraft: this.isDraft
    }
  }
}
