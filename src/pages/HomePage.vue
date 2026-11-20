<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import EntryCard from '@/components/EntryCard.vue'
import SlowDownDialog from '@/components/SlowDownDialog.vue'
import { assetUrl } from '@/lib/format'
import { catalogKey } from '@/lib/keys'
import { pickEntries } from '@/lib/random'
import type { EntrySummary } from '@/types'

const EGG_TAP_THRESHOLD = 5
const EGG_TAP_WINDOW_MS = 2000
const EGG_COOLDOWN_MS = 3000

const catalog = inject(catalogKey)!

const hero = ref<EntrySummary | null>(null)
const picks = ref<EntrySummary[]>([])
const rollId = ref(0)
const eggOpen = ref(false)

let rerollTaps: number[] = []
let eggCooldownUntil = 0

const categoryStats = computed(() => {
  const counts = new Map<string, number>()
  for (const entry of catalog.entries) {
    counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
})

function roll() {
  const picked = pickEntries(catalog.entries, 10, { remember: true })
  hero.value = picked[0] ?? null
  picks.value = picked.slice(1)
  rollId.value += 1
}

function registerRerollTap() {
  const now = performance.now()
  if (now < eggCooldownUntil) return
  rerollTaps = rerollTaps.filter((time) => now - time < EGG_TAP_WINDOW_MS)
  rerollTaps.push(now)
  if (rerollTaps.length < EGG_TAP_THRESHOLD) return
  rerollTaps = []
  eggOpen.value = true
}

function rerollHero() {
  registerRerollTap()
  const exclude = new Set(picks.value.map((entry) => entry.id))
  if (hero.value) exclude.add(hero.value.id)
  const picked = pickEntries(catalog.entries, 1, { exclude, remember: true })
  if (picked[0]) {
    hero.value = picked[0]
    rollId.value += 1
  }
}

watch(eggOpen, (open) => {
  if (!open) eggCooldownUntil = performance.now() + EGG_COOLDOWN_MS
})

onMounted(roll)
</script>

<template>
  <div>
    <section v-if="hero" class="relative h-[64vh] min-h-[480px] max-h-[780px] overflow-hidden">
      <Transition name="hero">
        <img
          :key="`${hero.id}-${rollId}`"
          :src="assetUrl(hero.cover.full)"
          :alt="hero.title"
          class="absolute inset-0 h-full w-full object-cover"
          fetchpriority="high"
        />
      </Transition>
      <div class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-ink-950/5" />

      <div class="absolute inset-x-0 bottom-0">
        <div class="container-page pb-10 sm:pb-14">
          <p class="eyebrow">随机推荐 · {{ hero.category }}</p>
          <h1
            class="mt-3 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl"
          >
            {{ hero.title }}
          </h1>
          <p class="mt-4 max-w-2xl text-sm leading-7 text-mist-300 sm:text-base">
            {{ hero.summary }}
          </p>
          <div class="mt-7 flex flex-wrap items-center gap-3">
            <RouterLink :to="`/entry/${hero.id}`" class="btn-primary">
              查看图集
              <span aria-hidden="true">→</span>
            </RouterLink>
            <button type="button" class="btn-ghost" @click="rerollHero">换一张</button>
            <span class="text-xs text-mist-500">
              {{ hero.photoCount }} 张照片<span v-if="hero.location"> · {{ hero.location }}</span>
            </span>
          </div>
        </div>
      </div>
    </section>

    <section v-else class="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p class="eyebrow">Empty</p>
      <h1 class="mt-3 text-2xl font-medium">还没有图鉴</h1>
      <p class="mt-2 max-w-md text-sm leading-6 text-mist-500">
        运行 <code class="text-sand-300">npm run demo:gen</code> 生成示例数据，或在
        <code class="text-sand-300">content/entries</code> 里添加第一组照片。
      </p>
    </section>

    <div class="border-b border-white/5">
      <div
        class="container-page flex flex-wrap items-center justify-between gap-3 py-4 text-xs text-mist-500"
      >
        <span>共 {{ catalog.stats.entries }} 组图鉴 · {{ catalog.stats.photos }} 张照片</span>
        <span class="text-mist-600">随机抽取，每次打开都不一样</span>
      </div>
    </div>

    <section class="container-page pt-6">
      <div class="flex flex-wrap gap-2">
        <RouterLink to="/browse" class="chip">
          全部图鉴 <span class="text-mist-600">{{ catalog.stats.entries }}</span>
        </RouterLink>
        <RouterLink
          v-for="[name, count] in categoryStats"
          :key="name"
          :to="{ path: '/browse', query: { cat: name } }"
          class="chip"
        >
          {{ name }} <span class="text-mist-600">{{ count }}</span>
        </RouterLink>
      </div>
    </section>

    <section class="container-page py-12 sm:py-16">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="eyebrow">Random picks</p>
          <h2 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">随便看看</h2>
        </div>
        <button type="button" class="btn-ghost" @click="roll">换一批 ↻</button>
      </div>

      <div
        :key="rollId"
        class="mt-8 grid animate-fade-up grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3"
      >
        <EntryCard v-for="entry in picks" :key="entry.id" :entry="entry" />
      </div>
    </section>

    <SlowDownDialog v-model:open="eggOpen" />
  </div>
</template>
