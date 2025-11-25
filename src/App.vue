<template>
  <h1>You did it!</h1>
  <div v-if="show">
    <div ref="$dom">ref dom</div>
    <HelloWorld v-for="x in 5" :value="x" :parentCount="count" />
  </div>
  <div>count: {{ count }}</div>
  <div>double: {{ double }}</div>
  <div>data: {{ data }}</div>
  <button @click="onPlusClick">+1</button>
  <input type="text" v-model="count" @keyup.enter="onKeyup" />
  <div>
    show:
    <input type="checkbox" v-model="show" />
    {{ show }}
  </div>
  <div v-html="html"></div>
  <div v-for="(item, index) in [10, 20, 30]">{{ item }}-{{ index }}</div>
</template>

<script setup lang="ts">
import HelloWorld from "./hello_world.vue"
import { ref, computed, reactive, watch } from "vue"
let count = ref(0)
let double = computed(() => count.value * 2)
let data = reactive({ count: 0 })
let show = ref(false)
let html = ref("<h1>hello</h1>")
let $dom = ref()
// let double = computed(function () {
//   return count.value * 2
// })
watch([count, data], () => {
  console.log("count or data changed: " + count.value + " " + data.count)
})
// setInterval(() => {
//   count.value++
// }, 1000)
// setInterval(() => {
//   data.count += 2
// }, 1500)
let onPlusClick = () => {
  count.value++
  data.count += 3
  console.log($dom.value)
}
let onKeyup = (e: KeyboardEvent) => {
  console.log(`keypress key:${e.key} code:${e.code} keyCode:${e.keyCode}`)
}
</script>

<style scoped></style>
