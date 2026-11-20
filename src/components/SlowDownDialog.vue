<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const card = ref<HTMLElement | null>(null)

let lastActive: HTMLElement | null = null
let locked = false

function close() {
  emit('update:open', false)
}

function onKeydown(event: KeyboardEvent) {
  if (props.open && event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      lastActive = document.activeElement instanceof HTMLElement ? document.activeElement : null
      if (!locked) {
        lockBodyScroll()
        locked = true
      }
      await nextTick()
      card.value?.focus()
    } else if (locked) {
      unlockBodyScroll()
      locked = false
      lastActive?.focus()
      lastActive = null
    }
  },
)

onMounted(() => window.addEventListener('keydown', onKeydown))

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
    <Transition name="egg">
      <div
        v-if="open"
        class="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          ref="card"
          class="egg-card relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] outline-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="slowdown-title"
          aria-describedby="slowdown-desc"
          tabindex="-1"
        >
          <div class="egg-stripes h-2" aria-hidden="true" />

          <div class="px-6 pb-7 pt-6 sm:px-8 sm:pb-8">
            <span
              class="inline-block -rotate-2 rounded-sm bg-sand-300 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-950"
            >
              The Finals
            </span>

            <p class="eyebrow mt-5">Easter egg · 手速过快</p>
            <h2
              id="slowdown-title"
              class="mt-2 font-display text-4xl leading-tight tracking-tight text-mist-100 sm:text-5xl"
            >
              慢一点
            </h2>
            <p id="slowdown-desc" class="mt-4 text-sm leading-7 text-mist-300">
              慢一点，你赶着去抢提现吗？不如先去玩一会儿
              <span class="font-semibold text-sand-200">THE FINALS</span>，回来再慢慢翻。
            </p>

            <div class="mt-7 flex flex-wrap items-center gap-3">
              <button type="button" class="btn-primary" @click="close">
                操你妈！
              </button>
              <span class="text-xs text-mist-600">Esc 关闭</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
