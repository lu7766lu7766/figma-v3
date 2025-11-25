<template>
  <!-- 頭部區域 -->
  <div class="header">
    <h1>🚀 部落格練習</h1>
    <p>練習轉換成 Vue.js</p>
    <p>目前共有 0 篇文章</p>
  </div>

  <div class="container">
    <!-- 搜尋區域 -->
    <div class="search-section">
      <input type="text" class="search-input" placeholder="🔍 搜尋文章標題或內容..." />

      <div class="filter-tags">
        <button class="tag-btn active">全部標籤</button>
        <button class="tag-btn">Vue.js</button>
        <button class="tag-btn">JavaScript</button>
        <button class="tag-btn">CSS</button>
        <button class="tag-btn">前端</button>
        <button class="tag-btn">後端</button>
      </div>
    </div>

    <!-- 統計資訊 -->
    <div class="stats">顯示 0 / 0 篇文章</div>

    <!-- 文章列表 -->
    <div class="blog-grid">
      <Card v-for="i in 18" />
    </div>

    <!-- 無結果提示 -->
    <div class="no-results">
      <h3>找不到相關文章</h3>
      <p>試試調整搜尋關鍵字或選擇不同的標籤</p>
    </div>
  </div>

  <!-- 新增文章按鈕 -->
  <button class="add-post-btn">+</button>

  <!-- 新增文章彈窗 -->
  <div class="modal">
    <div class="modal-content">
      <h2>新增文章</h2>
      <form>
        <div class="form-group">
          <label class="form-label">文章標題</label>
          <input type="text" class="form-input" placeholder="輸入文章標題..." />
        </div>
        <div class="form-group">
          <label class="form-label">文章摘要</label>
          <textarea class="form-textarea" placeholder="輸入文章摘要..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">標籤 (用逗號分隔)</label>
          <input type="text" class="form-input" placeholder="例如: Vue.js, 前端, JavaScript" />
        </div>
        <div class="form-buttons">
          <button type="button" class="btn btn-secondary">取消</button>
          <button type="submit" class="btn btn-primary">新增文章</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import Card from "./card.vue"
</script>
