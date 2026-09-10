import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError } from '@/api/ApiError'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Input from '@/components/ui/Input'
import { login } from '@/features/auth/api/auth'
import AuthLayout from '@/features/auth/components/AuthLayout'
import { AUTH_IMAGES } from '@/features/auth/constants'
import { validateEmail, validatePassword } from '@/features/auth/utils/validation'

type Errors = {
  email?: string
  password?: string
}

export default function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(true)

  const [errors, setErrors] = useState<Errors>({})
  const [submitError, setSubmitError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const nextErrors: Errors = {
      email: validateEmail(email),
      password: validatePassword(password),
    }
    setErrors(nextErrors)
    setSubmitError(undefined)
    if (nextErrors.email || nextErrors.password) return

    setSubmitting(true)
    try {
      await login({ email, password })
      navigate('/')
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
      image={AUTH_IMAGES.login.src}
      imageRatio={AUTH_IMAGES.login.ratio}
      headline={['오늘은 어느 온천에', '몸을 담글까']}
    >
      <h1 className="text-[38px] leading-tight font-bold sm:text-[44px]">로그인</h1>
      <p className="text-text-secondary mt-2 text-[14px]">저장한 장소와 내 지도를 이어서</p>

      <form onSubmit={handleSubmit} noValidate className="mt-10 flex flex-col gap-6">
        <Input
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <div className="flex flex-col gap-3">
          <Input
            label="비밀번호"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            trailing={{
              label: showPassword ? '숨기기' : '표시',
              onClick: () => setShowPassword((prev) => !prev),
            }}
          />

          <div className="flex items-center justify-between">
            <Checkbox
              label="로그인 상태 유지"
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
            />
            <Link
              to="/password-reset"
              className="text-text-secondary hover:text-text-primary text-[13px]"
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

        <Button type="submit" size="large" disabled={submitting} className="mt-2 w-full">
          {submitting ? '로그인 중…' : '로그인'}
        </Button>
      </form>

      <p className="text-text-secondary mt-6 text-center text-[13px]">
        계정이 없나요?{' '}
        <Link to="/signup" className="text-text-primary font-bold">
          회원가입
        </Link>
      </p>
    </AuthLayout>
  )
}
