import { Schema, defineConfig } from "@/sheets-orm"

/**
 * Google Sheets ORM Configuration
 * 展示所有支援的資料類型與驗證規則
 */
export default defineConfig({
  // Google Sheets Spreadsheet ID
  spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,

  // Dual Authentication (API Key + OAuth2)
  auth: {
    // API Key for read-only access to public sheets (fast, no login required)
    apiKey: import.meta.env.VITE_API_KEY,

    // OAuth2 for write operations (requires user login)
    oauth: {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.readonly"
      ],
    },

    // Preferred authentication mode (defaults to 'api_key')
    preferredMode: 'api_key' as const,
  },

  // Schema definitions for each sheet/table
  schemas: {
    // Users table schema - 完整的資料類型展示
    users: Schema.create({
      // ==================== 數字類型 ====================
      id: Schema.number().primary().autoIncrement(),
      age: Schema.number().min(0).max(150),
      // salary: Schema.number().min(0),
      // rating: Schema.number().min(0).max(5),

      // ==================== 字串類型 ====================
      name: Schema.string().required().minLength(2).maxLength(100),
      email: Schema.string().required().unique().email(),
      // phone: Schema.string().pattern(/^\+?[0-9]{10,15}$/),
      username: Schema.string().required().minLength(3).maxLength(30),
      password: Schema.string().required().minLength(8),
      // avatar: Schema.string(),
      // website: Schema.string(),

      // ==================== 長文本類型 ====================
      // bio: Schema.text().maxLength(1000),
      // notes: Schema.text(),

      // ==================== 布林類型 ====================
      // isActive: Schema.boolean().default(true),
      // isEmailVerified: Schema.boolean().default(false),
      // isPhoneVerified: Schema.boolean().default(false),
      // isPremium: Schema.boolean().default(false),
      // receiveNewsletter: Schema.boolean().default(true),

      // ==================== 列舉類型 ====================
      status: Schema.enum(["active", "inactive", "suspended", "pending"] as const).default("pending"),
      role: Schema.enum(["user", "admin", "moderator", "guest"] as const).default("user"),
      // gender: Schema.enum(["male", "female", "other", "prefer_not_to_say"] as const),
      // plan: Schema.enum(["free", "basic", "pro", "enterprise"] as const).default("free"),
      // language: Schema.enum(["zh-TW", "zh-CN", "en", "ja", "ko"] as const).default("zh-TW"),
      // theme: Schema.enum(["light", "dark", "auto"] as const).default("auto"),

      // ==================== JSON 類型 ====================
      // metadata: Schema.json().nullable(),
      // settings: Schema.json().nullable(),
      // address: Schema.json().nullable(),
      // socialLinks: Schema.json().nullable(),

      // ==================== 陣列類型 ====================
      // tags: Schema.array(Schema.string()).default([]),
      // skills: Schema.array(Schema.string()).default([]),
      // interests: Schema.array(Schema.string()).default([]),
      // languages: Schema.array(Schema.string()).default([]),
      // permissions: Schema.array(Schema.string()).default([]),
      // deviceIds: Schema.array(Schema.string()).default([]),

      // ==================== 日期時間類型 ====================
      // birthday: Schema.dateTime().nullable(),
      // lastLoginAt: Schema.dateTime().nullable(),
      // emailVerifiedAt: Schema.dateTime().nullable(),
      // phoneVerifiedAt: Schema.dateTime().nullable(),
      // premiumExpiresAt: Schema.dateTime().nullable(),
      // suspendedAt: Schema.dateTime().nullable(),
      // passwordChangedAt: Schema.dateTime().nullable(),
      createdAt: Schema.dateTime(),
      updatedAt: Schema.dateTime(),
      deletedAt: Schema.dateTime().nullable(),

      // ==================== 特殊欄位 ====================
      // apiToken: Schema.string().nullable(),
      // secretKey: Schema.string().nullable(),
      // referralCode: Schema.string().required(),
      // referredBy: Schema.number().nullable(),
    }),

    // Posts table schema
    posts: Schema.create({
      id: Schema.number().primary().autoIncrement(),
      userId: Schema.number().required(),
      title: Schema.string().required().maxLength(200),
      content: Schema.text(),
      excerpt: Schema.string().maxLength(500),
      tags: Schema.array(Schema.string()),
      published: Schema.boolean().default(false),
      publishedAt: Schema.dateTime().nullable(),
      createdAt: Schema.dateTime(),
      updatedAt: Schema.dateTime(),
      deletedAt: Schema.dateTime().nullable(),
    }),
  },

  // Cache configuration (conservative caching)
  cache: {
    enabled: false, // Only cache when explicitly requested with .cache()
    ttl: 5 * 60 * 1000, // 5 minutes
  },

  // Debug mode
  debug: import.meta.env.DEV,

  // Pagination defaults
  pagination: {
    perPage: 20,
    maxPerPage: 100,
  },
})
