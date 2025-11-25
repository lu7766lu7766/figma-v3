<template>
  <h1 class="red">hello world {{ props.value }} - {{ props.parentCount }}</h1>
</template>

<script setup lang="ts">
let props = defineProps(["value", "parentCount"])
</script>

<style scoped>
.red {
  color: blueviolet;
}
</style>
