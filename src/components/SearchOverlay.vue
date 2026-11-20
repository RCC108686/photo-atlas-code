<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { EntrySummary } from '@/types'
import { assetUrl, formatDate } from '@/lib/format'
import { catalogKey } from '@/lib/keys'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll'
import { createSearch } from '@/lib/search'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const router = useRouter()
const catalog = inject(catalogKey)!
const fuse = createSearch(catalog.entries)

const term = ref('')
const selected = ref(0)
const input = ref<HTMLInputElement | null>(null)
let locked = false

const suggestions = computed(() => catalog.entries.slice(0, 6))
const results = computed<EntrySummary[]>(() => {
  const query = term.value.trim()
  if (!query) return suggestions.value
  return fuse.search(query, { limit: 8 }).map((result) => result.item)
})

function close() {
  emit('update:open', false)
}

function choose(entry: EntrySummary) {
  router.push(`/entry/${entry.id}`)
  close()
}

function viewAll() {
  const query = term.value.trim()
  if (!query) return
  router.push({ path: '/browse', query: { q: query } })
  close()
}

function onInputKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selected.value = Math.min(selected.value + 1, Math.max(results.value.length - 1, 0))
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selected.value = Math.max(selected.value - 1, 0)
  } else if (event.key === 'Enter') {
    const entry = results.value[selected.value]
    if (entry) choose(entry)
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      term.value = ''
      selected.value = 0
      if (!locked) {
        lockBodyScroll()
        locked = true
      }
      await nextTick()
      input.value?.focus()
    } else if (locked) {
      unlockBodyScroll()
      locked = false
    }
  },
)

watch(results, () => {
  selected.value = 0
})

function onWindowKeydown(event: KeyboardEvent) {
  if (props.open && event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

onMounted(() => window.addEventListener('keydown', onWindowKeydown))

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onWindowKeydown)
  if (locked) {
    unlockBodyScroll()
    locked = false
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[80] flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm"
        @click.self="close"
      >
        <div
          class="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="搜索图鉴"
        >
          <div class="flex items-center gap-3 border-b border-white/5 px-4 py-3">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="h-4 w-4 shrink-0 text-mist-500"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" stroke-linecap="round" />
            </svg>
            <input
              ref="input"
              v-model="term"
              type="search"
              placeholder="搜索标题、标签、地点…"
              class="h-9 flex-1 bg-transparent text-sm text-mist-100 outline-none placeholder:text-mist-600"
              autocomplete="off"
              @keydown="onInputKeydown"
            />
            <kbd
              class="hidden rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-mist-600 sm:block"
            >
              Esc
            </kbd>
          </div>

          <div class="max-h-[60vh] overflow-y-auto p-2">
            <p class="px-3 pb-1 pt-2 text-[11px] uppercase tracking-[0.18em] text-mist-600">
              {{ term.trim() ? `搜索结果 · ${results.length}` : '最近收录' }}
            </p>

            <button
              v-for="(entry, index) in results"
              :key="entry.id"
              type="button"
              class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors"
              :class="index === selected ? 'bg-white/10' : 'hover:bg-white/5'"
              @click="choose(entry)"
              @mouseenter="selected = index"
            >
              <img
                :src="assetUrl(entry.cover.thumb)"
                alt=""
                class="h-12 w-16 shrink-0 rounded object-cover"
                loading="lazy"
              />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm text-mist-100">{{ entry.title }}</span>
                <span class="mt-0.5 block truncate text-xs text-mist-500">
                  {{ entry.category }} · {{ entry.location || formatDate(entry.date) }} ·
                  {{ entry.photoCount }} 张
                </span>
              </span>
              <span v-if="index === selected" class="text-[10px] text-mist-600">↵</span>
            </button>

            <p v-if="!results.length" class="px-3 py-10 text-center text-sm text-mist-500">
              没有找到相关图鉴，试试其他关键词
            </p>
          </div>

          <div
            v-if="term.trim()"
            class="flex items-center justify-between border-t border-white/5 px-4 py-2.5"
          >
            <span class="text-[11px] text-mist-600">↑↓ 选择 · Enter 打开</span>
            <button
              type="button"
              class="text-xs text-sand-300 transition-colors hover:text-sand-200"
              @click="viewAll"
            >
              在全部图鉴中查看 →
            </button>
          </div>
          <div v-else class="border-t border-white/5 px-4 py-2.5 text-[11px] text-mist-600">
            输入关键词开始搜索 · Esc 关闭
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
