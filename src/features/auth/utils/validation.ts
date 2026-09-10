import type { ZodType } from 'zod'

import * as schema from '@/features/auth/schemas'

export {
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@/features/auth/schemas'

function firstError(field: ZodType, value: unknown): string | undefined {
  const result = field.safeParse(value)
  return result.success ? undefined : result.error.issues[0]?.message
}

export function validateEmail(value: string) {
  return firstError(schema.email, value)
}

export function validatePassword(value: string) {
  return firstError(schema.password, value)
}

export function validateName(value: string) {
  return firstError(schema.name, value)
}

export function validateBirthDate(value: string) {
  return firstError(schema.birthDate, value)
}

export function validatePhone(value: string) {
  return firstError(schema.phone, value)
}

export function validateNickname(value: string) {
  return firstError(schema.nickname, value)
}

export function validatePasswordConfirm(value: string, password: string): string | undefined {
  if (!value) return '비밀번호를 다시 입력해주세요.'
  if (value !== password) return '비밀번호가 일치하지 않습니다.'
  return undefined
}

/** 입력 중 010-1234-5678 형태로 만든다. */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length < 4) return digits
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}
