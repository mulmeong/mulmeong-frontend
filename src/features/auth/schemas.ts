import { z } from 'zod'

/** 규칙은 백엔드 필드 정의와 맞출 것 (AUTH-07). */

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 64
export const NAME_MAX_LENGTH = 20

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, '이메일을 입력해주세요.')
  .max(254, '이메일이 너무 깁니다.')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, '이메일 형식이 올바르지 않습니다.')

export const password = z
  .string()
  .min(1, '비밀번호를 입력해주세요.')
  .min(PASSWORD_MIN_LENGTH, `${PASSWORD_MIN_LENGTH}~${PASSWORD_MAX_LENGTH}자로 입력해주세요.`)
  .max(PASSWORD_MAX_LENGTH, `${PASSWORD_MIN_LENGTH}~${PASSWORD_MAX_LENGTH}자로 입력해주세요.`)
  // 명세: 영문+숫자 필수, 특수문자는 선택.
  .regex(/[A-Za-z]/, '영문과 숫자를 함께 사용해주세요.')
  .regex(/\d/, '영문과 숫자를 함께 사용해주세요.')

export const name = z
  .string()
  .trim()
  .min(1, '이름을 입력해주세요.')
  .max(NAME_MAX_LENGTH, `${NAME_MAX_LENGTH}자 이하로 입력해주세요.`)

export const birthDate = z
  .string()
  .min(1, '생년월일을 입력해주세요.')
  .regex(/^\d{4}-\d{2}-\d{2}$/, '생년월일 형식이 올바르지 않습니다.')
  .refine((value) => !Number.isNaN(new Date(value).getTime()), '존재하지 않는 날짜입니다.')
  .refine((value) => new Date(value) <= new Date(), '생년월일이 미래로 입력되었습니다.')

/** 입력은 자유롭게 받되 서버로는 명세 형식(010-0000-0000)으로 보낸다. */
export const phone = z
  .string()
  .transform((value) => value.replace(/\D/g, ''))
  .pipe(
    z
      .string()
      .min(1, '전화번호를 입력해주세요.')
      .regex(/^010\d{8}$/, '전화번호 형식이 올바르지 않습니다.'),
  )
  .transform((digits) => `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`)

export const loginSchema = z.object({ email, password })

/** 닉네임은 서버가 가입 시 자동 생성한다 (AUTH-07) — 폼에서 받지 않는다. */
export const signupSchema = z
  .object({
    email,
    password,
    passwordConfirm: z.string().min(1, '비밀번호를 다시 입력해주세요.'),
    name,
    birthDate,
    phone,
    marketingAgreed: z.boolean(),
  })
  .refine((data) => data.passwordConfirm === data.password, {
    path: ['passwordConfirm'],
    message: '비밀번호가 일치하지 않습니다.',
  })

export type LoginRequest = z.infer<typeof loginSchema>
/** 명세상 passwordConfirm도 서버가 검증하므로 그대로 보낸다. */
export type SignupRequest = z.infer<typeof signupSchema>
