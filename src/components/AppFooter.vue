<script setup lang="ts">
import { computed, inject } from 'vue'
import { catalogKey } from '@/lib/keys'

const catalog = inject(catalogKey)!
const allDemo = computed(() => catalog.entries.length > 0 && catalog.entries.every((entry) => entry.demo))
</script>

<template>
  <footer class="mt-20 border-t border-white/5">
    <div
      class="container-page flex flex-col gap-2 py-8 text-xs text-mist-600 sm:flex-row sm:items-center sm:justify-between"
    >
      <p>写实图鉴 · Photo Atlas</p>
      <p class="flex flex-wrap items-center gap-2">
        <span>{{ catalog.stats.entries }} 组图鉴 · {{ catalog.stats.photos }} 张照片 · 本地预览版</span>
        <span v-if="allDemo" class="rounded-full border border-sand-300/30 px-2 py-0.5 text-[10px] text-sand-300">
          示例数据
        </span>
      </p>
    </div>
  </footer>
</template>
