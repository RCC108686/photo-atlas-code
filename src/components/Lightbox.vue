<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Photo } from '@/types'
import { assetUrl } from '@/lib/format'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll'

const props = withDefaults(
  defineProps<{
    open: boolean
    photos: Photo[]
    startIndex?: number
    title?: string
  }>(),
  { startIndex: 0, title: '' },
)

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const current = ref(0)
const closeButton = ref<HTMLButtonElement | null>(null)
const strip = ref<HTMLDivElement | null>(null)

let lastActive: HTMLElement | null = null
let locked = false
let pointerStartX = 0
let pointerStartY = 0

const photo = computed<Photo | undefined>(() => props.photos[current.value])

function clamp(index: number): number {
  if (!props.photos.length) return 0
  return Math.min(Math.max(index, 0), props.photos.length - 1)
}

function preloadNeighbours() {
  for (const offset of [-1, 1]) {
    const index = current.value + offset
    if (index < 0 || index >= props.photos.length) continue
    const image = new Image()
    image.src = assetUrl(props.photos[index].full)
  }
}

function goTo(index: number) {
  current.value = clamp(index)
}

function prev() {
  if (!props.photos.length) return
  current.value = (current.value - 1 + props.photos.length) % props.photos.length
}

function next() {
  if (!props.photos.length) return
  current.value = (current.value + 1) % props.photos.length
}

function close() {
  emit('update:open', false)
}

function onKeydown(event: KeyboardEvent) {
  if (!props.open) return
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    prev()
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    next()
  }
}

function onPointerDown(event: PointerEvent) {
  pointerStartX = event.clientX
  pointerStartY = event.clientY
}

function onPointerUp(event: PointerEvent) {
  const deltaX = event.clientX - pointerStartX
  const deltaY = event.clientY - pointerStartY
  if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > 0) prev()
    else next()
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      current.value = clamp(props.startIndex)
      lastActive = document.activeElement as HTMLElement | null
      if (!locked) {
        lockBodyScroll()
        locked = true
      }
      await nextTick()
      closeButton.value?.focus()
      preloadNeighbours()
    } else if (locked) {
      unlockBodyScroll()
      locked = false
      lastActive?.focus()
    }
  },
)

watch(current, () => {
  preloadNeighbours()
  void nextTick(() => {
    const active = strip.value?.querySelector<HTMLElement>('[data-active="true"]')
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  })
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  if (props.open) {
    current.value = clamp(props.startIndex)
    if (!locked) {
      lockBodyScroll()
      locked = true
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
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
        v-if="open && photo"
        class="fixed inset-0 z-[70] flex flex-col bg-black"
        role="dialog"
        aria-modal="true"
        :aria-label="title || '图片查看器'"
      >
        <header class="flex items-center justify-between gap-4 px-4 py-3 text-xs text-white/60">
          <span class="min-w-0 truncate">{{ title }}</span>
          <span class="shrink-0 tabular-nums">{{ current + 1 }} / {{ photos.length }}</span>
          <button
            ref="closeButton"
            type="button"
            class="shrink-0 rounded-full border border-white/15 px-3 py-1 text-xs text-white/80 transition-colors hover:bg-white/10"
            @click="close"
          >
            关闭 Esc
          </button>
        </header>

        <div
          class="relative flex flex-1 items-center justify-center overflow-hidden"
          @pointerdown="onPointerDown"
          @pointerup="onPointerUp"
        >
          <button
            type="button"
            class="absolute left-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/5 text-2xl text-white/70 transition-colors hover:bg-white/15 hover:text-white"
            aria-label="上一张"
            @click="prev"
          >
            ‹
          </button>
          <img
            :key="photo.file"
            :src="assetUrl(photo.full)"
            :alt="photo.caption || `${title} 第 ${current + 1} 张`"
            class="max-h-full max-w-full select-none object-contain"
            draggable="false"
          />
          <button
            type="button"
            class="absolute right-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/5 text-2xl text-white/70 transition-colors hover:bg-white/15 hover:text-white"
            aria-label="下一张"
            @click="next"
          >
            ›
          </button>
        </div>

        <footer class="px-4 pb-4">
          <p v-if="photo.caption" class="mb-3 text-center text-sm text-white/70">
            {{ photo.caption }}
          </p>
          <div ref="strip" class="mx-auto flex max-w-4xl gap-2 overflow-x-auto pb-1">
            <button
              v-for="(item, index) in photos"
              :key="item.file"
              type="button"
              :data-active="index === current"
              class="h-14 w-20 shrink-0 overflow-hidden rounded border-2 transition-opacity"
              :class="index === current ? 'border-white' : 'border-transparent opacity-40 hover:opacity-90'"
              @click="goTo(index)"
            >
              <img :src="assetUrl(item.thumb)" alt="" class="h-full w-full object-cover" loading="lazy" />
            </button>
          </div>
        </footer>
      </div>
    </Transition>
  </Teleport>
</template>
