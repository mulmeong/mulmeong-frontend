import { useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { ApiError } from '@/api/ApiError'
import Checkbox from '@/components/ui/Checkbox'
import { AuthField, AuthHeading, AuthSubmit } from '@/features/auth/components/AuthForm'
import AuthLayout from '@/features/auth/components/AuthLayout'
import { useAuth } from '@/features/auth/hooks/authContext'
import { AUTH_IMAGES } from '@/features/auth/constants'
import { validateEmail, validatePassword } from '@/features/auth/utils/validation'

type Errors = {
  email?: string
  password?: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  /** 로그인이 필요해 밀려난 화면. 없으면 홈으로 보낸다. */
  const from = (location.state as { from?: string } | null)?.from

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const touched = useRef({ email: false, password: false })

  const [errors, setErrors] = useState<Errors>({})
  const [submitError, setSubmitError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    touched.current = { email: true, password: true }

    const nextErrors: Errors = {
      email: validateEmail(email),
      password: validatePassword(password),
    }
    setErrors(nextErrors)
    setSubmitError(undefined)
    if (nextErrors.email || nextErrors.password) {
      event.currentTarget
        .querySelector<HTMLInputElement>(`[name="${nextErrors.email ? 'email' : 'password'}"]`)
        ?.focus()
      return
    }

    setSubmitting(true)
    try {
      await login({ email, password })
      navigate(from ?? '/', { replace: true })
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      formPage
      panelClassName="lg:px-14"
      contentClassName="max-w-[420px] [&>p:first-of-type]:mt-2"
      image={AUTH_IMAGES.login.src}
      imageRatio={AUTH_IMAGES.login.ratio}
      headline={['오늘은 어느 온천에', '몸을 담글까']}
    >
      <AuthHeading title="로그인" subtitle="저장한 온천과 나만의 지도를 이어서 만나보세요." />

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-busy={submitting}
        className="mt-10 flex flex-col gap-6"
      >
        <AuthField
          compact
          label="이메일"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (touched.current.email)
              setErrors((previous) => ({ ...previous, email: validateEmail(e.target.value) }))
            setSubmitError(undefined)
          }}
          onBlur={() => {
            touched.current.email = true
            setErrors((previous) => ({ ...previous, email: validateEmail(email) }))
          }}
          error={errors.email}
        />

        <div className="flex flex-col gap-3">
          <AuthField
            compact
            label="비밀번호"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호 입력"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (touched.current.password)
                setErrors((previous) => ({
                  ...previous,
                  password: validatePassword(e.target.value),
                }))
              setSubmitError(undefined)
            }}
            onBlur={() => {
              touched.current.password = true
              setErrors((previous) => ({ ...previous, password: validatePassword(password) }))
            }}
            error={errors.password}
          />

          <div className="text-text-primary/65 flex min-h-11 items-center justify-between gap-3 text-[12px] lg:min-h-8">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 lg:min-h-8">
              <Checkbox
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2"
              />
              로그인 상태 유지
            </label>
            <Link
              to="/password-reset"
              className="hover:text-text-primary inline-flex min-h-11 shrink-0 items-center underline-offset-4 hover:underline focus-visible:underline lg:min-h-8"
            >
              비밀번호 찾기
            </Link>
          </div>
        </div>

        {submitError && (
          <p role="alert" className="text-danger text-[13px]">
            {submitError}
          </p>
        )}

        <AuthSubmit disabled={submitting} className="mt-2">
          {submitting ? '로그인 중…' : '로그인'}
        </AuthSubmit>
      </form>

      <p className="text-text-primary/65 mt-6 text-center text-[13px] leading-6">
        계정이 없나요?{' '}
        <Link
          to="/signup"
          className="text-text-primary ml-1 inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:underline focus-visible:underline lg:min-h-6"
        >
          회원가입
        </Link>
      </p>
    </AuthLayout>
  )
}
