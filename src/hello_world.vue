<template>
  <h1 class="red">hello world {{ props.value }}</h1>
</template>

<script setup lang="ts">
let props = defineProps(["value"])
</script>

<style scoped>
.red {
  color: blueviolet;
}
</style>
