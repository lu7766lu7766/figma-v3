<template>
  <div>
    {{ users }}
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from "vue"
import User from "./models/User"
import type { Serialized } from "./sheets-orm"
const users = ref<Serialized<User>[]>([])
onMounted(async () => {
  users.value = await User.query().preload("posts").toArray()
})
</script>
