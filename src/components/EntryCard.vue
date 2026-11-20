<script setup lang="ts">
import type { EntrySummary } from '@/types'
import { assetUrl, formatDate, photoSrcSet } from '@/lib/format'

defineProps<{ entry: EntrySummary }>()
</script>

<template>
  <RouterLink :to="`/entry/${entry.id}`" class="group block">
    <div class="relative aspect-[4/3] overflow-hidden rounded-xl bg-ink-800">
      <img
        :src="assetUrl(entry.cover.thumb)"
        :srcset="photoSrcSet(entry.cover)"
        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
        :alt="entry.title"
        loading="lazy"
        decoding="async"
        class="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100"
      />
      <span
        class="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white/80 backdrop-blur"
      >
        {{ entry.photoCount }} 张
      </span>
    </div>

    <div class="mt-3 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3
          class="truncate text-[15px] font-medium leading-snug text-mist-100 transition-colors group-hover:text-sand-200"
        >
          {{ entry.title }}
        </h3>
        <p class="mt-1 truncate text-xs text-mist-500">
          {{ entry.category }} · {{ formatDate(entry.date) }}
        </p>
      </div>
      <span v-if="entry.location" class="shrink-0 pt-1 text-[11px] text-mist-500">
        {{ entry.location }}
      </span>
    </div>
  </RouterLink>
</template>
