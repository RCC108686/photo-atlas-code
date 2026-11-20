import type { InjectionKey } from 'vue'
import type { Catalog } from '@/types'

export const catalogKey: InjectionKey<Catalog> = Symbol('catalog')
