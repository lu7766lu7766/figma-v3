import { BaseModel, column, beforeSave, afterCreate, hasMany } from "@/sheets-orm"
import type { HasMany } from "@/sheets-orm"
// import type { ModelQuery } from "@/sheets-orm"
import Post from "./Post"

/**
 * User Model - 展示各種資料類型
 */
export default class User extends BaseModel {
  static table = "users"
  static softDeletes = true
  static hidden = ["password", "apiToken", "secretKey"]

  // ==================== 數字類型 ====================
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare age: number // 年齡

  @column()
  declare name: string // 姓名

  @column()
  declare email: string // Email

  @column()
  declare username: string // 使用者名稱

  @column()
  declare password: string // 密碼 (會被隱藏)

  @column()
  declare status: "active" | "inactive" | "suspended" | "pending" // 狀態

  @column()
  declare role: "user" | "admin" | "moderator" | "guest" // 角色

  @column.dateTime({ autoCreate: true })
  declare createdAt: Date // 建立時間

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: Date // 更新時間

  @column.dateTime()
  declare deletedAt: Date | null // 軟刪除時間

  @hasMany(() => Post, { foreignKey: "userId" })
  declare posts: HasMany<typeof Post>

  @beforeSave()
  async updateTimestamps() {
    if (this.isNew) {
      this.createdAt = new Date()
    }
    this.updatedAt = new Date()
  }

  @beforeSave()
  async hashPasswordIfChanged() {
    // 如果密碼有變更,這裡可以進行雜湊
    if (this.isDirty && "password" in this.dirty) {
      // 實際專案中應該使用 bcrypt 等加密庫
      console.log("Password changed, should hash it")
    }
  }

  @beforeSave()
  async setDefaults() {
    if (this.isNew) {
      // 設定預設值
      this.status = this.status || "pending"
      this.role = this.role || "user"
      // this.isActive = this.isActive ?? true
      // this.isPremium = this.isPremium ?? false
      // this.isEmailVerified = this.isEmailVerified ?? false
      // this.isPhoneVerified = this.isPhoneVerified ?? false
      // this.receiveNewsletter = this.receiveNewsletter ?? true
      // this.theme = this.theme || "auto"
      // this.language = this.language || "zh-TW"
      // this.plan = this.plan || "free"

      // 設定空陣列
      // this.tags = this.tags || []
      // this.skills = this.skills || []
      // this.interests = this.interests || []
      // this.languages = this.languages || []
      // this.permissions = this.permissions || []
      // this.deviceIds = this.deviceIds || []

      // 設定空物件
      // this.metadata = this.metadata || {}
      // this.settings = this.settings || {}
      // this.address = this.address || {}
      // this.socialLinks = this.socialLinks || {}

      // 生成推薦碼
      // if (!this.referralCode) {
      //   this.referralCode = this.generateReferralCode()
      // }
    }
  }

  serialize() {
    const data = super.serialize()

    return {
      ...data,
      // 加入計算欄位
      // fullName: this.fullName,
      // isAdmin: this.isAdmin,
      // isModerator: this.isModerator,
      // isVerified: this.isVerified,
      // isFullyVerified: this.isFullyVerified,
      // isPremiumActive: this.isPremiumActive,
      // ageGroup: this.ageGroup,
      // profileCompletion: this.profileCompletion,
      // hasAvatar: this.hasAvatar,

      // 移除敏感資訊已在 hidden 中定義
    }
  }
  // @column()
  // declare salary: number // 薪資

  // @column()
  // declare rating: number // 評分 (可以是小數)

  // ==================== 字串類型 ====================

  // @column()
  // declare phone: string // 電話

  // @column()
  // declare avatar: string // 頭像 URL

  // @column()
  // declare website: string // 個人網站

  // ==================== 長文本類型 ====================
  // @column()
  // declare bio: string // 個人簡介

  // @column()
  // declare notes: string // 備註

  // ==================== 布林類型 ====================
  // @column()
  // declare isActive: boolean // 是否啟用

  // @column()
  // declare isEmailVerified: boolean // Email 是否已驗證

  // @column()
  // declare isPhoneVerified: boolean // 電話是否已驗證

  // @column()
  // declare isPremium: boolean // 是否為付費會員

  // @column()
  // declare receiveNewsletter: boolean // 是否接收電子報

  // ==================== 列舉類型 ====================

  // @column()
  // declare gender: "male" | "female" | "other" | "prefer_not_to_say" // 性別

  // @column()
  // declare plan: "free" | "basic" | "pro" | "enterprise" // 訂閱方案

  // @column()
  // declare language: "zh-TW" | "zh-CN" | "en" | "ja" | "ko" // 語言偏好

  // @column()
  // declare theme: "light" | "dark" | "auto" // 主題偏好

  // ==================== JSON 類型 ====================
  // @column()
  // declare metadata: {
  //   lastLoginIp?: string
  //   loginCount?: number
  //   preferences?: Record<string, any>
  //   suspensionReason?: string
  //   [key: string]: any
  // } // 元數據

  // @column()
  // declare settings: {
  //   notifications?: {
  //     email?: boolean
  //     push?: boolean
  //     sms?: boolean
  //   }
  //   privacy?: {
  //     profilePublic?: boolean
  //     showEmail?: boolean
  //   }
  // } // 設定

  // @column()
  // declare address: {
  //   street?: string
  //   city?: string
  //   state?: string
  //   country?: string
  //   postalCode?: string
  //   coordinates?: {
  //     lat: number
  //     lng: number
  //   }
  // } // 地址

  // @column()
  // declare socialLinks: {
  //   facebook?: string
  //   twitter?: string
  //   instagram?: string
  //   linkedin?: string
  //   github?: string
  // } // 社交連結

  // ==================== 陣列類型 ====================
  // @column()
  // declare tags: string[] // 標籤

  // @column()
  // declare skills: string[] // 技能

  // @column()
  // declare interests: string[] // 興趣

  // @column()
  // declare languages: string[] // 會說的語言

  // @column()
  // declare permissions: string[] // 權限列表

  // @column()
  // declare deviceIds: string[] // 裝置 ID 列表

  // // ==================== 日期時間類型 ====================
  // @column.dateTime()
  // declare birthday: Date // 生日

  // @column.dateTime()
  // declare lastLoginAt: Date | null // 最後登入時間

  // @column.dateTime()
  // declare emailVerifiedAt: Date | null // Email 驗證時間

  // @column.dateTime()
  // declare phoneVerifiedAt: Date | null // 電話驗證時間

  // @column.dateTime()
  // declare premiumExpiresAt: Date | null // 付費會員到期時間

  // @column.dateTime()
  // declare suspendedAt: Date | null // 停權時間

  // @column.dateTime()
  // declare passwordChangedAt: Date | null // 密碼最後修改時間

  // ==================== 特殊欄位 ====================
  // @column()
  // declare apiToken: string | null // API Token (會被隱藏)

  // @column()
  // declare secretKey: string | null // 密鑰 (會被隱藏)

  // @column()
  // declare referralCode: string // 推薦碼

  // @column()
  // declare referredBy: number | null // 被誰推薦 (User ID)

  // ==================== 關聯關係 ====================

  // ==================== Scopes ====================
  // static scopes = {
  //   // 狀態相關
  //   active: (query: ModelQuery) => query.where("status", "active"),
  //   inactive: (query: ModelQuery) => query.where("status", "inactive"),
  //   suspended: (query: ModelQuery) => query.where("status", "suspended"),
  //   pending: (query: ModelQuery) => query.where("status", "pending"),

  //   // 角色相關
  //   admins: (query: ModelQuery) => query.where("role", "admin"),
  //   moderators: (query: ModelQuery) => query.where("role", "moderator"),
  //   regularUsers: (query: ModelQuery) => query.where("role", "user"),

  //   // 驗證狀態
  //   emailVerified: (query: ModelQuery) => query.whereNotNull("emailVerifiedAt"),
  //   emailNotVerified: (query: ModelQuery) => query.whereNull("emailVerifiedAt"),
  //   phoneVerified: (query: ModelQuery) => query.whereNotNull("phoneVerifiedAt"),

  //   // 會員狀態
  //   premium: (query: ModelQuery) => query.where("isPremium", true),
  //   free: (query: ModelQuery) => query.where("isPremium", false),

  //   // 年齡相關
  //   adults: (query: ModelQuery) => query.where("age", ">=", 18),
  //   minors: (query: ModelQuery) => query.where("age", "<", 18),
  //   seniors: (query: ModelQuery) => query.where("age", ">=", 65),

  //   // 時間相關
  //   recent: (query: ModelQuery) => query.orderBy("createdAt", "desc").limit(10),
  //   recentlyActive: (query: ModelQuery) => query.whereNotNull("lastLoginAt").orderBy("lastLoginAt", "desc").limit(20),

  //   // 組合條件
  //   activeVerifiedUsers: (query: ModelQuery) => query.where("status", "active").where("isEmailVerified", true).whereNotNull("emailVerifiedAt"),
  // }

  // ==================== Hooks ====================

  // @afterCreate()
  // static async sendWelcomeEmail(user: User) {
  //   console.log(`Welcome email should be sent to ${user.email}`)
  //   // 實際專案中應該發送真實的歡迎郵件
  // }

  // @afterCreate()
  // static async logUserCreation(user: User) {
  //   console.log(`New user created: ${user.name} (${user.email})`)
  // }

  // // ==================== Accessors ====================
  // get fullName(): string {
  //   return this.name
  // }

  // get isAdmin(): boolean {
  //   return this.role === "admin"
  // }

  // get isModerator(): boolean {
  //   return this.role === "moderator"
  // }

  // get isGuest(): boolean {
  //   return this.role === "guest"
  // }

  // get ageGroup(): "minor" | "adult" | "senior" {
  //   if (this.age < 18) return "minor"
  //   if (this.age >= 65) return "senior"
  //   return "adult"
  // }

  // get isVerified(): boolean {
  //   return this.isEmailVerified || this.isPhoneVerified
  // }

  // get isFullyVerified(): boolean {
  //   return this.isEmailVerified && this.isPhoneVerified
  // }

  // get isPremiumActive(): boolean {
  //   if (!this.isPremium) return false
  //   if (!this.premiumExpiresAt) return true
  //   return new Date() < this.premiumExpiresAt
  // }

  // get isSuspended(): boolean {
  //   return this.status === "suspended" && this.suspendedAt !== null
  // }

  // get hasAvatar(): boolean {
  //   return !!this.avatar
  // }

  // get profileCompletion(): number {
  //   const fields = [
  //     this.name,
  //     this.email,
  //     this.phone,
  //     this.avatar,
  //     this.bio,
  //     this.birthday,
  //     // this.address.city,
  //     // this.address.country
  //   ]

  //   const completed = fields.filter((field) => field !== null && field !== undefined && field !== "").length
  //   return Math.round((completed / fields.length) * 100)
  // }

  // // ==================== Methods ====================
  // async verifyEmail(): Promise<this> {
  //   this.isEmailVerified = true
  //   this.emailVerifiedAt = new Date()
  //   return this.save()
  // }

  // async verifyPhone(): Promise<this> {
  //   this.isPhoneVerified = true
  //   this.phoneVerifiedAt = new Date()
  //   return this.save()
  // }

  // async activate(): Promise<this> {
  //   this.status = "active"
  //   this.isActive = true
  //   return this.save()
  // }

  // async deactivate(): Promise<this> {
  //   this.status = "inactive"
  //   this.isActive = false
  //   return this.save()
  // }

  // async suspend(reason?: string): Promise<this> {
  //   this.status = "suspended"
  //   this.suspendedAt = new Date()
  //   if (reason) {
  //     this.metadata = {
  //       ...this.metadata,
  //       suspensionReason: reason,
  //     }
  //   }
  //   return this.save()
  // }

  // async unsuspend(): Promise<this> {
  //   this.status = "active"
  //   this.suspendedAt = null
  //   return this.save()
  // }

  // async upgradeToPremium(expiresAt?: Date): Promise<this> {
  //   this.isPremium = true
  //   this.premiumExpiresAt = expiresAt || null
  //   this.plan = "pro"
  //   return this.save()
  // }

  // async downgradeTofree(): Promise<this> {
  //   this.isPremium = false
  //   this.premiumExpiresAt = null
  //   this.plan = "free"
  //   return this.save()
  // }

  // async updateLastLogin(ip?: string): Promise<this> {
  //   this.lastLoginAt = new Date()

  //   if (ip) {
  //     const currentMetadata = this.metadata || {}
  //     this.metadata = {
  //       ...currentMetadata,
  //       lastLoginIp: ip,
  //       loginCount: (currentMetadata.loginCount || 0) + 1,
  //     }
  //   }

  //   return this.save()
  // }

  // async addTag(tag: string): Promise<this> {
  //   if (!this.tags.includes(tag)) {
  //     this.tags.push(tag)
  //     return this.save()
  //   }
  //   return this
  // }

  // async removeTag(tag: string): Promise<this> {
  //   this.tags = this.tags.filter((t) => t !== tag)
  //   return this.save()
  // }

  // async addSkill(skill: string): Promise<this> {
  //   if (!this.skills.includes(skill)) {
  //     this.skills.push(skill)
  //     return this.save()
  //   }
  //   return this
  // }

  // async grantPermission(permission: string): Promise<this> {
  //   if (!this.permissions.includes(permission)) {
  //     this.permissions.push(permission)
  //     return this.save()
  //   }
  //   return this
  // }

  // async revokePermission(permission: string): Promise<this> {
  //   this.permissions = this.permissions.filter((p) => p !== permission)
  //   return this.save()
  // }

  // hasPermission(permission: string): boolean {
  //   return this.permissions.includes(permission) || this.role === "admin"
  // }

  // async updateSettings(settings: Partial<typeof this.settings>): Promise<this> {
  //   this.settings = {
  //     ...this.settings,
  //     ...settings,
  //   }
  //   return this.save()
  // }

  // private generateReferralCode(): string {
  //   const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  //   let code = ""
  //   for (let i = 0; i < 8; i++) {
  //     code += chars.charAt(Math.floor(Math.random() * chars.length))
  //   }
  //   return code
  // }

  // ==================== Serialization ====================
}
