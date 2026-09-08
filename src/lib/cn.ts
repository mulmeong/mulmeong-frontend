import { extendTailwindMerge } from 'tailwind-merge'

/** @theme에 토큰을 추가하면 여기에도 등록해야 덮어쓰기가 동작한다. */
const colors = [
  'surface',
  'surface-dim',
  'inverse',
  'text-primary',
  'text-secondary',
  'text-inverse',
  'border-default',
  'border-strong',
  'danger',
]

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: colors,
    },
  },
})

export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(classes.filter(Boolean).join(' '))
}
