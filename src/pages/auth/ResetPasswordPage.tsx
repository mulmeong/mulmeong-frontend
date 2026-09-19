import { useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { ApiError } from '@/api/ApiError'
import { resetPassword } from '@/features/auth/api/auth'
import { AuthField, AuthHeading, AuthSubmit } from '@/features/auth/components/AuthForm'
import AuthLayout from '@/features/auth/components/AuthLayout'
import { AUTH_IMAGES } from '@/features/auth/constants'
import { validatePassword, validatePasswordConfirm } from '@/features/auth/utils/validation'

type Errors = {
  newPassword?: string
  newPasswordConfirm?: string
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [submitError, setSubmitError] = useState<string>()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const touched = useRef({ newPassword: false, newPasswordConfirm: false })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    touched.current = { newPassword: true, newPasswordConfirm: true }
    const nextErrors = {
      newPassword: validatePassword(newPassword),
      newPasswordConfirm: validatePasswordConfirm(newPasswordConfirm, newPassword),
    }
    setErrors(nextErrors)
    setSubmitError(undefined)
    if (nextErrors.newPassword || nextErrors.newPasswordConfirm) return

    setSubmitting(true)
    try {
      await resetPassword({ token, newPassword, newPasswordConfirm })
      setSubmitted(true)
    } catch (cause) {
      setSubmitError(
        cause instanceof ApiError
          ? cause.message
          : '비밀번호를 변경하지 못했어요. 잠시 후 다시 시도해주세요.',
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
            title="비밀번호를 변경했어요"
            subtitle="새 비밀번호로 다시 로그인해 주세요."
          />
          <Link to="/login" className="mt-10 block">
            <AuthSubmit>로그인하러 가기</AuthSubmit>
          </Link>
        </>
      ) : !token ? (
        <>
          <AuthHeading
            title="재설정 링크가 필요해요"
            subtitle="이메일에서 받은 비밀번호 재설정 링크로 다시 열어주세요."
          />
          <Link to="/password-reset" className="mt-10 block">
            <AuthSubmit>재설정 링크 다시 받기</AuthSubmit>
          </Link>
        </>
      ) : (
        <>
          <AuthHeading
            title="새 비밀번호 설정"
            subtitle="영문과 숫자를 포함해 8~64자로 입력해 주세요."
          />
          <form
            onSubmit={handleSubmit}
            noValidate
            aria-busy={submitting}
            className="mt-10 flex flex-col gap-6"
          >
            <AuthField
              compact
              label="새 비밀번호"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="새 비밀번호 입력"
              required
              autoFocus
              disabled={submitting}
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value)
                if (touched.current.newPassword) {
                  setErrors((previous) => ({
                    ...previous,
                    newPassword: validatePassword(event.target.value),
                  }))
                }
                if (touched.current.newPasswordConfirm) {
                  setErrors((previous) => ({
                    ...previous,
                    newPasswordConfirm: validatePasswordConfirm(
                      newPasswordConfirm,
                      event.target.value,
                    ),
                  }))
                }
                setSubmitError(undefined)
              }}
              onBlur={() => {
                touched.current.newPassword = true
                setErrors((previous) => ({
                  ...previous,
                  newPassword: validatePassword(newPassword),
                }))
              }}
              error={errors.newPassword}
            />
            <AuthField
              compact
              label="새 비밀번호 확인"
              name="newPasswordConfirm"
              type="password"
              autoComplete="new-password"
              placeholder="새 비밀번호를 한 번 더 입력"
              required
              disabled={submitting}
              value={newPasswordConfirm}
              onChange={(event) => {
                setNewPasswordConfirm(event.target.value)
                if (touched.current.newPasswordConfirm) {
                  setErrors((previous) => ({
                    ...previous,
                    newPasswordConfirm: validatePasswordConfirm(event.target.value, newPassword),
                  }))
                }
                setSubmitError(undefined)
              }}
              onBlur={() => {
                touched.current.newPasswordConfirm = true
                setErrors((previous) => ({
                  ...previous,
                  newPasswordConfirm: validatePasswordConfirm(newPasswordConfirm, newPassword),
                }))
              }}
              error={errors.newPasswordConfirm}
            />
            {submitError && (
              <p role="alert" className="text-danger text-[13px]">
                {submitError}
              </p>
            )}
            <AuthSubmit disabled={submitting}>
              {submitting ? '변경 중…' : '비밀번호 변경하기'}
            </AuthSubmit>
          </form>
        </>
      )}
    </AuthLayout>
  )
}
