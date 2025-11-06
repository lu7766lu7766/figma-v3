<template>
  <h1>You did it!</h1>
  <HelloWorld />
  <div>count: {{ count }}</div>
  <div>double: {{ double }}</div>
</template>

<script setup lang="ts">
import HelloWorld from "./hello_world.vue"
import { ref, computed } from "vue"
let count = ref(0)
let double = computed(() => count.value * 2)
// let double = computed(function () {
//   return count.value * 2
// })
setInterval(() => {
  count.value++
}, 1000)
</script>

<style scoped></style>
