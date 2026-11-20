<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import EntryCard from '@/components/EntryCard.vue'
import Lightbox from '@/components/Lightbox.vue'
import { loadEntry } from '@/lib/catalog'
import { assetUrl, formatDate, photoSrcSet } from '@/lib/format'
import { catalogKey } from '@/lib/keys'
import type { EntryDetail, EntrySummary } from '@/types'

const route = useRoute()
const catalog = inject(catalogKey)!

const id = computed(() => String(route.params.id))
const summary = computed<EntrySummary | undefined>(() =>
  catalog.entries.find((entry) => entry.id === id.value),
)
const index = computed(() =>
  summary.value ? catalog.entries.findIndex((entry) => entry.id === id.value) : -1,
)
const prevEntry = computed(() => (index.value > 0 ? catalog.entries[index.value - 1] : null))
const nextEntry = computed(() =>
  index.value >= 0 && index.value < catalog.entries.length - 1
    ? catalog.entries[index.value + 1]
    : null,
)

const detail = ref<EntryDetail | null>(null)
const loading = ref(false)
const error = ref('')

const photos = computed(() => detail.value?.photos ?? [])
const leadPhoto = computed(() => photos.value[0])
const restPhotos = computed(() => photos.value.slice(1))

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

const related = computed(() => {
  const current = summary.value
  if (!current) return []
  const pool = catalog.entries.filter((entry) => entry.id !== current.id)
  const sameCategory = pool.filter((entry) => entry.category === current.category)
  return (sameCategory.length ? sameCategory : pool).slice(0, 3)
})

function openLightbox(position: number) {
  lightboxIndex.value = position
  lightboxOpen.value = true
}

async function load(value: string) {
  detail.value = null
  error.value = ''
  loading.value = false

  if (!catalog.entries.some((entry) => entry.id === value)) return

  loading.value = true
  try {
    const data = await loadEntry(value)
    if (id.value === value) detail.value = data
  } catch (err) {
    if (id.value === value) {
      error.value = err instanceof Error ? err.message : '图集加载失败'
    }
  } finally {
    if (id.value === value) loading.value = false
  }
}

function retry() {
  void load(id.value)
}

watch(id, load, { immediate: true })
watch(id, () => {
  lightboxOpen.value = false
})
</script>

<template>
  <div v-if="summary" class="pb-16">
    <div class="container-page pt-8">
      <RouterLink
        to="/browse"
        class="inline-flex items-center gap-2 text-xs text-mist-500 transition-colors hover:text-mist-200"
      >
        ← 返回全部图鉴
      </RouterLink>

      <header class="mt-6 max-w-3xl">
        <p class="eyebrow">{{ summary.category }} · {{ formatDate(summary.date) }}</p>
        <h1 class="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {{ summary.title }}
        </h1>
        <p class="mt-4 text-sm leading-7 text-mist-300 sm:text-base">{{ summary.summary }}</p>

        <div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-mist-500">
          <span v-if="summary.location">📍 {{ summary.location }}</span>
          <span>{{ summary.photoCount }} 张照片</span>
        </div>

        <div v-if="summary.tags.length" class="mt-4 flex flex-wrap gap-2">
          <RouterLink
            v-for="tag in summary.tags"
            :key="tag"
            :to="{ path: '/browse', query: { tag } }"
            class="chip"
          >
            #{{ tag }}
          </RouterLink>
        </div>
      </header>

      <p
        v-if="detail?.description"
        class="mt-6 max-w-3xl whitespace-pre-line text-sm leading-7 text-mist-400"
      >
        {{ detail.description }}
      </p>
    </div>

    <div class="container-page mt-8">
      <div v-if="loading" class="grid gap-3 sm:grid-cols-2">
        <div class="aspect-[16/10] animate-pulse rounded-2xl bg-ink-800" />
        <div class="grid grid-cols-2 gap-3">
          <div class="aspect-[4/3] animate-pulse rounded-xl bg-ink-800" />
          <div class="aspect-[4/3] animate-pulse rounded-xl bg-ink-800" />
        </div>
      </div>

      <div
        v-else-if="error"
        class="rounded-2xl border border-white/5 bg-ink-900 px-6 py-12 text-center"
      >
        <p class="text-sm text-mist-300">{{ error }}</p>
        <button type="button" class="btn-ghost mt-4" @click="retry">重试</button>
      </div>

      <template v-else-if="leadPhoto">
        <button
          type="button"
          class="group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-ink-900"
          @click="openLightbox(0)"
        >
          <img
            :src="assetUrl(leadPhoto.full)"
            :alt="leadPhoto.caption || summary.title"
            class="mx-auto max-h-[74vh] w-full object-contain"
            fetchpriority="high"
          />
          <span
            class="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] text-white/70 backdrop-blur"
          >
            1 / {{ photos.length }}
          </span>
        </button>

        <div
          v-if="restPhotos.length"
          class="mt-3 grid gap-3"
          :class="restPhotos.length === 1 ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'"
        >
          <button
            v-for="(photo, position) in restPhotos"
            :key="photo.file"
            type="button"
            class="group relative cursor-zoom-in overflow-hidden rounded-xl bg-ink-800"
            @click="openLightbox(position + 1)"
          >
            <img
              :src="assetUrl(photo.thumb)"
              :srcset="photoSrcSet(photo)"
              sizes="(min-width: 1024px) 30vw, 46vw"
              :alt="photo.caption || `${summary.title} 第 ${position + 2} 张`"
              loading="lazy"
              decoding="async"
              class="aspect-[4/3] h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            <span
              v-if="photo.caption"
              class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-[11px] text-white/75 opacity-0 transition-opacity group-hover:opacity-100"
            >
              {{ photo.caption }}
            </span>
          </button>
        </div>
      </template>
    </div>

    <nav class="container-page mt-14 grid gap-3 border-t border-white/5 pt-8 sm:grid-cols-2">
      <RouterLink
        v-if="prevEntry"
        :to="`/entry/${prevEntry.id}`"
        class="group flex items-center gap-3 rounded-xl border border-white/5 bg-ink-850 p-3 transition-colors hover:border-white/15"
      >
        <img
          :src="assetUrl(prevEntry.cover.thumb)"
          alt=""
          class="h-14 w-20 shrink-0 rounded object-cover"
          loading="lazy"
        />
        <span class="min-w-0">
          <span class="block text-[11px] uppercase tracking-[0.18em] text-mist-600">上一组</span>
          <span class="mt-0.5 block truncate text-sm text-mist-200">{{ prevEntry.title }}</span>
        </span>
      </RouterLink>
      <span v-else />

      <RouterLink
        v-if="nextEntry"
        :to="`/entry/${nextEntry.id}`"
        class="group flex items-center gap-3 rounded-xl border border-white/5 bg-ink-850 p-3 transition-colors hover:border-white/15 sm:flex-row-reverse sm:text-right"
      >
        <img
          :src="assetUrl(nextEntry.cover.thumb)"
          alt=""
          class="h-14 w-20 shrink-0 rounded object-cover"
          loading="lazy"
        />
        <span class="min-w-0 flex-1">
          <span class="block text-[11px] uppercase tracking-[0.18em] text-mist-600">下一组</span>
          <span class="mt-0.5 block truncate text-sm text-mist-200">{{ nextEntry.title }}</span>
        </span>
      </RouterLink>
    </nav>

    <section v-if="related.length" class="container-page mt-14">
      <div class="flex items-end justify-between gap-4">
        <h2 class="text-lg font-medium tracking-tight">同一分类</h2>
        <RouterLink
          :to="{ path: '/browse', query: { cat: summary.category } }"
          class="text-xs text-mist-500 transition-colors hover:text-mist-200"
        >
          查看全部 →
        </RouterLink>
      </div>
      <div class="mt-6 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-3">
        <EntryCard v-for="entry in related" :key="entry.id" :entry="entry" />
      </div>
    </section>

    <Lightbox
      v-model:open="lightboxOpen"
      :photos="photos"
      :start-index="lightboxIndex"
      :title="summary.title"
    />
  </div>

  <div
    v-else
    class="container-page flex min-h-[60vh] flex-col items-center justify-center text-center"
  >
    <p class="font-display text-7xl text-white/10">404</p>
    <h1 class="mt-4 text-2xl font-medium">没有找到这组图鉴</h1>
    <p class="mt-2 text-sm text-mist-500">链接可能已失效，或者条目已被移除。</p>
    <RouterLink to="/browse" class="btn-primary mt-6">浏览全部图鉴</RouterLink>
  </div>
</template>
