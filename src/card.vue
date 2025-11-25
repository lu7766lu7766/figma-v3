<template>
  <div class="blog-card">
    <div class="blog-image">{{ post.title[0] }}</div>
    <div class="blog-content">
      <h3 class="blog-title">{{ post.title }}</h3>
      <p class="blog-excerpt">
        {{ post.excerpt }}
      </p>
      <div class="blog-meta">
        <span class="blog-date">{{ post.date }}</span>
        <span class="blog-read-time">{{ post.readTime }} 分鐘閱讀</span>
      </div>
      <div class="blog-tags">
        <span class="blog-tag" v-for="tag in post.tags">{{ tag }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
let props = defineProps(["post"])
</script>
