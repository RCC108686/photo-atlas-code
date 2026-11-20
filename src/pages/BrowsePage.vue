<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EntryCard from '@/components/EntryCard.vue'
import { catalogKey } from '@/lib/keys'
import { createSearch } from '@/lib/search'

const catalog = inject(catalogKey)!
const route = useRoute()
const router = useRouter()
const fuse = createSearch(catalog.entries)

const PAGE_SIZE = 24

const qLocal = ref(String(route.query.q ?? ''))
const visibleCount = ref(PAGE_SIZE)
let debounceTimer: ReturnType<typeof setTimeout> | undefined

const shownKey = computed(() => `atlas:browse:shown:${route.fullPath}`)

function restoreShownCount() {
  try {
    const saved = Number(sessionStorage.getItem(shownKey.value))
    if (Number.isFinite(saved) && saved > PAGE_SIZE) visibleCount.value = saved
  } catch {
    // 隐私模式下忽略
  }
}

function persistShownCount(value: number) {
  try {
    sessionStorage.setItem(shownKey.value, String(value))
  } catch {
    // 隐私模式下忽略
  }
}

onMounted(restoreShownCount)
watch(visibleCount, persistShownCount)

const activeQuery = computed(() => String(route.query.q ?? '').trim())
const activeCategory = computed(() => String(route.query.cat ?? ''))
const activeTag = computed(() => String(route.query.tag ?? ''))

const sort = computed({
  get: () => String(route.query.sort ?? 'newest'),
  set: (value: string) => setQuery({ sort: value === 'newest' ? undefined : value }),
})

const categoryStats = computed(() => {
  const counts = new Map<string, number>()
  for (const entry of catalog.entries) {
    counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
})

const tagStats = computed(() => {
  const counts = new Map<string, number>()
  for (const entry of catalog.entries) {
    for (const tag of entry.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14)
})

const results = computed(() => {
  const query = activeQuery.value
  let list = query ? fuse.search(query).map((result) => result.item) : catalog.entries.slice()

  if (activeCategory.value) {
    list = list.filter((entry) => entry.category === activeCategory.value)
  }
  if (activeTag.value) {
    list = list.filter((entry) => entry.tags.includes(activeTag.value))
  }

  if (!query) {
    if (sort.value === 'oldest') {
      list.sort((a, b) => a.date.localeCompare(b.date))
    } else if (sort.value === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'))
    } else {
      list.sort((a, b) => b.date.localeCompare(a.date))
    }
  }

  return list
})

const visibleEntries = computed(() => results.value.slice(0, visibleCount.value))
const photoTotal = computed(() => results.value.reduce((sum, entry) => sum + entry.photoCount, 0))
const hasFilter = computed(() => Boolean(activeQuery.value || activeCategory.value || activeTag.value))

function setQuery(patch: Record<string, string | undefined>) {
  const merged: Record<string, string> = {}
  for (const [key, value] of Object.entries({ ...route.query, ...patch })) {
    if (typeof value === 'string' && value) merged[key] = value
  }
  void router.replace({ query: merged })
}

function onSearchInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    setQuery({ q: qLocal.value.trim() || undefined })
  }, 220)
}

function clearFilters() {
  if (debounceTimer) clearTimeout(debounceTimer)
  qLocal.value = ''
  void router.replace({ query: {} })
}

watch(
  () => route.query.q,
  (value) => {
    const next = String(value ?? '')
    if (next !== qLocal.value) qLocal.value = next
  },
)

watch(
  [() => route.query.q, () => route.query.cat, () => route.query.tag, () => route.query.sort],
  () => {
    visibleCount.value = PAGE_SIZE
  },
)

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <div class="container-page py-10 sm:py-14">
    <header class="max-w-3xl">
      <p class="eyebrow">Browse</p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">全部图鉴</h1>
      <p class="mt-3 text-sm text-mist-500">
        共 {{ results.length }} 组 · {{ photoTotal }} 张照片
        <span v-if="hasFilter" class="text-mist-600">（已筛选）</span>
      </p>
    </header>

    <div class="mt-8 space-y-4">
      <div class="flex flex-col gap-3 sm:flex-row">
        <label class="relative flex-1">
          <span class="sr-only">搜索图鉴</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-600"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" stroke-linecap="round" />
          </svg>
          <input
            v-model="qLocal"
            type="search"
            placeholder="搜索标题、标签、地点…"
            class="w-full rounded-full border border-white/10 bg-ink-900 py-3 pl-11 pr-4 text-sm text-mist-100 outline-none transition-colors placeholder:text-mist-600 focus:border-white/25"
            @input="onSearchInput"
          />
        </label>

        <label class="sm:w-40">
          <span class="sr-only">排序</span>
          <select
            v-model="sort"
            class="w-full appearance-none rounded-full border border-white/10 bg-ink-900 px-4 py-3 text-sm text-mist-300 outline-none transition-colors focus:border-white/25"
          >
            <option value="newest">最新优先</option>
            <option value="oldest">最早优先</option>
            <option value="title">按标题</option>
          </select>
        </label>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="chip"
          :class="{ 'chip-active': !activeCategory }"
          @click="setQuery({ cat: undefined })"
        >
          全部
        </button>
        <button
          v-for="[name, count] in categoryStats"
          :key="name"
          type="button"
          class="chip"
          :class="{ 'chip-active': activeCategory === name }"
          @click="setQuery({ cat: activeCategory === name ? undefined : name })"
        >
          {{ name }} <span class="text-mist-600">{{ count }}</span>
        </button>
      </div>

      <div v-if="tagStats.length" class="flex flex-wrap items-center gap-2">
        <span class="text-[11px] uppercase tracking-[0.18em] text-mist-600">标签</span>
        <button
          v-for="[name, count] in tagStats"
          :key="name"
          type="button"
          class="chip"
          :class="{ 'chip-active': activeTag === name }"
          @click="setQuery({ tag: activeTag === name ? undefined : name })"
        >
          #{{ name }} <span class="text-mist-600">{{ count }}</span>
        </button>
      </div>
    </div>

    <div
      v-if="results.length"
      class="mt-8 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <EntryCard v-for="entry in visibleEntries" :key="entry.id" :entry="entry" />
    </div>

    <div v-else class="mt-16 rounded-2xl border border-white/5 bg-ink-900 px-6 py-16 text-center">
      <p class="text-sm text-mist-300">没有匹配的图鉴</p>
      <p class="mt-1 text-xs text-mist-600">换个关键词，或者清除筛选条件</p>
      <button type="button" class="btn-ghost mt-5" @click="clearFilters">清除筛选</button>
    </div>

    <div v-if="results.length > visibleCount" class="mt-12 text-center">
      <button type="button" class="btn-ghost" @click="visibleCount += 24">
        加载更多 · 还有 {{ results.length - visibleCount }} 组
      </button>
    </div>
    <p v-else-if="results.length" class="mt-12 text-center text-xs text-mist-600">
      已显示全部 {{ results.length }} 组
    </p>
  </div>
</template>
