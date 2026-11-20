let lockCount = 0
let previousOverflow = ''

export function lockBodyScroll(): void {
  if (lockCount === 0) {
    previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
  }
  lockCount += 1
}

export function unlockBodyScroll(): void {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.documentElement.style.overflow = previousOverflow
  }
}
