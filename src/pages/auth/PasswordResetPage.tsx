import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { ApiError } from '@/api/ApiError'
import { AuthField, AuthHeading, AuthSubmit } from '@/features/auth/components/AuthForm'
import AuthLayout from '@/features/auth/components/AuthLayout'
import { requestPasswordReset } from '@/features/auth/api/auth'
import { AUTH_IMAGES } from '@/features/auth/constants'
import { validateEmail } from '@/features/auth/utils/validation'

export default function PasswordResetPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string>()
  const [submitError, setSubmitError] = useState<string>()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const touched = useRef(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    touched.current = true
    const error = validateEmail(email)
    setEmailError(error)
    setSubmitError(undefined)
    if (error) return

    setSubmitting(true)
    try {
      await requestPasswordReset(email.trim())
      setSubmitted(true)
    } catch (cause) {
      setSubmitError(
        cause instanceof ApiError
          ? cause.message
          : '재설정 메일을 보내지 못했어요. 잠시 후 다시 시도해주세요.',
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
      headline={['다시, 편안한', '온천 여행으로']}
    >
      {submitted ? (
        <>
          <AuthHeading
            title="메일을 보냈어요"
            subtitle="입력하신 이메일로 비밀번호 재설정 링크를 보냈습니다."
          />
          <p className="text-text-primary/65 mt-8 text-[14px] leading-6">
            메일이 보이지 않으면 스팸함을 확인해 주세요.
          </p>
          <Link to="/login" className="mt-8 block">
            <AuthSubmit>로그인으로 돌아가기</AuthSubmit>
          </Link>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="text-text-primary/65 hover:text-text-primary mx-auto mt-4 flex min-h-11 items-center text-[13px] underline underline-offset-4"
          >
            다른 이메일로 다시 요청하기
          </button>
        </>
      ) : (
        <>
          <AuthHeading title="비밀번호 찾기" subtitle="가입한 이메일로 재설정 링크를 보내드려요." />
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
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (touched.current) setEmailError(validateEmail(event.target.value))
                setSubmitError(undefined)
              }}
              onBlur={() => {
                touched.current = true
                setEmailError(validateEmail(email))
              }}
              error={emailError}
            />
            {submitError && (
              <p role="alert" className="text-danger text-[13px]">
                {submitError}
              </p>
            )}
            <AuthSubmit disabled={submitting}>
              {submitting ? '보내는 중…' : '재설정 링크 보내기'}
            </AuthSubmit>
          </form>
          <Link
            to="/login"
            className="text-text-primary/65 hover:text-text-primary mt-6 flex min-h-11 items-center justify-center text-[13px] underline-offset-4 hover:underline"
          >
            로그인으로 돌아가기
          </Link>
        </>
      )}
    </AuthLayout>
  )
}
