import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError } from '@/api/ApiError'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Input from '@/components/ui/Input'
import { checkEmail, signup } from '@/features/auth/api/auth'
import AuthLayout from '@/features/auth/components/AuthLayout'
import { AUTH_IMAGES } from '@/features/auth/constants'
import {
  formatPhone,
  PASSWORD_MIN_LENGTH,
  validateBirthDate,
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirm,
  validatePhone,
} from '@/features/auth/utils/validation'

type Form = {
  email: string
  password: string
  passwordConfirm: string
  name: string
  birthDate: string
  phone: string
}

type Errors = Partial<Record<keyof Form, string>>

const INITIAL_FORM: Form = {
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  birthDate: '',
  phone: '',
}

/** 이용약관·개인정보는 필수, 매거진 수신은 선택. */
type Agreements = {
  terms: boolean
  privacy: boolean
  marketing: boolean
}

export default function SignupPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState<Form>(INITIAL_FORM)
  const [agreements, setAgreements] = useState<Agreements>({
    terms: false,
    privacy: false,
    marketing: false,
  })

  const [errors, setErrors] = useState<Errors>({})
  const [agreementError, setAgreementError] = useState<string>()
  const [submitError, setSubmitError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  /** null=미확인. 이메일을 고치면 null로 돌아간다. */
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    if (key === 'email') setEmailAvailable(null)
  }

  /**
   * AUTH-07 이메일 중복 확인. 명세대로 blur 시점에 부른다.
   * UX 보조일 뿐이라 실패해도 막지 않는다 — 최종 검증은 가입 API가 한다.
   */
  async function handleEmailBlur() {
    const value = form.email.trim()
    if (!value || validateEmail(value)) return

    try {
      const { available } = await checkEmail(value)
      setEmailAvailable(available)
      if (!available) {
        setErrors((prev) => ({ ...prev, email: '이미 가입된 이메일입니다.' }))
      }
    } catch {
      // 조회 실패는 조용히 넘어간다. 가입 시 서버가 409로 잡는다.
      setEmailAvailable(null)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const nextErrors: Errors = {
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      passwordConfirm: validatePasswordConfirm(form.passwordConfirm, form.password),
      name: validateName(form.name),
      birthDate: validateBirthDate(form.birthDate),
      phone: validatePhone(form.phone),
    }

    // 중복이 확인된 이메일이면 제출 전에 잡는다 (미확인은 서버가 판단).
    if (!nextErrors.email && emailAvailable === false) {
      nextErrors.email = '이미 가입된 이메일입니다.'
    }

    const nextAgreementError =
      agreements.terms && agreements.privacy ? undefined : '필수 약관에 동의해주세요.'

    setErrors(nextErrors)
    setAgreementError(nextAgreementError)
    setSubmitError(undefined)

    if (Object.values(nextErrors).some(Boolean) || nextAgreementError) return

    setSubmitting(true)
    try {
      // 닉네임은 서버가 만들어 응답으로 준다. 자동 로그인은 하지 않는다.
      const { nickname } = await signup({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        passwordConfirm: form.passwordConfirm,
        name: form.name.trim(),
        birthDate: form.birthDate,
        phone: formatPhone(form.phone),
        marketingAgreed: agreements.marketing,
      })
      navigate('/signup/done', { replace: true, state: { nickname } })
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : '가입에 실패했습니다. 잠시 후 다시 시도해주세요.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      image={AUTH_IMAGES.signup.src}
      imageRatio={AUTH_IMAGES.signup.ratio}
      headline={['가입하고', '기록을 남겨요']}
      caption={[
        '다녀온 온천이 내 지도에 채워집니다',
        '가고 싶은 곳을 찜해두고 팜플렛으로 만들어요',
      ]}
    >
      <h1 className="text-[32px] leading-tight font-bold sm:text-[40px]">회원가입</h1>

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-5">
        <Input
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          onBlur={handleEmailBlur}
          error={errors.email}
          hint={emailAvailable ? '사용할 수 있는 이메일입니다.' : undefined}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="비밀번호"
            type="password"
            autoComplete="new-password"
            placeholder={`${PASSWORD_MIN_LENGTH}자 이상`}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            error={errors.password}
          />
          <Input
            label="비밀번호 확인"
            type="password"
            autoComplete="new-password"
            placeholder="다시 입력"
            value={form.passwordConfirm}
            onChange={(e) => update('passwordConfirm', e.target.value)}
            error={errors.passwordConfirm}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="이름"
            autoComplete="name"
            placeholder="실명을 입력하세요"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            error={errors.name}
          />
          <Input
            label="생년월일"
            type="date"
            autoComplete="bday"
            value={form.birthDate}
            onChange={(e) => update('birthDate', e.target.value)}
            error={errors.birthDate}
          />
        </div>

        <Input
          label="전화번호"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="010-1234-5678"
          value={form.phone}
          onChange={(e) => update('phone', formatPhone(e.target.value))}
          error={errors.phone}
        />

        {/* 닉네임은 서버가 자동 생성한다 (AUTH-07) — 가입 후 마이페이지에서 바꾼다. */}

        <div className="flex flex-col gap-2.5">
          <AgreementRow
            label="이용약관 동의 (필수)"
            checked={agreements.terms}
            onChange={(checked) => {
              setAgreements((prev) => ({ ...prev, terms: checked }))
              setAgreementError(undefined)
            }}
            to="/terms"
          />
          <AgreementRow
            label="개인정보 처리방침 동의 (필수)"
            checked={agreements.privacy}
            onChange={(checked) => {
              setAgreements((prev) => ({ ...prev, privacy: checked }))
              setAgreementError(undefined)
            }}
            to="/privacy"
          />
          <AgreementRow
            label="매거진 소식 받기 (선택)"
            checked={agreements.marketing}
            onChange={(checked) => setAgreements((prev) => ({ ...prev, marketing: checked }))}
          />
          {agreementError && (
            <p role="alert" className="text-danger text-[12px]">
              {agreementError}
            </p>
          )}
        </div>

        {submitError && (
          <p role="alert" className="text-danger text-[13px]">
            {submitError}
          </p>
        )}

        <Button type="submit" size="large" disabled={submitting} className="mt-2 w-full">
          {submitting ? '가입 중' : '회원가입'}
        </Button>
      </form>

      <p className="text-text-secondary mt-5 text-center text-[13px]">
        이미 계정이 있나요?{' '}
        <Link to="/login" className="text-text-primary font-bold">
          로그인
        </Link>
      </p>
    </AuthLayout>
  )
}

function AgreementRow({
  label,
  checked,
  onChange,
  to,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  to?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Checkbox label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {to && (
        <Link
          to={to}
          className="text-text-secondary hover:text-text-primary shrink-0 text-[12px] underline-offset-2 hover:underline"
        >
          보기
        </Link>
      )}
    </div>
  )
}
