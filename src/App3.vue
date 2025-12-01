<template>
  <div class="app-container">
    <!-- 頭部區域 -->
    <div class="header">
      <h1>🚀 Google Sheets ORM 完整示範</h1>
      <p>使用 TypeScript + Vue 3 + Google Sheets</p>

      <!-- 認證狀態 -->
      <div class="auth-section">
        <div v-if="!isAuthenticated" class="auth-box">
          <p class="auth-message">請先登入 Google 帳號以存取試算表</p>
          <button @click="handleSignIn" :disabled="isLoading" class="btn btn-primary">
            {{ isLoading ? "登入中..." : "🔐 使用 Google 登入" }}
          </button>
          <p v-if="error" class="error-message">{{ error }}</p>
        </div>
        <div v-else class="auth-box authenticated">
          <span class="success-badge">✓ 已登入</span>
          <button @click="handleSignOut" class="btn btn-secondary btn-sm">登出</button>
        </div>
      </div>
    </div>

    <!-- 主要內容區 (只在已登入時顯示) -->
    <div v-if="isAuthenticated" class="container">
      <!-- 功能選項卡 -->
      <div class="tabs">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="['tab-btn', { active: activeTab === tab.id }]">
          {{ tab.icon }} {{ tab.label }}
        </button>
      </div>

      <!-- Tab 1: 使用者列表 -->
      <div v-show="activeTab === 'users'" class="tab-content">
        <div class="section-header">
          <h2>👥 使用者管理</h2>
          <button @click="showCreateModal = true" class="btn btn-success">➕ 新增使用者</button>
        </div>

        <!-- 篩選器 -->
        <div class="filters">
          <div class="filter-group">
            <label>🔍 搜尋:</label>
            <input v-model="searchKeyword" type="text" placeholder="搜尋姓名或 Email..." class="filter-input" />
          </div>

          <div class="filter-group">
            <label>狀態:</label>
            <select v-model="filterStatus" class="filter-select">
              <option value="">全部</option>
              <option value="active">啟用</option>
              <option value="inactive">停用</option>
              <option value="suspended">停權</option>
              <option value="pending">待審核</option>
            </select>
          </div>

          <div class="filter-group">
            <label>角色:</label>
            <select v-model="filterRole" class="filter-select">
              <option value="">全部</option>
              <option value="admin">管理員</option>
              <option value="moderator">版主</option>
              <option value="user">一般用戶</option>
            </select>
          </div>

          <div class="filter-group">
            <label>會員:</label>
            <select v-model="filterPremium" class="filter-select">
              <option value="">全部</option>
              <option value="true">付費會員</option>
              <option value="false">免費會員</option>
            </select>
          </div>

          <button @click="applyFilters" class="btn btn-primary btn-sm">🔍 套用篩選</button>
          <button @click="resetFilters" class="btn btn-secondary btn-sm">🔄 重置</button>
        </div>

        <!-- 統計資訊 -->
        <div class="stats-bar">
          <div class="stat-item">
            <span class="stat-label">總共:</span>
            <span class="stat-value">{{ stats.total }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">啟用:</span>
            <span class="stat-value text-success">{{ stats.active }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">管理員:</span>
            <span class="stat-value text-primary">{{ stats.admins }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">付費會員:</span>
            <span class="stat-value text-warning">{{ stats.premium }}</span>
          </div>
        </div>

        <!-- 載入中 -->
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>載入中...</p>
        </div>

        <!-- 使用者列表 -->
        <div v-else-if="filteredUsers.length > 0" class="user-grid">
          <div v-for="user in filteredUsers" :key="user.id" class="user-card">
            <div class="user-card-header">
              <div class="user-avatar">
                <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
                <div v-else class="avatar-placeholder">
                  <!-- {{ user.name.charAt(0).toUpperCase() }} -->
                  {{ user.name }}
                </div>
              </div>
              <div class="user-info">
                <h3>{{ user.name }}</h3>
                <p class="user-email">{{ user.email }}</p>
                <div class="user-badges">
                  <span :class="['badge', `badge-${user.status}`]">
                    {{ statusLabels[user.status] }}
                  </span>
                  <span :class="['badge', `badge-${user.role}`]">
                    {{ roleLabels[user.role] }}
                  </span>
                  <span v-if="user.isPremiumActive" class="badge badge-premium"> ⭐ 付費會員 </span>
                </div>
              </div>
            </div>

            <div class="user-card-body">
              <div class="user-detail">
                <span class="label">年齡:</span>
                <span>{{ user.age }} 歲 ({{ user.ageGroup === "adult" ? "成年" : user.ageGroup === "minor" ? "未成年" : "長者" }})</span>
              </div>
              <div class="user-detail">
                <span class="label">方案:</span>
                <span>{{ planLabels[user.plan] }}</span>
              </div>
              <div class="user-detail">
                <span class="label">驗證:</span>
                <span>
                  {{ user.isEmailVerified ? "✅ Email" : "❌ Email" }}
                  {{ user.isPhoneVerified ? "✅ 電話" : "❌ 電話" }}
                </span>
              </div>
              <div class="user-detail">
                <span class="label">資料完整度:</span>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: user.profileCompletion + '%' }"></div>
                  <span class="progress-text">{{ user.profileCompletion }}%</span>
                </div>
              </div>
              <div v-if="user.skills?.length > 0" class="user-detail">
                <span class="label">技能:</span>
                <div class="tags">
                  <span v-for="skill in user.skills.slice(0, 3)" :key="skill" class="tag">
                    {{ skill }}
                  </span>
                  <span v-if="user.skills.length > 3" class="tag"> +{{ user.skills.length - 3 }} </span>
                </div>
              </div>
              <div class="user-detail">
                <span class="label">建立時間:</span>
                <span>{{ formatDate(user.createdAt) }}</span>
              </div>
            </div>

            <div class="user-card-actions">
              <button @click="editUser(user)" class="btn btn-sm btn-primary">✏️ 編輯</button>
              <button @click="viewUserDetails(user)" class="btn btn-sm btn-info">👁️ 詳情</button>
              <button v-if="user.status !== 'active'" @click="activateUser(user.id)" class="btn btn-sm btn-success">✓ 啟用</button>
              <button v-if="user.status === 'active'" @click="deactivateUser(user.id)" class="btn btn-sm btn-warning">⏸ 停用</button>
              <button @click="deleteUser(user.id)" class="btn btn-sm btn-danger">🗑️ 刪除</button>
            </div>
          </div>
        </div>

        <!-- 無結果 -->
        <div v-else class="no-results">
          <h3>😔 找不到使用者</h3>
          <p>試試調整篩選條件</p>
        </div>

        <!-- 分頁 -->
        <div v-if="pagination.total > pagination.perPage" class="pagination">
          <button @click="goToPage(pagination.currentPage - 1)" :disabled="pagination.currentPage === 1" class="btn btn-sm">← 上一頁</button>
          <span class="page-info"> 第 {{ pagination.currentPage }} / {{ pagination.lastPage }} 頁 (共 {{ pagination.total }} 筆) </span>
          <button @click="goToPage(pagination.currentPage + 1)" :disabled="pagination.currentPage === pagination.lastPage" class="btn btn-sm">
            下一頁 →
          </button>
        </div>
      </div>

      <!-- Tab 2: 查詢範例 -->
      <div v-show="activeTab === 'queries'" class="tab-content">
        <div class="section-header">
          <h2>🔍 查詢範例</h2>
        </div>

        <div class="query-examples">
          <div class="example-group">
            <h3>基本查詢</h3>
            <button @click="runQuery('all')" class="example-btn">取得所有使用者</button>
            <button @click="runQuery('first')" class="example-btn">取得第一筆</button>
            <button @click="runQuery('count')" class="example-btn">計算總數</button>
          </div>

          <div class="example-group">
            <h3>使用 Scopes</h3>
            <button @click="runQuery('active')" class="example-btn">只取啟用的</button>
            <button @click="runQuery('admins')" class="example-btn">只取管理員</button>
            <button @click="runQuery('premium')" class="example-btn">只取付費會員</button>
            <button @click="runQuery('adults')" class="example-btn">只取成年人</button>
            <button @click="runQuery('emailVerified')" class="example-btn">Email 已驗證</button>
          </div>

          <div class="example-group">
            <h3>組合查詢</h3>
            <button @click="runQuery('activeAdmins')" class="example-btn">啟用的管理員</button>
            <button @click="runQuery('premiumAdults')" class="example-btn">付費成年會員</button>
            <button @click="runQuery('recentActive')" class="example-btn">最近活躍用戶</button>
          </div>

          <div class="example-group">
            <h3>進階查詢</h3>
            <button @click="runQuery('paginate')" class="example-btn">分頁查詢</button>
            <button @click="runQuery('orderBy')" class="example-btn">排序查詢</button>
            <button @click="runQuery('whereBetween')" class="example-btn">年齡區間</button>
          </div>
        </div>

        <!-- 查詢結果 -->
        <div v-if="queryResult" class="query-result">
          <div class="result-header">
            <h3>查詢結果</h3>
            <button @click="queryResult = null" class="btn btn-sm">✕ 清除</button>
          </div>
          <pre>{{ queryResult }}</pre>
        </div>
      </div>

      <!-- Tab 3: 資料統計 -->
      <div v-show="activeTab === 'stats'" class="tab-content">
        <div class="section-header">
          <h2>📊 資料統計</h2>
          <button @click="loadStatistics" class="btn btn-primary btn-sm">🔄 重新整理</button>
        </div>

        <div class="statistics-grid">
          <div class="stat-card">
            <div class="stat-card-icon">👥</div>
            <div class="stat-card-content">
              <h3>{{ statistics.totalUsers }}</h3>
              <p>總使用者數</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">✅</div>
            <div class="stat-card-content">
              <h3>{{ statistics.activeUsers }}</h3>
              <p>啟用用戶</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">⭐</div>
            <div class="stat-card-content">
              <h3>{{ statistics.premiumUsers }}</h3>
              <p>付費會員</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">👑</div>
            <div class="stat-card-content">
              <h3>{{ statistics.adminUsers }}</h3>
              <p>管理員</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">📧</div>
            <div class="stat-card-content">
              <h3>{{ statistics.emailVerified }}</h3>
              <p>Email 已驗證</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">📱</div>
            <div class="stat-card-content">
              <h3>{{ statistics.phoneVerified }}</h3>
              <p>電話已驗證</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">📅</div>
            <div class="stat-card-content">
              <h3>{{ statistics.avgAge }}</h3>
              <p>平均年齡</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-icon">📈</div>
            <div class="stat-card-content">
              <h3>{{ statistics.avgCompletion }}%</h3>
              <p>平均資料完整度</p>
            </div>
          </div>
        </div>

        <!-- 圖表區域 -->
        <div class="charts-section">
          <div class="chart-card">
            <h3>狀態分佈</h3>
            <div class="bar-chart">
              <div v-for="(value, key) in statistics.statusDistribution" :key="key" class="bar-item">
                <div class="bar-label">{{ statusLabels[key] }}</div>
                <div class="bar-container">
                  <div class="bar-fill" :style="{ width: (value / statistics.totalUsers) * 100 + '%' }"></div>
                  <span class="bar-value">{{ value }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="chart-card">
            <h3>角色分佈</h3>
            <div class="bar-chart">
              <div v-for="(value, key) in statistics.roleDistribution" :key="key" class="bar-item">
                <div class="bar-label">{{ roleLabels[key] }}</div>
                <div class="bar-container">
                  <div class="bar-fill" :style="{ width: (value / statistics.totalUsers) * 100 + '%' }"></div>
                  <span class="bar-value">{{ value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/編輯使用者 Modal -->
    <div v-if="showCreateModal || editingUser" class="modal" @click.self="closeModal">
      <div class="modal-content large">
        <div class="modal-header">
          <h2>{{ editingUser ? "✏️ 編輯使用者" : "➕ 新增使用者" }}</h2>
          <button @click="closeModal" class="btn-close">✕</button>
        </div>

        <form @submit.prevent="submitUser" class="user-form">
          <!-- 基本資訊 -->
          <div class="form-section">
            <h3>基本資訊</h3>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">姓名 *</label>
                <input v-model="userForm.name" type="text" class="form-input" required />
                <span v-if="formErrors.name" class="error-text">{{ formErrors.name[0] }}</span>
              </div>
              <div class="form-group">
                <label class="form-label">使用者名稱 *</label>
                <input v-model="userForm.username" type="text" class="form-input" required />
                <span v-if="formErrors.username" class="error-text">{{ formErrors.username[0] }}</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Email *</label>
                <input v-model="userForm.email" type="email" class="form-input" required />
                <span v-if="formErrors.email" class="error-text">{{ formErrors.email[0] }}</span>
              </div>
              <div class="form-group">
                <label class="form-label">電話</label>
                <input v-model="userForm.phone" type="tel" class="form-input" placeholder="+886912345678" />
                <span v-if="formErrors.phone" class="error-text">{{ formErrors.phone[0] }}</span>
              </div>
            </div>

            <div v-if="!editingUser" class="form-row">
              <div class="form-group">
                <label class="form-label">密碼 *</label>
                <input v-model="userForm.password" type="password" class="form-input" :required="!editingUser" placeholder="至少8個字元" />
                <span v-if="formErrors.password" class="error-text">{{ formErrors.password[0] }}</span>
              </div>
            </div>
          </div>

          <!-- 詳細資訊 -->
          <div class="form-section">
            <h3>詳細資訊</h3>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">年齡</label>
                <input v-model.number="userForm.age" type="number" class="form-input" min="0" max="150" />
                <span v-if="formErrors.age" class="error-text">{{ formErrors.age[0] }}</span>
              </div>
              <div class="form-group">
                <label class="form-label">性別</label>
                <select v-model="userForm.gender" class="form-select">
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                  <option value="other">其他</option>
                  <option value="prefer_not_to_say">不透露</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">角色</label>
                <select v-model="userForm.role" class="form-select">
                  <option value="user">一般用戶</option>
                  <option value="moderator">版主</option>
                  <option value="admin">管理員</option>
                  <option value="guest">訪客</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">狀態</label>
                <select v-model="userForm.status" class="form-select">
                  <option value="active">啟用</option>
                  <option value="inactive">停用</option>
                  <option value="suspended">停權</option>
                  <option value="pending">待審核</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">個人簡介</label>
              <textarea v-model="userForm.bio" class="form-textarea" placeholder="介紹一下自己..." maxlength="1000"></textarea>
            </div>
          </div>

          <!-- 技能與興趣 -->
          <div class="form-section">
            <h3>技能與興趣</h3>
            <div class="form-group">
              <label class="form-label">技能 (用逗號分隔)</label>
              <input v-model="skillsInput" type="text" class="form-input" placeholder="例如: JavaScript, TypeScript, Vue.js" />
            </div>
            <div class="form-group">
              <label class="form-label">興趣 (用逗號分隔)</label>
              <input v-model="interestsInput" type="text" class="form-input" placeholder="例如: 程式設計, 閱讀, 旅遊" />
            </div>
          </div>

          <!-- 會員設定 -->
          <div class="form-section">
            <h3>會員設定</h3>
            <div class="form-row">
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="userForm.isPremium" type="checkbox" />
                  付費會員
                </label>
              </div>
              <div class="form-group" v-if="userForm.isPremium">
                <label class="form-label">方案</label>
                <select v-model="userForm.plan" class="form-select">
                  <option value="basic">基礎</option>
                  <option value="pro">專業</option>
                  <option value="enterprise">企業</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="userForm.isActive" type="checkbox" />
                  帳號啟用
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="userForm.isEmailVerified" type="checkbox" />
                  Email 已驗證
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="userForm.receiveNewsletter" type="checkbox" />
                  接收電子報
                </label>
              </div>
            </div>
          </div>

          <!-- 表單按鈕 -->
          <div class="form-buttons">
            <button type="button" @click="closeModal" class="btn btn-secondary">取消</button>
            <button type="submit" :disabled="submitting" class="btn btn-primary">
              {{ submitting ? "處理中..." : editingUser ? "儲存" : "新增" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 使用者詳情 Modal -->
    <div v-if="viewingUser" class="modal" @click.self="viewingUser = null">
      <div class="modal-content large">
        <div class="modal-header">
          <h2>👁️ 使用者詳情</h2>
          <button @click="viewingUser = null" class="btn-close">✕</button>
        </div>

        <div class="user-details">
          <div class="detail-section">
            <h3>基本資訊</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">ID:</span>
                <span class="detail-value">{{ viewingUser.id }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">姓名:</span>
                <span class="detail-value">{{ viewingUser.name }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ viewingUser.email }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">電話:</span>
                <span class="detail-value">{{ viewingUser.phone || "未設定" }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">使用者名稱:</span>
                <span class="detail-value">{{ viewingUser.username }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">年齡:</span>
                <span class="detail-value">{{ viewingUser.age }} 歲 ({{ viewingUser.ageGroup }})</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">性別:</span>
                <span class="detail-value">{{ viewingUser.gender }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">推薦碼:</span>
                <span class="detail-value">{{ viewingUser.referralCode }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>帳號狀態</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">狀態:</span>
                <span :class="['badge', `badge-${viewingUser.status}`]">
                  {{ statusLabels[viewingUser.status] }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">角色:</span>
                <span :class="['badge', `badge-${viewingUser.role}`]">
                  {{ roleLabels[viewingUser.role] }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">方案:</span>
                <span class="detail-value">{{ planLabels[viewingUser.plan] }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">付費會員:</span>
                <span class="detail-value">{{ viewingUser.isPremium ? "是" : "否" }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Email 驗證:</span>
                <span class="detail-value">{{ viewingUser.isEmailVerified ? "✅ 已驗證" : "❌ 未驗證" }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">電話驗證:</span>
                <span class="detail-value">{{ viewingUser.isPhoneVerified ? "✅ 已驗證" : "❌ 未驗證" }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="viewingUser.skills.length > 0">
            <h3>技能</h3>
            <div class="tags">
              <span v-for="skill in viewingUser.skills" :key="skill" class="tag tag-primary">
                {{ skill }}
              </span>
            </div>
          </div>

          <div class="detail-section" v-if="viewingUser.interests.length > 0">
            <h3>興趣</h3>
            <div class="tags">
              <span v-for="interest in viewingUser.interests" :key="interest" class="tag tag-secondary">
                {{ interest }}
              </span>
            </div>
          </div>

          <div class="detail-section" v-if="viewingUser.bio">
            <h3>個人簡介</h3>
            <p class="bio-text">{{ viewingUser.bio }}</p>
          </div>

          <div class="detail-section">
            <h3>時間記錄</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">建立時間:</span>
                <span class="detail-value">{{ formatDate(viewingUser.createdAt) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">更新時間:</span>
                <span class="detail-value">{{ formatDate(viewingUser.updatedAt) }}</span>
              </div>
              <div class="detail-item" v-if="viewingUser.lastLoginAt">
                <span class="detail-label">最後登入:</span>
                <span class="detail-value">{{ formatDate(viewingUser.lastLoginAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useAuth, ValidationError, type Serialized } from "@/sheets-orm"
import User from "@/models/User"

// ==================== 認證 ====================
const { isAuthenticated, isLoading, error, signIn, signOut } = useAuth()

const handleSignIn = async () => {
  try {
    await signIn()
    await loadUsers()
  } catch (e) {
    console.error("登入失敗:", e)
  }
}

const handleSignOut = async () => {
  await signOut()
  users.value = []
}

// ==================== Tab 管理 ====================
const activeTab = ref("users")
const tabs = [
  { id: "users", label: "使用者列表", icon: "👥" },
  { id: "queries", label: "查詢範例", icon: "🔍" },
  { id: "stats", label: "資料統計", icon: "📊" },
]

// ==================== 使用者資料 ====================
const users = ref<Serialized<User>[]>([])
const loading = ref(false)
const searchKeyword = ref("")
const filterStatus = ref("")
const filterRole = ref("")
const filterPremium = ref("")

// ==================== 分頁 ====================
const pagination = ref({
  currentPage: 1,
  perPage: 12,
  total: 0,
  lastPage: 1,
})

// ==================== Modal 狀態 ====================
const showCreateModal = ref(false)
const editingUser = ref<User | null>(null)
const viewingUser = ref<User | null>(null)
const submitting = ref(false)

// ==================== 表單 ====================
const userForm = ref({
  name: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  age: 18,
  gender: "prefer_not_to_say" as any,
  role: "user" as any,
  status: "active" as any,
  bio: "",
  isPremium: false,
  plan: "free" as any,
  isActive: true,
  isEmailVerified: false,
  receiveNewsletter: true,
})

const skillsInput = ref("")
const interestsInput = ref("")
const formErrors = ref<Record<string, string[]>>({})

// ==================== 標籤映射 ====================
const statusLabels: Record<string, string> = {
  active: "啟用",
  inactive: "停用",
  suspended: "停權",
  pending: "待審核",
}

const roleLabels: Record<string, string> = {
  user: "一般用戶",
  admin: "管理員",
  moderator: "版主",
  guest: "訪客",
}

const planLabels: Record<string, string> = {
  free: "免費",
  basic: "基礎",
  pro: "專業",
  enterprise: "企業",
}

// ==================== 計算屬性 ====================
const filteredUsers = computed(() => {
  let result = users.value

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter((user) => user.name.toLowerCase().includes(keyword) || user.email.toLowerCase().includes(keyword))
  }

  if (filterStatus.value) {
    result = result.filter((user) => user.status === filterStatus.value)
  }

  if (filterRole.value) {
    result = result.filter((user) => user.role === filterRole.value)
  }

  if (filterPremium.value) {
    const isPremium = filterPremium.value === "true"
    result = result.filter((user) => user.isPremium === isPremium)
  }

  return result
})

const stats = computed(() => ({
  total: users.value.length,
  active: users.value.filter((u) => u.status === "active").length,
  admins: users.value.filter((u) => u.role === "admin").length,
  premium: users.value.filter((u) => u.isPremium).length,
}))

// ==================== 統計資料 ====================
const statistics = ref({
  totalUsers: 0,
  activeUsers: 0,
  premiumUsers: 0,
  adminUsers: 0,
  emailVerified: 0,
  phoneVerified: 0,
  avgAge: 0,
  avgCompletion: 0,
  statusDistribution: {} as Record<string, number>,
  roleDistribution: {} as Record<string, number>,
})

// ==================== 查詢結果 ====================
const queryResult = ref<any>(null)

// ==================== 方法 ====================
const loadUsers = async () => {
  loading.value = true
  try {
    users.value = await User.query().preload("posts").orderBy("createdAt", "desc").toArray()
    console.log(users.value)
    console.log("載入使用者:", users.value.length)
  } catch (e) {
    console.error("載入失敗:", e)
  } finally {
    loading.value = false
  }
}

const applyFilters = async () => {
  // 篩選邏輯已在 computed 中處理
  console.log("套用篩選")
}

const resetFilters = () => {
  searchKeyword.value = ""
  filterStatus.value = ""
  filterRole.value = ""
  filterPremium.value = ""
}

const submitUser = async () => {
  submitting.value = true
  formErrors.value = {}

  try {
    const data = {
      ...userForm.value,
      skills: skillsInput.value ? skillsInput.value.split(",").map((s) => s.trim()) : [],
      interests: interestsInput.value ? interestsInput.value.split(",").map((s) => s.trim()) : [],
    }

    if (editingUser.value) {
      // 更新
      const user = await User.find(editingUser.value.id)
      if (user) {
        user.fill(data)
        await user.save()
        await loadUsers()
      }
    } else {
      // 新增
      await User.create(data)
      await loadUsers()
    }

    closeModal()
  } catch (e) {
    if (e instanceof ValidationError) {
      formErrors.value = e.messages
    }
    console.error("儲存失敗:", e)
  } finally {
    submitting.value = false
  }
}

const editUser = (user: User) => {
  editingUser.value = user
  userForm.value = {
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone || "",
    password: "",
    age: user.age,
    gender: user.gender,
    role: user.role,
    status: user.status,
    bio: user.bio || "",
    isPremium: user.isPremium,
    plan: user.plan,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    receiveNewsletter: user.receiveNewsletter,
  }
  skillsInput.value = user.skills.join(", ")
  interestsInput.value = user.interests.join(", ")
}

const viewUserDetails = (user: User) => {
  viewingUser.value = user
}

const activateUser = async (id: number) => {
  const user = await User.find(id)
  if (user) {
    await user.activate()
    await loadUsers()
  }
}

const deactivateUser = async (id: number) => {
  const user = await User.find(id)
  if (user) {
    await user.deactivate()
    await loadUsers()
  }
}

const deleteUser = async (id: number) => {
  if (!confirm("確定要刪除此使用者嗎?")) return

  try {
    await User.query().where("id", id).delete()
    await loadUsers()
  } catch (e) {
    console.error("刪除失敗:", e)
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingUser.value = null
  userForm.value = {
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    age: 18,
    gender: "prefer_not_to_say",
    role: "user",
    status: "active",
    bio: "",
    isPremium: false,
    plan: "free",
    isActive: true,
    isEmailVerified: false,
    receiveNewsletter: true,
  }
  skillsInput.value = ""
  interestsInput.value = ""
  formErrors.value = {}
}

const goToPage = (page: number) => {
  pagination.value.currentPage = page
  loadUsers()
}

const formatDate = (date: Date | null) => {
  if (!date) return "-"
  return new Date(date).toLocaleString("zh-TW")
}

// ==================== 查詢範例 ====================
const runQuery = async (type: string) => {
  try {
    let result: any

    switch (type) {
      case "all":
        result = await User.all()
        break
      case "first":
        result = await User.query().first()
        break
      case "count":
        result = await User.query().count()
        break
      case "active":
        result = await User.query().apply("active").get()
        break
      case "admins":
        result = await User.query().apply("admins").get()
        break
      case "premium":
        result = await User.query().apply("premium").get()
        break
      case "adults":
        result = await User.query().apply("adults").get()
        break
      case "emailVerified":
        result = await User.query().apply("emailVerified").get()
        break
      case "activeAdmins":
        result = await User.query().apply("active").apply("admins").get()
        break
      case "premiumAdults":
        result = await User.query().apply("premium").apply("adults").get()
        break
      case "recentActive":
        result = await User.query().apply("recentlyActive").get()
        break
      case "paginate":
        result = await User.query().paginate(1, 5)
        break
      case "orderBy":
        result = await User.query().orderBy("age", "desc").limit(10).get()
        break
      case "whereBetween":
        result = await User.query().whereBetween("age", [18, 30]).get()
        break
    }

    queryResult.value = JSON.stringify(result, null, 2)
    console.log("查詢結果:", result)
  } catch (e) {
    console.error("查詢失敗:", e)
    queryResult.value = `錯誤: ${e}`
  }
}

// ==================== 統計資料 ====================
const loadStatistics = async () => {
  const allUsers = await User.all()

  statistics.value = {
    totalUsers: allUsers.length,
    activeUsers: allUsers.filter((u) => u.status === "active").length,
    premiumUsers: allUsers.filter((u) => u.isPremium).length,
    adminUsers: allUsers.filter((u) => u.role === "admin").length,
    emailVerified: allUsers.filter((u) => u.isEmailVerified).length,
    phoneVerified: allUsers.filter((u) => u.isPhoneVerified).length,
    avgAge: Math.round(allUsers.reduce((sum, u) => sum + u.age, 0) / allUsers.length),
    avgCompletion: Math.round(allUsers.reduce((sum, u) => sum + u.profileCompletion, 0) / allUsers.length),
    statusDistribution: {
      active: allUsers.filter((u) => u.status === "active").length,
      inactive: allUsers.filter((u) => u.status === "inactive").length,
      suspended: allUsers.filter((u) => u.status === "suspended").length,
      pending: allUsers.filter((u) => u.status === "pending").length,
    },
    roleDistribution: {
      user: allUsers.filter((u) => u.role === "user").length,
      admin: allUsers.filter((u) => u.role === "admin").length,
      moderator: allUsers.filter((u) => u.role === "moderator").length,
      guest: allUsers.filter((u) => u.role === "guest").length,
    },
  }
}

// ==================== 生命週期 ====================
onMounted(async () => {
  if (isAuthenticated.value) {
    await loadUsers()
    await loadStatistics()
  }
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 40px;
}

.header {
  background: white;
  padding: 30px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.header h1 {
  color: #333;
  margin-bottom: 8px;
  font-size: 28px;
}

.header p {
  color: #666;
  font-size: 14px;
}

.auth-section {
  margin-top: 20px;
}

.auth-box {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  text-align: center;
}

.auth-box.authenticated {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
}

.success-badge {
  color: #4caf50;
  font-weight: bold;
  font-size: 16px;
}

.auth-message {
  margin-bottom: 15px;
  color: #666;
}

.error-message {
  color: #f44336;
  margin-top: 10px;
  font-size: 14px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 12px 24px;
  background: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.tab-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tab-content {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.section-header h2 {
  color: #333;
  font-size: 24px;
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.filter-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.filter-input {
  min-width: 200px;
}

.stats-bar {
  display: flex;
  gap: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.stat-label {
  font-size: 13px;
  color: #666;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.text-success {
  color: #4caf50;
}
.text-primary {
  color: #667eea;
}
.text-warning {
  color: #ff9800;
}

.loading-container {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.user-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
}

.user-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.user-card-header {
  display: flex;
  gap: 15px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eaf6 100%);
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  background: white;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 24px;
  font-weight: bold;
}

.user-info h3 {
  color: #333;
  font-size: 18px;
  margin-bottom: 4px;
}

.user-email {
  color: #666;
  font-size: 13px;
  margin-bottom: 8px;
}

.user-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.badge-active {
  background: #e8f5e9;
  color: #2e7d32;
}
.badge-inactive {
  background: #fff3e0;
  color: #e65100;
}
.badge-suspended {
  background: #ffebee;
  color: #c62828;
}
.badge-pending {
  background: #e3f2fd;
  color: #1565c0;
}
.badge-admin {
  background: #f3e5f5;
  color: #6a1b9a;
}
.badge-moderator {
  background: #e1f5fe;
  color: #01579b;
}
.badge-user {
  background: #f5f5f5;
  color: #616161;
}
.badge-premium {
  background: #fff9c4;
  color: #f57f17;
}

.user-card-body {
  padding: 15px 20px;
}

.user-detail {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 13px;
}

.user-detail .label {
  font-weight: 600;
  color: #666;
  min-width: 80px;
}

.progress-bar {
  flex: 1;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.tag {
  padding: 3px 8px;
  background: #e0e0e0;
  border-radius: 8px;
  font-size: 11px;
  color: #666;
}

.tag-primary {
  background: #e3f2fd;
  color: #1976d2;
}
.tag-secondary {
  background: #f3e5f5;
  color: #7b1fa2;
}

.user-card-actions {
  display: flex;
  gap: 8px;
  padding: 15px 20px;
  background: #fafafa;
  border-top: 1px solid #e0e0e0;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-secondary {
  background: #9e9e9e;
  color: white;
}

.btn-success {
  background: #4caf50;
  color: white;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-warning {
  background: #ff9800;
  color: white;
}

.btn-info {
  background: #2196f3;
  color: white;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.no-results h3 {
  font-size: 24px;
  margin-bottom: 10px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 30px;
}

.page-info {
  font-size: 14px;
  color: #666;
}

/* Query Examples */
.query-examples {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.example-group {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.example-group h3 {
  font-size: 16px;
  margin-bottom: 15px;
  color: #333;
}

.example-btn {
  display: block;
  width: 100%;
  padding: 10px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
  text-align: left;
}

.example-btn:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.query-result {
  margin-top: 30px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.query-result pre {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 20px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.6;
}

/* Statistics */
.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 25px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.stat-card-icon {
  font-size: 48px;
}

.stat-card-content h3 {
  font-size: 32px;
  margin-bottom: 5px;
}

.stat-card-content p {
  font-size: 14px;
  opacity: 0.9;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
  margin-top: 30px;
}

.chart-card {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 12px;
}

.chart-card h3 {
  margin-bottom: 20px;
  color: #333;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.bar-label {
  min-width: 80px;
  font-size: 13px;
  color: #666;
}

.bar-container {
  flex: 1;
  height: 30px;
  background: #e0e0e0;
  border-radius: 15px;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s;
  display: flex;
  align-items: center;
  padding-right: 10px;
  justify-content: flex-end;
}

.bar-value {
  color: white;
  font-size: 12px;
  font-weight: bold;
  position: relative;
  z-index: 1;
}

/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  color: #333;
  font-size: 20px;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  color: #666;
}

.btn-close:hover {
  background: #e0e0e0;
}

.user-form {
  padding: 25px;
}

.form-section {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.form-input,
.form-select,
.form-textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.error-text {
  color: #f44336;
  font-size: 12px;
}

.form-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

/* User Details */
.user-details {
  padding: 25px;
}

.detail-section {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-section h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.detail-item {
  display: flex;
  gap: 10px;
}

.detail-label {
  font-weight: 600;
  color: #666;
  min-width: 100px;
  font-size: 13px;
}

.detail-value {
  color: #333;
  font-size: 13px;
}

.bio-text {
  color: #666;
  line-height: 1.6;
  font-size: 14px;
}

@media (max-width: 768px) {
  .user-grid {
    grid-template-columns: 1fr;
  }

  .filters {
    flex-direction: column;
  }

  .filter-input {
    min-width: 100%;
  }

  .statistics-grid,
  .charts-section {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
