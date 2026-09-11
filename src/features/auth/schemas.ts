import { z } from 'zod'

/** 규칙은 백엔드 필드 정의와 맞출 것 (AUTH-07). */

export const PASSWORD_MIN_LENGTH = 8
export const NICKNAME_MIN_LENGTH = 2
export const NICKNAME_MAX_LENGTH = 12

/** 메시지는 무엇이·왜·어떻게 고치는지가 한 문장에 담기게 쓴다. */

export const email = z
  .string()
  .trim()
  .min(1, '이메일을 입력해주세요.')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, '@와 도메인을 포함해 입력해주세요. 예: you@example.com')

export const password = z
  .string()
  .min(1, '비밀번호를 입력해주세요.')
  .min(PASSWORD_MIN_LENGTH, `${PASSWORD_MIN_LENGTH}자 이상이어야 합니다. 조금 더 입력해주세요.`)

export const name = z.string().trim().min(1, '이름을 입력해주세요.')

export const birthDate = z
  .string()
  .min(1, '생년월일을 입력해주세요.')
  .regex(/^\d{4}-\d{2}-\d{2}$/, '연도·월·일을 모두 선택해주세요.')
  .refine((value) => !Number.isNaN(new Date(value).getTime()), '달력에 없는 날짜입니다.')
  .refine((value) => new Date(value) <= new Date(), '오늘 이전의 날짜로 입력해주세요.')

/** 하이픈을 지운 숫자로 검사하고, 서버로도 숫자만 보낸다. */
export const phone = z
  .string()
  .transform((value) => value.replace(/\D/g, ''))
  .pipe(
    z
      .string()
      .min(1, '전화번호를 입력해주세요.')
      .regex(/^01\d{8,9}$/, '010으로 시작하는 10~11자리 번호를 입력해주세요.'),
  )

export const nickname = z
  .string()
  .trim()
  .min(1, '닉네임을 입력해주세요.')
  .min(NICKNAME_MIN_LENGTH, `${NICKNAME_MIN_LENGTH}자 이상으로 입력해주세요.`)
  .max(NICKNAME_MAX_LENGTH, `${NICKNAME_MAX_LENGTH}자 이하로 입력해주세요.`)

export const loginSchema = z.object({ email, password })

export const signupSchema = z
  .object({
    email,
    password,
    passwordConfirm: z.string().min(1, '비밀번호를 다시 입력해주세요.'),
    name,
    birthDate,
    phone,
    nickname,
    marketingAgreed: z.boolean(),
  })
  .refine((data) => data.passwordConfirm === data.password, {
    path: ['passwordConfirm'],
    message: '비밀번호가 일치하지 않습니다.',
  })

export type LoginRequest = z.infer<typeof loginSchema>
/** passwordConfirm은 서버로 보내지 않는다. */
export type SignupRequest = Omit<z.infer<typeof signupSchema>, 'passwordConfirm'>
