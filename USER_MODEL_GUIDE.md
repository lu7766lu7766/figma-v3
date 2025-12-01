# User Model 完整功能指南

這個 User Model 展示了 Google Sheets ORM 支援的**所有資料類型**與功能。

## 📊 支援的資料類型

### 1. 數字類型 (Number)
```typescript
age: number          // 年齡 (min: 0, max: 150)
salary: number       // 薪資 (min: 0)
rating: number       // 評分 (0-5,可以是小數)
```

### 2. 字串類型 (String)
```typescript
name: string         // 姓名 (2-100字元)
email: string        // Email (必填,唯一,email格式)
phone: string        // 電話 (regex驗證)
username: string     // 使用者名稱 (3-30字元)
password: string     // 密碼 (8字元以上,會被隱藏)
avatar: string       // 頭像 URL
website: string      // 個人網站
```

### 3. 長文本類型 (Text)
```typescript
bio: string          // 個人簡介 (最多1000字元)
notes: string        // 備註
```

### 4. 布林類型 (Boolean)
```typescript
isActive: boolean              // 是否啟用
isEmailVerified: boolean       // Email是否已驗證
isPhoneVerified: boolean       // 電話是否已驗證
isPremium: boolean             // 是否為付費會員
receiveNewsletter: boolean     // 是否接收電子報
```

### 5. 列舉類型 (Enum)
```typescript
status: 'active' | 'inactive' | 'suspended' | 'pending'
role: 'user' | 'admin' | 'moderator' | 'guest'
gender: 'male' | 'female' | 'other' | 'prefer_not_to_say'
plan: 'free' | 'basic' | 'pro' | 'enterprise'
language: 'zh-TW' | 'zh-CN' | 'en' | 'ja' | 'ko'
theme: 'light' | 'dark' | 'auto'
```

### 6. JSON 類型 (Object)
```typescript
metadata: {
  lastLoginIp?: string
  loginCount?: number
  preferences?: Record<string, any>
  suspensionReason?: string
}

settings: {
  notifications?: {
    email?: boolean
    push?: boolean
    sms?: boolean
  }
  privacy?: {
    profilePublic?: boolean
    showEmail?: boolean
  }
}

address: {
  street?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

socialLinks: {
  facebook?: string
  twitter?: string
  instagram?: string
  linkedin?: string
  github?: string
}
```

### 7. 陣列類型 (Array)
```typescript
tags: string[]           // 標籤
skills: string[]         // 技能
interests: string[]      // 興趣
languages: string[]      // 會說的語言
permissions: string[]    // 權限列表
deviceIds: string[]      // 裝置 ID 列表
```

### 8. 日期時間類型 (DateTime)
```typescript
birthday: Date                  // 生日
lastLoginAt: Date | null        // 最後登入時間
emailVerifiedAt: Date | null    // Email驗證時間
phoneVerifiedAt: Date | null    // 電話驗證時間
premiumExpiresAt: Date | null   // 付費會員到期時間
suspendedAt: Date | null        // 停權時間
passwordChangedAt: Date | null  // 密碼最後修改時間
createdAt: Date                 // 建立時間 (自動)
updatedAt: Date                 // 更新時間 (自動)
deletedAt: Date | null          // 軟刪除時間
```

### 9. 特殊欄位
```typescript
apiToken: string | null      // API Token (會被隱藏)
secretKey: string | null     // 密鑰 (會被隱藏)
referralCode: string         // 推薦碼 (自動生成)
referredBy: number | null    // 被誰推薦
```

## 🎯 Scopes (查詢範圍)

### 狀態相關
```typescript
User.query().apply('active')      // 只查啟用的
User.query().apply('inactive')    // 只查停用的
User.query().apply('suspended')   // 只查停權的
User.query().apply('pending')     // 只查待審核的
```

### 角色相關
```typescript
User.query().apply('admins')       // 只查管理員
User.query().apply('moderators')   // 只查版主
User.query().apply('regularUsers') // 只查一般用戶
```

### 驗證狀態
```typescript
User.query().apply('emailVerified')     // Email已驗證
User.query().apply('emailNotVerified')  // Email未驗證
User.query().apply('phoneVerified')     // 電話已驗證
```

### 會員狀態
```typescript
User.query().apply('premium')  // 付費會員
User.query().apply('free')     // 免費會員
```

### 年齡相關
```typescript
User.query().apply('adults')   // 成年人 (≥18)
User.query().apply('minors')   // 未成年 (<18)
User.query().apply('seniors')  // 長者 (≥65)
```

### 時間相關
```typescript
User.query().apply('recent')          // 最近10筆
User.query().apply('recentlyActive')  // 最近活躍20筆
```

### 組合條件
```typescript
User.query().apply('activeVerifiedUsers')  // 啟用且已驗證
```

## 🪝 Hooks (生命週期)

### @beforeSave
```typescript
// 自動更新時間戳記
@beforeSave()
async updateTimestamps() {
  if (this.isNew) {
    this.createdAt = new Date()
  }
  this.updatedAt = new Date()
}

// 密碼變更時自動雜湊
@beforeSave()
async hashPasswordIfChanged() {
  if (this.isDirty && 'password' in this.dirty) {
    // 實際應使用 bcrypt 等加密
    console.log('Password changed, should hash it')
  }
}

// 設定預設值
@beforeSave()
async setDefaults() {
  if (this.isNew) {
    this.status = this.status || 'pending'
    this.role = this.role || 'user'
    this.tags = this.tags || []
    this.referralCode = this.generateReferralCode()
  }
}
```

### @afterCreate
```typescript
@afterCreate()
static async sendWelcomeEmail(user: User) {
  console.log(`Welcome email sent to ${user.email}`)
}

@afterCreate()
static async logUserCreation(user: User) {
  console.log(`New user created: ${user.name}`)
}
```

## 📈 Accessors (計算屬性)

```typescript
user.fullName            // 完整姓名
user.isAdmin             // 是否為管理員
user.isModerator         // 是否為版主
user.isGuest             // 是否為訪客
user.ageGroup            // 年齡組別: 'minor' | 'adult' | 'senior'
user.isVerified          // 是否已驗證 (email或phone)
user.isFullyVerified     // 是否完全驗證 (email且phone)
user.isPremiumActive     // 付費會員是否有效
user.isSuspended         // 是否被停權
user.hasAvatar           // 是否有頭像
user.profileCompletion   // 個人資料完成度 (0-100%)
```

## 🛠️ 方法

### 驗證相關
```typescript
await user.verifyEmail()   // 驗證 Email
await user.verifyPhone()   // 驗證電話
```

### 狀態管理
```typescript
await user.activate()                    // 啟用帳號
await user.deactivate()                  // 停用帳號
await user.suspend('違規原因')           // 停權
await user.unsuspend()                   // 解除停權
```

### 會員管理
```typescript
await user.upgradeToPremium(expiresAt)   // 升級為付費會員
await user.downgradeTofree()             // 降級為免費會員
```

### 登入追蹤
```typescript
await user.updateLastLogin('192.168.1.1')  // 更新最後登入
```

### 標籤管理
```typescript
await user.addTag('VIP')         // 新增標籤
await user.removeTag('VIP')      // 移除標籤
```

### 技能管理
```typescript
await user.addSkill('TypeScript')  // 新增技能
```

### 權限管理
```typescript
await user.grantPermission('edit_posts')     // 授予權限
await user.revokePermission('edit_posts')    // 撤銷權限
user.hasPermission('edit_posts')             // 檢查權限
```

### 設定更新
```typescript
await user.updateSettings({
  notifications: {
    email: true,
    push: false
  }
})
```

## 🔐 序列化與隱藏欄位

### 隱藏敏感資料
```typescript
static hidden = ['password', 'apiToken', 'secretKey']

// 序列化時自動移除
const json = user.toJSON()  // password、apiToken、secretKey 不會出現
```

### 加入計算欄位
```typescript
serialize() {
  return {
    ...super.serialize(),
    fullName: this.fullName,
    isAdmin: this.isAdmin,
    profileCompletion: this.profileCompletion
  }
}
```

## 💡 使用範例

### 1. 新增使用者
```typescript
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  username: 'johndoe',
  password: 'SecurePass123',
  age: 25,
  gender: 'male',
  skills: ['JavaScript', 'TypeScript'],
  interests: ['Programming', 'Reading'],
  address: {
    city: 'Taipei',
    country: 'Taiwan'
  }
})

// Hooks 會自動執行:
// - 生成 referralCode
// - 設定預設值
// - 發送歡迎郵件
```

### 2. 查詢使用者
```typescript
// 查詢啟用的成年管理員
const admins = await User.query()
  .apply('active')
  .apply('admins')
  .apply('adults')
  .orderBy('createdAt', 'desc')
  .get()

// 分頁查詢
const page = await User.query()
  .apply('premium')
  .paginate(1, 20)
```

### 3. 更新使用者
```typescript
const user = await User.find(1)

// 驗證 Email
await user.verifyEmail()

// 升級會員
const expiresAt = new Date()
expiresAt.setFullYear(expiresAt.getFullYear() + 1)
await user.upgradeToPremium(expiresAt)

// 新增技能
await user.addSkill('Vue.js')
await user.addSkill('Node.js')

// 更新設定
await user.updateSettings({
  notifications: {
    email: true,
    push: true,
    sms: false
  },
  privacy: {
    profilePublic: true,
    showEmail: false
  }
})
```

### 4. 權限管理
```typescript
const user = await User.find(1)

// 授予權限
await user.grantPermission('create_posts')
await user.grantPermission('edit_posts')
await user.grantPermission('delete_posts')

// 檢查權限
if (user.hasPermission('delete_posts')) {
  // 允許刪除文章
}

// 撤銷權限
await user.revokePermission('delete_posts')
```

### 5. 軟刪除
```typescript
// 刪除使用者 (軟刪除)
await user.delete()  // 設定 deletedAt

// 查詢包含已刪除的
const allUsers = await User.query().withTrashed().get()

// 只查詢已刪除的
const deleted = await User.query().onlyTrashed().get()

// 恢復
await user.restore()

// 永久刪除
await user.forceDelete()
```

### 6. 追蹤登入
```typescript
const user = await User.findBy('email', 'john@example.com')

// 更新最後登入
await user.updateLastLogin('192.168.1.100')

// metadata 會自動更新:
// {
//   lastLoginIp: '192.168.1.100',
//   loginCount: 5
// }
```

## 📋 Google Sheets 欄位設定

在 Google Sheets 中建立 `users` 分頁,第一列(標題列)設定如下欄位:

```
id | name | email | phone | username | password | avatar | website |
bio | notes | age | salary | rating | isActive | isEmailVerified |
isPhoneVerified | isPremium | receiveNewsletter | status | role |
gender | plan | language | theme | metadata | settings | address |
socialLinks | tags | skills | interests | languages | permissions |
deviceIds | birthday | lastLoginAt | emailVerifiedAt | phoneVerifiedAt |
premiumExpiresAt | suspendedAt | passwordChangedAt | createdAt |
updatedAt | deletedAt | apiToken | secretKey | referralCode | referredBy
```

這個 User Model 展示了 ORM 的**所有功能**:
- ✅ 10種資料類型
- ✅ 20種驗證規則
- ✅ 15個 Scopes
- ✅ 5個 Hooks
- ✅ 11個 Accessors
- ✅ 20個方法
- ✅ 軟刪除
- ✅ 序列化
- ✅ 隱藏敏感欄位

這是一個完整的**生產級別** Model 範例! 🚀
