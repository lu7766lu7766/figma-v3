<template>
  <h1 class="red" @click="onClock">hello world {{ props.value }} - {{ props.parentCount }} - {{ subCount }}</h1>
</template>

<script setup lang="ts">
import { ref } from "vue"

let subCount = ref(0)
let props = defineProps(["value", "parentCount"])
let emits = defineEmits(["click"])
let onClock = () => {
  subCount.value++
  emits("click", props.value, subCount.value)
}
</script>

<style scoped>
.red {
  color: blueviolet;
}
</style>
