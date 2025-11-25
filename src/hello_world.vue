<template>
  <div>
    <slot name="head">head conternt</slot>
    <h1 class="red" @click="onClock">hello world {{ props.value }} - {{ props.parentCount }} - {{ subCount }}</h1>
    <slot :subCount="subCount">default content</slot>
  </div>
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
