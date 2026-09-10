/** 폼 라이브러리 미확정이라 순수 함수로 둔다. 규칙은 백엔드와 맞출 것 (AUTH-07). */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BIRTH_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const PASSWORD_MIN_LENGTH = 8
export const NICKNAME_MIN_LENGTH = 2
export const NICKNAME_MAX_LENGTH = 12

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return '이메일을 입력해주세요.'
  if (!EMAIL_PATTERN.test(value)) return '이메일 형식이 올바르지 않습니다.'
  return undefined
}

export function validatePassword(value: string): string | undefined {
  if (!value) return '비밀번호를 입력해주세요.'
  if (value.length < PASSWORD_MIN_LENGTH) return `${PASSWORD_MIN_LENGTH}자 이상 입력해주세요.`
  return undefined
}

export function validatePasswordConfirm(value: string, password: string): string | undefined {
  if (!value) return '비밀번호를 다시 입력해주세요.'
  if (value !== password) return '비밀번호가 일치하지 않습니다.'
  return undefined
}

export function validateName(value: string): string | undefined {
  if (!value.trim()) return '이름을 입력해주세요.'
  return undefined
}

export function validateBirthDate(value: string): string | undefined {
  if (!value) return '생년월일을 입력해주세요.'
  if (!BIRTH_DATE_PATTERN.test(value)) return '생년월일 형식이 올바르지 않습니다.'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '존재하지 않는 날짜입니다.'
  if (date > new Date()) return '생년월일이 미래로 입력되었습니다.'
  return undefined
}

/** 서버로도 숫자만 보낸다. */
export function validatePhone(value: string): string | undefined {
  const digits = value.replace(/\D/g, '')
  if (!digits) return '전화번호를 입력해주세요.'
  if (!/^01\d{8,9}$/.test(digits)) return '전화번호 형식이 올바르지 않습니다.'
  return undefined
}

export function validateNickname(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return '닉네임을 입력해주세요.'
  if (trimmed.length < NICKNAME_MIN_LENGTH || trimmed.length > NICKNAME_MAX_LENGTH) {
    return `${NICKNAME_MIN_LENGTH}~${NICKNAME_MAX_LENGTH}자로 입력해주세요.`
  }
  return undefined
}

/** 입력 중 010-1234-5678 형태로 만든다. */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length < 4) return digits
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}
