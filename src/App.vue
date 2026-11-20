<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import SearchOverlay from '@/components/SearchOverlay.vue'

const route = useRoute()
const searchOpen = ref(false)

function isTyping(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null
  return (
    !!element &&
    (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable)
  )
}

function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    searchOpen.value = !searchOpen.value
    return
  }
  if (event.key === '/' && !isTyping(event.target) && !searchOpen.value) {
    event.preventDefault()
    searchOpen.value = true
  }
}

watch(
  () => route.fullPath,
  () => {
    searchOpen.value = false
  },
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader @open-search="searchOpen = true" />
    <main class="flex-1">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <AppFooter />
    <SearchOverlay v-model:open="searchOpen" />
  </div>
</template>
