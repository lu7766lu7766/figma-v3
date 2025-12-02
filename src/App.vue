<template>
  <button @click="handleSignIn" v-if="!isAuthenticated">login</button>
  <button @click="handleSignOut" v-else>logout</button>
  <pre>
    {{ users }}
  </pre>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from "vue"
import User from "./models/User"
import { type Serialized, useAuth } from "./sheets-orm"
const users = ref<Serialized<User>[]>([])
const { isAuthenticated, signIn, signOut } = useAuth()
const handleSignIn = async () => {
  try {
    await signIn()
  } catch (e) {
    console.error("登入失敗:", e)
  }
}
const handleSignOut = async () => {
  try {
    await signOut()
  } catch (e) {
    console.error("登出失敗:", e)
  }
}
onMounted(async () => {
  // console.log(await User.query().where("id", 1).update({ name: "John Doe3" }))
  // console.log(await User.create({ username: "444", name: "Jac", email: "2b3x5@example.com", password: "password" }))
  // User.find(3).then((u) => u?.delete())
  // console.log(await User.query().where("id", 3).first()) // (3).then((u) => console.log(u))
  users.value = await User.query().preload("posts").toArray()
})
</script>
