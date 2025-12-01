<template>
  <div class="sheets-orm-example">
    <h1>Google Sheets ORM 範例</h1>

    <!-- Authentication Section -->
    <section class="auth-section">
      <h2>認證</h2>
      <div v-if="!isAuthenticated">
        <button @click="handleSignIn" :disabled="isLoading">
          {{ isLoading ? '登入中...' : '使用 Google 登入' }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
      <div v-else>
        <p class="success">已登入 ✓</p>
        <button @click="handleSignOut">登出</button>
      </div>
    </section>

    <!-- Users Section -->
    <section v-if="isAuthenticated" class="users-section">
      <h2>使用者列表</h2>

      <!-- Loading State -->
      <div v-if="loading">載入中...</div>

      <!-- User List -->
      <div v-else>
        <div class="user-stats">
          共 {{ users.length }} 位使用者
        </div>

        <table class="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>姓名</th>
              <th>Email</th>
              <th>年齡</th>
              <th>狀態</th>
              <th>角色</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.age }}</td>
              <td>
                <span :class="['status', user.status]">
                  {{ user.status === 'active' ? '啟用' : '停用' }}
                </span>
              </td>
              <td>{{ user.role === 'admin' ? '管理員' : '一般用戶' }}</td>
              <td>
                <button @click="deleteUser(user.id)" class="btn-delete">刪除</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Create User Form -->
        <div class="create-form">
          <h3>新增使用者</h3>
          <form @submit.prevent="createUser">
            <div class="form-group">
              <label>姓名:</label>
              <input v-model="form.name" required />
              <span v-if="formErrors.name" class="error">{{ formErrors.name[0] }}</span>
            </div>
            <div class="form-group">
              <label>Email:</label>
              <input v-model="form.email" type="email" required />
              <span v-if="formErrors.email" class="error">{{ formErrors.email[0] }}</span>
            </div>
            <div class="form-group">
              <label>年齡:</label>
              <input v-model.number="form.age" type="number" required />
              <span v-if="formErrors.age" class="error">{{ formErrors.age[0] }}</span>
            </div>
            <div class="form-group">
              <label>角色:</label>
              <select v-model="form.role">
                <option value="user">一般用戶</option>
                <option value="admin">管理員</option>
              </select>
            </div>
            <button type="submit" :disabled="creating">
              {{ creating ? '新增中...' : '新增使用者' }}
            </button>
          </form>
        </div>
      </div>
    </section>

    <!-- Query Examples Section -->
    <section v-if="isAuthenticated" class="examples-section">
      <h2>查詢範例</h2>
      <div class="examples">
        <button @click="runQueryExample('all')">取得所有使用者</button>
        <button @click="runQueryExample('active')">只取得啟用的使用者</button>
        <button @click="runQueryExample('admins')">只取得管理員</button>
        <button @click="runQueryExample('paginate')">分頁查詢</button>
        <button @click="runQueryExample('count')">計數</button>
      </div>
      <pre v-if="queryResult">{{ queryResult }}</pre>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDatabase, useAuth, ValidationError } from '@/sheets-orm'
import User from '@/models/User'

// Composables
const { isAuthenticated, isLoading, error, signIn, signOut } = useAuth()

// State
const users = ref<User[]>([])
const loading = ref(false)
const creating = ref(false)
const form = ref({
  name: '',
  email: '',
  age: 18,
  role: 'user' as 'user' | 'admin'
})
const formErrors = ref<Record<string, string[]>>({})
const queryResult = ref('')

// Methods
const handleSignIn = async () => {
  try {
    await signIn()
    await loadUsers()
  } catch (e) {
    console.error('Sign in failed:', e)
  }
}

const handleSignOut = async () => {
  await signOut()
  users.value = []
}

const loadUsers = async () => {
  loading.value = true
  try {
    // Using Model API with scope
    users.value = await User.query()
      .apply('active')
      .orderBy('createdAt', 'desc')
      .get()

    console.log('Users loaded:', users.value.length)
  } catch (e) {
    console.error('Failed to load users:', e)
  } finally {
    loading.value = false
  }
}

const createUser = async () => {
  creating.value = true
  formErrors.value = {}

  try {
    const user = await User.create(form.value)
    users.value.unshift(user)

    // Reset form
    form.value = {
      name: '',
      email: '',
      age: 18,
      role: 'user'
    }

    console.log('User created:', user.toJSON())
  } catch (e) {
    if (e instanceof ValidationError) {
      formErrors.value = e.messages
    }
    console.error('Failed to create user:', e)
  } finally {
    creating.value = false
  }
}

const deleteUser = async (id: number) => {
  if (!confirm('確定要刪除此使用者嗎?')) return

  try {
    await User.query().where('id', id).delete()
    users.value = users.value.filter(u => u.id !== id)
    console.log('User deleted:', id)
  } catch (e) {
    console.error('Failed to delete user:', e)
  }
}

const runQueryExample = async (type: string) => {
  try {
    let result: any

    switch (type) {
      case 'all':
        result = await User.all()
        break

      case 'active':
        result = await User.query().apply('active').get()
        break

      case 'admins':
        result = await User.query().apply('admins').get()
        break

      case 'paginate':
        result = await User.query().paginate(1, 5)
        break

      case 'count':
        result = await User.query().count()
        break
    }

    queryResult.value = JSON.stringify(result, null, 2)
    console.log('Query result:', result)
  } catch (e) {
    console.error('Query failed:', e)
    queryResult.value = `Error: ${e}`
  }
}

// Lifecycle
onMounted(async () => {
  if (isAuthenticated.value) {
    await loadUsers()
  }
})
</script>

<style scoped>
.sheets-orm-example {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #333;
  margin-bottom: 30px;
}

h2 {
  color: #666;
  margin: 20px 0 10px;
  border-bottom: 2px solid #eee;
  padding-bottom: 5px;
}

section {
  margin-bottom: 40px;
}

button {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
}

button:hover {
  background: #45a049;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-delete {
  background: #f44336;
  padding: 5px 10px;
  font-size: 12px;
}

.btn-delete:hover {
  background: #da190b;
}

.success {
  color: #4CAF50;
  font-weight: bold;
}

.error {
  color: #f44336;
  font-size: 12px;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.user-table th,
.user-table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

.user-table th {
  background: #f2f2f2;
  font-weight: bold;
}

.user-table tr:hover {
  background: #f5f5f5;
}

.status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.status.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.status.inactive {
  background: #ffebee;
  color: #c62828;
}

.create-form {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.examples {
  margin: 15px 0;
}

pre {
  background: #f4f4f4;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  margin-top: 10px;
}
</style>
