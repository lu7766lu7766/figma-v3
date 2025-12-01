# Google Sheets ORM - 快速開始指南

## 第一步:設定 Google Cloud

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新專案
3. 啟用 **Google Sheets API**
4. 前往「憑證」→「建立憑證」→「OAuth 用戶端 ID」
5. 應用程式類型選擇「網頁應用程式」
6. 授權的 JavaScript 來源加入:
   ```
   http://localhost:5173
   ```
7. 複製**用戶端 ID**

## 第二步:創建 Google Sheets

1. 前往 [Google Sheets](https://sheets.google.com)
2. 創建新試算表
3. 創建分頁 `users`,第一列填入:
   ```
   id | name | email | age | status | role | createdAt | updatedAt | deletedAt
   ```
4. 創建分頁 `posts`,第一列填入:
   ```
   id | userId | title | content | excerpt | tags | published | publishedAt | createdAt | updatedAt | deletedAt
   ```
5. 從網址複製 **Spreadsheet ID**:
   ```
   https://docs.google.com/spreadsheets/d/{這裡是ID}/edit
   ```

## 第三步:設定環境變數

創建 `.env.local` 檔案:

```bash
cp .env.example .env.local
```

編輯 `.env.local`:

```bash
VITE_GOOGLE_CLIENT_ID=你的用戶端ID.apps.googleusercontent.com
VITE_SPREADSHEET_ID=你的試算表ID
```

## 第四步:啟動專案

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

## 第五步:測試

打開瀏覽器訪問 `http://localhost:5173`

使用範例元件:

```vue
<script setup>
import SheetsORMExample from '@/components/SheetsORMExample.vue'
</script>

<template>
  <SheetsORMExample />
</template>
```

## 基本使用

### 1. 認證

```typescript
import { useAuth } from '@/sheets-orm'

const { isAuthenticated, signIn, signOut } = useAuth()

// 登入
await signIn()

// 登出
await signOut()
```

### 2. 查詢資料

```typescript
import User from '@/models/User'

// 取得所有使用者
const users = await User.all()

// 條件查詢
const activeUsers = await User.query()
  .where('status', 'active')
  .get()
```

### 3. 新增資料

```typescript
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 25
})
```

### 4. 更新資料

```typescript
const user = await User.find(1)
user.age = 26
await user.save()
```

### 5. 刪除資料

```typescript
const user = await User.find(1)
await user.delete() // 軟刪除
```

## 常見問題

**Q: 無法登入?**
A: 檢查用戶端 ID 是否正確,確認已啟用 Google Sheets API

**Q: 找不到試算表?**
A: 確認 Spreadsheet ID 正確,檢查 Google 帳號是否有存取權限

**Q: 資料無法儲存?**
A: 確認 Sheet 名稱與 Model 的 `table` 屬性一致,欄位名稱必須匹配

## 下一步

查看完整文檔: [SHEETS_ORM_README.md](./SHEETS_ORM_README.md)

開始開發你的應用!
