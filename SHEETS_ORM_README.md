# Google Sheets ORM

一個強大的 TypeScript Google Sheets ORM 工具,靈感來自 AdonisJS 6 Lucid,專為 Vue 3 設計。

## 功能特色

✅ **Query Builder** - 流暢的查詢 API
✅ **Active Record** - Model 模式
✅ **Schema 定義** - 完整的型別定義與驗證
✅ **生命週期 Hooks** - beforeCreate, afterSave 等
✅ **軟刪除** - Soft Delete 支援
✅ **關聯關係** - hasMany, belongsTo, hasOne
✅ **TypeScript** - 完整型別安全
✅ **Vue 3 整合** - Plugin 與 Composables
✅ **OAuth2 認證** - 瀏覽器端認證

## 安裝

專案已包含所有必要的套件:

```bash
npm install
```

## 設定

### 1. 創建 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新專案或選擇現有專案
3. 啟用 Google Sheets API
4. 創建 OAuth 2.0 用戶端 ID (Web 應用程式)
5. 設定授權的 JavaScript 來源: `http://localhost:5173`
6. 複製用戶端 ID

### 2. 創建 Google Sheets

1. 前往 [Google Sheets](https://sheets.google.com)
2. 創建新試算表
3. 創建兩個分頁:
   - `users` - 欄位: id, name, email, age, status, role, createdAt, updatedAt, deletedAt
   - `posts` - 欄位: id, userId, title, content, excerpt, tags, published, publishedAt, createdAt, updatedAt, deletedAt
4. 在第一列填入欄位名稱
5. 從網址複製 Spreadsheet ID: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

### 3. 環境變數設定

複製 `.env.example` 為 `.env.local`:

```bash
cp .env.example .env.local
```

編輯 `.env.local`:

```bash
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_SPREADSHEET_ID=your-spreadsheet-id-here
```

## 使用方式

### 基礎設定

```typescript
// src/main.ts
import { createApp } from 'vue'
import { createSheetsORM } from '@/sheets-orm'
import config from '@/config/sheets-orm.config'

const app = createApp(App)
const sheetsORM = createSheetsORM(config)

app.use(sheetsORM)
app.mount('#app')
```

### Schema 定義

```typescript
// src/config/sheets-orm.config.ts
import { Schema, defineConfig } from '@/sheets-orm'

export default defineConfig({
  spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID,

  auth: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly'
    ]
  },

  schemas: {
    users: Schema.create({
      id: Schema.number().primary().autoIncrement(),
      name: Schema.string().required(),
      email: Schema.string().required().unique().email(),
      age: Schema.number().min(0).max(120),
      status: Schema.enum(['active', 'inactive'] as const).default('active'),
      createdAt: Schema.dateTime(),
      updatedAt: Schema.dateTime(),
      deletedAt: Schema.dateTime().nullable()
    })
  }
})
```

### Model 定義

```typescript
// src/models/User.ts
import { BaseModel, column, beforeSave } from '@/sheets-orm'

export default class User extends BaseModel {
  static table = 'users'
  static softDeletes = true

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare email: string

  @column()
  declare age: number

  @column()
  declare status: 'active' | 'inactive'

  @column.dateTime({ autoCreate: true })
  declare createdAt: Date

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: Date

  @column.dateTime()
  declare deletedAt: Date | null

  // Scopes
  static scopes = {
    active: (query) => query.where('status', 'active')
  }

  // Hooks
  @beforeSave()
  async updateTimestamps() {
    if (this.isNew) {
      this.createdAt = new Date()
    }
    this.updatedAt = new Date()
  }
}
```

### 在 Vue 元件中使用

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDatabase, useAuth } from '@/sheets-orm'
import User from '@/models/User'

const { isAuthenticated, signIn, signOut } = useAuth()
const users = ref<User[]>([])

// 載入使用者
const loadUsers = async () => {
  users.value = await User.query()
    .apply('active')
    .orderBy('createdAt', 'desc')
    .get()
}

// 新增使用者
const createUser = async () => {
  const user = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    age: 25
  })
  users.value.unshift(user)
}

// 更新使用者
const updateUser = async (id: number) => {
  const user = await User.find(id)
  if (user) {
    user.age = 26
    await user.save()
  }
}

// 刪除使用者 (軟刪除)
const deleteUser = async (id: number) => {
  const user = await User.find(id)
  if (user) {
    await user.delete() // 設定 deletedAt
  }
}

onMounted(async () => {
  if (isAuthenticated.value) {
    await loadUsers()
  }
})
</script>
```

## API 範例

### Query Builder API

```typescript
// 取得所有資料
const users = await db.from('users').select('*')

// 條件查詢
const activeUsers = await db.from('users')
  .where('status', 'active')
  .where('age', '>', 18)
  .select(['name', 'email'])

// WHERE IN
await db.from('users').whereIn('status', ['active', 'pending'])

// ORDER BY & LIMIT
await db.from('users')
  .orderBy('createdAt', 'desc')
  .limit(10)

// 分頁
const page = await db.from('users')
  .where('status', 'active')
  .paginate(1, 20)

// INSERT
await db.table('users').insert({
  name: 'John Doe',
  email: 'john@example.com'
})

// UPDATE
await db.from('users')
  .where('email', 'john@example.com')
  .update({ age: 26 })

// DELETE
await db.from('users')
  .where('status', 'inactive')
  .delete()
```

### Model API

```typescript
// 查詢所有
const users = await User.all()

// 條件查詢
const activeUsers = await User.query()
  .where('status', 'active')
  .get()

// 使用 Scope
const activeAdults = await User.query()
  .apply('active')
  .where('age', '>=', 18)
  .get()

// 查詢單筆
const user = await User.find(1)
const user = await User.findBy('email', 'john@example.com')
const user = await User.findOrFail(1) // 找不到會拋出錯誤

// 新增
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com'
})

// 批次新增
const users = await User.createMany([
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' }
])

// 更新
const user = await User.find(1)
user.age = 26
await user.save()

// 刪除 (軟刪除)
await user.delete()

// 包含已刪除的資料
const allUsers = await User.query().withTrashed().get()

// 只查詢已刪除的資料
const trashedUsers = await User.query().onlyTrashed().get()

// 永久刪除
await user.forceDelete()

// 恢復
await user.restore()
```

### 驗證

```typescript
try {
  const user = await User.create({
    name: 'John',
    email: 'invalid-email', // 會失敗
    age: -5 // 會失敗
  })
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.messages)
    // {
    //   email: ['Invalid email format'],
    //   age: ['Must be at least 0']
    // }
  }
}
```

### Hooks

```typescript
export default class User extends BaseModel {
  @beforeCreate()
  static setDefaults(user: User) {
    user.status = user.status || 'active'
  }

  @beforeSave()
  async updateTimestamp() {
    this.updatedAt = new Date()
  }

  @afterCreate()
  static async sendWelcomeEmail(user: User) {
    console.log(`Welcome email sent to ${user.email}`)
  }
}
```

## 快取策略

預設採用保守快取策略(不啟用),需要時明確調用:

```typescript
// 啟用快取
const users = await db.from('users')
  .cache() // 快取 5 分鐘 (預設)
  .select('*')

// 自訂快取時間
const users = await User.query()
  .cache(10 * 60 * 1000) // 快取 10 分鐘
  .get()

// 清除快取
db.clearCache() // 清除所有快取
User.clearCache() // 清除 User model 的快取
```

## 進階功能

### Scopes

```typescript
static scopes = {
  active: (query) => query.where('status', 'active'),
  recent: (query) => query.orderBy('createdAt', 'desc').limit(10)
}

// 使用
const activeUsers = await User.query().apply('active').get()
```

### Accessors & Mutators

```typescript
// Accessor
get fullName() {
  return `${this.firstName} ${this.lastName}`
}

// Mutator
set fullName(value: string) {
  const [first, ...last] = value.split(' ')
  this.firstName = first
  this.lastName = last.join(' ')
}
```

### 序列化

```typescript
static hidden = ['password', 'apiToken']

serialize() {
  return {
    ...super.serialize(),
    fullName: this.fullName,
    isActive: this.status === 'active'
  }
}

const user = await User.find(1)
console.log(user.toJSON()) // password 會被排除
```

## 檔案結構

```
src/
├── sheets-orm/              # ORM 核心
│   ├── core/               # Database, Config
│   ├── query/              # QueryBuilder, QueryExecutor
│   ├── model/              # BaseModel, decorators
│   ├── schema/             # Schema, Validator
│   ├── auth/               # GoogleAuth, TokenManager
│   ├── adapters/           # SheetsAdapter
│   ├── utils/              # 工具函數
│   └── index.ts            # 主要匯出
├── config/
│   └── sheets-orm.config.ts  # ORM 配置
├── models/                  # Model 定義
│   ├── User.ts
│   └── Post.ts
└── components/
    └── SheetsORMExample.vue  # 使用範例
```

## 開發指引

### 啟動開發伺服器

```bash
npm run dev
```

### 類型檢查

```bash
npm run type-check
```

### 建置

```bash
npm run build
```

## 注意事項

1. **API 配額**: Google Sheets API 有使用限制(每 100 秒 100 次請求)
2. **效能**: 大量資料建議使用分頁和快取
3. **認證**: 需要用戶登入 Google 帳號授權
4. **ID 管理**: 使用 `MAX(id)+1` 自動遞增,需在 Sheet 中手動設定公式或由程式管理

## 疑難排解

### 無法載入 Google API

確認 `index.html` 中已加入:

```html
<script src="https://apis.google.com/js/api.js"></script>
<script src="https://accounts.google.com/gsi/client"></script>
```

### 認證失敗

1. 檢查 Client ID 是否正確
2. 確認授權的 JavaScript 來源包含當前網域
3. 檢查是否啟用了 Google Sheets API

### 資料無法儲存

1. 確認 Sheet 名稱與 Model 的 `table` 屬性一致
2. 檢查欄位名稱是否匹配
3. 確認用戶有編輯權限

## 授權

MIT

## 作者

Claude & Lu7766
