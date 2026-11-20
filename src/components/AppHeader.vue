<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const emit = defineEmits<{ 'open-search': [] }>()
const route = useRoute()

const onHome = computed(() => route.name === 'home')
const onBrowse = computed(() => route.name === 'browse')
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-white/5 bg-ink-950/80 backdrop-blur-md">
    <div class="container-page flex h-16 items-center justify-between gap-4">
      <RouterLink to="/" class="flex shrink-0 items-center gap-3">
        <span
          class="grid h-8 w-8 place-items-center rounded-md border border-white/15 bg-white/5 text-[13px] font-semibold"
        >
          毛
        </span>
        <span class="leading-tight">
          <span class="block text-sm font-medium tracking-tight">写实图鉴</span>
          <span class="block text-[10px] uppercase tracking-[0.24em] text-mist-600">Photo Atlas</span>
        </span>
      </RouterLink>

      <nav class="flex items-center gap-0.5 text-sm sm:gap-1">
        <RouterLink
          to="/"
          class="rounded-full px-3 py-1.5 transition-colors"
          :class="onHome ? 'text-mist-100' : 'text-mist-500 hover:text-mist-200'"
        >
          首页
        </RouterLink>
        <RouterLink
          to="/browse"
          class="rounded-full px-3 py-1.5 transition-colors"
          :class="onBrowse ? 'text-mist-100' : 'text-mist-500 hover:text-mist-200'"
        >
          全部
        </RouterLink>

        <button
          type="button"
          class="ml-1 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-mist-400 transition-colors hover:border-white/25 hover:text-mist-100"
          @click="emit('open-search')"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" stroke-linecap="round" />
          </svg>
          <span class="hidden sm:inline">搜索</span>
          <kbd
            class="hidden rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-sans text-[10px] text-mist-500 md:inline"
          >
            Ctrl K
          </kbd>
        </button>
      </nav>
    </div>
  </header>
</template>
